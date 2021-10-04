const assert = require('assert')
const sinon = require('sinon')

const sampleTemplate = {
  Resources: {
    LogGroupA: {
      Type: 'AWS::Logs::LogGroup',
      Properties: {
        LogGroupName: '/aws/lambda/log-group-a',
      },
    },
  },
}

class MockCloudFormation {
  getTemplate() {
    return {
      TemplateBody: JSON.stringify(sampleTemplate),
    }
  }
}

const AWS_CreateExportTask = (args) => {
  /** Required AWS api call parameters */
  assert(args.logGroupName)
  assert(args.destination)
  assert.notEqual(args.from, undefined)
  assert(args.to)

  /** Use this as "taskId" for tests */
  assert(args.taskName)

  return { taskId: args.taskName }
}

const make_AWS_DescribeExportTasks = (endStatus = 'COMPLETED') => {
  let timesCalled = 0
  return (args) => {
    assert(args.taskId)
    const taskId = args.taskId

    const makeResult = (status) => ({
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

    if (++timesCalled < 3) {
      return makeResult('PENDING')
    }
    return makeResult(endStatus)
  }
}

class MockCloudWatchLogs {
  constructor() {
    this.describeExportTasks = sinon.spy(make_AWS_DescribeExportTasks('COMPLETED'))
    this.createExportTask = sinon.spy(AWS_CreateExportTask)
  }
}

class MockAWSProvider {
  constructor() {
    this.services = {
      CloudFormation: new MockCloudFormation(),
      CloudWatchLogs: new MockCloudWatchLogs(),
    }
  }

  async request(serviceName, api, params) {
    const service = this.services[serviceName]
    assert.notEqual(service, null)
    assert.notEqual(service[api], null)

    return new Promise((resolve) => {
      resolve(service[api](params))
    })
  }
}

module.exports = {
  sampleTemplate,
  MockAWSProvider,
  AWS_CreateExportTask,
  make_AWS_DescribeExportTasks,
}
