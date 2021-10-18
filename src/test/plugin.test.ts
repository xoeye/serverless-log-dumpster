import assert from 'assert'
import LogDumpsterPlugin from '../index'
import { MockAWSProvider, sampleTemplate } from './mocks/awsProvider.mock'
import { MockServerless } from './mocks/serverless.mock'

const DUMMY_OPTIONS = { stage: 'unittest', region: 'outer-space' }

describe('serverless plugin log dumping', () => {
  it('dumps logs if log group is removed from stack', async () => {
    const serverless = MockServerless()
    const plugin = new LogDumpsterPlugin(serverless, DUMMY_OPTIONS)
    await plugin.onBeforeUpdateStack()

    const providers = serverless.providers
    const awsProvider = providers.aws as MockAWSProvider
    const createExportTask = awsProvider.services.CloudWatchLogs.createExportTask
    assert(createExportTask.calledOnce)
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
