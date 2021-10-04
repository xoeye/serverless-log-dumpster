const assert = require('assert')
const sinon = require('sinon')

const logDumper = require('../src/logDumper')
const { AWS_CreateExportTask, make_AWS_DescribeExportTasks } = require('./mocks/awsProvider.mock')

describe('log dumper', () => {
  it('makes the proper AWS api calls', async () => {
    const createExportTask = sinon.spy(AWS_CreateExportTask)
    const describeExportTasks = sinon.spy(make_AWS_DescribeExportTasks('COMPLETED'))

    await logDumper.dumpLogGroup(
      { createExportTask, describeExportTasks },
      'destbucket',
      'prefix',
      {
        name: 'logGroupname',
        logicalId: 'LogGroup',
      }
    )

    assert(createExportTask.calledOnce)
    assert.equal(describeExportTasks.callCount, 3)
  })

  it('throws an error if the export task fails', async () => {
    const createExportTask = sinon.spy(AWS_CreateExportTask)
    const describeExportTasks = sinon.spy(make_AWS_DescribeExportTasks('FAILED'))

    await assert.rejects(
      logDumper.dumpLogGroup({ createExportTask, describeExportTasks }, 'destbucket', 'prefix', {
        name: 'logGroupname',
        logicalId: 'LogGroup',
      }),
      /CloudWatch log group export failed/
    )

    assert(createExportTask.calledOnce)
    assert.equal(describeExportTasks.callCount, 3)
  })

  it('throws an error if the export task is cancelled', async () => {
    const createExportTask = sinon.spy(AWS_CreateExportTask)
    const describeExportTasks = sinon.spy(make_AWS_DescribeExportTasks('CANCELLED'))

    await assert.rejects(
      logDumper.dumpLogGroup({ createExportTask, describeExportTasks }, 'destbucket', 'prefix', {
        name: 'logGroupname',
        logicalId: 'LogGroup',
      }),
      /CloudWatch log group export failed/
    )

    assert(createExportTask.calledOnce)
    assert.equal(describeExportTasks.callCount, 3)
  })
})
