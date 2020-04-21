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

import {
  getGeometryStateStyle,
  isPointOnGeometry,
  getBarStyleOverrides,
  getPointStyleOverrides,
  getClippedRanges,
  getRadiusFn,
} from './rendering';
import { BarSeriesStyle, SharedGeometryStateStyle, PointStyle } from '../../../utils/themes/theme';
import { DataSeriesDatum, XYChartSeriesIdentifier } from '../utils/series';
import { mergePartial, RecursivePartial } from '../../../utils/commons';
import { BarGeometry, PointGeometry } from '../../../utils/geometry';
import { MockDataSeries } from '../../../mocks';
import { MockScale } from '../../../mocks/scale';
import { LegendItem } from '../../../commons/legend';

describe('Rendering utils', () => {
  test('check if point is on geometry', () => {
    const seriesStyle = {
      rect: {
        opacity: 1,
      },
      rectBorder: {
        strokeWidth: 1,
        visible: false,
      },
      displayValue: {
        fill: 'black',
        fontFamily: '',
        fontSize: 2,
        offsetX: 0,
        offsetY: 0,
        padding: 2,
      },
    };

    const geometry: BarGeometry = {
      color: 'red',
      seriesIdentifier: {
        specId: 'id',
        yAccessor: 'y1',
        splitAccessors: new Map(),
        seriesKeys: [],
        key: '',
      },
      value: {
        accessor: 'y1',
        x: 0,
        y: 0,
        mark: null,
      },
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      seriesStyle,
    };
    expect(isPointOnGeometry(0, 0, geometry)).toBe(true);
    expect(isPointOnGeometry(10, 10, geometry)).toBe(true);
    expect(isPointOnGeometry(0, 10, geometry)).toBe(true);
    expect(isPointOnGeometry(10, 0, geometry)).toBe(true);
    expect(isPointOnGeometry(-10, 0, geometry)).toBe(false);
    expect(isPointOnGeometry(-11, 0, geometry)).toBe(false);
    expect(isPointOnGeometry(11, 11, geometry)).toBe(false);
  });
  test('check if point is on point geometry', () => {
    const geometry: PointGeometry = {
      color: 'red',
      seriesIdentifier: {
        specId: 'id',
        yAccessor: 'y1',
        splitAccessors: new Map(),
        seriesKeys: [],
        key: '',
      },
      value: {
        accessor: 'y1',
        x: 0,
        y: 0,
        mark: null,
      },
      transform: {
        x: 0,
        y: 0,
      },
      x: 0,
      y: 0,
      radius: 10,
    };
    // with buffer
    expect(isPointOnGeometry(10, 10, geometry, 10)).toBe(true);
    expect(isPointOnGeometry(20, 20, geometry, 5)).toBe(false);

    // without buffer
    expect(isPointOnGeometry(0, 0, geometry, 0)).toBe(true);
    expect(isPointOnGeometry(0, 10, geometry, 0)).toBe(true);
    expect(isPointOnGeometry(10, 0, geometry, 0)).toBe(true);
    expect(isPointOnGeometry(11, 11, geometry, 0)).toBe(false);
    expect(isPointOnGeometry(-10, 0, geometry, 0)).toBe(true);
    expect(isPointOnGeometry(-11, 0, geometry, 0)).toBe(false);
    expect(isPointOnGeometry(11, 11, geometry, 0)).toBe(false);

    // should use radial check
    expect(isPointOnGeometry(9, 9, geometry, 0)).toBe(false);
    expect(isPointOnGeometry(-9, 9, geometry, 0)).toBe(false);
    expect(isPointOnGeometry(9, -9, geometry, 0)).toBe(false);
    expect(isPointOnGeometry(-9, -9, geometry, 0)).toBe(false);
  });

  describe('should get common geometry style dependent on legend item highlight state', () => {
    const seriesIdentifier: XYChartSeriesIdentifier = {
      specId: 'id',
      yAccessor: 'y1',
      splitAccessors: new Map(),
      seriesKeys: [],
      key: 'somekey',
    };
    const highlightedLegendItem: LegendItem = {
      color: '',
      label: '',
      seriesIdentifier,
      isSeriesHidden: false,
      defaultExtra: {
        formatted: null,
        raw: null,
      },
    };

    const unhighlightedLegendItem: LegendItem = {
      ...highlightedLegendItem,
      seriesIdentifier: {
        ...seriesIdentifier,
        key: 'not me',
      },
    };

    const sharedThemeStyle: SharedGeometryStateStyle = {
      default: {
        opacity: 1,
      },
      highlighted: {
        opacity: 0.5,
      },
      unhighlighted: {
        opacity: 0.25,
      },
    };

    it('no highlighted elements', () => {
      const defaultStyle = getGeometryStateStyle(seriesIdentifier, null, sharedThemeStyle);
      expect(defaultStyle).toBe(sharedThemeStyle.default);
    });

    it('should equal highlighted opacity', () => {
      const highlightedStyle = getGeometryStateStyle(seriesIdentifier, highlightedLegendItem, sharedThemeStyle);
      expect(highlightedStyle).toBe(sharedThemeStyle.highlighted);
    });

    it('should equal unhighlighted when not highlighted item', () => {
      const unhighlightedStyle = getGeometryStateStyle(seriesIdentifier, unhighlightedLegendItem, sharedThemeStyle);
      expect(unhighlightedStyle).toBe(sharedThemeStyle.unhighlighted);
    });

    it('should equal custom spec highlighted opacity', () => {
      const customHighlightedStyle = getGeometryStateStyle(seriesIdentifier, highlightedLegendItem, sharedThemeStyle);
      expect(customHighlightedStyle).toBe(sharedThemeStyle.highlighted);
    });

    it('unhighlighted elements remain unchanged with custom opacity', () => {
      const customUnhighlightedStyle = getGeometryStateStyle(
        seriesIdentifier,
        unhighlightedLegendItem,
        sharedThemeStyle,
      );
      expect(customUnhighlightedStyle).toBe(sharedThemeStyle.unhighlighted);
    });

    it('has individual highlight', () => {
      const hasIndividualHighlight = getGeometryStateStyle(seriesIdentifier, null, sharedThemeStyle, {
        hasHighlight: true,
        hasGeometryHover: true,
      });
      expect(hasIndividualHighlight).toBe(sharedThemeStyle.highlighted);
    });

    it('no highlight', () => {
      const noHighlight = getGeometryStateStyle(seriesIdentifier, null, sharedThemeStyle, {
        hasHighlight: false,
        hasGeometryHover: true,
      });
      expect(noHighlight).toBe(sharedThemeStyle.unhighlighted);
    });

    it('no geometry hover', () => {
      const noHover = getGeometryStateStyle(seriesIdentifier, null, sharedThemeStyle, {
        hasHighlight: true,
        hasGeometryHover: false,
      });
      expect(noHover).toBe(sharedThemeStyle.highlighted);
    });
  });

  describe('getBarStyleOverrides', () => {
    let mockAccessor: jest.Mock;

    const sampleSeriesStyle: BarSeriesStyle = {
      rect: {
        opacity: 1,
      },
      rectBorder: {
        visible: true,
        strokeWidth: 1,
      },
      displayValue: {
        fontSize: 10,
        fontFamily: 'helvetica',
        fill: 'blue',
        padding: 1,
        offsetX: 1,
        offsetY: 1,
      },
    };
    const datum: DataSeriesDatum = {
      x: 1,
      y1: 2,
      y0: 3,
      initialY1: 4,
      initialY0: 5,
      mark: null,
      datum: null,
    };
    const seriesIdentifier: XYChartSeriesIdentifier = {
      specId: 'test',
      yAccessor: 'test',
      splitAccessors: new Map(),
      seriesKeys: ['test'],
      key: '',
    };

    beforeEach(() => {
      mockAccessor = jest.fn();
    });

    it('should return input seriesStyle if no barStyleAccessor is passed', () => {
      const styleOverrides = getBarStyleOverrides(datum, seriesIdentifier, sampleSeriesStyle);

      expect(styleOverrides).toBe(sampleSeriesStyle);
    });

    it('should return input seriesStyle if barStyleAccessor returns null', () => {
      mockAccessor.mockReturnValue(null);
      const styleOverrides = getBarStyleOverrides(datum, seriesIdentifier, sampleSeriesStyle, mockAccessor);

      expect(styleOverrides).toBe(sampleSeriesStyle);
    });

    it('should call barStyleAccessor with datum and seriesIdentifier', () => {
      getBarStyleOverrides(datum, seriesIdentifier, sampleSeriesStyle, mockAccessor);

      expect(mockAccessor).toBeCalledWith(datum, seriesIdentifier);
    });

    it('should return seriesStyle with updated fill color', () => {
      const color = 'blue';
      mockAccessor.mockReturnValue(color);
      const styleOverrides = getBarStyleOverrides(datum, seriesIdentifier, sampleSeriesStyle, mockAccessor);
      const expectedStyles: BarSeriesStyle = {
        ...sampleSeriesStyle,
        rect: {
          ...sampleSeriesStyle.rect,
          fill: color,
        },
      };
      expect(styleOverrides).toEqual(expectedStyles);
    });

    it('should return a new seriesStyle object with color', () => {
      mockAccessor.mockReturnValue('blue');
      const styleOverrides = getBarStyleOverrides(datum, seriesIdentifier, sampleSeriesStyle, mockAccessor);

      expect(styleOverrides).not.toBe(sampleSeriesStyle);
    });

    it('should return seriesStyle with updated partial style', () => {
      const partialStyle: RecursivePartial<BarSeriesStyle> = {
        rect: {
          fill: 'blue',
        },
        rectBorder: {
          strokeWidth: 10,
        },
      };
      mockAccessor.mockReturnValue(partialStyle);
      const styleOverrides = getBarStyleOverrides(datum, seriesIdentifier, sampleSeriesStyle, mockAccessor);
      const expectedStyles = mergePartial(sampleSeriesStyle, partialStyle, {
        mergeOptionalPartialValues: true,
      });

      expect(styleOverrides).toEqual(expectedStyles);
    });

    it('should return a new seriesStyle object with partial styles', () => {
      mockAccessor.mockReturnValue({
        rect: {
          fill: 'blue',
        },
      });
      const styleOverrides = getBarStyleOverrides(datum, seriesIdentifier, sampleSeriesStyle, mockAccessor);

      expect(styleOverrides).not.toBe(sampleSeriesStyle);
    });
  });

  describe('getPointStyleOverrides', () => {
    let mockAccessor: jest.Mock;

    const datum: DataSeriesDatum = {
      x: 1,
      y1: 2,
      y0: 3,
      initialY1: 4,
      initialY0: 5,
      mark: null,
      datum: null,
    };
    const seriesIdentifier: XYChartSeriesIdentifier = {
      specId: 'test',
      yAccessor: 'test',
      splitAccessors: new Map(),
      seriesKeys: ['test'],
      key: '',
    };

    beforeEach(() => {
      mockAccessor = jest.fn();
    });

    it('should return undefined if no pointStyleAccessor is passed', () => {
      const styleOverrides = getPointStyleOverrides(datum, seriesIdentifier);

      expect(styleOverrides).toBeUndefined();
    });

    it('should return undefined if pointStyleAccessor returns null', () => {
      mockAccessor.mockReturnValue(null);
      const styleOverrides = getPointStyleOverrides(datum, seriesIdentifier, mockAccessor);

      expect(styleOverrides).toBeUndefined();
    });

    it('should call pointStyleAccessor with datum and seriesIdentifier', () => {
      getPointStyleOverrides(datum, seriesIdentifier, mockAccessor);

      expect(mockAccessor).toBeCalledWith(datum, seriesIdentifier);
    });

    it('should return seriesStyle with updated stroke color', () => {
      const stroke = 'blue';
      mockAccessor.mockReturnValue(stroke);
      const styleOverrides = getPointStyleOverrides(datum, seriesIdentifier, mockAccessor);
      const expectedStyles: Partial<PointStyle> = {
        stroke,
      };
      expect(styleOverrides).toEqual(expectedStyles);
    });
  });

  describe('getClippedRanges', () => {
    const dataSeries = MockDataSeries.fitFunction({ shuffle: false });
    const xScale = MockScale.default({
      scale: jest.fn().mockImplementation((x) => x),
      bandwidth: 0,
      range: [dataSeries.data[0].x as number, dataSeries.data[12].x as number],
    });

    it('should return array pairs of non-null x regions with null end values', () => {
      const actual = getClippedRanges(dataSeries.data, xScale, 0);

      expect(actual).toEqual([
        [0, 1],
        [2, 4],
        [4, 6],
        [7, 11],
        [11, 12],
      ]);
    });

    it('should return array pairs of non-null x regions with valid end values', () => {
      const data = dataSeries.data.slice(1, -1);
      const xScale = MockScale.default({
        scale: jest.fn().mockImplementation((x) => x),
        range: [data[0].x as number, data[10].x as number],
      });
      const actual = getClippedRanges(data, xScale, 0);

      expect(actual).toEqual([
        [2, 4],
        [4, 6],
        [7, 11],
      ]);
    });

    it('should account for bandwidth', () => {
      const bandwidth = 2;
      const xScale = MockScale.default({
        scale: jest.fn().mockImplementation((x) => x),
        bandwidth,
        range: [dataSeries.data[0].x as number, (dataSeries.data[12].x as number) + bandwidth * (2 / 3)],
      });
      const actual = getClippedRanges(dataSeries.data, xScale, 0);

      expect(actual).toEqual([
        [0, 2],
        [3, 5],
        [5, 7],
        [8, 12],
      ]);
    });

    it('should account for xScaleOffset', () => {
      const actual = getClippedRanges(dataSeries.data, xScale, 2);

      expect(actual).toEqual([
        [0, -1],
        [0, 2],
        [2, 4],
        [5, 9],
      ]);
    });

    it('should call scale to get x value for each datum', () => {
      getClippedRanges(dataSeries.data, xScale, 0);

      expect(xScale.scale).toHaveBeenNthCalledWith(1, dataSeries.data[0].x);
      expect(xScale.scale).toHaveBeenCalledTimes(dataSeries.data.length);
      expect(xScale.scale).toHaveBeenCalledWith(dataSeries.data[12].x);
    });
  });
  describe('#getRadiusFn', () => {
    describe('empty data', () => {
      const getRadius = getRadiusFn([], 1);

      it('should return a function', () => {
        expect(getRadius).toBeFunction();
      });

      it.each<[number, number]>([
        [0, 0],
        [10, 10],
        [1000, 1000],
        [10000, 10000],
      ])('should always return 0 - %#', (...args) => {
        expect(getRadius(...args)).toBe(0);
      });
    });

    describe('default markSizeRatio', () => {
      const { data } = MockDataSeries.random(
        {
          count: 20,
          mark: { min: 500, max: 1000 },
        },
        true,
      );
      const getRadius = getRadiusFn(data, 1);

      it('should return a function', () => {
        expect(getRadius).toBeFunction();
      });

      describe('Dataset validations', () => {
        const expectedValues = [
          15.29,
          40.89,
          13.39,
          36.81,
          44.66,
          44.34,
          51.01,
          6.97,
          34.04,
          49.07,
          45.11,
          25.44,
          8.98,
          9.33,
          50.62,
          48.89,
          44.34,
          1,
          33.09,
          5.94,
        ];
        it.each<[number | null, number]>(data.map(({ mark }, i) => [mark, expectedValues[i]]))(
          'should return stepped value from domain - data[%#]',
          (mark, expected) => {
            expect(getRadius(mark)).toBeCloseTo(expected, 1);
          },
        );
      });

      it('should return default values when mark is null', () => {
        expect(getRadius(null, 111)).toBe(111);
      });
    });

    describe('variable markSizeRatio', () => {
      const { data } = MockDataSeries.random(
        {
          count: 5,
          mark: { min: 0, max: 100 },
        },
        true,
      );

      describe('markSizeRatio - -100', () => {
        // Should be treated as 0
        const getRadius = getRadiusFn(data, 1, -100);
        it.each<[number | null]>(data.map(({ mark }) => [mark]))('should return stepped value - data[%#]', (mark) => {
          expect(getRadius(mark)).toBe(1);
        });
      });

      describe('markSizeRatio - 0', () => {
        const getRadius = getRadiusFn(data, 1, 0);
        it.each<[number | null]>(data.map(({ mark }) => [mark]))('should return stepped value - data[%#]', (mark) => {
          expect(getRadius(mark)).toBe(1);
        });
      });

      describe('markSizeRatio - 1', () => {
        const getRadius = getRadiusFn(data, 1, 1);
        const expectedRadii = [2.62, 2.59, 1, 2.73, 2.63];
        it.each<[number | null, number]>(data.map(({ mark }, i) => [mark, expectedRadii[i]]))(
          'should return stepped value - data[%#]',
          (mark, expected) => {
            expect(getRadius(mark)).toBeCloseTo(expected, 1);
          },
        );
      });

      describe('markSizeRatio - 10', () => {
        const getRadius = getRadiusFn(data, 1, 10);
        const expectedRadii = [9.09, 8.56, 1, 11.1, 9.38];
        it.each<[number | null, number]>(data.map(({ mark }, i) => [mark, expectedRadii[i]]))(
          'should return stepped value - data[%#]',
          (mark, expected) => {
            expect(getRadius(mark)).toBeCloseTo(expected, 1);
          },
        );
      });

      describe('markSizeRatio - 100', () => {
        const getRadius = getRadiusFn(data, 1, 100);
        const expectedRadii = [80.71, 75.37, 1, 101.0, 83.61];
        it.each<[number | null, number]>(data.map(({ mark }, i) => [mark, expectedRadii[i]]))(
          'should return stepped value - data[%#]',
          (mark, expected) => {
            expect(getRadius(mark)).toBeCloseTo(expected, 1);
          },
        );
      });

      describe('markSizeRatio - 1000', () => {
        // Should be treated as 100
        const getRadius = getRadiusFn(data, 1, 1000);
        const expectedRadii = [80.71, 75.37, 1, 101.0, 83.61];
        it.each<[number | null, number]>(data.map(({ mark }, i) => [mark, expectedRadii[i]]))(
          'should return stepped value - data[%#]',
          (mark, expected) => {
            expect(getRadius(mark)).toBeCloseTo(expected, 1);
          },
        );
      });
    });
  });
});
