const { findRemovedLogGroups } = require('../cfnTemplateDiff')

const templateA = {
  Resources: {
    LogGroupA: {
      Type: 'AWS::Logs::LogGroup',
      Properties: {
        LogGroupName: '/aws/lambda/log-group-a',
      },
    },
  },
}

const templateARenamed = {
  Resources: {
    LogGroupA: {
      Type: 'AWS::Logs::LogGroup',
      Properties: {
        LogGroupName: '/aws/lambda/log-group-a-renamed',
      },
    },
  },
}

const templateAB = {
  Resources: {
    LogGroupA: {
      Type: 'AWS::Logs::LogGroup',
      Properties: {
        LogGroupName: '/aws/lambda/log-group-a',
      },
    },
    LogGroupB: {
      Type: 'AWS::Logs::LogGroup',
      Properties: {
        LogGroupName: '/aws/lambda/log-group-b',
      },
    },
  },
}

const emptyTemplate = {
  Resources: {},
}

describe('findRemovedLogGroups', () => {
  it('returns removed log groups', () => {
    const result = findRemovedLogGroups(templateAB, emptyTemplate)
    expect(result).toEqual([
      { logicalId: 'LogGroupA', name: '/aws/lambda/log-group-a' },
      { logicalId: 'LogGroupB', name: '/aws/lambda/log-group-b' },
    ])
  })

  it("doesn't return renamed log groups", () => {
    const result = findRemovedLogGroups(templateA, templateARenamed)
    expect(result).toEqual([])
  })

  it("returns nothing if log groups haven't changed", () => {
    const result = findRemovedLogGroups(templateA, templateA)
    expect(result).toEqual([])
  })

  it("doesn't return new log groups", () => {
    const result = findRemovedLogGroups(emptyTemplate, templateA)
    expect(result).toEqual([])
  })
})
