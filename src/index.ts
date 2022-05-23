import { inspect } from 'util'
import { diffFindRemovedLogGroups } from './cfnTemplateDiff'
import { dumpLogGroup } from './logDumper'
import { AwsApiCall, JSONRepresentable, ListStackResourcesResult } from './types/awsApi'
import { LogGroup } from './types/logGroup'
import { AWSProvider, AWSServiceProvider, Serverless } from './types/serverless'

const LOG_PREFIX = '[LogDumpster]'

export class PhysicalIDNotFoundError extends Error {
  constructor(logGroup: LogGroup) {
    const logGroupStr = inspect(logGroup, {
      colors: true,
      depth: null,
    })
    super(`Failed to get physical ID for log group: ${logGroupStr}`)
  }
}

export default class LogDumpsterPlugin {
  serverless: Serverless
  provider: AWSProvider
  serviceProvider: AWSServiceProvider

  hooks: { [key: string]: (...args: any) => any | Promise<any> }

  destinationBucketName: string
  destinationPathPrefix: string

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(serverless: Serverless, _options: unknown) {
    this.serverless = serverless

    if (this.serverless.service.provider.name !== 'aws') {
      throw new Error("serverless-log-dumpster can only be used with the 'aws' provider")
    }

    /**
     * AWSProvider
     * Reference: https://github.com/serverless/serverless/blob/v2.60.1/lib/plugins/aws/provider.js#L205
     * We use the aws-sdk used by this same service provider, as it is already configured and ready to go
     */
    this.provider = this.serverless.getProvider('aws')

    this.serviceProvider = this.serverless.service.provider as AWSServiceProvider

    this.hooks = {
      'before:aws:deploy:deploy:updateStack': this.onBeforeUpdateStack.bind(this),
    }

    const configProperties = {
      type: 'object',
      properties: {
        destinationBucketName: { type: 'string' },
        destinationPathPrefix: { type: 'string' },
      },
      required: ['destinationBucketName', 'destinationPathPrefix'],
    }

    this.serverless.configSchemaHandler.defineTopLevelProperty('logDumpster', configProperties)

    const config = this.serverless.configurationInput.logDumpster as JSONRepresentable
    if (!config) {
      throw new Error('Please specify `logDumpster` in your serverless.yml file!')
    }

    this.destinationBucketName = config.destinationBucketName as string

    if (!this.destinationBucketName) {
      throw new Error(
        'Please specify `logDumpster.destinationBucketName` in your serverless.yml file!'
      )
    }

    this.destinationPathPrefix = (config.destinationPathPrefix as string) || 'logDumpster'
  }

  log(str: string, ...objects: unknown[]): void {
    let objects_str = objects.map((e) => inspect(e, { colors: true, depth: null })).join('\n')
    if (objects_str.length > 0) objects_str = '\n' + objects_str

    this.serverless.cli.log(`${LOG_PREFIX} ${str}${objects_str}`)
  }

  async onBeforeUpdateStack(): Promise<void> {
    const removedLogGroups = await this.findRemovedLogGroups()
    if (removedLogGroups.length > 0) {
      const removed_names = removedLogGroups.map((group) => group.name)

      this.log('Found the following log groups to be replaced or removed:', ...removed_names)

      if (this.serviceProvider.shouldNotDeploy) {
        this.log('Dry-run was requested, skipping log export.')
      } else {
        await this.dumpRemovedLogGroups(removedLogGroups)
        this.log(`Completed dumping all logs!`)
      }
    } else {
      this.log('No log groups will be removed as a result of this deployment')
    }
  }

  async fetchCurrentStackResources(): Promise<Record<string, string>> {
    const params = { StackName: this.serviceProvider.stackName }
    const physicalIds = (await this.provider.request(
      'CloudFormation',
      'listStackResources',
      params
    )) as unknown as ListStackResourcesResult

    const logicalToPhysical: Record<string, string> = {}
    for (const resource of physicalIds.StackResourceSummaries) {
      logicalToPhysical[resource.LogicalResourceId] = resource.PhysicalResourceId
    }
    this.log('Obtained current resources from deployed stack.')

    return logicalToPhysical
  }

  populatePhysicalIds(logGroups: LogGroup[], logicalToPhysical: Record<string, string>): void {
    for (const logGroup of logGroups) {
      if (typeof logGroup.name != 'string') {
        this.log(`Log group name is defined by instrinsic function:`, logGroup)

        const physicalId = logicalToPhysical[logGroup.logicalId]
        if (physicalId) {
          this.log(`Using physical ID from ListResources: ${physicalId}`)
          logGroup.name = physicalId
        } else {
          throw new PhysicalIDNotFoundError(logGroup)
        }
      }
    }
  }

  async findRemovedLogGroups(): Promise<LogGroup[]> {
    const params = { StackName: this.serviceProvider.stackName, TemplateStage: 'Original' }
    const resp = await this.provider.request('CloudFormation', 'getTemplate', params)
    const deployedTemplate = JSON.parse(resp.TemplateBody as string)
    const newTemplate = JSON.parse(
      JSON.stringify(this.serviceProvider.compiledCloudFormationTemplate)
    )

    const logicalToPhysical = await this.fetchCurrentStackResources()

    const logGroups = diffFindRemovedLogGroups(deployedTemplate, newTemplate)
    this.populatePhysicalIds(logGroups, logicalToPhysical)

    return logGroups
  }

  async dumpRemovedLogGroups(removedLogGroups: LogGroup[]): Promise<void> {
    if (this.serviceProvider.shouldNotDeploy) return

    const cloudWatchMethod =
      (action: string) =>
      async (params: JSONRepresentable): Promise<JSONRepresentable> =>
        await this.provider.request('CloudWatchLogs', action, params)

    const apis: Record<string, AwsApiCall<JSONRepresentable, JSONRepresentable>> = {
      createExportTask: cloudWatchMethod('createExportTask'),
      describeExportTasks: cloudWatchMethod('describeExportTasks'),
    }

    const dump = dumpLogGroup.bind(
      null,
      apis,
      this.destinationBucketName,
      this.destinationPathPrefix
    )

    for (const logGroup of removedLogGroups) {
      this.log(`Starting export of ${logGroup.name}`)
      const exportTime = await dump(logGroup)
      this.log(`Completed export in ${exportTime} seconds`)
    }
  }
}

module.exports = LogDumpsterPlugin // happy transpiler now, `export default` isn't equivalent
