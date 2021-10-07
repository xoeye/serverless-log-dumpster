import Serverless from 'serverless'
import { Provider } from 'serverless/plugins/aws/provider/awsProvider'
import { JSONRepresentable } from './awsApi'

export interface ServerlessInstance extends Partial<Serverless> {
  /**
   * @types/serverless is still rather incomplete. Not sure what the _actual_
   * type is, but this works for our needs.
   */
  configurationInput: JSONRepresentable
}

export interface AWSServiceProvider extends Provider {
  compiledCloudFormationTemplate: { [key: string]: unknown }
  shouldNotDeploy?: boolean
}
