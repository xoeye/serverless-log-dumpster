import assert from 'assert'
import LogDumpsterPlugin, { PhysicalIDNotFoundError } from '../index'
import { MockAWSProvider, sampleTemplate } from './mocks/awsProvider.mock'
import { MockServerless } from './mocks/serverless.mock'

const DUMMY_OPTIONS = { stage: 'unittest', region: 'outer-space' }

const sampleLogGroup = () => ({
  logicalId: 'log-group-b-nonexistant',
  name: {
    'Fn::Join': [
      '/',
      [
        '/aws/appsync/apis',
        {
          'Fn::GetAtt': ['TestAPILogicalResource', 'ApiId'],
        },
      ],
    ],
  },
})

describe('serverless plugin log dumping', () => {
  it('dumps logs if log group is removed from stack', async () => {
    const serverless = MockServerless()
    const plugin = new LogDumpsterPlugin(serverless, DUMMY_OPTIONS)
    await plugin.onBeforeUpdateStack()

    const providers = serverless.providers
    const awsProvider = providers.aws as MockAWSProvider
    const createExportTask = awsProvider.services.CloudWatchLogs.createExportTask
    assert(createExportTask.calledTwice)
  })

  it('correctly associates physical ID', async () => {
    const serverless = MockServerless()
    const plugin = new LogDumpsterPlugin(serverless, DUMMY_OPTIONS)

    const logGroups = [sampleLogGroup()]

    const logGroupPath = '/aws/appsync/apis/log-group-b-nonexistant'
    const logicalToPhysical = { 'log-group-b-nonexistant': logGroupPath }
    const newLogGroups = plugin.populatePhysicalIds(logGroups, logicalToPhysical)

    assert.notEqual(logGroups[0].name, newLogGroups[0].name)
    assert.equal(newLogGroups[0].name, logGroupPath)
  })

  it('throw an error if physical ID cannot be found', async () => {
    const serverless = MockServerless()
    const plugin = new LogDumpsterPlugin(serverless, DUMMY_OPTIONS)

    const logGroups = [sampleLogGroup()]

    assert.throws(plugin.populatePhysicalIds.bind(plugin, logGroups, {}), PhysicalIDNotFoundError)
  })

  it("doesn't dump logs if shouldNotDeploy == true", async () => {
    const serverless = MockServerless()
    const plugin = new LogDumpsterPlugin(serverless, DUMMY_OPTIONS)
    serverless.service.provider.shouldNotDeploy = true

    await plugin.onBeforeUpdateStack()

    const providers = serverless.providers
    const awsProvider = providers.aws as MockAWSProvider
    const createExportTask = awsProvider.services.CloudWatchLogs.createExportTask
    assert(createExportTask.notCalled)
  })

  it("doesn't dump logs if stacks are the same", async () => {
    const serverless = MockServerless()
    serverless.service.provider.compiledCloudFormationTemplate = sampleTemplate

    const plugin = new LogDumpsterPlugin(serverless, DUMMY_OPTIONS)

    await plugin.onBeforeUpdateStack()

    const providers = serverless.providers
    const awsProvider = providers.aws as MockAWSProvider
    const createExportTask = awsProvider.services.CloudWatchLogs.createExportTask
    assert(createExportTask.notCalled)
  })
})

describe('plugin configuration and usage', () => {
  it('errors out if using non-aws provider', () => {
    const serverless = MockServerless() as any
    serverless.service.provider.name = 'not_aws'

    assert.throws(() => {
      new LogDumpsterPlugin(serverless, DUMMY_OPTIONS)
    }, /only be used with the 'aws' provider/)
  })

  it('errors out on missing logDumpster root entry', () => {
    const serverless = MockServerless()
    serverless.configurationInput = {}

    assert.throws(() => {
      new LogDumpsterPlugin(serverless, DUMMY_OPTIONS)
    }, /Please specify `logDumpster`/)
  })

  it('errors out on missing destinationBucketName', () => {
    const serverless = MockServerless()
    serverless.configurationInput = {
      logDumpster: {},
    }

    assert.throws(() => {
      new LogDumpsterPlugin(serverless, DUMMY_OPTIONS)
    }, /Please specify `logDumpster.destinationBucketName`/)
  })
})
