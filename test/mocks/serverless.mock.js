const assert = require('assert')
const sinon = require('sinon')
const { MockAWSProvider } = require('./awsProvider.mock')

class MockServerless {
  constructor() {
    this.cli = { log: sinon.fake() }
    this.service = {
      provider: {
        name: 'aws',
        stackName: 'cool-test-stack',
        compiledCloudFormationTemplate: {
          Resources: {},
        },
      },
    }

    this.configSchemaHandler = {
      defineTopLevelProperty: sinon.fake(),
    }

    this.providers = {
      aws: new MockAWSProvider(),
    }

    this.configurationInput = {
      logDumpster: {
        destinationBucketName: 'destinationBucket',
        destinationPathprefix: 'logDumpster',
      },
    }
  }

  setShouldNotDeploy(shouldNotDeploy) {
    this.service.provider.shouldNotDeploy = shouldNotDeploy
  }

  getProvider(name) {
    assert.notEqual(this.providers[name], undefined)
    return this.providers[name]
  }
}

module.exports = { MockServerless }
