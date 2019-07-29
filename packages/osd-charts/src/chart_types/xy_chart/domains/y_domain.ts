import { BasicSeriesSpec, DomainRange } from '../utils/specs';
import { GroupId, SpecId } from '../../../utils/ids';
import { ScaleContinuousType, ScaleType } from '../../../utils/scales/scales';
import { isCompleteBound, isLowerBound, isUpperBound } from '../utils/axis_utils';
import { BaseDomain } from './domain';
import { RawDataSeries } from '../utils/series';
import { computeContinuousDataDomain } from '../../../utils/domain';
import { identity } from '../../../utils/commons';
import { sum } from 'd3-array';

export type YDomain = BaseDomain & {
  type: 'yDomain';
  isBandScale: false;
  scaleType: ScaleContinuousType;
  groupId: GroupId;
};
export type YBasicSeriesSpec = Pick<
  BasicSeriesSpec,
  'id' | 'seriesType' | 'yScaleType' | 'groupId' | 'stackAccessors' | 'yScaleToDataExtent' | 'colorAccessors'
> & { stackAsPercentage?: boolean };

export function mergeYDomain(
  dataSeries: Map<SpecId, RawDataSeries[]>,
  specs: YBasicSeriesSpec[],
  domainsByGroupId: Map<GroupId, DomainRange>,
): YDomain[] {
  // group specs by group ids
  const specsByGroupIds = splitSpecsByGroupId(specs);

  const specsByGroupIdsEntries = [...specsByGroupIds.entries()];

  const yDomains = specsByGroupIdsEntries.map(
    ([groupId, groupSpecs]): YDomain => {
      const groupYScaleType = coerceYScaleTypes([...groupSpecs.stacked, ...groupSpecs.nonStacked]);
      const { isPercentageStack } = groupSpecs;

      let domain: number[];
      if (isPercentageStack) {
        domain = computeContinuousDataDomain([0, 1], identity);
      } else {
        // compute stacked domain
        const isStackedScaleToExtent = groupSpecs.stacked.some((spec) => {
          return spec.yScaleToDataExtent;
        });
        const stackedDataSeries = getDataSeriesOnGroup(dataSeries, groupSpecs.stacked);
        const stackedDomain = computeYStackedDomain(stackedDataSeries, isStackedScaleToExtent);

        // compute non stacked domain
        const isNonStackedScaleToExtent = groupSpecs.nonStacked.some((spec) => {
          return spec.yScaleToDataExtent;
        });
        const nonStackedDataSeries = getDataSeriesOnGroup(dataSeries, groupSpecs.nonStacked);
        const nonStackedDomain = computeYNonStackedDomain(nonStackedDataSeries, isNonStackedScaleToExtent);

        // merge stacked and non stacked domain together
        domain = computeContinuousDataDomain(
          [...stackedDomain, ...nonStackedDomain],
          identity,
          isStackedScaleToExtent || isNonStackedScaleToExtent,
        );

        const [computedDomainMin, computedDomainMax] = domain;

        const customDomain = domainsByGroupId.get(groupId);

        if (customDomain && isCompleteBound(customDomain)) {
          // Don't need to check min > max because this has been validated on axis domain merge
          domain = [customDomain.min, customDomain.max];
        } else if (customDomain && isLowerBound(customDomain)) {
          if (customDomain.min > computedDomainMax) {
            throw new Error(`custom yDomain for ${groupId} is invalid, custom min is greater than computed max`);
          }

          domain = [customDomain.min, computedDomainMax];
        } else if (customDomain && isUpperBound(customDomain)) {
          if (computedDomainMin > customDomain.max) {
            throw new Error(`custom yDomain for ${groupId} is invalid, computed min is greater than custom max`);
          }

          domain = [computedDomainMin, customDomain.max];
        }
      }
      return {
        type: 'yDomain',
        isBandScale: false,
        scaleType: groupYScaleType,
        groupId,
        domain,
      };
    },
  );

  return yDomains;
}

export function getDataSeriesOnGroup(
  dataSeries: Map<SpecId, RawDataSeries[]>,
  specs: YBasicSeriesSpec[],
): RawDataSeries[] {
  return specs.reduce(
    (acc, spec) => {
      const ds = dataSeries.get(spec.id) || [];
      return [...acc, ...ds];
    },
    [] as RawDataSeries[],
  );
}

function computeYStackedDomain(dataseries: RawDataSeries[], scaleToExtent: boolean): number[] {
  const stackMap = new Map<any, any[]>();
  dataseries.forEach((ds, index) => {
    ds.data.forEach((datum) => {
      const stack = stackMap.get(datum.x) || [];
      stack[index] = datum.y1;
      stackMap.set(datum.x, stack);
    });
  });
  const dataValues = [];
  for (const stackValues of stackMap) {
    dataValues.push(...stackValues[1]);
    if (stackValues[1].length > 1) {
      dataValues.push(sum(stackValues[1]));
    }
  }
  if (dataValues.length === 0) {
    return [];
  }
  return computeContinuousDataDomain(dataValues, identity, scaleToExtent);
}
function computeYNonStackedDomain(dataseries: RawDataSeries[], scaleToExtent: boolean) {
  const yValues = new Set<any>();
  dataseries.forEach((ds) => {
    ds.data.forEach((datum) => {
      yValues.add(datum.y1);
      if (datum.y0 != null) {
        yValues.add(datum.y0);
      }
    });
  });
  if (yValues.size === 0) {
    return [];
  }
  return computeContinuousDataDomain([...yValues.values()], identity, scaleToExtent);
}
export function splitSpecsByGroupId(specs: YBasicSeriesSpec[]) {
  const specsByGroupIds = new Map<
    GroupId,
    { isPercentageStack: boolean; stacked: YBasicSeriesSpec[]; nonStacked: YBasicSeriesSpec[] }
  >();
  // split each specs by groupId and by stacked or not
  specs.forEach((spec) => {
    const group = specsByGroupIds.get(spec.groupId) || {
      isPercentageStack: false,
      stacked: [],
      nonStacked: [],
    };
    if (spec.stackAccessors && spec.stackAccessors.length > 0) {
      group.stacked.push(spec);
    } else {
      group.nonStacked.push(spec);
    }
    if (spec.stackAsPercentage === true) {
      group.isPercentageStack = true;
    }
    specsByGroupIds.set(spec.groupId, group);
  });
  return specsByGroupIds;
}

/**
 * Coerce the scale types of a set of specification to a generic one.
 * If there is at least one bar series type, than the response will specity
 * that the coerced scale is a `scaleBand` (each point needs to have a surrounding empty
 * space to draw the bar width).
 * If there are multiple continuous scale types, is coerced to linear.
 * If there are at least one Ordinal scale type, is coerced to ordinal.
 * If none of the above, than coerce to the specified scale.
 * @returns {ChartScaleType}
 */
export function coerceYScaleTypes(specs: Pick<BasicSeriesSpec, 'yScaleType'>[]): ScaleContinuousType {
  const scaleTypes = new Set<ScaleContinuousType>();
  specs.forEach((spec) => {
    scaleTypes.add(spec.yScaleType);
  });
  return coerceYScale(scaleTypes);
}

function coerceYScale(scaleTypes: Set<ScaleContinuousType>): ScaleContinuousType {
  if (scaleTypes.size === 1) {
    const scales = scaleTypes.values();
    const value = scales.next().value;
    return value;
  }
  return ScaleType.Linear;
}
