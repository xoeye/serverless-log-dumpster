const { diffTemplate, ResourceImpact } = require('@aws-cdk/cloudformation-diff')

const isLogGroup = (change) => change.oldResourceType == 'AWS::Logs::LogGroup'
const isRemovedLogGroup = (change) => isLogGroup(change) && change.isRemoval

const findRemovedLogGroups = (oldTemplate, newTemplate) => {
  const diff = diffTemplate(oldTemplate, newTemplate)

  const removedLogGroupDiffs = diff.resources.filter(isRemovedLogGroup)
  return Object.entries(removedLogGroupDiffs.diffs).map(([logicalId, diff]) => ({
    logicalId: logicalId,
    name: diff.oldProperties.LogGroupName,
  }))
}

module.exports = { findRemovedLogGroups }
