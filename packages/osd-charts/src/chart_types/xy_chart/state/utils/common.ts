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

import { LegendItem } from '../../../../common/legend';
import { getDistance, Rotation } from '../../../../utils/common';
import { Point } from '../../../../utils/point';
import { BasicSeriesSpec, SeriesType } from '../../utils/specs';
import { GeometriesCounts } from './types';

/** @internal */
export const MAX_ANIMATABLE_BARS = 300;
/** @internal */
export const MAX_ANIMATABLE_LINES_AREA_POINTS = 600;

/** @internal */
export function isHorizontalRotation(chartRotation: Rotation) {
  return chartRotation === 0 || chartRotation === 180;
}

/** @internal */
export function isVerticalRotation(chartRotation: Rotation) {
  return chartRotation === -90 || chartRotation === 90;
}
/**
 * Check if a specs map contains only line or area specs
 * @param specs Map<SpecId, BasicSeriesSpec>
 * @internal
 */
export function isLineAreaOnlyChart(specs: BasicSeriesSpec[]) {
  return !specs.some((spec) => spec.seriesType === SeriesType.Bar);
}

/** @internal */
export function isChartAnimatable(geometriesCounts: GeometriesCounts, animationEnabled: boolean): boolean {
  if (!animationEnabled) {
    return false;
  }
  const { bars, linePoints, areasPoints } = geometriesCounts;
  const isBarsAnimatable = bars <= MAX_ANIMATABLE_BARS;
  const isLinesAndAreasAnimatable = linePoints + areasPoints <= MAX_ANIMATABLE_LINES_AREA_POINTS;
  return isBarsAnimatable && isLinesAndAreasAnimatable;
}

/** @internal */
export function isAllSeriesDeselected(legendItems: LegendItem[]): boolean {
  // eslint-disable-next-line no-restricted-syntax
  for (const legendItem of legendItems) {
    if (!legendItem.isSeriesHidden) {
      return false;
    }
  }
  return true;
}

/**
 * Sorts points in order from closest to farthest from cursor
 * @internal
 */
export const sortClosestToPoint = (cursor: Point) => (a: Point, b: Point): number => {
  return getDistance(cursor, a) - getDistance(cursor, b);
};
