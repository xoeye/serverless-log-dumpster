const ctime = () => Math.floor(new Date().getTime())

const waitForExportTask = async (describeExportTasks, taskId) => {
  while (true) {
    const resp = await describeExportTasks({ taskId })
    const task = resp.exportTasks[0]

    switch ((task.status && task.status.code) || 'PENDING') {
      case 'COMPLETED':
        return Math.ceil(task.executionInfo.completionTime - task.executionInfo.creationTime / 1000)
      case 'CANCELLED':
      case 'FAILED':
        throw new Error(
          `CloudWatch log group export failed! Task ID: ${taskId}, Status: ${task.status}`
        )
      default:
        await new Promise((resolve) => setTimeout(resolve, 5 * 1000))
    }
  }
}

const dumpLogGroup = async (
  { createExportTask, describeExportTasks },
  bucketName,
  pathPrefix,
  logGroup
) => {
  const now = Date.now()

  const taskName = `${logGroup.logicalId}-${now}"`

  const nameWithoutPrefix = logGroup.name.replace(/^\/aws\/lambda\//, '')
  const exportPath = `${pathPrefix}/${nameWithoutPrefix}`

  const createParams = {
    taskName,
    logGroupName: logGroup.name,
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

module.exports.dumpLogGroup = dumpLogGroup
