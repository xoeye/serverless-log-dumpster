'use strict'

const templateDiffer = require('./cfnTemplateDiff')
const { dumpLogGroup } = require('./logDumper')

class ServerlessPlugin {
  constructor(serverless, options) {
    this.serverless = serverless
    this.options = options

    if (serverless.service.provider.name !== 'aws') {
      throw new Error("serverless-log-dumpster can only be used with the 'aws' provider")
    }

    /**
     * AWSProvider
     * Reference: https://github.com/serverless/serverless/blob/v2.60.1/lib/plugins/aws/provider.js#L205
     * We use the aws-sdk used by this same service provider, as it is already configured and ready to go
     */
    this.provider = this.serverless.getProvider('aws')

    this.serviceProvider = serverless.service.provider

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

    serverless.configSchemaHandler.defineTopLevelProperty('logDumpster', configProperties)

    const config = serverless.configurationInput.logDumpster
    if (!config) {
      throw new Error('Please specify `logDumpster` in your serverless.yml file!')
    }

    this.destinationBucketName = config.destinationBucketName

    if (!this.destinationBucketName) {
      throw new Error(
        'Please specify `logDumpster.destinationBucketName` in your serverless.yml file!'
      )
    }

    this.destinationPathPrefix = config.destinationPathPrefix || 'logDumpster'
  }

  async onBeforeUpdateStack() {
    const removedLogGroups = await this.findRemovedLogGroups()
    await this.dumpRemovedLogGroups(removedLogGroups)
  }

  async findRemovedLogGroups() {
    const params = { StackName: this.serviceProvider.stackName, TemplateStage: 'Original' }
    const resp = await this.provider.request('CloudFormation', 'getTemplate', params)
    const deployedTemplate = JSON.parse(resp.TemplateBody)
    const newTemplate = this.serviceProvider.compiledCloudFormationTemplate

    const removed = templateDiffer.findRemovedLogGroups(deployedTemplate, newTemplate)

    const removed_str = removed.map((group) => group.logGroupName).join(', ')
    this.serverless.cli.log(
      `LogDumpster found the following log groups to be replaced or removed: ${removed_str}`
    )

    return removed
  }

  async dumpRemovedLogGroups(removedLogGroups) {
    if (this.serverless.service.provider.shouldNotDeploy) return
    console.log('removing dumped stuffs woo')

    const cloudWatchMethod = (action) => async (params) =>
      await this.provider.request('CloudWatchLogs', action, params)

    const apis = {
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
      this.serverless.cli.log(`[LogDumpster] Starting export of ${logGroup.name}`)
      const exportTime = await dump(logGroup)
      this.serverless.cli.log(`[LogDumpster] Completed export in ${exportTime} seconds`)
    }
    this.serverless.cli.log(`[LogDumpster] Completed dumping all logs`)
  }
}

module.exports = ServerlessPlugin
