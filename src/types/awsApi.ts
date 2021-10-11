export interface JSONRepresentable {
  [name: string | symbol]: string | number | JSONRepresentable
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
