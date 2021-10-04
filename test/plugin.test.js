const assert = require('assert')

const { sampleTemplate } = require('./mocks/awsProvider.mock')

const { MockServerless } = require('./mocks/serverless.mock')
const ServerlessPlugin = require('../src/index')

describe('serverless plugin log dumping', () => {
  it('dump logs if log group is removed from stack', async () => {
    const serverless = new MockServerless()
    const plugin = new ServerlessPlugin(serverless, {})

    await plugin.onBeforeUpdateStack()

    const createExportTask = serverless.providers.aws.services.CloudWatchLogs.createExportTask
    assert(createExportTask.calledOnce)
  })

  it("doesn't dump logs if shouldNotDeploy == true", async () => {
    const serverless = new MockServerless()
    const plugin = new ServerlessPlugin(serverless, {})
    serverless.setShouldNotDeploy(true)

    await plugin.onBeforeUpdateStack()

    const createExportTask = serverless.providers.aws.services.CloudWatchLogs.createExportTask
    assert(createExportTask.notCalled)
  })

  it("doesn't dump logs if stacks are the same", async () => {
    const serverless = new MockServerless()
    serverless.service.provider.compiledCloudFormationTemplate = sampleTemplate

    const plugin = new ServerlessPlugin(serverless, {})

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
      new ServerlessPlugin(serverless, {})
    }, /only be used with the 'aws' provider/)
  })

  it('errors out on missing logDumpster root entry', () => {
    const serverless = new MockServerless()
    serverless.configurationInput = {}

    assert.throws(() => {
      new ServerlessPlugin(serverless, {})
    }, /Please specify `logDumpster`/)
  })

  it('errors out on missing destinationBucketName', () => {
    const serverless = new MockServerless()
    serverless.configurationInput = {
      logDumpster: {},
    }

    assert.throws(() => {
      new ServerlessPlugin(serverless, {})
    }, /Please specify `logDumpster.destinationBucketName`/)
  })
})
