/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { uniq } from 'lodash';
import { Duration, Moment } from 'moment';
import { Unit } from '@elastic/datemath';

import { SerializedFieldFormat } from '../../../../../expressions/common/types';

export interface Column {
  id: string;
  name: string;
}

export interface Row {
  [key: string]: number | 'NaN';
}

export interface Table {
  columns: Column[];
  rows: Row[];
}

/**
 * Helper to build common chart properties shared by single-series and multi-series charts
 */
const buildBaseChartProperties = (
  xColumnName: string,
  xDimension: Dimension & { params: HistogramParams },
  allDataPoints: Array<{ x: number }>
) => {
  return {
    xAxisOrderedValues: uniq(allDataPoints.map((p) => p.x)),
    xAxisFormat: {
      id: (xDimension.format.id || 'date') as string,
      params: xDimension.format.params || { pattern: 'YYYY-MM-DD HH:mm' },
    },
    xAxisLabel: xColumnName,
    ordered: {
      date: true,
      interval: xDimension.params.interval,
      intervalOpenSearchUnit: xDimension.params.intervalOpenSearchUnit,
      intervalOpenSearchValue: xDimension.params.intervalOpenSearchValue,
      min: xDimension.params.bounds.min,
      max: xDimension.params.bounds.max,
    },
  };
};

interface HistogramParams {
  date: true;
  interval: Duration;
  intervalOpenSearchValue: number;
  intervalOpenSearchUnit: Unit;
  format: string;
  bounds: {
    min: Moment;
    max: Moment;
  };
}
export interface Dimension {
  accessor: 0 | 1;
  format: SerializedFieldFormat<{ pattern: string }>;
}

export interface Dimensions {
  x: Dimension & { params: HistogramParams };
  y: Dimension;
}

export interface Ordered {
  date: true;
  interval: Duration;
  intervalOpenSearchUnit: string;
  intervalOpenSearchValue: number;
  min: Moment;
  max: Moment;
}

export interface HistogramDataPoint {
  x: number;
  y: number;
}

export interface HistogramSeries {
  id: string;
  name: string;
  data: HistogramDataPoint[];
}

export interface Chart {
  values: HistogramDataPoint[];
  xAxisOrderedValues: number[];
  xAxisFormat: Dimension['format'];
  xAxisLabel: Column['name'];
  yAxisLabel?: Column['name'];
  ordered: Ordered;
  series?: HistogramSeries[];
}

export const buildPointSeriesData = (table: Table, dimensions: Dimensions) => {
  const { x, y } = dimensions;
  const xAccessor = table.columns[x.accessor].id;
  const yAccessor = table.columns[y.accessor].id;

  // Build values array
  const values = table.rows
    .filter((row) => row && row[yAccessor] !== 'NaN')
    .map((row) => ({
      x: row[xAccessor] as number,
      y: row[yAccessor] as number,
    }));

  // Use helper to build base chart properties
  const baseProperties = buildBaseChartProperties(table.columns[x.accessor].name, x, values);

  return {
    ...baseProperties,
    values,
    yAxisLabel: table.columns[y.accessor].name,
  } as Chart;
};

/**
 * Builds chart from pre-grouped breakdown series (from server)
 * Transforms server series structure into Chart format with HistogramSeries
 */
export const buildChartFromBreakdownSeries = (
  breakdownSeries: {
    breakdownField: string;
    series: Array<{ breakdownValue: string; dataPoints: Array<[number, number]> }>;
  },
  dimensions: Dimensions
): Chart => {
  const { x } = dimensions;

  // Transform server series to HistogramSeries with x/y accessors
  const series: HistogramSeries[] = breakdownSeries.series.map(
    ({ breakdownValue, dataPoints }) => ({
      id: breakdownValue,
      name: breakdownValue,
      data: dataPoints.map(([timestamp, count]) => ({
        x: timestamp,
        y: count,
      })),
    })
  );

  // Flatten all series data for base properties calculation and legacy values array
  const allDataPoints = series.flatMap((s) => s.data);

  // Build base chart properties using the time field name
  const baseProperties = buildBaseChartProperties(
    x.params.bounds.min.format('YYYY-MM-DD HH:mm'),
    x,
    allDataPoints
  );

  return {
    ...baseProperties,
    values: allDataPoints,
    yAxisLabel: 'Count',
    series,
    breakdownField: breakdownSeries.breakdownField,
  } as Chart;
};
