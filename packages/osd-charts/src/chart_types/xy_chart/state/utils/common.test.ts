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

import { ChartType } from '../../..';
import { LegendItem } from '../../../../common/legend';
import { ScaleType } from '../../../../scales/constants';
import { SpecType } from '../../../../specs';
import { BARCHART_1Y1G } from '../../../../utils/data_samples/test_dataset';
import { Point } from '../../../../utils/point';
import { AreaSeriesSpec, SeriesType, LineSeriesSpec, BarSeriesSpec } from '../../utils/specs';
import {
  isHorizontalRotation,
  isVerticalRotation,
  isLineAreaOnlyChart,
  isChartAnimatable,
  isAllSeriesDeselected,
  sortClosestToPoint,
} from './common';

describe('Type Checks', () => {
  it('is horizontal chart rotation', () => {
    expect(isHorizontalRotation(0)).toBe(true);
    expect(isHorizontalRotation(180)).toBe(true);
    expect(isHorizontalRotation(-90)).toBe(false);
    expect(isHorizontalRotation(90)).toBe(false);
    expect(isVerticalRotation(-90)).toBe(true);
    expect(isVerticalRotation(90)).toBe(true);
    expect(isVerticalRotation(0)).toBe(false);
    expect(isVerticalRotation(180)).toBe(false);
  });
  it('is vertical chart rotation', () => {
    expect(isVerticalRotation(-90)).toBe(true);
    expect(isVerticalRotation(90)).toBe(true);
    expect(isVerticalRotation(0)).toBe(false);
    expect(isVerticalRotation(180)).toBe(false);
  });

  describe('#isLineAreaOnlyChart', () => {
    it('is an area or line only map', () => {
      const area: AreaSeriesSpec = {
        chartType: ChartType.XYAxis,
        specType: SpecType.Series,
        id: 'area',
        groupId: 'group1',
        seriesType: SeriesType.Area,
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Linear,
        xAccessor: 'x',
        yAccessors: ['y'],
        splitSeriesAccessors: ['g'],
        data: BARCHART_1Y1G,
      };
      const line: LineSeriesSpec = {
        chartType: ChartType.XYAxis,
        specType: SpecType.Series,
        id: 'line',
        groupId: 'group2',
        seriesType: SeriesType.Line,
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Linear,
        xAccessor: 'x',
        yAccessors: ['y'],
        splitSeriesAccessors: ['g'],
        stackAccessors: ['x'],
        data: BARCHART_1Y1G,
      };
      const bar: BarSeriesSpec = {
        chartType: ChartType.XYAxis,
        specType: SpecType.Series,
        id: 'bar',
        groupId: 'group2',
        seriesType: SeriesType.Bar,
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
    it('can enable the chart animation if we have a valid number of elements', () => {
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

  it('displays no data available if chart is empty', () => {
    const legendItems1: LegendItem[] = [
      {
        color: '#1EA593',
        label: 'a',
        seriesIdentifiers: [
          {
            key: 'specId:{bars},colors:{a}',
            specId: 'bars',
          },
        ],
        defaultExtra: { raw: 6, formatted: '6.00', legendSizingLabel: '6.00' },
        isSeriesHidden: true,
        path: [],
        keys: [],
      },
      {
        color: '#2B70F7',
        label: 'b',
        seriesIdentifiers: [
          {
            key: 'specId:{bars},colors:{b}',
            specId: 'bars',
          },
        ],
        defaultExtra: { raw: 2, formatted: '2.00', legendSizingLabel: '2.00' },
        isSeriesHidden: true,
        path: [],
        keys: [],
      },
    ];
    expect(isAllSeriesDeselected(legendItems1)).toBe(true);
  });
  it('displays data availble if chart is not empty', () => {
    const legendItems2: LegendItem[] = [
      {
        color: '#1EA593',
        label: 'a',
        seriesIdentifiers: [
          {
            key: 'specId:{bars},colors:{a}',
            specId: 'bars',
          },
        ],
        defaultExtra: { raw: 6, formatted: '6.00', legendSizingLabel: '6.00' },
        isSeriesHidden: false,
        path: [],
        keys: [],
      },
      {
        color: '#2B70F7',
        label: 'b',
        seriesIdentifiers: [
          {
            key: 'specId:{bars},colors:{b}',
            specId: 'bars',
          },
        ],
        defaultExtra: { raw: 2, formatted: '2.00', legendSizingLabel: '2.00' },
        isSeriesHidden: true,
        path: [],
        keys: [],
      },
    ];
    expect(isAllSeriesDeselected(legendItems2)).toBe(false);
  });

  describe('#sortClosestToPoint', () => {
    describe('positive cursor', () => {
      const cursor: Point = { x: 10, y: 10 };

      it('should sort points with same x', () => {
        const points: Point[] = [
          { x: 10, y: -10 },
          { x: 10, y: 12 },
          { x: 10, y: 11 },
          { x: 10, y: 10 },
          { x: 10, y: 5 },
          { x: 10, y: -12 },
        ];
        expect(points.sort(sortClosestToPoint(cursor))).toEqual([
          { x: 10, y: 10 },
          { x: 10, y: 11 },
          { x: 10, y: 12 },
          { x: 10, y: 5 },
          { x: 10, y: -10 },
          { x: 10, y: -12 },
        ]);
      });

      it('should sort points with different x', () => {
        const points: Point[] = [
          { x: 9, y: -10 },
          { x: -6, y: 12 },
          { x: 3, y: 11 },
          { x: 9, y: 10 },
          { x: 1, y: 5 },
          { x: -9, y: -12 },
        ];
        expect(points.sort(sortClosestToPoint(cursor))).toEqual([
          { x: 9, y: 10 },
          { x: 3, y: 11 },
          { x: 1, y: 5 },
          { x: -6, y: 12 },
          { x: 9, y: -10 },
          { x: -9, y: -12 },
        ]);
      });
    });

    describe('negative cursor', () => {
      const cursor: Point = { x: -10, y: -10 };

      it('should sort points with same x', () => {
        const points: Point[] = [
          { x: 10, y: -10 },
          { x: 10, y: 12 },
          { x: 10, y: 11 },
          { x: 10, y: 10 },
          { x: 10, y: 5 },
          { x: 10, y: -12 },
        ];
        expect(points.sort(sortClosestToPoint(cursor))).toEqual([
          { x: 10, y: -10 },
          { x: 10, y: -12 },
          { x: 10, y: 5 },
          { x: 10, y: 10 },
          { x: 10, y: 11 },
          { x: 10, y: 12 },
        ]);
      });

      it('should sort points with different x', () => {
        const points: Point[] = [
          { x: 9, y: -10 },
          { x: -6, y: 12 },
          { x: 3, y: 11 },
          { x: 9, y: 10 },
          { x: 1, y: 5 },
          { x: -9, y: -12 },
        ];
        expect(points.sort(sortClosestToPoint(cursor))).toEqual([
          { x: -9, y: -12 },
          { x: 1, y: 5 },
          { x: 9, y: -10 },
          { x: -6, y: 12 },
          { x: 3, y: 11 },
          { x: 9, y: 10 },
        ]);
      });
    });
  });
});
