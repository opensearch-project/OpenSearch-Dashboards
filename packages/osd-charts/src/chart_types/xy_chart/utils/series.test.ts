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
  SeriesIdentifier,
  cleanDatum,
} from './series';
import { BasicSeriesSpec, LineSeriesSpec, SeriesTypes } from './specs';
import { formatStackedDataSeriesValues } from './stacked_series_utils';
import * as TestDataset from '../../../utils/data_samples/test_dataset';
import { ChartTypes } from '../..';
import { SpecTypes } from '../../../specs/settings';

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
          { x: 1, y1: 1 },
          { x: 2, y1: 2 },
          { x: 4, y1: 4 },
        ],
      },
      {
        specId: 'spec1',
        yAccessor: 'y1',
        splitAccessors: new Map(),
        seriesKeys: ['b'],
        key: 'b',
        data: [
          { x: 1, y1: 21 },
          { x: 3, y1: 23 },
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
          { x: 1, y1: 1 },
          { x: 2, y1: 2 },
          { x: 3, y1: 3 },
          { x: 4, y1: 4 },
        ],
      },
      {
        specId: 'spec1',
        yAccessor: 'y1',
        splitAccessors: new Map(),
        seriesKeys: ['b'],
        key: 'b',
        data: [
          { x: 1, y1: 1 },
          { x: 2, y1: 2 },
          { x: 3, y1: 3 },
          { x: 4, y1: 4 },
        ],
      },
      {
        specId: 'spec1',
        yAccessor: 'y1',
        splitAccessors: new Map(),
        seriesKeys: ['b'],
        key: 'b',
        data: [
          { x: 1, y1: 1 },
          { x: 2, y1: 2 },
          { x: 3, y1: 3 },
          { x: 4, y1: 4 },
        ],
      },
      {
        specId: 'spec1',
        yAccessor: 'y1',
        splitAccessors: new Map(),
        seriesKeys: ['b'],
        key: 'b',
        data: [
          { x: 1, y1: 1 },
          { x: 2, y1: 2 },
          { x: 3, y1: 3 },
          { x: 4, y1: 4 },
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
          { x: 1, y1: 1 },
          { x: 4, y1: 4 },
          { x: 2, y1: 2 },
        ],
      },
      {
        specId: 'spec1',
        yAccessor: 'y1',
        splitAccessors: new Map(),
        seriesKeys: ['b'],
        key: 'b',
        data: [
          { x: 3, y1: 23 },
          { x: 1, y1: 21 },
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
        data: new Array(maxArrayItems).fill(0).map((d, i) => ({ x: i, y1: i })),
      },
      {
        specId: 'spec1',
        yAccessor: 'y1',
        splitAccessors: new Map(),
        seriesKeys: ['b'],
        key: 'b',
        data: new Array(maxArrayItems).fill(0).map((d, i) => ({ x: i, y1: i })),
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
          { x: 1, y1: 1 },
          { x: 2, y1: 2 },
          { x: 4, y1: 4 },
        ],
      },
      {
        specId: 'spec1',
        yAccessor: 'y1',
        splitAccessors: new Map(),
        seriesKeys: ['b'],
        key: 'b',
        data: [
          { x: 1, y1: 21 },
          { x: 3, y1: 23 },
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
          { x: 1, y1: 1 },
          { x: 2, y1: 2 },
          { x: 3, y1: 3 },
          { x: 4, y1: 4 },
        ],
      },
      {
        specId: 'spec1',
        yAccessor: 'y1',
        splitAccessors: new Map(),
        seriesKeys: ['b'],
        key: 'b',
        data: [
          { x: 1, y1: 1 },
          { x: 2, y1: 2 },
          { x: 3, y1: 3 },
          { x: 4, y1: 4 },
        ],
      },
      {
        specId: 'spec1',
        yAccessor: 'y1',
        splitAccessors: new Map(),
        seriesKeys: ['b'],
        key: 'b',
        data: [
          { x: 1, y1: 1 },
          { x: 2, y1: 2 },
          { x: 3, y1: 3 },
          { x: 4, y1: 4 },
        ],
      },
      {
        specId: 'spec1',
        yAccessor: 'y1',
        splitAccessors: new Map(),
        seriesKeys: ['b'],
        key: 'b',
        data: [
          { x: 1, y1: 1 },
          { x: 2, y1: 2 },
          { x: 3, y1: 3 },
          { x: 4, y1: 4 },
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
          { x: 1, y1: 3, y0: 1 },
          { x: 2, y1: 3, y0: 2 },
          { x: 4, y1: 4, y0: 3 },
        ],
      },
      {
        specId: 'spec1',
        yAccessor: 'y1',
        splitAccessors: new Map(),
        seriesKeys: ['b'],
        key: 'b',
        data: [
          { x: 1, y1: 2, y0: 1 },
          { x: 2, y1: 3, y0: 1 },
          { x: 3, y1: 23, y0: 4 },
          { x: 4, y1: 4, y0: 1 },
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
          { x: 1, y1: 3, y0: 1 },
          { x: 2, y1: 3, y0: 2 },
          { x: 4, y1: 4, y0: 3 },
        ],
      },
      {
        specId: 'spec1',
        yAccessor: 'y1',
        splitAccessors: new Map(),
        seriesKeys: ['b'],
        key: 'b',
        data: [
          { x: 1, y1: 2, y0: 1 },
          { x: 2, y1: 3, y0: 1 },
          { x: 3, y1: 23, y0: 4 },
          { x: 4, y1: 4, y0: 1 },
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
  test('should get series color map', () => {
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

    const specs = new Map();
    specs.set(spec1.id, spec1);

    const dataSeriesValuesA: SeriesCollectionValue = {
      seriesIdentifier: {
        specId: 'spec1',
        yAccessor: 'y1',
        splitAccessors: new Map(),
        seriesKeys: ['a', 'b', 'c'],
        key: '',
      },
    };

    const chartColors: ColorConfig = {
      vizColors: ['elastic_charts_c1', 'elastic_charts_c2'],
      defaultVizColor: 'elastic_charts',
    };

    const seriesColors = new Map();
    seriesColors.set('spec1', dataSeriesValuesA);

    const emptyCustomColors = new Map();

    const defaultColorMap = getSeriesColors(seriesColors, chartColors, emptyCustomColors);
    const expectedDefaultColorMap = new Map();
    expectedDefaultColorMap.set('spec1', 'elastic_charts_c1');
    expect(defaultColorMap).toEqual(expectedDefaultColorMap);

    const customColors: Map<string, string> = new Map();
    customColors.set('spec1', 'custom_color');

    const customizedColorMap = getSeriesColors(seriesColors, chartColors, customColors);
    const expectedCustomizedColorMap = new Map();
    expectedCustomizedColorMap.set('spec1', 'custom_color');
    expect(customizedColorMap).toEqual(expectedCustomizedColorMap);
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
    expect(allSeries.splittedSeries.get(specId)!.length).toBe(2);

    const emptyDeselected = getSplittedSeries([splitSpec]);
    expect(emptyDeselected.splittedSeries.get(specId)!.length).toBe(2);

    const deselectedDataSeries: SeriesIdentifier[] = [
      {
        specId,
        yAccessor: splitSpec.yAccessors[0],
        splitAccessors: new Map(),
        seriesKeys: [],
        key: 'spec{splitSpec}yAccessor{y1}splitAccessors{}',
      },
    ];
    const subsetSplit = getSplittedSeries([splitSpec], deselectedDataSeries);
    expect(subsetSplit.splittedSeries.get(specId)!.length).toBe(1);
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
    expect(datum.y1).toBe(1);
    expect(datum.y0).toBe(2);
    datum = cleanDatum([0, '1', 2], 0, 1, 2);
    expect(datum.y1).toBe(1);
    expect(datum.y0).toBe(2);

    datum = cleanDatum([0, '1', '2'], 0, 1, 2);
    expect(datum.y1).toBe(1);
    expect(datum.y0).toBe(2);

    datum = cleanDatum([0, 1, '2'], 0, 1, 2);
    expect(datum.y1).toBe(1);
    expect(datum.y0).toBe(2);

    datum = cleanDatum([0, 'invalid', 'invalid'], 0, 1, 2);
    expect(datum.y1).toBe(null);
    expect(datum.y0).toBe(null);
  });
});
