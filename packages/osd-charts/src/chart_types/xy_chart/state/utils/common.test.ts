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

import { ChartTypes } from '../../..';
import { LegendItem } from '../../../../commons/legend';
import { ScaleType } from '../../../../scales/constants';
import { SpecTypes } from '../../../../specs';
import { BARCHART_1Y1G } from '../../../../utils/data_samples/test_dataset';
import { AreaSeriesSpec, SeriesTypes, LineSeriesSpec, BarSeriesSpec } from '../../utils/specs';
import {
  isHorizontalRotation,
  isVerticalRotation,
  isLineAreaOnlyChart,
  isChartAnimatable,
  isAllSeriesDeselected,
} from './common';

describe('Type Checks', () => {
  test('is horizontal chart rotation', () => {
    expect(isHorizontalRotation(0)).toBe(true);
    expect(isHorizontalRotation(180)).toBe(true);
    expect(isHorizontalRotation(-90)).toBe(false);
    expect(isHorizontalRotation(90)).toBe(false);
    expect(isVerticalRotation(-90)).toBe(true);
    expect(isVerticalRotation(90)).toBe(true);
    expect(isVerticalRotation(0)).toBe(false);
    expect(isVerticalRotation(180)).toBe(false);
  });
  test('is vertical chart rotation', () => {
    expect(isVerticalRotation(-90)).toBe(true);
    expect(isVerticalRotation(90)).toBe(true);
    expect(isVerticalRotation(0)).toBe(false);
    expect(isVerticalRotation(180)).toBe(false);
  });

  describe('#isLineAreaOnlyChart', () => {
    test('is an area or line only map', () => {
      const area: AreaSeriesSpec = {
        chartType: ChartTypes.XYAxis,
        specType: SpecTypes.Series,
        id: 'area',
        groupId: 'group1',
        seriesType: SeriesTypes.Area,
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Linear,
        xAccessor: 'x',
        yAccessors: ['y'],
        splitSeriesAccessors: ['g'],
        data: BARCHART_1Y1G,
      };
      const line: LineSeriesSpec = {
        chartType: ChartTypes.XYAxis,
        specType: SpecTypes.Series,
        id: 'line',
        groupId: 'group2',
        seriesType: SeriesTypes.Line,
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Linear,
        xAccessor: 'x',
        yAccessors: ['y'],
        splitSeriesAccessors: ['g'],
        stackAccessors: ['x'],
        data: BARCHART_1Y1G,
      };
      const bar: BarSeriesSpec = {
        chartType: ChartTypes.XYAxis,
        specType: SpecTypes.Series,
        id: 'bar',
        groupId: 'group2',
        seriesType: SeriesTypes.Bar,
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Linear,
        xAccessor: 'x',
        yAccessors: ['y'],
        splitSeriesAccessors: ['g'],
        stackAccessors: ['x'],
        data: BARCHART_1Y1G,
      };
      let series = [area, line, bar];
      expect(isLineAreaOnlyChart(series)).toBe(false);
      series = [area, line];
      expect(isLineAreaOnlyChart(series)).toBe(true);
      series = [area];
      expect(isLineAreaOnlyChart(series)).toBe(true);
      series = [line];
      expect(isLineAreaOnlyChart(series)).toBe(true);
      series = [bar, { ...bar, id: 'bar2' }];
      expect(isLineAreaOnlyChart(series)).toBe(false);
    });
  });

  describe('#isChartAnimatable', () => {
    test('can enable the chart animation if we have a valid number of elements', () => {
      const geometriesCounts = {
        points: 0,
        bars: 0,
        areas: 0,
        areasPoints: 0,
        lines: 0,
        linePoints: 0,
        bubbles: 0,
        bubblePoints: 0,
      };
      expect(isChartAnimatable(geometriesCounts, false)).toBe(false);
      expect(isChartAnimatable(geometriesCounts, true)).toBe(true);
      geometriesCounts.bars = 300;
      expect(isChartAnimatable(geometriesCounts, true)).toBe(true);
      geometriesCounts.areasPoints = 300;
      expect(isChartAnimatable(geometriesCounts, true)).toBe(true);
      geometriesCounts.linePoints = 300;
      expect(isChartAnimatable(geometriesCounts, true)).toBe(true);
      expect(isChartAnimatable(geometriesCounts, false)).toBe(false);
      geometriesCounts.linePoints = 301;
      expect(isChartAnimatable(geometriesCounts, true)).toBe(false);
    });
  });

  test('displays no data available if chart is empty', () => {
    const legendItems1: LegendItem[] = [
      {
        color: '#1EA593',
        label: 'a',
        seriesIdentifier: {
          key: 'specId:{bars},colors:{a}',
          specId: 'bars',
        },
        defaultExtra: { raw: 6, formatted: '6.00', legendSizingLabel: '6.00' },
        isSeriesHidden: true,
      },
      {
        color: '#2B70F7',
        label: 'b',
        seriesIdentifier: {
          key: 'specId:{bars},colors:{b}',
          specId: 'bars',
        },
        defaultExtra: { raw: 2, formatted: '2.00', legendSizingLabel: '2.00' },
        isSeriesHidden: true,
      },
    ];
    expect(isAllSeriesDeselected(legendItems1)).toBe(true);
  });
  test('displays data availble if chart is not empty', () => {
    const legendItems2: LegendItem[] = [
      {
        color: '#1EA593',
        label: 'a',
        seriesIdentifier: {
          key: 'specId:{bars},colors:{a}',
          specId: 'bars',
        },
        defaultExtra: { raw: 6, formatted: '6.00', legendSizingLabel: '6.00' },
        isSeriesHidden: false,
      },
      {
        color: '#2B70F7',
        label: 'b',
        seriesIdentifier: {
          key: 'specId:{bars},colors:{b}',
          specId: 'bars',
        },
        defaultExtra: { raw: 2, formatted: '2.00', legendSizingLabel: '2.00' },
        isSeriesHidden: true,
      },
    ];
    expect(isAllSeriesDeselected(legendItems2)).toBe(false);
  });
});
