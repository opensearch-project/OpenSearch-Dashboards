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

import { ScaleType } from '../../../scales/constants';
import { DataSeries } from './series';
import { BasicSeriesSpec, isLineSeriesSpec, isAreaSeriesSpec } from './specs';

/**
 * @internal
 */
export function fillSeries(
  dataSeries: DataSeries[],
  xValues: Set<string | number>,
  groupScaleType: ScaleType,
): DataSeries[] {
  const sortedXValues = [...xValues.values()];
  return dataSeries.map((series) => {
    const { spec, data, isStacked } = series;

    const noFillRequired = isXFillNotRequired(spec, groupScaleType, isStacked);
    if (data.length === xValues.size || noFillRequired) {
      return {
        ...series,
        data,
      };
    }
    const filledData: typeof data = [];
    const missingValues = new Set(xValues);
    for (let i = 0; i < data.length; i++) {
      const { x } = data[i];
      filledData.push(data[i]);
      missingValues.delete(x);
    }

    const missingValuesArray = [...missingValues.values()];
    for (let i = 0; i < missingValuesArray.length; i++) {
      const missingValue = missingValuesArray[i];
      const index = sortedXValues.indexOf(missingValue);

      filledData.splice(index, 0, {
        x: missingValue,
        y1: null,
        y0: null,
        initialY1: null,
        initialY0: null,
        mark: null,
        datum: undefined,
        filled: {
          x: missingValue,
        },
      });
    }
    return {
      ...series,
      data: filledData,
    };
  });
}

function isXFillNotRequired(spec: BasicSeriesSpec, groupScaleType: ScaleType, isStacked: boolean) {
  const onlyNoFitAreaLine = (isAreaSeriesSpec(spec) || isLineSeriesSpec(spec)) && !spec.fit;
  const onlyContinuous = groupScaleType === ScaleType.Linear || groupScaleType === ScaleType.Time;
  return onlyNoFitAreaLine && onlyContinuous && !isStacked;
}
