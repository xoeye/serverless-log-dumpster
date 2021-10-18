import assert from 'assert'
import sinon from 'sinon'
import {
  CreateExportTask,
  CreateExportTaskParams,
  CreateExportTaskResult,
  DescribeExportTasks,
  DescribeExportTasksParams,
  DescribeExportTasksResult,
  ExportTaskStatus,
  GetTemplateParams,
  GetTemplateResult,
  JSONRepresentable,
} from '../../types/awsApi'

export const sampleTemplate = {
  Resources: {
    LogGroupA: {
      Type: 'AWS::Logs::LogGroup',
      Properties: {
        LogGroupName: '/aws/lambda/log-group-a',
      },
    },
  },
}

function ResolvedPromise<T>(res: T): Promise<T> {
  const promise = new Promise((resolve) => resolve(res)) as Promise<T>
  return promise
}

export class MockCloudFormation {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getTemplate(_params: GetTemplateParams): Promise<GetTemplateResult> {
    return ResolvedPromise<GetTemplateResult>({
      TemplateBody: JSON.stringify(sampleTemplate),
    })
  }
}

export const AWS_CreateExportTask = (
  args: CreateExportTaskParams
): Promise<CreateExportTaskResult> => {
  /** Required AWS api call parameters */
  assert(args.logGroupName)
  assert(args.destination)
  assert.notEqual(args.from, undefined)
  assert(args.to)

  /** Use this as "taskId" for tests */
  assert(args.taskName)

  return ResolvedPromise({ taskId: args.taskName })
}

export const make_AWS_DescribeExportTasks = (
  endStatus: ExportTaskStatus = 'COMPLETED'
): DescribeExportTasks => {
  let timesCalled = 0

  return (args: DescribeExportTasksParams): Promise<DescribeExportTasksResult> => {
    assert(args.taskId)
    const taskId = args.taskId

    const makeResult = (status: ExportTaskStatus): Promise<DescribeExportTasksResult> =>
      new Promise((resolve) =>
        resolve({
          exportTasks: [
            {
              taskId,
              status: {
                code: status,
              },
              executionInfo: {
                creationTime: 1000,
                completionTime: 2000,
              },
            },
          ],
        })
      )

    if (++timesCalled < 3) {
      return makeResult('PENDING')
    }
    return makeResult(endStatus)
  }
}

export class MockCloudWatchLogs {
  describeExportTasks: DescribeExportTasks
  createExportTask: CreateExportTask

  constructor() {
    this.describeExportTasks = sinon.spy(make_AWS_DescribeExportTasks('COMPLETED'))
    this.createExportTask = sinon.spy(AWS_CreateExportTask)
  }
}

export class MockAWSProvider {
  services: { [key: string]: any }

  constructor() {
    this.services = {
      CloudFormation: new MockCloudFormation(),
      CloudWatchLogs: new MockCloudWatchLogs(),
    }
  }

  async request(serviceName: string, api: string, params: JSONRepresentable): Promise<any> {
    const service = this.services[serviceName]
    assert.notEqual(service, null)
    assert.notEqual(service[api], null)

    return ResolvedPromise(service[api](params))
  }
}
