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
 * under the License. */

import { DataSeries, DataSeriesDatum, RawDataSeries } from './series';
import { fitFunction } from './fit_function';
import { isAreaSeriesSpec, isLineSeriesSpec, SeriesSpecs, BasicSeriesSpec } from './specs';
import { ScaleType } from '../../../scales';
import { getSpecsById } from '../state/utils';

/** @internal */
export const formatNonStackedDataSeriesValues = (
  dataseries: RawDataSeries[],
  scaleToExtent: boolean,
  seriesSpecs: SeriesSpecs,
  xScaleType: ScaleType,
): DataSeries[] => {
  const len = dataseries.length;
  const formattedValues: DataSeries[] = [];
  for (let i = 0; i < len; i++) {
    const formattedDataValue = formatNonStackedDataValues(dataseries[i], scaleToExtent);
    const spec = getSpecsById<BasicSeriesSpec>(seriesSpecs, formattedDataValue.specId);

    if (
      spec !== null &&
      spec !== undefined &&
      (isAreaSeriesSpec(spec) || isLineSeriesSpec(spec)) &&
      spec.fit !== undefined
    ) {
      const fittedData = fitFunction(formattedDataValue, spec.fit, xScaleType);
      formattedValues.push(fittedData);
    } else {
      formattedValues.push(formattedDataValue);
    }
  }
  return formattedValues;
};

/** @internal */
export const formatNonStackedDataValues = (dataSeries: RawDataSeries, scaleToExtent: boolean): DataSeries => {
  const len = dataSeries.data.length;
  const formattedValues: DataSeries = {
    ...dataSeries,
    data: [],
  };
  for (let i = 0; i < len; i++) {
    const data = dataSeries.data[i];
    const { x, y1, datum } = data;
    let y0: number | null;
    if (y1 === null) {
      y0 = null;
    } else {
      if (scaleToExtent) {
        y0 = data.y0 ? data.y0 : y1;
      } else {
        y0 = data.y0 ? data.y0 : 0;
      }
    }

    const formattedValue: DataSeriesDatum = {
      x,
      y1,
      y0,
      initialY1: y1,
      initialY0: data.y0 == null || y1 === null ? null : data.y0,
      datum,
    };
    formattedValues.data.push(formattedValue);
  }
  return formattedValues;
};
