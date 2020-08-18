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

import { GracefulError } from '../../../components/error_boundary/errors';
import { ScaleContinuousType } from '../../../scales';
import { ScaleType } from '../../../scales/constants';
import { identity } from '../../../utils/commons';
import { computeContinuousDataDomain } from '../../../utils/domain';
import { GroupId } from '../../../utils/ids';
import { Logger } from '../../../utils/logger';
import { isCompleteBound, isLowerBound, isUpperBound } from '../utils/axis_type_utils';
import { DataSeries, FormattedDataSeries } from '../utils/series';
import { BasicSeriesSpec, YDomainRange, DEFAULT_GLOBAL_ID, SeriesTypes, StackMode } from '../utils/specs';
import { YDomain } from './types';

export type YBasicSeriesSpec = Pick<
  BasicSeriesSpec,
  'id' | 'seriesType' | 'yScaleType' | 'groupId' | 'stackAccessors' | 'yScaleToDataExtent' | 'useDefaultGroupDomain'
> & { stackMode?: StackMode; enableHistogramMode?: boolean };

interface GroupSpecs {
  stackMode?: StackMode;
  stacked: YBasicSeriesSpec[];
  nonStacked: YBasicSeriesSpec[];
}

/** @internal */
export function mergeYDomain(
  {
    stacked,
    nonStacked,
  }: {
    stacked: FormattedDataSeries[];
    nonStacked: FormattedDataSeries[];
  },
  specs: YBasicSeriesSpec[],
  domainsByGroupId: Map<GroupId, YDomainRange>,
): YDomain[] {
  // group specs by group ids
  const specsByGroupIds = splitSpecsByGroupId(specs);
  const specsByGroupIdsEntries = [...specsByGroupIds.entries()];
  const globalId = DEFAULT_GLOBAL_ID;

  const yDomains = specsByGroupIdsEntries.map<YDomain>(([groupId, groupSpecs]) => {
    const customDomain = domainsByGroupId.get(groupId);
    const emptyDS: FormattedDataSeries = {
      dataSeries: [],
      groupId,
      counts: { area: 0, bubble: 0, bar: 0, line: 0 },
    };
    const stackedDS = stacked.find((d) => d.groupId === groupId) ?? emptyDS;
    const nonStackedDS = nonStacked.find((d) => d.groupId === groupId) ?? emptyDS;
    const nonZeroBaselineSpecs =
      stackedDS.counts.bar + stackedDS.counts.area + nonStackedDS.counts.bar + nonStackedDS.counts.area;
    return mergeYDomainForGroup(
      stackedDS.dataSeries,
      nonStackedDS.dataSeries,
      groupId,
      groupSpecs,
      nonZeroBaselineSpecs > 0,
      customDomain,
    );
  });

  const globalGroupIds: Set<GroupId> = specs.reduce<Set<GroupId>>((acc, { groupId, useDefaultGroupDomain }) => {
    if (groupId !== globalId && useDefaultGroupDomain) {
      acc.add(groupId);
    }
    return acc;
  }, new Set());
  globalGroupIds.add(globalId);

  const globalYDomains = yDomains.filter((domain) => globalGroupIds.has(domain.groupId));
  let globalYDomain = [Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER];
  globalYDomains.forEach((domain) => {
    globalYDomain = [Math.min(globalYDomain[0], domain.domain[0]), Math.max(globalYDomain[1], domain.domain[1])];
  });
  return yDomains.map((domain) => {
    if (globalGroupIds.has(domain.groupId)) {
      return {
        ...domain,
        domain: globalYDomain,
      };
    }
    return domain;
  });
}

function mergeYDomainForGroup(
  stacked: DataSeries[],
  nonStacked: DataSeries[],
  groupId: GroupId,
  groupSpecs: GroupSpecs,
  hasZeroBaselineSpecs: boolean,
  customDomain?: YDomainRange,
): YDomain {
  const groupYScaleType = coerceYScaleTypes([...groupSpecs.stacked, ...groupSpecs.nonStacked]);
  const { stackMode } = groupSpecs;

  let domain: number[];
  if (stackMode === StackMode.Percentage) {
    domain = computeContinuousDataDomain([0, 1], identity, customDomain);
  } else {
    // TODO remove when removing yScaleToDataExtent
    const newCustomDomain = customDomain ? { ...customDomain } : {};
    const shouldScaleToExtent =
      groupSpecs.stacked.some(({ yScaleToDataExtent }) => yScaleToDataExtent) ||
      groupSpecs.nonStacked.some(({ yScaleToDataExtent }) => yScaleToDataExtent);
    if (customDomain?.fit !== true && shouldScaleToExtent) {
      newCustomDomain.fit = true;
    }

    // compute stacked domain
    const stackedDomain = computeYDomain(stacked, hasZeroBaselineSpecs);

    // compute non stacked domain
    const nonStackedDomain = computeYDomain(nonStacked, hasZeroBaselineSpecs);

    // merge stacked and non stacked domain together
    domain = computeContinuousDataDomain([...stackedDomain, ...nonStackedDomain], identity, newCustomDomain);

    const [computedDomainMin, computedDomainMax] = domain;

    if (newCustomDomain && isCompleteBound(newCustomDomain)) {
      // Don't need to check min > max because this has been validated on axis domain merge
      domain = [newCustomDomain.min, newCustomDomain.max];
    } else if (newCustomDomain && isLowerBound(newCustomDomain)) {
      if (newCustomDomain.min > computedDomainMax) {
        throw new GracefulError(`custom yDomain for ${groupId} is invalid, custom min is greater than computed max`);
      }

      domain = [newCustomDomain.min, computedDomainMax];
    } else if (newCustomDomain && isUpperBound(newCustomDomain)) {
      if (computedDomainMin > newCustomDomain.max) {
        throw new Error(`custom yDomain for ${groupId} is invalid, computed min is greater than custom max`);
      }

      domain = [computedDomainMin, newCustomDomain.max];
    }
  }
  return {
    type: 'yDomain',
    isBandScale: false,
    scaleType: groupYScaleType,
    groupId,
    domain,
  };
}

function computeYDomain(dataseries: DataSeries[], hasZeroBaselineSpecs: boolean) {
  const yValues = new Set<any>();
  dataseries.forEach((ds) => {
    ds.data.forEach((datum) => {
      yValues.add(datum.y1);
      if (hasZeroBaselineSpecs && datum.y0 != null) {
        yValues.add(datum.y0);
      }
    });
  });
  if (yValues.size === 0) {
    return [];
  }
  return computeContinuousDataDomain([...yValues.values()], identity, null);
}

/** @internal */
export function splitSpecsByGroupId(specs: YBasicSeriesSpec[]) {
  const specsByGroupIds = new Map<
    GroupId,
    { stackMode: StackMode | undefined; stacked: YBasicSeriesSpec[]; nonStacked: YBasicSeriesSpec[] }
  >();
  // After mobx->redux https://github.com/elastic/elastic-charts/pull/281 we keep the specs untouched on mount
  // in MobX version, the stackAccessors was programmatically added to every histogram specs
  // in ReduX version, we left untouched the specs, so we have to manually check that
  const isHistogramEnabled = specs.some(
    ({ seriesType, enableHistogramMode }) => seriesType === SeriesTypes.Bar && enableHistogramMode,
  );
  // split each specs by groupId and by stacked or not
  specs.forEach((spec) => {
    const group = specsByGroupIds.get(spec.groupId) || {
      stackMode: undefined,
      stacked: [],
      nonStacked: [],
    };
    // stack every bars if using histogram mode
    // independenyly from lines and areas
    if (
      (spec.seriesType === SeriesTypes.Bar && isHistogramEnabled) ||
      (spec.stackAccessors && spec.stackAccessors.length > 0)
    ) {
      group.stacked.push(spec);
    } else {
      group.nonStacked.push(spec);
    }
    if (group.stackMode === undefined && spec.stackMode !== undefined) {
      group.stackMode = spec.stackMode;
    }
    if (spec.stackMode !== undefined && group.stackMode !== undefined && group.stackMode !== spec.stackMode) {
      Logger.warn(`Is not possible to mix different stackModes, please align all stackMode on the same GroupId
      to the same mode. The default behaviour will be to use the first encountered stackMode on the series`);
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
 * @internal
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
    const { value } = scales.next();
    return value;
  }
  return ScaleType.Linear;
}
