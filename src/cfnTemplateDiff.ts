import { diffTemplate, PropertyMap, ResourceDifference } from '@aws-cdk/cloudformation-diff'
import { LogGroup } from './types/logGroup'

export const isLogGroup = (change: ResourceDifference): boolean =>
  change.oldResourceType == 'AWS::Logs::LogGroup'

const isRemovedLogGroup = (change: ResourceDifference): boolean =>
  isLogGroup(change) && change.isRemoval

export const diffFindRemovedLogGroups = (
  oldTemplate: PropertyMap,
  newTemplate: PropertyMap
): LogGroup[] => {
  const diff = diffTemplate(oldTemplate, newTemplate)

  const removedLogGroupDiffs = diff.resources.filter(isRemovedLogGroup)

  const removed: LogGroup[] = []
  removedLogGroupDiffs.forEachDifference((logicalId, diff) =>
    removed.push({
      logicalId: logicalId,
      name: diff.oldProperties.LogGroupName,
    })
  )

  return removed
}
