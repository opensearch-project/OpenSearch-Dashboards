import { isCompleteBound, isLowerBound, isUpperBound } from '../utils/axis_utils';
import { compareByValueAsc, identity } from '../../../utils/commons';
import { computeContinuousDataDomain, computeOrdinalDataDomain, Domain } from '../../../utils/domain';
import { ScaleType } from '../../../utils/scales/scales';
import { BasicSeriesSpec, DomainRange } from '../utils/specs';
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
 * @param specs an array of [{ seriesType, xScaleType }]
 * @param xValues a set of unique x values from all specs
 * @param customXDomain if specified, a custom xDomain
 * @returns a merged XDomain between all series.
 */
export function mergeXDomain(
  specs: Pick<BasicSeriesSpec, 'seriesType' | 'xScaleType'>[],
  xValues: Set<any>,
  customXDomain?: DomainRange | Domain,
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
    if (customXDomain) {
      if (Array.isArray(customXDomain)) {
        seriesXComputedDomains = customXDomain;
      } else {
        throw new Error('xDomain for ordinal scale should be an array of values, not a DomainRange object');
      }
    }
  } else {
    seriesXComputedDomains = computeContinuousDataDomain(values, identity, true);
    let customMinInterval: undefined | number;

    if (customXDomain) {
      if (Array.isArray(customXDomain)) {
        throw new Error('xDomain for continuous scale should be a DomainRange object, not an array');
      }

      customMinInterval = customXDomain.minInterval;

      if (customXDomain) {
        const [computedDomainMin, computedDomainMax] = seriesXComputedDomains;

        if (isCompleteBound(customXDomain)) {
          if (customXDomain.min > customXDomain.max) {
            throw new Error('custom xDomain is invalid, min is greater than max');
          }

          seriesXComputedDomains = [customXDomain.min, customXDomain.max];
        } else if (isLowerBound(customXDomain)) {
          if (customXDomain.min > computedDomainMax) {
            throw new Error('custom xDomain is invalid, custom min is greater than computed max');
          }

          seriesXComputedDomains = [customXDomain.min, computedDomainMax];
        } else if (isUpperBound(customXDomain)) {
          if (computedDomainMin > customXDomain.max) {
            throw new Error('custom xDomain is invalid, computed min is greater than custom max');
          }

          seriesXComputedDomains = [computedDomainMin, customXDomain.max];
        }
      }
    }

    const computedMinInterval = findMinInterval(values);
    if (customMinInterval != null) {
      // Allow greater custom min iff xValues has 1 member.
      if (xValues.size > 1 && customMinInterval > computedMinInterval) {
        throw new Error('custom xDomain is invalid, custom minInterval is greater than computed minInterval');
      }
      if (customMinInterval < 0) {
        throw new Error('custom xDomain is invalid, custom minInterval is less than 0');
      }
    }

    minInterval = customMinInterval || computedMinInterval;
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
 * If there are at least one `ordinal` scale type, the resulting scale is coerched to ordinal.
 * If there are only `continuous` scale types, the resulting scale is coerched to linear.
 * If there are only `time` scales, we coerch the timeZone to `utc` only if we have multiple
 * different timezones.
 * @returns the coerched scale type, the timezone and a parameter that describe if its a bandScale or not
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
