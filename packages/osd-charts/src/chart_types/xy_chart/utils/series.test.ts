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

import { ColorConfig } from '../../../utils/themes/theme';
import { ScaleType } from '../../../scales';
import {
  SeriesCollectionValue,
  getFormattedDataseries,
  getSeriesColors,
  getSortedDataSeriesColorsValuesMap,
  getSplittedSeries,
  RawDataSeries,
  splitSeries,
  XYChartSeriesIdentifier,
  cleanDatum,
  getSeriesName,
} from './series';
import { BasicSeriesSpec, LineSeriesSpec, SeriesTypes, AreaSeriesSpec } from './specs';
import { formatStackedDataSeriesValues } from './stacked_series_utils';
import * as TestDataset from '../../../utils/data_samples/test_dataset';
import { ChartTypes } from '../..';
import { SpecTypes } from '../../../specs/settings';
import { MockSeriesSpec } from '../../../mocks/specs';
import { SeededDataGenerator } from '../../../mocks/utils';
import { MockSeriesIdentifier } from '../../../mocks/series/series_identifiers';
import { AccessorFn } from '../../../utils/accessor';

const dg = new SeededDataGenerator();

describe('Series', () => {
  test('Can split dataset into 1Y0G series', () => {
    const splittedSeries = splitSeries({
      id: 'spec1',
      data: TestDataset.BARCHART_1Y0G,
      xAccessor: 'x',
      yAccessors: ['y1'],
      splitSeriesAccessors: ['y'],
    });

    expect(splittedSeries.rawDataSeries).toMatchSnapshot();
  });
  test('Can split dataset into 1Y1G series', () => {
    const splittedSeries = splitSeries({
      id: 'spec1',
      data: TestDataset.BARCHART_1Y1G,
      xAccessor: 'x',
      yAccessors: ['y'],
    });
    expect(splittedSeries.rawDataSeries).toMatchSnapshot();
  });
  test('Can split dataset into 1Y2G series', () => {
    const splittedSeries = splitSeries({
      id: 'spec1',
      data: TestDataset.BARCHART_1Y2G,
      xAccessor: 'x',
      yAccessors: ['y'],
      splitSeriesAccessors: ['g1', 'g2'],
    });
    expect(splittedSeries.rawDataSeries).toMatchSnapshot();
  });
  test('Can split dataset into 2Y0G series', () => {
    const splittedSeries = splitSeries({
      id: 'spec1',
      data: TestDataset.BARCHART_2Y0G,
      xAccessor: 'x',
      yAccessors: ['y1', 'y2'],
    });
    expect(splittedSeries.rawDataSeries).toMatchSnapshot();
  });
  test('Can split dataset into 2Y1G series', () => {
    const splittedSeries = splitSeries({
      id: 'spec1',
      data: TestDataset.BARCHART_2Y1G,
      xAccessor: 'x',
      yAccessors: ['y1', 'y2'],
      splitSeriesAccessors: ['g'],
    });
    expect(splittedSeries.rawDataSeries).toMatchSnapshot();
  });
  test('Can split dataset into 2Y2G series', () => {
    const splittedSeries = splitSeries({
      id: 'spec1',
      data: TestDataset.BARCHART_2Y2G,
      xAccessor: 'x',
      yAccessors: ['y1', 'y2'],
      splitSeriesAccessors: ['g1', 'g2'],
    });
    expect(splittedSeries.rawDataSeries).toMatchSnapshot();
  });
  test('Can stack simple dataseries', () => {
    const dataSeries: RawDataSeries[] = [
      {
        specId: 'spec1',
        yAccessor: 'y1',
        splitAccessors: new Map(),
        seriesKeys: ['a'],
        key: 'a',
        data: [
          { x: 1, y1: 1, mark: null },
          { x: 2, y1: 2, mark: null },
          { x: 4, y1: 4, mark: null },
        ],
      },
      {
        specId: 'spec1',
        yAccessor: 'y1',
        splitAccessors: new Map(),
        seriesKeys: ['b'],
        key: 'b',
        data: [
          { x: 1, y1: 21, mark: null },
          { x: 3, y1: 23, mark: null },
        ],
      },
    ];
    const xValues = new Set([1, 2, 3, 4]);
    const stackedValues = formatStackedDataSeriesValues(dataSeries, false, false, xValues, ScaleType.Linear);
    expect(stackedValues).toMatchSnapshot();
  });
  test('Can stack multiple dataseries', () => {
    const dataSeries: RawDataSeries[] = [
      {
        specId: 'spec1',
        yAccessor: 'y1',
        splitAccessors: new Map(),
        seriesKeys: ['a'],
        key: 'a',
        data: [
          { x: 1, y1: 1, mark: null },
          { x: 2, y1: 2, mark: null },
          { x: 3, y1: 3, mark: null },
          { x: 4, y1: 4, mark: null },
        ],
      },
      {
        specId: 'spec1',
        yAccessor: 'y1',
        splitAccessors: new Map(),
        seriesKeys: ['b'],
        key: 'b',
        data: [
          { x: 1, y1: 1, mark: null },
          { x: 2, y1: 2, mark: null },
          { x: 3, y1: 3, mark: null },
          { x: 4, y1: 4, mark: null },
        ],
      },
      {
        specId: 'spec1',
        yAccessor: 'y1',
        splitAccessors: new Map(),
        seriesKeys: ['b'],
        key: 'b',
        data: [
          { x: 1, y1: 1, mark: null },
          { x: 2, y1: 2, mark: null },
          { x: 3, y1: 3, mark: null },
          { x: 4, y1: 4, mark: null },
        ],
      },
      {
        specId: 'spec1',
        yAccessor: 'y1',
        splitAccessors: new Map(),
        seriesKeys: ['b'],
        key: 'b',
        data: [
          { x: 1, y1: 1, mark: null },
          { x: 2, y1: 2, mark: null },
          { x: 3, y1: 3, mark: null },
          { x: 4, y1: 4, mark: null },
        ],
      },
    ];
    const xValues = new Set([1, 2, 3, 4]);
    const stackedValues = formatStackedDataSeriesValues(dataSeries, false, false, xValues, ScaleType.Linear);
    expect(stackedValues).toMatchSnapshot();
  });
  test('Can stack unsorted dataseries', () => {
    const dataSeries: RawDataSeries[] = [
      {
        specId: 'spec1',
        yAccessor: 'y1',
        splitAccessors: new Map(),
        seriesKeys: ['a'],
        key: 'a',
        data: [
          { x: 1, y1: 1, mark: null },
          { x: 4, y1: 4, mark: null },
          { x: 2, y1: 2, mark: null },
        ],
      },
      {
        specId: 'spec1',
        yAccessor: 'y1',
        splitAccessors: new Map(),
        seriesKeys: ['b'],
        key: 'b',
        data: [
          { x: 3, y1: 23, mark: null },
          { x: 1, y1: 21, mark: null },
        ],
      },
    ];
    const xValues = new Set([1, 2, 3, 4]);
    const stackedValues = formatStackedDataSeriesValues(dataSeries, false, false, xValues, ScaleType.Linear);
    expect(stackedValues).toMatchSnapshot();
  });
  test('Can stack high volume of dataseries', () => {
    const maxArrayItems = 1000;
    const dataSeries: RawDataSeries[] = [
      {
        specId: 'spec1',
        yAccessor: 'y1',
        splitAccessors: new Map(),
        seriesKeys: ['a'],
        key: 'a',
        data: new Array(maxArrayItems).fill(0).map((d, i) => ({ x: i, y1: i, mark: null })),
      },
      {
        specId: 'spec1',
        yAccessor: 'y1',
        splitAccessors: new Map(),
        seriesKeys: ['b'],
        key: 'b',
        data: new Array(maxArrayItems).fill(0).map((d, i) => ({ x: i, y1: i, mark: null })),
      },
    ];
    const xValues = new Set(new Array(maxArrayItems).fill(0).map((d, i) => i));
    const stackedValues = formatStackedDataSeriesValues(dataSeries, false, false, xValues, ScaleType.Linear);
    expect(stackedValues).toMatchSnapshot();
  });
  test('Can stack simple dataseries with scale to extent', () => {
    const dataSeries: RawDataSeries[] = [
      {
        specId: 'spec1',
        yAccessor: 'y1',
        splitAccessors: new Map(),
        seriesKeys: ['a'],
        key: 'a',
        data: [
          { x: 1, y1: 1, mark: null },
          { x: 2, y1: 2, mark: null },
          { x: 4, y1: 4, mark: null },
        ],
      },
      {
        specId: 'spec1',
        yAccessor: 'y1',
        splitAccessors: new Map(),
        seriesKeys: ['b'],
        key: 'b',
        data: [
          { x: 1, y1: 21, mark: null },
          { x: 3, y1: 23, mark: null },
        ],
      },
    ];
    const xValues = new Set([1, 2, 3, 4]);
    const stackedValues = formatStackedDataSeriesValues(dataSeries, true, false, xValues, ScaleType.Linear);
    // the datum on the snapshots is undefined because we are not adding it to
    // the test raw dataseries
    expect(stackedValues).toMatchSnapshot();
  });
  test('Can stack multiple dataseries with scale to extent', () => {
    const dataSeries: RawDataSeries[] = [
      {
        specId: 'spec1',
        yAccessor: 'y1',
        splitAccessors: new Map(),
        seriesKeys: ['a'],
        key: 'a',
        data: [
          { x: 1, y1: 1, mark: null },
          { x: 2, y1: 2, mark: null },
          { x: 3, y1: 3, mark: null },
          { x: 4, y1: 4, mark: null },
        ],
      },
      {
        specId: 'spec1',
        yAccessor: 'y1',
        splitAccessors: new Map(),
        seriesKeys: ['b'],
        key: 'b',
        data: [
          { x: 1, y1: 1, mark: null },
          { x: 2, y1: 2, mark: null },
          { x: 3, y1: 3, mark: null },
          { x: 4, y1: 4, mark: null },
        ],
      },
      {
        specId: 'spec1',
        yAccessor: 'y1',
        splitAccessors: new Map(),
        seriesKeys: ['b'],
        key: 'b',
        data: [
          { x: 1, y1: 1, mark: null },
          { x: 2, y1: 2, mark: null },
          { x: 3, y1: 3, mark: null },
          { x: 4, y1: 4, mark: null },
        ],
      },
      {
        specId: 'spec1',
        yAccessor: 'y1',
        splitAccessors: new Map(),
        seriesKeys: ['b'],
        key: 'b',
        data: [
          { x: 1, y1: 1, mark: null },
          { x: 2, y1: 2, mark: null },
          { x: 3, y1: 3, mark: null },
          { x: 4, y1: 4, mark: null },
        ],
      },
    ];
    const xValues = new Set([1, 2, 3, 4]);
    const stackedValues = formatStackedDataSeriesValues(dataSeries, true, false, xValues, ScaleType.Linear);
    // the datum on the snapshots is undefined because we are not adding it to
    // the test raw dataseries
    expect(stackedValues).toMatchSnapshot();
  });
  test('Can stack simple dataseries with y0', () => {
    const dataSeries: RawDataSeries[] = [
      {
        specId: 'spec1',
        yAccessor: 'y1',
        splitAccessors: new Map(),
        seriesKeys: ['a'],
        key: 'a',
        data: [
          { x: 1, y1: 3, y0: 1, mark: null },
          { x: 2, y1: 3, y0: 2, mark: null },
          { x: 4, y1: 4, y0: 3, mark: null },
        ],
      },
      {
        specId: 'spec1',
        yAccessor: 'y1',
        splitAccessors: new Map(),
        seriesKeys: ['b'],
        key: 'b',
        data: [
          { x: 1, y1: 2, y0: 1, mark: null },
          { x: 2, y1: 3, y0: 1, mark: null },
          { x: 3, y1: 23, y0: 4, mark: null },
          { x: 4, y1: 4, y0: 1, mark: null },
        ],
      },
    ];
    const xValues = new Set([1, 2, 3, 4]);
    const stackedValues = formatStackedDataSeriesValues(dataSeries, true, false, xValues, ScaleType.Linear);
    // the datum on the snapshots is undefined because we are not adding it to
    // the test raw dataseries

    expect(stackedValues[0].data[0].y0).toBe(1);
    expect(stackedValues[0].data[0].y1).toBe(3);
    expect(stackedValues[0].data[0].initialY0).toBe(1);
    expect(stackedValues[0].data[0].initialY1).toBe(3);

    expect(stackedValues[1].data[0].y0).toBe(4);
    expect(stackedValues[1].data[0].y1).toBe(5);
    expect(stackedValues[1].data[0].initialY0).toBe(1);
    expect(stackedValues[1].data[0].initialY1).toBe(2);

    expect(stackedValues).toMatchSnapshot();
  });
  test('Can stack simple dataseries with scale to extent with y0', () => {
    const dataSeries: RawDataSeries[] = [
      {
        specId: 'spec1',
        yAccessor: 'y1',
        splitAccessors: new Map(),
        seriesKeys: ['a'],
        key: 'a',
        data: [
          { x: 1, y1: 3, y0: 1, mark: null },
          { x: 2, y1: 3, y0: 2, mark: null },
          { x: 4, y1: 4, y0: 3, mark: null },
        ],
      },
      {
        specId: 'spec1',
        yAccessor: 'y1',
        splitAccessors: new Map(),
        seriesKeys: ['b'],
        key: 'b',
        data: [
          { x: 1, y1: 2, y0: 1, mark: null },
          { x: 2, y1: 3, y0: 1, mark: null },
          { x: 3, y1: 23, y0: 4, mark: null },
          { x: 4, y1: 4, y0: 1, mark: null },
        ],
      },
    ];
    const xValues = new Set([1, 2, 3, 4]);
    const stackedValues = formatStackedDataSeriesValues(dataSeries, true, false, xValues, ScaleType.Linear);
    // the datum on the snapshots is undefined because we are not adding it to
    // the test raw dataseries
    expect(stackedValues[0].data[0].y0).toBe(1);
    expect(stackedValues[0].data[0].y1).toBe(3);
    expect(stackedValues[0].data[0].initialY0).toBe(1);
    expect(stackedValues[0].data[0].initialY1).toBe(3);

    expect(stackedValues[1].data[0].y0).toBe(4);
    expect(stackedValues[1].data[0].y1).toBe(5);
    expect(stackedValues[1].data[0].initialY0).toBe(1);
    expect(stackedValues[1].data[0].initialY1).toBe(2);
    expect(stackedValues).toMatchSnapshot();
  });

  test('should split an array of specs into data series', () => {
    const spec1: LineSeriesSpec = {
      specType: SpecTypes.Series,
      chartType: ChartTypes.XYAxis,
      id: 'spec1',
      groupId: 'group',
      seriesType: SeriesTypes.Line,
      yScaleType: ScaleType.Log,
      xScaleType: ScaleType.Linear,
      xAccessor: 'x',
      yAccessors: ['y'],
      yScaleToDataExtent: false,
      data: TestDataset.BARCHART_1Y0G,
      hideInLegend: false,
    };
    const spec2: BasicSeriesSpec = {
      specType: SpecTypes.Series,
      chartType: ChartTypes.XYAxis,
      id: 'spec2',
      groupId: 'group2',
      seriesType: SeriesTypes.Line,
      yScaleType: ScaleType.Log,
      xScaleType: ScaleType.Linear,
      xAccessor: 'x',
      yAccessors: ['y1', 'y2'],
      stackAccessors: ['x'],
      yScaleToDataExtent: false,
      data: TestDataset.BARCHART_2Y0G,
      hideInLegend: false,
    };

    const splittedDataSeries = getSplittedSeries([spec1, spec2]);
    expect(splittedDataSeries.splittedSeries.get('spec1')).toMatchSnapshot();
    expect(splittedDataSeries.splittedSeries.get('spec2')).toMatchSnapshot();
  });
  test('should compute data series for stacked specs', () => {
    const spec1: BasicSeriesSpec = {
      specType: SpecTypes.Series,
      chartType: ChartTypes.XYAxis,
      id: 'spec1',
      groupId: 'group',
      seriesType: SeriesTypes.Line,
      yScaleType: ScaleType.Log,
      xScaleType: ScaleType.Linear,
      xAccessor: 'x',
      yAccessors: ['y'],
      yScaleToDataExtent: false,
      data: TestDataset.BARCHART_1Y0G,
      hideInLegend: false,
    };
    const spec2: BasicSeriesSpec = {
      specType: SpecTypes.Series,
      chartType: ChartTypes.XYAxis,
      id: 'spec2',
      groupId: 'group2',
      seriesType: SeriesTypes.Line,
      yScaleType: ScaleType.Log,
      xScaleType: ScaleType.Linear,
      xAccessor: 'x',
      yAccessors: ['y1', 'y2'],
      stackAccessors: ['x'],
      yScaleToDataExtent: false,
      data: TestDataset.BARCHART_2Y0G,
      hideInLegend: false,
    };
    const xValues = new Set([0, 1, 2, 3]);
    const splittedDataSeries = getSplittedSeries([spec1, spec2]);
    const stackedDataSeries = getFormattedDataseries(
      [spec1, spec2],
      splittedDataSeries.splittedSeries,
      xValues,
      ScaleType.Linear,
      [],
    );
    expect(stackedDataSeries.stacked).toMatchSnapshot();
  });

  describe('#getSeriesColors', () => {
    const seriesKey = 'mock_series_key';
    const mockSeries: SeriesCollectionValue = {
      seriesIdentifier: {
        specId: 'spec1',
        yAccessor: 'y1',
        splitAccessors: new Map(),
        seriesKeys: ['a', 'b', 'c'],
        key: seriesKey,
      },
    };

    const chartColors: ColorConfig = {
      vizColors: ['elastic_charts_c1', 'elastic_charts_c2'],
      defaultVizColor: 'elastic_charts',
    };

    const seriesColors = new Map();
    seriesColors.set(seriesKey, mockSeries);

    const emptyCustomColors = new Map();
    const persistedColor = 'persisted_color';
    const customColor = 'custom_color';
    const customColors: Map<string, string> = new Map();
    customColors.set(seriesKey, customColor);
    const emptyColorOverrides = {
      persisted: {},
      temporary: {},
    };
    const persistedOverrides = {
      persisted: { [seriesKey]: persistedColor },
      temporary: {},
    };

    it('should return deafult color', () => {
      const result = getSeriesColors(seriesColors, chartColors, emptyCustomColors, emptyColorOverrides);
      const expected = new Map();
      expected.set(seriesKey, 'elastic_charts_c1');
      expect(result).toEqual(expected);
    });

    it('should return persisted color', () => {
      const result = getSeriesColors(seriesColors, chartColors, emptyCustomColors, persistedOverrides);
      const expected = new Map();
      expected.set(seriesKey, persistedColor);
      expect(result).toEqual(expected);
    });

    it('should return custom color', () => {
      const result = getSeriesColors(seriesColors, chartColors, customColors, persistedOverrides);
      const expected = new Map();
      expected.set(seriesKey, customColor);
      expect(result).toEqual(expected);
    });

    it('should return temporary color', () => {
      const temporaryColor = 'persisted-color';
      const result = getSeriesColors(seriesColors, chartColors, customColors, {
        ...persistedOverrides,
        temporary: { [seriesKey]: temporaryColor },
      });
      const expected = new Map();
      expected.set(seriesKey, temporaryColor);
      expect(result).toEqual(expected);
    });
  });
  test('should only include deselectedDataSeries when splitting series if deselectedDataSeries is defined', () => {
    const specId = 'splitSpec';

    const splitSpec: BasicSeriesSpec = {
      specType: SpecTypes.Series,
      chartType: ChartTypes.XYAxis,
      id: specId,
      groupId: 'group',
      seriesType: SeriesTypes.Line,
      yScaleType: ScaleType.Log,
      xScaleType: ScaleType.Linear,
      xAccessor: 'x',
      yAccessors: ['y1', 'y2'],
      stackAccessors: ['x'],
      yScaleToDataExtent: false,
      data: TestDataset.BARCHART_2Y0G,
      hideInLegend: false,
    };

    const allSeries = getSplittedSeries([splitSpec]);
    expect(allSeries.splittedSeries.get(specId)?.length).toBe(2);

    const emptyDeselected = getSplittedSeries([splitSpec]);
    expect(emptyDeselected.splittedSeries.get(specId)?.length).toBe(2);

    const deselectedDataSeries: XYChartSeriesIdentifier[] = [
      {
        specId,
        yAccessor: splitSpec.yAccessors[0],
        splitAccessors: new Map(),
        seriesKeys: [],
        key: 'spec{splitSpec}yAccessor{y1}splitAccessors{}',
      },
    ];
    const subsetSplit = getSplittedSeries([splitSpec], deselectedDataSeries);
    expect(subsetSplit.splittedSeries.get(specId)?.length).toBe(1);
  });

  test('should sort series color by series spec sort index', () => {
    const spec1Id = 'spec1';
    const spec2Id = 'spec2';
    const spec3Id = 'spec3';

    const seriesCollection = new Map();
    const dataSeriesValues1: SeriesCollectionValue = {
      seriesIdentifier: {
        specId: spec1Id,
        yAccessor: 'y1',
        splitAccessors: new Map(),
        seriesKeys: [],
        key: '',
      },
      specSortIndex: 0,
    };

    const dataSeriesValues2: SeriesCollectionValue = {
      seriesIdentifier: {
        specId: spec2Id,
        yAccessor: 'y1',
        splitAccessors: new Map(),
        seriesKeys: [],
        key: '',
      },
      specSortIndex: 1,
    };

    const dataSeriesValues3: SeriesCollectionValue = {
      seriesIdentifier: {
        specId: spec3Id,
        yAccessor: 'y1',
        splitAccessors: new Map(),
        seriesKeys: [],
        key: '',
      },
      specSortIndex: 3,
    };

    seriesCollection.set(spec3Id, dataSeriesValues3);
    seriesCollection.set(spec1Id, dataSeriesValues1);
    seriesCollection.set(spec2Id, dataSeriesValues2);

    const descSortedColorValues = new Map();
    descSortedColorValues.set(spec1Id, dataSeriesValues1);
    descSortedColorValues.set(spec2Id, dataSeriesValues2);
    descSortedColorValues.set(spec3Id, dataSeriesValues3);

    expect(getSortedDataSeriesColorsValuesMap(seriesCollection)).toEqual(descSortedColorValues);

    const ascSortedColorValues = new Map();
    dataSeriesValues1.specSortIndex = 2;
    dataSeriesValues2.specSortIndex = 1;
    dataSeriesValues3.specSortIndex = 0;

    ascSortedColorValues.set(spec3Id, dataSeriesValues3);
    ascSortedColorValues.set(spec2Id, dataSeriesValues2);
    ascSortedColorValues.set(spec1Id, dataSeriesValues1);

    expect(getSortedDataSeriesColorsValuesMap(seriesCollection)).toEqual(ascSortedColorValues);

    // Any series with undefined sort order should come last
    const undefinedSortedColorValues = new Map();
    dataSeriesValues1.specSortIndex = 1;
    dataSeriesValues2.specSortIndex = undefined;
    dataSeriesValues3.specSortIndex = 0;

    undefinedSortedColorValues.set(spec3Id, dataSeriesValues3);
    undefinedSortedColorValues.set(spec1Id, dataSeriesValues1);
    undefinedSortedColorValues.set(spec2Id, dataSeriesValues2);

    expect(getSortedDataSeriesColorsValuesMap(seriesCollection)).toEqual(undefinedSortedColorValues);
  });
  test('clean datum shall parse string as number for y values', () => {
    let datum = cleanDatum([0, 1, 2], 0, 1, 2);
    expect(datum).toBeDefined();
    expect(datum?.y1).toBe(1);
    expect(datum?.y0).toBe(2);
    datum = cleanDatum([0, '1', 2], 0, 1, 2);
    expect(datum).toBeDefined();
    expect(datum?.y1).toBe(1);
    expect(datum?.y0).toBe(2);

    datum = cleanDatum([0, '1', '2'], 0, 1, 2);
    expect(datum).toBeDefined();
    expect(datum?.y1).toBe(1);
    expect(datum?.y0).toBe(2);

    datum = cleanDatum([0, 1, '2'], 0, 1, 2);
    expect(datum).toBeDefined();
    expect(datum?.y1).toBe(1);
    expect(datum?.y0).toBe(2);

    datum = cleanDatum([0, 'invalid', 'invalid'], 0, 1, 2);
    expect(datum).toBeDefined();
    expect(datum?.y1).toBe(null);
    expect(datum?.y0).toBe(null);
  });
  describe('#getSeriesNameKeys', () => {
    const data = dg.generateGroupedSeries(50, 2).map((d) => ({ ...d, y2: d.y }));
    const spec = MockSeriesSpec.area({
      data,
      yAccessors: ['y', 'y2'],
      splitSeriesAccessors: ['g'],
    });
    const indentifiers = MockSeriesIdentifier.fromSpecs([spec]);

    it('should get series label from spec', () => {
      const [identifier] = indentifiers;
      const actual = getSeriesName(identifier, false, false, spec);
      expect(actual).toBe('a - y');
    });

    it('should not show y value with single yAccessor', () => {
      const specSingleY: AreaSeriesSpec = {
        ...spec,
        yAccessors: ['y'],
      };
      const [identifier] = MockSeriesIdentifier.fromSpecs([spec]);
      const actual = getSeriesName(identifier, false, false, specSingleY);

      expect(actual).toBe('a');
    });

    describe('Custom labeling', () => {
      it('should replace full label', () => {
        const label = 'My custom new label';
        const [identifier] = indentifiers;
        const actual = getSeriesName(identifier, false, false, {
          ...spec,
          name: ({ yAccessor, splitAccessors }) =>
            yAccessor === identifier.yAccessor && splitAccessors.get('g') === 'a' ? label : null,
        });

        expect(actual).toBe(label);
      });

      it('should have access to all accessors with single y', () => {
        const specSingleY: AreaSeriesSpec = {
          ...spec,
          yAccessors: ['y'],
          name: ({ seriesKeys }) => seriesKeys.join(' - '),
        };
        const [identifier] = MockSeriesIdentifier.fromSpecs([spec]);
        const actual = getSeriesName(identifier, false, false, specSingleY);

        expect(actual).toBe('a - y');
      });

      it('should replace yAccessor sub label with map', () => {
        const [identifier] = indentifiers;
        const actual = getSeriesName(identifier, false, false, {
          ...spec,
          name: {
            names: [
              {
                accessor: 'g',
                value: 'a',
              },
              {
                accessor: 'y',
                name: 'Yuuuup',
              },
            ],
          },
        });
        expect(actual).toBe('a - Yuuuup');
      });

      it('should join with custom delimiter', () => {
        const [identifier] = indentifiers;
        const actual = getSeriesName(identifier, false, false, {
          ...spec,
          name: {
            names: [
              {
                accessor: 'g',
                value: 'a',
              },
              {
                accessor: 'y',
              },
            ],
            delimiter: ' ¯\\_(ツ)_/¯ ',
          },
        });
        expect(actual).toBe('a ¯\\_(ツ)_/¯ y');
      });

      it('should replace splitAccessor sub label with map', () => {
        const [identifier] = indentifiers;
        const actual = getSeriesName(identifier, false, false, {
          ...spec,
          name: {
            names: [
              {
                accessor: 'g',
                value: 'a',
                name: 'Apple',
              },
              {
                accessor: 'y',
              },
            ],
          },
        });
        expect(actual).toBe('Apple - y');
      });

      it('should mind order of names', () => {
        const [identifier] = indentifiers;
        const actual = getSeriesName(identifier, false, false, {
          ...spec,
          name: {
            names: [
              {
                accessor: 'y',
                name: 'Yuuum',
              },
              {
                accessor: 'g',
                value: 'a',
                name: 'Apple',
              },
            ],
          },
        });
        expect(actual).toBe('Yuuum - Apple');
      });

      it('should mind sortIndex of names', () => {
        const [identifier] = indentifiers;
        const actual = getSeriesName(identifier, false, false, {
          ...spec,
          name: {
            names: [
              {
                accessor: 'y',
                name: 'Yuuum',
                sortIndex: 2,
              },
              {
                accessor: 'g',
                value: 'a',
                name: 'Apple',
                sortIndex: 0,
              },
            ],
          },
        });
        expect(actual).toBe('Apple - Yuuum');
      });

      it('should allow undefined sortIndex', () => {
        const [identifier] = indentifiers;
        const actual = getSeriesName(identifier, false, false, {
          ...spec,
          name: {
            names: [
              {
                accessor: 'y',
                name: 'Yuuum',
              },
              {
                accessor: 'g',
                value: 'a',
                name: 'Apple',
                sortIndex: 0,
              },
            ],
          },
        });
        expect(actual).toBe('Apple - Yuuum');
      });

      it('should ignore missing names', () => {
        const [identifier] = indentifiers;
        const actual = getSeriesName(identifier, false, false, {
          ...spec,
          name: {
            names: [
              {
                accessor: 'g',
                value: 'a',
                name: 'Apple',
              },
              {
                accessor: 'g',
                value: 'Not a mapping',
                name: 'No Value',
              },
              {
                accessor: 'y',
                name: 'Yuuum',
              },
            ],
          },
        });
        expect(actual).toBe('Apple - Yuuum');
      });

      it('should return fallback label if empty string', () => {
        const [identifier] = indentifiers;
        const actual = getSeriesName(identifier, false, false, {
          ...spec,
          name: {
            names: [],
          },
        });
        expect(actual).toBe('a - y');
      });
    });
  });

  describe('functional accessors', () => {
    test('Can split dataset into 2Y2G series', () => {
      const xAccessor: AccessorFn = (d) => d.x;
      const splittedSeries = splitSeries({
        id: 'spec1',
        data: TestDataset.BARCHART_2Y2G,
        xAccessor,
        yAccessors: ['y1', 'y2'],
        splitSeriesAccessors: ['g1', 'g2'],
      });
      expect(splittedSeries.rawDataSeries.length).toBe(8);
      expect(splittedSeries.rawDataSeries).toMatchSnapshot();
    });

    test('Can split dataset with custom _all xAccessor', () => {
      const xAccessor: AccessorFn = () => '_all';
      const splittedSeries = splitSeries({
        id: 'spec1',
        data: TestDataset.BARCHART_2Y2G,
        xAccessor,
        yAccessors: ['y1'],
      });
      expect(splittedSeries.rawDataSeries.length).toBe(1);
      expect(splittedSeries.rawDataSeries).toMatchSnapshot();
    });

    test('Shall ignore undefined values on splitSeriesAccessors', () => {
      const spec = MockSeriesSpec.bar({
        data: [
          [0, 1, 'a'],
          [1, 1, 'a'],
          [2, 1, 'a'],
          [0, 1, 'b'],
          [1, 1, 'b'],
          [2, 1, 'b'],
          [0, 1],
          [1, 1],
          [2, 1],
        ],
        xAccessor: 0,
        yAccessors: [1],
        splitSeriesAccessors: [2],
      });
      const splittedSeries = splitSeries(spec);
      expect(splittedSeries.rawDataSeries.length).toBe(2);
      expect(splittedSeries.rawDataSeries).toMatchSnapshot();
    });
    test('Should ignore series if splitSeriesAccessors are defined but not contained in any datum', () => {
      const spec = MockSeriesSpec.bar({
        data: [
          [0, 1],
          [1, 1],
          [2, 1],
        ],
        xAccessor: 0,
        yAccessors: [1],
        splitSeriesAccessors: [2],
      });
      const splittedSeries = splitSeries(spec);
      expect(splittedSeries.rawDataSeries.length).toBe(0);
    });
  });
});
