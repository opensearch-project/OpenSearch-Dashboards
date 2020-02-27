import createCachedSelector from 're-reselect';
import { getAxisSpecsSelector } from './get_specs';
import { isYDomain, isCompleteBound, isLowerBound, isUpperBound, isBounded } from '../../utils/axis_utils';
import { AxisSpec, DomainRange } from '../../utils/specs';
import { Rotation } from '../../../../utils/commons';
import { getSettingsSpecSelector } from '../../../../state/selectors/get_settings_specs';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';
import { GroupId } from '../../../../utils/ids';

export const mergeYCustomDomainsByGroupIdSelector = createCachedSelector(
  [getAxisSpecsSelector, getSettingsSpecSelector],
  (axisSpecs, settingsSpec): Map<GroupId, DomainRange> => {
    return mergeYCustomDomainsByGroupId(axisSpecs, settingsSpec ? settingsSpec.rotation : 0);
  },
)(getChartIdSelector);

export function mergeYCustomDomainsByGroupId(
  axesSpecs: AxisSpec[],
  chartRotation: Rotation,
): Map<GroupId, DomainRange> {
  const domainsByGroupId = new Map<GroupId, DomainRange>();

  axesSpecs.forEach((spec: AxisSpec) => {
    const { id, groupId, domain } = spec;

    if (!domain) {
      return;
    }

    const isAxisYDomain = isYDomain(spec.position, chartRotation);

    if (!isAxisYDomain) {
      const errorMessage = `[Axis ${id}]: custom domain for xDomain should be defined in Settings`;
      throw new Error(errorMessage);
    }

    if (isCompleteBound(domain) && domain.min > domain.max) {
      const errorMessage = `[Axis ${id}]: custom domain is invalid, min is greater than max`;
      throw new Error(errorMessage);
    }

    const prevGroupDomain = domainsByGroupId.get(groupId);

    if (prevGroupDomain) {
      const prevDomain = prevGroupDomain as DomainRange;

      const prevMin = isLowerBound(prevDomain) ? prevDomain.min : undefined;
      const prevMax = isUpperBound(prevDomain) ? prevDomain.max : undefined;

      let max = prevMax;
      let min = prevMin;

      if (isCompleteBound(domain)) {
        min = prevMin != null ? Math.min(domain.min, prevMin) : domain.min;
        max = prevMax != null ? Math.max(domain.max, prevMax) : domain.max;
      } else if (isLowerBound(domain)) {
        min = prevMin != null ? Math.min(domain.min, prevMin) : domain.min;
      } else if (isUpperBound(domain)) {
        max = prevMax != null ? Math.max(domain.max, prevMax) : domain.max;
      }

      const mergedDomain = {
        min,
        max,
      };

      if (isBounded(mergedDomain)) {
        domainsByGroupId.set(groupId, mergedDomain);
      }
    } else {
      domainsByGroupId.set(groupId, domain);
    }
  });
  return domainsByGroupId;
}
