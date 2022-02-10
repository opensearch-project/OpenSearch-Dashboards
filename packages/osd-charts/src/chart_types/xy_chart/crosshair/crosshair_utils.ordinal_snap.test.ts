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

import { ChartType } from '../..';
import { MockGlobalSpec } from '../../../mocks/specs/specs';
import { ScaleType } from '../../../scales/constants';
import { SpecType } from '../../../specs/constants';
import { getScaleConfigsFromSpecs } from '../state/selectors/get_api_scale_configs';
import { computeSeriesDomains } from '../state/utils/utils';
import { computeXScale } from '../utils/scales';
import { BasicSeriesSpec, SeriesType } from '../utils/specs';
import { getSnapPosition } from './crosshair_utils';

describe('Crosshair utils ordinal scales', () => {
  const barSeries1SpecId = 'barSeries1';
  const barSeries2SpecId = 'barSeries2';
  const lineSeries1SpecId = 'lineSeries1';
  const lineSeries2SpecId = 'lineSeries2';

  const barSeries1: BasicSeriesSpec = {
    chartType: ChartType.XYAxis,
    specType: SpecType.Series,
    id: barSeries1SpecId,
    groupId: 'group1',
    seriesType: SeriesType.Bar,
    data: [
      ['a', 0],
      ['b', 0],
      ['c', 0],
    ],
    xAccessor: 0,
    yAccessors: [1],
    xScaleType: ScaleType.Ordinal,
    yScaleType: ScaleType.Linear,
  };
  const barSeries2: BasicSeriesSpec = {
    chartType: ChartType.XYAxis,
    specType: SpecType.Series,
    id: barSeries2SpecId,
    groupId: 'group1',
    seriesType: SeriesType.Bar,
    data: [
      ['a', 2],
      ['b', 2],
      ['c', 2],
    ],
    xAccessor: 0,
    yAccessors: [1],
    xScaleType: ScaleType.Ordinal,
    yScaleType: ScaleType.Linear,
  };
  const lineSeries1: BasicSeriesSpec = {
    chartType: ChartType.XYAxis,
    specType: SpecType.Series,
    id: lineSeries1SpecId,
    groupId: 'group1',
    seriesType: SeriesType.Line,
    data: [
      ['a', 0],
      ['b', 0],
      ['c', 0],
    ],
    xAccessor: 0,
    yAccessors: [1],
    xScaleType: ScaleType.Ordinal,
    yScaleType: ScaleType.Linear,
  };
  const lineSeries2: BasicSeriesSpec = {
    chartType: ChartType.XYAxis,
    specType: SpecType.Series,
    id: lineSeries2SpecId,
    groupId: 'group1',
    seriesType: SeriesType.Line,
    data: [
      ['a', 2],
      ['b', 2],
      ['c', 2],
    ],
    xAccessor: 0,
    yAccessors: [1],
    xScaleType: ScaleType.Ordinal,
    yScaleType: ScaleType.Linear,
  };

  const barSeries = [barSeries1];

  const barSeriesDomains = computeSeriesDomains(
    barSeries,
    getScaleConfigsFromSpecs([], barSeries, MockGlobalSpec.settings()),
  );

  const multiBarSeries = [barSeries1, barSeries2];
  const multiBarSeriesDomains = computeSeriesDomains(
    multiBarSeries,
    getScaleConfigsFromSpecs([], multiBarSeries, MockGlobalSpec.settings()),
  );

  const lineSeries = [lineSeries1];
  const lineSeriesDomains = computeSeriesDomains(
    lineSeries,
    getScaleConfigsFromSpecs([], lineSeries, MockGlobalSpec.settings()),
  );

  const multiLineSeries = [lineSeries1, lineSeries2];
  const multiLineSeriesDomains = computeSeriesDomains(
    multiLineSeries,
    getScaleConfigsFromSpecs([], multiLineSeries, MockGlobalSpec.settings()),
  );

  const mixedLinesBars = [lineSeries1, lineSeries2, barSeries1, barSeries2];
  const mixedLinesBarsSeriesDomains = computeSeriesDomains(
    mixedLinesBars,
    getScaleConfigsFromSpecs([], mixedLinesBars, MockGlobalSpec.settings()),
  );

  const barSeriesScale = computeXScale({
    xDomain: barSeriesDomains.xDomain,
    totalBarsInCluster: barSeries.length,
    range: [0, 120],
  });
  const multiBarSeriesScale = computeXScale({
    xDomain: multiBarSeriesDomains.xDomain,
    totalBarsInCluster: multiBarSeries.length,
    range: [0, 120],
  });
  const lineSeriesScale = computeXScale({
    xDomain: lineSeriesDomains.xDomain,
    totalBarsInCluster: lineSeries.length,
    range: [0, 120],
  });
  const multiLineSeriesScale = computeXScale({
    xDomain: multiLineSeriesDomains.xDomain,
    totalBarsInCluster: multiLineSeries.length,
    range: [0, 120],
  });
  const mixedLinesBarsSeriesScale = computeXScale({
    xDomain: mixedLinesBarsSeriesDomains.xDomain,
    totalBarsInCluster: mixedLinesBars.length,
    range: [0, 120],
  });

  test('can snap position on scale ordinal bar', () => {
    let snappedPosition = getSnapPosition('a', barSeriesScale);
    expect(snappedPosition?.band).toEqual(40);
    expect(snappedPosition?.position).toEqual(0);

    snappedPosition = getSnapPosition('b', barSeriesScale);
    expect(snappedPosition?.band).toEqual(40);
    expect(snappedPosition?.position).toEqual(40);

    snappedPosition = getSnapPosition('c', barSeriesScale);
    expect(snappedPosition?.band).toEqual(40);
    expect(snappedPosition?.position).toEqual(80);

    snappedPosition = getSnapPosition('x', barSeriesScale);
    expect(snappedPosition).toBeUndefined();

    snappedPosition = getSnapPosition('a', multiBarSeriesScale, 2);
    expect(snappedPosition?.band).toEqual(40);
    expect(snappedPosition?.position).toEqual(0);

    snappedPosition = getSnapPosition('b', multiBarSeriesScale, 2);
    expect(snappedPosition?.band).toEqual(40);
    expect(snappedPosition?.position).toEqual(40);

    snappedPosition = getSnapPosition('c', multiBarSeriesScale, 2);
    expect(snappedPosition?.band).toEqual(40);
    expect(snappedPosition?.position).toEqual(80);
  });
  test('can snap position on scale ordinal lines', () => {
    let snappedPosition = getSnapPosition('a', lineSeriesScale);
    expect(snappedPosition?.band).toEqual(40);
    expect(snappedPosition?.position).toEqual(0);

    snappedPosition = getSnapPosition('b', lineSeriesScale);
    expect(snappedPosition?.band).toEqual(40);
    expect(snappedPosition?.position).toEqual(40);

    snappedPosition = getSnapPosition('c', lineSeriesScale);
    expect(snappedPosition?.band).toEqual(40);
    expect(snappedPosition?.position).toEqual(80);

    snappedPosition = getSnapPosition('x', lineSeriesScale);
    expect(snappedPosition).toBeUndefined();

    snappedPosition = getSnapPosition('a', multiLineSeriesScale, 2);
    expect(snappedPosition?.band).toEqual(40);
    expect(snappedPosition?.position).toEqual(0);

    snappedPosition = getSnapPosition('b', multiLineSeriesScale, 2);
    expect(snappedPosition?.band).toEqual(40);
    expect(snappedPosition?.position).toEqual(40);

    snappedPosition = getSnapPosition('c', multiLineSeriesScale, 2);
    expect(snappedPosition?.band).toEqual(40);
    expect(snappedPosition?.position).toEqual(80);
  });

  test('can snap position on scale ordinal mixed lines/bars', () => {
    let snappedPosition = getSnapPosition('a', mixedLinesBarsSeriesScale, 4);
    expect(snappedPosition?.band).toEqual(40);
    expect(snappedPosition?.position).toEqual(0);

    snappedPosition = getSnapPosition('b', mixedLinesBarsSeriesScale, 4);
    expect(snappedPosition?.band).toEqual(40);
    expect(snappedPosition?.position).toEqual(40);

    snappedPosition = getSnapPosition('c', mixedLinesBarsSeriesScale, 4);
    expect(snappedPosition?.band).toEqual(40);
    expect(snappedPosition?.position).toEqual(80);

    snappedPosition = getSnapPosition('x', mixedLinesBarsSeriesScale, 4);
    expect(snappedPosition).toBeUndefined();
  });
});
