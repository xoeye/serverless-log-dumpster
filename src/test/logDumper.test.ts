import assert from 'assert'
import sinon from 'sinon'
import { dumpLogGroup } from '../logDumper'
import { AWS_CreateExportTask, make_AWS_DescribeExportTasks } from './mocks/awsProvider.mock'

describe('log dumper', () => {
  it('makes the proper AWS api calls', async () => {
    const createExportTask = sinon.spy(AWS_CreateExportTask)
    const describeExportTasks = sinon.spy(make_AWS_DescribeExportTasks('COMPLETED'))

    await dumpLogGroup({ createExportTask, describeExportTasks }, 'destbucket', 'prefix', {
      name: 'logGroupname',
      logicalId: 'LogGroup',
    })

    assert(createExportTask.calledOnce)
    assert.equal(describeExportTasks.callCount, 3)
  })

  it('throws an error if the export task fails', async () => {
    const createExportTask = sinon.spy(AWS_CreateExportTask)
    const describeExportTasks = sinon.spy(make_AWS_DescribeExportTasks('FAILED'))

    await assert.rejects(
      dumpLogGroup({ createExportTask, describeExportTasks }, 'destbucket', 'prefix', {
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
      dumpLogGroup({ createExportTask, describeExportTasks }, 'destbucket', 'prefix', {
        name: 'logGroupname',
        logicalId: 'LogGroup',
      }),
      /CloudWatch log group export failed/
    )

    assert(createExportTask.calledOnce)
    assert.equal(describeExportTasks.callCount, 3)
  })
})
