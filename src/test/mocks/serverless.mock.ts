import assert from 'assert'
import sinon from 'sinon'
import { MockAWSProvider } from './awsProvider.mock'
type LogDumpsterConfiguration = {
  logDumpster?: {
    destinationBucketName?: string
    destinationPathPrefix?: string
  }
}

export class MockServerless {
  cli = { log: sinon.fake() }
  public service = {
    provider: {
      name: 'aws',
      shouldNotDeploy: false,
      stackName: 'cool-test-stack',
      compiledCloudFormationTemplate: {
        Resources: {},
      },
    },
  }

  configSchemaHandler = {
    defineTopLevelProperty: sinon.fake(),

    defineCustomProperties: sinon.fake(),
    defineFunctionEvent: sinon.fake(),
    defineFunctionEventProperties: sinon.fake(),
    defineFunctionProperties: sinon.fake(),
    defineProvider: sinon.fake(),
  }

  providers: { [key: string]: MockAWSProvider } = {
    aws: new MockAWSProvider(),
  }

  configurationInput: LogDumpsterConfiguration
  constructor() {
    this.configurationInput = {
      logDumpster: {
        destinationBucketName: 'destinationBucket',
        destinationPathPrefix: 'logDumpster',
      },
    }
  }

  setShouldNotDeploy(shouldNotDeploy: boolean): void {
    this.service.provider.shouldNotDeploy = shouldNotDeploy
  }

  getProvider(name: string): MockAWSProvider {
    assert.notEqual(this.providers[name], undefined)
    return this.providers[name]
  }
}

module.exports = { MockServerless }
