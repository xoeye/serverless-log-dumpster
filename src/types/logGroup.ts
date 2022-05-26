import { JSONRepresentable } from './awsApi'

export interface LogGroup {
  logicalId: string
  name: string | JSONRepresentable
}
