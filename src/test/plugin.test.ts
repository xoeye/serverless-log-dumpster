import assert from 'assert'
import LogDumpsterPlugin from '../index'
import { sampleTemplate } from './mocks/awsProvider.mock'
import { MockServerless } from './mocks/serverless.mock'

const DUMMY_OPTIONS = { stage: 'unittest', region: 'outer-space' }

describe('serverless plugin log dumping', () => {
  it('dumps logs if log group is removed from stack', async () => {
    const serverless = new MockServerless()
    const plugin = new LogDumpsterPlugin(serverless as unknown, DUMMY_OPTIONS)
    await plugin.onBeforeUpdateStack()

    const createExportTask = serverless.providers.aws.services.CloudWatchLogs.createExportTask
    assert(createExportTask.calledOnce)
  })

  it("doesn't dump logs if shouldNotDeploy == true", async () => {
    const serverless = new MockServerless()
    const plugin = new LogDumpsterPlugin(serverless as unknown, DUMMY_OPTIONS)
    serverless.setShouldNotDeploy(true)

    await plugin.onBeforeUpdateStack()

    const createExportTask = serverless.providers.aws.services.CloudWatchLogs.createExportTask
    assert(createExportTask.notCalled)
  })

  it("doesn't dump logs if stacks are the same", async () => {
    const serverless = new MockServerless()
    serverless.service.provider.compiledCloudFormationTemplate = sampleTemplate

    const plugin = new LogDumpsterPlugin(serverless as unknown, DUMMY_OPTIONS)

    await plugin.onBeforeUpdateStack()

    const createExportTask = serverless.providers.aws.services.CloudWatchLogs.createExportTask
    assert(createExportTask.notCalled)
  })
})

describe('plugin configuration and usage', () => {
  it('errors out if using non-aws provider', () => {
    const serverless = new MockServerless()
    serverless.service.provider.name = 'not_aws'

    assert.throws(() => {
      new LogDumpsterPlugin(serverless as unknown, DUMMY_OPTIONS)
    }, /only be used with the 'aws' provider/)
  })

  it('errors out on missing logDumpster root entry', () => {
    const serverless = new MockServerless()
    serverless.configurationInput = {}

    assert.throws(() => {
      new LogDumpsterPlugin(serverless as unknown, DUMMY_OPTIONS)
    }, /Please specify `logDumpster`/)
  })

  it('errors out on missing destinationBucketName', () => {
    const serverless = new MockServerless()
    serverless.configurationInput = {
      logDumpster: {},
    }

    assert.throws(() => {
      new LogDumpsterPlugin(serverless as unknown, DUMMY_OPTIONS)
    }, /Please specify `logDumpster.destinationBucketName`/)
  })
})
