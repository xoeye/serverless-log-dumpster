export type JSONObject =
  | string
  | number
  | boolean
  | { [name: string]: JSONObject }
  | Array<JSONObject>

export interface JSONRepresentable {
  [name: string | symbol | number]: string | number | boolean | JSONObject
}

export type AwsApiCall<TParams, TRes> = (params: TParams) => Promise<TRes>

/**
 * CloudWatchLogs::CreateExportTask
 */
export interface CreateExportTaskParams {
  logGroupName: string
  destination: string
  destinationPrefix?: string

  from: number
  to: number

  taskName?: string
}

export interface CreateExportTaskResult {
  taskId: string
}

export type CreateExportTask = AwsApiCall<CreateExportTaskParams, CreateExportTaskResult>

/**
 * CloudWatchLogs::DescribeExportTasks
 */
export interface DescribeExportTasksParams {
  taskId: string
  statusCode?: string
}

export type ExportTaskStatus =
  | 'CANCELLED'
  | 'COMPLETED'
  | 'FAILED'
  | 'PENDING'
  | 'PENDING_CANCEL'
  | 'RUNNING'

export interface ExportTask {
  logGroupName?: string
  destination?: string
  destinationPrefix?: string

  from?: number
  to?: number

  taskId?: string
  taskName?: string

  executionInfo?: {
    completionTime?: number
    creationTime?: number
  }

  status?: {
    code?: string & ExportTaskStatus
    message?: string
  }
}

export interface DescribeExportTasksResult {
  exportTasks: ExportTask[]
}

export type DescribeExportTasks = AwsApiCall<DescribeExportTasksParams, DescribeExportTasksResult>

/**
 * CloudWatchLogs Definition
 */
export interface CloudWatchLogsApi {
  createExportTask: CreateExportTask
  describeExportTasks: DescribeExportTasks
}

/**
 * CloudFormation::GetTemplate
 */
export interface GetTemplateParams {
  StackName: string
}

export interface GetTemplateResult {
  TemplateBody: string
}

export type GetTemplate = AwsApiCall<GetTemplateParams, GetTemplateResult>

/**
 * CloudFormation Definition
 */
export interface CloudFormationApi {
  getTemplate: GetTemplate
}

/**
 * Cloudformation::ListResources
 */
export interface ListStackResourcesParams {
  StackName: string
}

export interface StackResource {
  LogicalResourceId: string
  PhysicalResourceId: string
  ResourceType: string
}

export interface ListStackResourcesResult {
  StackResourceSummaries: Array<StackResource>
}
