import Sinon from 'sinon'
import { Serverless } from '../../types/serverless'
import { MockAWSProvider } from './awsProvider.mock'

export const MockServerless = (): Serverless => {
  const awsProvider = new MockAWSProvider()
  return {
    service: {
      provider: {
        name: 'aws',
        shouldNotDeploy: false,
        stackName: 'cool-test-stack',
        compiledCloudFormationTemplate: {
          Resources: {},
        },
      },
    },

    providers: {
      aws: awsProvider,
    },

    getProvider(str: string) {
      if (str !== 'aws') {
        throw new Error(`mock getProvider not implemented for provider ${str}`)
      }
      return awsProvider
    },

    cli: {
      log: Sinon.fake(),
    },

    configSchemaHandler: { defineTopLevelProperty: Sinon.fake() },

    configurationInput: {
      logDumpster: {
        destinationBucketName: 'destinationBucket',
        destinationPathPrefix: 'logDumpster',
      },
    },
  }
}
