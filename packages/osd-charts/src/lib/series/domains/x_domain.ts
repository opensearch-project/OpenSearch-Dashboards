import { isCompleteBound, isLowerBound, isUpperBound } from '../../axes/axis_utils';
import { compareByValueAsc, identity } from '../../utils/commons';
import { computeContinuousDataDomain, computeOrdinalDataDomain, Domain } from '../../utils/domain';
import { ScaleType } from '../../utils/scales/scales';
import { BasicSeriesSpec, DomainRange } from '../specs';
import { BaseDomain } from './domain';

export type XDomain = BaseDomain & {
  type: 'xDomain';
  /* the minimum interval of the scale if not-ordinal band-scale*/
  minInterval: number;
  /** if x domain is time, we should also specify the timezone */
  timeZone?: string;
};

/**
 * Merge X domain value between a set of chart specification.
 */
export function mergeXDomain(
  specs: Pick<BasicSeriesSpec, 'seriesType' | 'xScaleType'>[],
  xValues: Set<any>,
  xDomain?: DomainRange | Domain,
): XDomain {
  const mainXScaleType = convertXScaleTypes(specs);
  if (!mainXScaleType) {
    throw new Error('Cannot merge the domain. Missing X scale types');
  }

  const values = [...xValues.values()];
  let seriesXComputedDomains;
  let minInterval = 0;
  if (mainXScaleType.scaleType === ScaleType.Ordinal) {
    seriesXComputedDomains = computeOrdinalDataDomain(values, identity, false, true);
    if (xDomain) {
      if (Array.isArray(xDomain)) {
        seriesXComputedDomains = xDomain;
      } else {
        throw new Error('xDomain for ordinal scale should be an array of values, not a DomainRange object');
      }
    }
  } else {
    seriesXComputedDomains = computeContinuousDataDomain(values, identity, true);
    if (xDomain) {
      if (!Array.isArray(xDomain)) {
        const [computedDomainMin, computedDomainMax] = seriesXComputedDomains;

        if (isCompleteBound(xDomain)) {
          if (xDomain.min > xDomain.max) {
            throw new Error('custom xDomain is invalid, min is greater than max');
          }

          seriesXComputedDomains = [xDomain.min, xDomain.max];
        } else if (isLowerBound(xDomain)) {
          if (xDomain.min > computedDomainMax) {
            throw new Error('custom xDomain is invalid, custom min is greater than computed max');
          }

          seriesXComputedDomains = [xDomain.min, computedDomainMax];
        } else if (isUpperBound(xDomain)) {
          if (computedDomainMin > xDomain.max) {
            throw new Error('custom xDomain is invalid, computed min is greater than custom max');
          }

          seriesXComputedDomains = [computedDomainMin, xDomain.max];
        }
      } else {
        throw new Error('xDomain for continuous scale should be a DomainRange object, not an array');
      }
    }
    minInterval = findMinInterval(values);
  }

  return {
    type: 'xDomain',
    scaleType: mainXScaleType.scaleType,
    isBandScale: mainXScaleType.isBandScale,
    domain: seriesXComputedDomains,
    minInterval,
    timeZone: mainXScaleType.timeZone,
  };
}

/**
 * Find the minimum interval between xValues.
 * Default to 0 if an empty array, 1 if one item array
 */
export function findMinInterval(xValues: number[]): number {
  const valuesLength = xValues.length;
  if (valuesLength <= 0) {
    return 0;
  }
  if (valuesLength === 1) {
    return 1;
  }
  const sortedValues = xValues.slice().sort(compareByValueAsc);
  let i;
  let minInterval = Math.abs(sortedValues[1] - sortedValues[0]);
  for (i = 1; i < valuesLength - 1; i++) {
    const current = sortedValues[i];
    const next = sortedValues[i + 1];
    const interval = Math.abs(next - current);
    minInterval = Math.min(minInterval, interval);
  }
  return minInterval;
}

/**
 * Convert the scale types of a set of specification to a generic one.
 * If there is at least one bar series type, than the response will specity
 * that the coerched scale is a `scaleBand` (each point needs to have a surrounding empty
 * space to draw the bar width).
 * If there are multiple continuous scale types, is coerched to linear.
 * If there are at least one Ordinal scale type, is coerched to ordinal.
 * If none of the above, than coerch to the specified scale.
 * @returns {ChartScaleType}
 */
export function convertXScaleTypes(
  specs: Pick<BasicSeriesSpec, 'seriesType' | 'xScaleType' | 'timeZone'>[],
): {
  scaleType: ScaleType;
  isBandScale: boolean;
  timeZone?: string;
} | null {
  const seriesTypes = new Set<string>();
  const scaleTypes = new Set<ScaleType>();
  const timeZones = new Set<string>();
  specs.forEach((spec) => {
    seriesTypes.add(spec.seriesType);
    scaleTypes.add(spec.xScaleType);
    if (spec.timeZone) {
      timeZones.add(spec.timeZone.toLowerCase());
    }
  });
  if (specs.length === 0 || seriesTypes.size === 0 || scaleTypes.size === 0) {
    return null;
  }
  const isBandScale = seriesTypes.has('bar');
  if (scaleTypes.size === 1) {
    const scaleType = scaleTypes.values().next().value;
    let timeZone: string | undefined;
    if (scaleType === ScaleType.Time) {
      if (timeZones.size > 1) {
        timeZone = 'utc';
      } else {
        timeZone = timeZones.values().next().value;
      }
    }
    return { scaleType, isBandScale, timeZone };
  }

  if (scaleTypes.size > 1 && scaleTypes.has(ScaleType.Ordinal)) {
    return { scaleType: ScaleType.Ordinal, isBandScale };
  }
  return { scaleType: ScaleType.Linear, isBandScale };
}
