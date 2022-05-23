import { CloudWatchLogsApi, CreateExportTaskParams, DescribeExportTasks } from './types/awsApi'
import { LogGroup } from './types/logGroup'

const runningUnitTests = (): boolean =>
  ['it', 'describe'].every((fn) => (global as Record<string, unknown>)[fn] instanceof Function)

const TIME_BETWEEN_CHECKS = runningUnitTests() ? 5 : 5 * 1000

const waitForExportTask = async (describeExportTasks: DescribeExportTasks, taskId: string) => {
  /*eslint no-constant-condition: ["error", { "checkLoops": false }]*/
  while (true) {
    const resp = await describeExportTasks({ taskId })
    const task = resp.exportTasks[0]

    switch (task.status && task.status.code) {
      case 'COMPLETED':
        return Math.ceil(
          (task.executionInfo.completionTime - task.executionInfo.creationTime) / 1000
        )
      case 'CANCELLED':
      case 'FAILED':
        throw new Error(
          `CloudWatch log group export failed! Task ID: ${taskId}, Status: ${task.status}`
        )
      default:
        await new Promise((resolve) => setTimeout(resolve, TIME_BETWEEN_CHECKS))
    }
  }
}

export const dumpLogGroup = async (
  { createExportTask, describeExportTasks }: CloudWatchLogsApi,
  bucketName: string,
  pathPrefix: string,
  logGroup: LogGroup
): Promise<number> => {
  const now = Date.now()

  const taskName = `${logGroup.logicalId}-${now}"`

  // Leading slash unwanted if exporting to root of bucket
  const name = logGroup.name as string
  const nameWithoutPrefix = name.replace(/^\//, '')

  // Remove leading or trailing slashes from configured prefix. Allows '/' or '' as root of bucket
  let sanitizedPrefix = pathPrefix.replace(/^\//, '').replace(/\/$/, '')
  if (sanitizedPrefix.length > 0) {
    // Only append trailing slash if not exporting to root of bucket
    sanitizedPrefix += '/'
  }

  const exportPath = `${sanitizedPrefix}${nameWithoutPrefix}`

  const createParams: CreateExportTaskParams = {
    taskName,
    logGroupName: name,
    destination: bucketName,
    destinationPrefix: exportPath,
    from: 0,
    to: now + 60 * 60 * 1000,
  }

  const createResp = await createExportTask(createParams)
  const taskId = createResp.taskId
  const exportTime = await waitForExportTask(describeExportTasks, taskId)

  return exportTime
}
