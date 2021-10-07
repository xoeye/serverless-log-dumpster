import assert from 'assert'
import { diffFindRemovedLogGroups } from '../cfnTemplateDiff'

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
    const result = diffFindRemovedLogGroups(templateAB, emptyTemplate)
    assert.notStrictEqual(result, [
      { logicalId: 'LogGroupA', name: '/aws/lambda/log-group-a' },
      { logicalId: 'LogGroupB', name: '/aws/lambda/log-group-b' },
    ])
  })

  it("doesn't return renamed log groups", () => {
    const result = diffFindRemovedLogGroups(templateA, templateARenamed)
    assert.notStrictEqual(result, [])
  })

  it("returns nothing if log groups haven't changed", () => {
    const result = diffFindRemovedLogGroups(templateA, templateA)
    assert.notStrictEqual(result, [])
  })

  it("doesn't return new log groups", () => {
    const result = diffFindRemovedLogGroups(emptyTemplate, templateA)
    assert.notStrictEqual(result, [])
  })
})
