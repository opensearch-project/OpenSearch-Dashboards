/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { Optional } from 'utility-types';

import { ScaleType } from '../../../scales/constants';
import { compareByValueAsc, identity } from '../../../utils/common';
import { computeContinuousDataDomain, computeOrdinalDataDomain } from '../../../utils/domain';
import { Logger } from '../../../utils/logger';
import { getXNiceFromSpec, getXScaleTypeFromSpec } from '../scales/get_api_scales';
import { ScaleConfigs } from '../state/selectors/get_api_scale_configs';
import { isCompleteBound, isLowerBound, isUpperBound } from '../utils/axis_type_utils';
import { BasicSeriesSpec, SeriesType, XScaleType } from '../utils/specs';
import { areAllNiceDomain } from './nice';
import { XDomain } from './types';

/**
 * Merge X domain value between a set of chart specification.
 * @internal
 */
export function mergeXDomain(
  { type, nice, isBandScale, timeZone, desiredTickCount, customDomain }: ScaleConfigs['x'],
  xValues: Set<string | number>,
  fallbackScale?: XScaleType,
): XDomain {
  const values = [...xValues.values()];
  let seriesXComputedDomains;
  let minInterval = 0;

  if (type === ScaleType.Ordinal || fallbackScale === ScaleType.Ordinal) {
    if (type !== ScaleType.Ordinal) {
      Logger.warn(`Each X value in a ${type} x scale needs be be a number. Using ordinal x scale as fallback.`);
    }

    seriesXComputedDomains = computeOrdinalDataDomain(values, identity, false, true);
    if (customDomain) {
      if (Array.isArray(customDomain)) {
        seriesXComputedDomains = customDomain;
      } else {
        if (fallbackScale === ScaleType.Ordinal) {
          Logger.warn(`xDomain ignored for fallback ordinal scale. Options to resolve:

1) Correct data to match ${type} scale type (see previous warning)
2) Change xScaleType to ordinal and set xDomain to Domain array`);
        } else {
          Logger.warn(
            'xDomain for ordinal scale should be an array of values, not a DomainRange object. xDomain is ignored.',
          );
        }
      }
    }
  } else {
    seriesXComputedDomains = computeContinuousDataDomain(values, identity, type, {
      fit: true,
    });
    let customMinInterval: undefined | number;

    if (customDomain) {
      if (Array.isArray(customDomain)) {
        Logger.warn('xDomain for continuous scale should be a DomainRange object, not an array');
      } else {
        customMinInterval = customDomain.minInterval;
        const [computedDomainMin, computedDomainMax] = seriesXComputedDomains;

        if (isCompleteBound(customDomain)) {
          if (customDomain.min > customDomain.max) {
            Logger.warn('custom xDomain is invalid, min is greater than max. Custom domain is ignored.');
          } else {
            seriesXComputedDomains = [customDomain.min, customDomain.max];
          }
        } else if (isLowerBound(customDomain)) {
          if (customDomain.min > computedDomainMax) {
            Logger.warn(
              'custom xDomain is invalid, custom min is greater than computed max. Custom domain is ignored.',
            );
          } else {
            seriesXComputedDomains = [customDomain.min, computedDomainMax];
          }
        } else if (isUpperBound(customDomain)) {
          if (computedDomainMin > customDomain.max) {
            Logger.warn(
              'custom xDomain is invalid, computed min is greater than custom max. Custom domain is ignored.',
            );
          } else {
            seriesXComputedDomains = [computedDomainMin, customDomain.max];
          }
        }
      }
    }
    const computedMinInterval = findMinInterval(values as number[]);
    minInterval = getMinInterval(computedMinInterval, xValues.size, customMinInterval);
  }

  return {
    type: fallbackScale ?? type,
    nice,
    isBandScale,
    domain: seriesXComputedDomains,
    minInterval,
    timeZone,
    logBase: customDomain && 'logBase' in customDomain ? customDomain.logBase : undefined,
    desiredTickCount,
  };
}

function getMinInterval(computedMinInterval: number, size: number, customMinInterval?: number): number {
  if (customMinInterval == null) {
    return computedMinInterval;
  }
  // Allow greater custom min if xValues has 1 member.
  if (size > 1 && customMinInterval > computedMinInterval) {
    Logger.warn(
      'custom xDomain is invalid, custom minInterval is greater than computed minInterval. Using computed minInterval.',
    );
    return computedMinInterval;
  }
  if (customMinInterval < 0) {
    Logger.warn('custom xDomain is invalid, custom minInterval is less than 0. Using computed minInterval.');
    return computedMinInterval;
  }

  return customMinInterval;
}

/**
 * Find the minimum interval between xValues.
 * Default to 0 if an empty array, 1 if one item array
 * @internal
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
 * If there are at least one `ordinal` scale type, the resulting scale is coerced to ordinal.
 * If there are only `continuous` scale types, the resulting scale is coerced to linear.
 * If there are only `time` scales, we coerce the timeZone to `utc` only if we have multiple
 * different timezones.
 * @returns the coerced scale type, the timezone and a parameter that describe if its a bandScale or not
 * @internal
 */
export function convertXScaleTypes(
  specs: Optional<Pick<BasicSeriesSpec, 'seriesType' | 'xScaleType' | 'xNice' | 'timeZone'>, 'seriesType'>[],
): {
  type: XScaleType;
  nice: boolean;
  isBandScale: boolean;
  timeZone?: string;
} {
  const seriesTypes = new Set<string | undefined>();
  const scaleTypes = new Set<ScaleType>();
  const timeZones = new Set<string>();
  const niceDomainConfigs: Array<boolean> = [];
  specs.forEach((spec) => {
    niceDomainConfigs.push(getXNiceFromSpec(spec.xNice));
    seriesTypes.add(spec.seriesType);
    scaleTypes.add(getXScaleTypeFromSpec(spec.xScaleType));
    if (spec.timeZone) {
      timeZones.add(spec.timeZone.toLowerCase());
    }
  });
  if (specs.length === 0 || seriesTypes.size === 0 || scaleTypes.size === 0) {
    return {
      type: ScaleType.Linear,
      nice: true,
      isBandScale: false,
    };
  }
  const nice = areAllNiceDomain(niceDomainConfigs);
  const isBandScale = seriesTypes.has(SeriesType.Bar);
  if (scaleTypes.size === 1) {
    const scaleType = scaleTypes.values().next().value;
    const timeZone = timeZones.size > 1 ? 'utc' : timeZones.values().next().value;
    return { type: scaleType, nice, isBandScale, timeZone };
  }

  if (scaleTypes.size > 1 && scaleTypes.has(ScaleType.Ordinal)) {
    return {
      type: ScaleType.Ordinal,
      nice,
      isBandScale,
    };
  }
  return {
    type: ScaleType.Linear,
    nice,
    isBandScale,
  };
}
