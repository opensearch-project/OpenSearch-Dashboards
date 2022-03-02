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

import {
  stack as D3Stack,
  stackOffsetExpand as D3StackOffsetExpand,
  stackOffsetNone as D3StackOffsetNone,
  stackOffsetSilhouette as D3StackOffsetSilhouette,
  stackOffsetWiggle as D3StackOffsetWiggle,
  stackOrderNone,
  SeriesPoint,
} from 'd3-shape';

import { SeriesKey } from '../../../common/series_id';
import { ScaleType } from '../../../scales/constants';
import { clamp } from '../../../utils/common';
import { DataSeries, DataSeriesDatum } from './series';
import { StackMode } from './specs';

/** @internal */
export interface StackedValues {
  values: number[];
  percent: Array<number>;
  total: number;
}

/** @internal */
export const datumXSortPredicate = (xScaleType: ScaleType, sortedXValues?: (string | number)[]) => (
  a: { x: number | string },
  b: { x: number | string },
) => {
  if (xScaleType === ScaleType.Ordinal || typeof a.x === 'string' || typeof b.x === 'string') {
    return sortedXValues ? sortedXValues.indexOf(a.x) - sortedXValues.indexOf(b.x) : 0;
  }
  return a.x - b.x;
};

type D3StackArrayElement = Record<SeriesKey, string | number | null>;
type D3UnionStack = Record<
  SeriesKey,
  {
    y0: SeriesPoint<D3StackArrayElement>[];
    y1: SeriesPoint<D3StackArrayElement>[];
  }
>;

/** @internal */
export function formatStackedDataSeriesValues(
  dataSeries: DataSeries[],
  xValues: Set<string | number>,
  stackMode?: StackMode,
): DataSeries[] {
  const dataSeriesKeys = dataSeries.reduce<Record<SeriesKey, DataSeries>>((acc, curr) => {
    acc[curr.key] = curr;
    return acc;
  }, {});

  const xValuesArray = [...xValues];
  const reorderedArray: Array<D3StackArrayElement> = [];
  const xValueMap: Map<SeriesKey, Map<string | number, DataSeriesDatum>> = new Map();
  // transforming the current set of series into the d3 stack required data structure
  dataSeries.forEach(({ data, key, isFiltered }) => {
    if (isFiltered) {
      return;
    }
    const dsMap: Map<string | number, DataSeriesDatum> = new Map();
    data.forEach((d) => {
      const { x, y0, y1 } = d;
      const xIndex = xValuesArray.indexOf(x);

      if (reorderedArray[xIndex] === undefined) {
        reorderedArray[xIndex] = { x };
      }
      // y0 can be considered as always present
      reorderedArray[xIndex][`${key}-y0`] = y0;
      // if y0 is available, we have to count y1 as the different of y1 and y0
      // to correctly stack them when stacking banded charts
      reorderedArray[xIndex][`${key}-y1`] = (y1 ?? 0) - (y0 ?? 0);
      dsMap.set(x, d);
    });
    xValueMap.set(key, dsMap);
  });

  const stackOffset = getOffsetBasedOnStackMode(stackMode);

  const keys = Object.keys(dataSeriesKeys).reduce<string[]>((acc, key) => [...acc, `${key}-y0`, `${key}-y1`], []);

  const stack = D3Stack<D3StackArrayElement>().keys(keys).order(stackOrderNone).offset(stackOffset)(reorderedArray);

  const unionedYStacks = stack.reduce<D3UnionStack>((acc, d) => {
    const key = d.key.slice(0, -3);
    const accessor = d.key.slice(-2);
    if (accessor !== 'y1' && accessor !== 'y0') {
      return acc;
    }
    if (!acc[key]) {
      acc[key] = {
        y0: [],
        y1: [],
      };
    }
    acc[key][accessor] = d.map((da) => da);
    return acc;
  }, {});

  return Object.keys(unionedYStacks).map((stackedDataSeriesKey) => {
    const dataSeriesProps = dataSeriesKeys[stackedDataSeriesKey];
    const dsMap = xValueMap.get(stackedDataSeriesKey);
    const { y0: y0StackArray, y1: y1StackArray } = unionedYStacks[stackedDataSeriesKey];
    const data = y1StackArray
      .map<DataSeriesDatum | null>((y1Stack, index) => {
        const { x } = y1Stack.data;
        if (x === undefined || x === null) {
          return null;
        }
        const originalData = dsMap?.get(x);
        if (!originalData) {
          return null;
        }
        const [, y0] = y0StackArray[index];
        const [, y1] = y1Stack;
        const { initialY0, initialY1, mark, datum, filled } = originalData;
        return {
          x,
          /**
           * Due to floating point errors, values computed on a stack
           * could falls out of the current defined domain boundaries.
           * This in particular cause issues with percent stack, where the domain
           * is hardcoded to [0,1] and some value can fall outside that domain.
           */
          y1: clampIfStackedAsPercentage(y1, stackMode),
          y0: clampIfStackedAsPercentage(y0, stackMode),
          initialY0,
          initialY1,
          mark,
          datum,
          filled,
        };
      })
      .filter((d) => d !== null) as DataSeriesDatum[];
    return {
      ...dataSeriesProps,
      data,
    };
  });
}

function clampIfStackedAsPercentage(value: number, stackMode?: StackMode) {
  return stackMode === StackMode.Percentage ? clamp(value, 0, 1) : value;
}

function getOffsetBasedOnStackMode(stackMode?: StackMode) {
  switch (stackMode) {
    case StackMode.Percentage:
      return D3StackOffsetExpand;
    case StackMode.Silhouette:
      return D3StackOffsetSilhouette;
    case StackMode.Wiggle:
      return D3StackOffsetWiggle;
    default:
      return D3StackOffsetNone;
  }
}
