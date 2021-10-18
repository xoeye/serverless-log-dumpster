import { JSONRepresentable } from './awsApi'

type LogDumpsterConfiguration = {
  logDumpster?: {
    destinationBucketName?: string
    destinationPathPrefix?: string
  }
}

export interface Serverless {
  /**
   * @types/serverless is still rather incomplete. Not sure what the _actual_
   * type is, but this works for our needs.
   */
  configurationInput: JSONRepresentable & LogDumpsterConfiguration
  service: Service

  providers: {
    aws: AWSProvider
  }

  getProvider: (str: string) => AWSProvider

  configSchemaHandler: {
    defineTopLevelProperty: (key: string, properties: Record<string, unknown>) => void
  }

  cli: {
    log: (str: string) => void
  }
}

export interface Service {
  provider: AWSServiceProvider
}

export interface AWSServiceProvider {
  compiledCloudFormationTemplate: JSONRepresentable
  stackName: string
  shouldNotDeploy?: boolean
  name: string & 'aws'
}

export interface AWSProvider {
  request: (service: string, api: string, params: JSONRepresentable) => Promise<JSONRepresentable>
}
