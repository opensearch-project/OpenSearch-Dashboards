import { ColorConfig } from '../themes/theme';
import { getGroupId, getSpecId, SpecId } from '../utils/ids';
import { ScaleType } from '../utils/scales/scales';
import {
  DataSeriesColorsValues,
  getFormattedDataseries,
  getSeriesColorMap,
  getSortedDataSeriesColorsValuesMap,
  getSplittedSeries,
  RawDataSeries,
  splitSeries,
} from './series';
import { BasicSeriesSpec } from './specs';
import { formatStackedDataSeriesValues } from './stacked_series_utils';
import * as TestDataset from './utils/test_dataset';

describe('Series', () => {
  test('Can split dataset into 1Y0G series', () => {
    const splittedSeries = splitSeries(
      TestDataset.BARCHART_1Y0G,
      {
        xAccessor: 'x',
        yAccessors: ['y'],
      },
      getSpecId('spec1'),
    );
    expect(splittedSeries.rawDataSeries).toMatchSnapshot();
  });
  test('Can split dataset into 1Y1G series', () => {
    const splittedSeries = splitSeries(
      TestDataset.BARCHART_1Y1G,
      {
        xAccessor: 'x',
        yAccessors: ['y'],
        splitSeriesAccessors: ['g'],
      },
      getSpecId('spec1'),
    );
    expect(splittedSeries.rawDataSeries).toMatchSnapshot();
  });
  test('Can split dataset into 1Y2G series', () => {
    const splittedSeries = splitSeries(
      TestDataset.BARCHART_1Y2G,
      {
        xAccessor: 'x',
        yAccessors: ['y'],
        splitSeriesAccessors: ['g1', 'g2'],
      },
      getSpecId('spec1'),
    );
    expect(splittedSeries.rawDataSeries).toMatchSnapshot();
  });
  test('Can split dataset into 2Y0G series', () => {
    const splittedSeries = splitSeries(
      TestDataset.BARCHART_2Y0G,
      {
        xAccessor: 'x',
        yAccessors: ['y1', 'y2'],
      },
      getSpecId('spec1'),
    );
    expect(splittedSeries.rawDataSeries).toMatchSnapshot();
  });
  test('Can split dataset into 2Y1G series', () => {
    const splittedSeries = splitSeries(
      TestDataset.BARCHART_2Y1G,
      {
        xAccessor: 'x',
        yAccessors: ['y1', 'y2'],
        splitSeriesAccessors: ['g'],
      },
      getSpecId('spec1'),
    );
    expect(splittedSeries.rawDataSeries).toMatchSnapshot();
  });
  test('Can split dataset into 2Y2G series', () => {
    const splittedSeries = splitSeries(
      TestDataset.BARCHART_2Y2G,
      {
        xAccessor: 'x',
        yAccessors: ['y1', 'y2'],
        splitSeriesAccessors: ['g1', 'g2'],
      },
      getSpecId('spec1'),
    );
    expect(splittedSeries.rawDataSeries).toMatchSnapshot();
  });
  test('Can stack simple dataseries', () => {
    const dataSeries: RawDataSeries[] = [
      {
        specId: getSpecId('spec1'),
        key: ['a'],
        seriesColorKey: 'a',
        data: [{ x: 1, y1: 1 }, { x: 2, y1: 2 }, { x: 4, y1: 4 }],
      },
      {
        specId: getSpecId('spec1'),
        key: ['b'],
        seriesColorKey: 'b',
        data: [{ x: 1, y1: 21 }, { x: 3, y1: 23 }],
      },
    ];
    const stackedValues = formatStackedDataSeriesValues(dataSeries, false);
    expect(stackedValues).toMatchSnapshot();
  });
  test('Can stack multiple dataseries', () => {
    const dataSeries: RawDataSeries[] = [
      {
        specId: getSpecId('spec1'),
        key: ['a'],
        seriesColorKey: 'a',
        data: [{ x: 1, y1: 1 }, { x: 2, y1: 2 }, { x: 3, y1: 3 }, { x: 4, y1: 4 }],
      },
      {
        specId: getSpecId('spec1'),
        key: ['b'],
        seriesColorKey: 'b',
        data: [{ x: 1, y1: 1 }, { x: 2, y1: 2 }, { x: 3, y1: 3 }, { x: 4, y1: 4 }],
      },
      {
        specId: getSpecId('spec1'),
        key: ['b'],
        seriesColorKey: 'b',
        data: [{ x: 1, y1: 1 }, { x: 2, y1: 2 }, { x: 3, y1: 3 }, { x: 4, y1: 4 }],
      },
      {
        specId: getSpecId('spec1'),
        key: ['b'],
        seriesColorKey: 'b',
        data: [{ x: 1, y1: 1 }, { x: 2, y1: 2 }, { x: 3, y1: 3 }, { x: 4, y1: 4 }],
      },
    ];
    const stackedValues = formatStackedDataSeriesValues(dataSeries, false);
    expect(stackedValues).toMatchSnapshot();
  });
  test('Can stack unsorted dataseries', () => {
    const dataSeries: RawDataSeries[] = [
      {
        specId: getSpecId('spec1'),
        key: ['a'],
        seriesColorKey: 'a',
        data: [{ x: 1, y1: 1 }, { x: 4, y1: 4 }, { x: 2, y1: 2 }],
      },
      {
        specId: getSpecId('spec1'),
        key: ['b'],
        seriesColorKey: 'b',
        data: [{ x: 3, y1: 23 }, { x: 1, y1: 21 }],
      },
    ];
    const stackedValues = formatStackedDataSeriesValues(dataSeries, false);
    expect(stackedValues).toMatchSnapshot();
  });
  test('Can stack high volume of dataseries', () => {
    const maxArrayItems = 1000;
    const dataSeries: RawDataSeries[] = [
      {
        specId: getSpecId('spec1'),
        key: ['a'],
        seriesColorKey: 'a',
        data: new Array(maxArrayItems).fill(0).map((d, i) => ({ x: i, y1: i })),
      },
      {
        specId: getSpecId('spec1'),
        key: ['b'],
        seriesColorKey: 'b',
        data: new Array(maxArrayItems).fill(0).map((d, i) => ({ x: i, y1: i })),
      },
    ];
    const stackedValues = formatStackedDataSeriesValues(dataSeries, false);
    expect(stackedValues).toMatchSnapshot();
  });
  test('Can stack simple dataseries with scale to extent', () => {
    const dataSeries: RawDataSeries[] = [
      {
        specId: getSpecId('spec1'),
        key: ['a'],
        seriesColorKey: 'a',
        data: [{ x: 1, y1: 1 }, { x: 2, y1: 2 }, { x: 4, y1: 4 }],
      },
      {
        specId: getSpecId('spec1'),
        key: ['b'],
        seriesColorKey: 'b',
        data: [{ x: 1, y1: 21 }, { x: 3, y1: 23 }],
      },
    ];
    const stackedValues = formatStackedDataSeriesValues(dataSeries, true);
    // the datum on the snapshots is undefined because we are not adding it to
    // the test raw dataseries
    expect(stackedValues).toMatchSnapshot();
  });
  test('Can stack multiple dataseries with scale to extent', () => {
    const dataSeries: RawDataSeries[] = [
      {
        specId: getSpecId('spec1'),
        key: ['a'],
        seriesColorKey: 'a',
        data: [{ x: 1, y1: 1 }, { x: 2, y1: 2 }, { x: 3, y1: 3 }, { x: 4, y1: 4 }],
      },
      {
        specId: getSpecId('spec1'),
        key: ['b'],
        seriesColorKey: 'b',
        data: [{ x: 1, y1: 1 }, { x: 2, y1: 2 }, { x: 3, y1: 3 }, { x: 4, y1: 4 }],
      },
      {
        specId: getSpecId('spec1'),
        key: ['b'],
        seriesColorKey: 'b',
        data: [{ x: 1, y1: 1 }, { x: 2, y1: 2 }, { x: 3, y1: 3 }, { x: 4, y1: 4 }],
      },
      {
        specId: getSpecId('spec1'),
        key: ['b'],
        seriesColorKey: 'b',
        data: [{ x: 1, y1: 1 }, { x: 2, y1: 2 }, { x: 3, y1: 3 }, { x: 4, y1: 4 }],
      },
    ];
    const stackedValues = formatStackedDataSeriesValues(dataSeries, true);
    // the datum on the snapshots is undefined because we are not adding it to
    // the test raw dataseries
    expect(stackedValues).toMatchSnapshot();
  });
  test('Can stack simple dataseries with y0', () => {
    const dataSeries: RawDataSeries[] = [
      {
        specId: getSpecId('spec1'),
        key: ['a'],
        seriesColorKey: 'a',
        data: [{ x: 1, y1: 3, y0: 1 }, { x: 2, y1: 3, y0: 2 }, { x: 4, y1: 4, y0: 3 }],
      },
      {
        specId: getSpecId('spec1'),
        key: ['b'],
        seriesColorKey: 'b',
        data: [{ x: 1, y1: 2, y0: 1 }, { x: 2, y1: 3, y0: 1 }, { x: 3, y1: 23, y0: 4 }, { x: 4, y1: 4, y0: 1 }],
      },
    ];
    const stackedValues = formatStackedDataSeriesValues(dataSeries, true);
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
        specId: getSpecId('spec1'),
        key: ['a'],
        seriesColorKey: 'a',
        data: [{ x: 1, y1: 3, y0: 1 }, { x: 2, y1: 3, y0: 2 }, { x: 4, y1: 4, y0: 3 }],
      },
      {
        specId: getSpecId('spec1'),
        key: ['b'],
        seriesColorKey: 'b',
        data: [{ x: 1, y1: 2, y0: 1 }, { x: 2, y1: 3, y0: 1 }, { x: 3, y1: 23, y0: 4 }, { x: 4, y1: 4, y0: 1 }],
      },
    ];
    const stackedValues = formatStackedDataSeriesValues(dataSeries, true);
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
    const seriesSpecs = new Map<SpecId, BasicSeriesSpec>();
    const spec1: BasicSeriesSpec = {
      id: getSpecId('spec1'),
      groupId: getGroupId('group'),
      seriesType: 'line',
      yScaleType: ScaleType.Log,
      xScaleType: ScaleType.Linear,
      xAccessor: 'x',
      yAccessors: ['y'],
      yScaleToDataExtent: false,
      data: TestDataset.BARCHART_1Y0G,
      hideInLegend: false,
    };
    const spec2: BasicSeriesSpec = {
      id: getSpecId('spec2'),
      groupId: getGroupId('group2'),
      seriesType: 'line',
      yScaleType: ScaleType.Log,
      xScaleType: ScaleType.Linear,
      xAccessor: 'x',
      yAccessors: ['y1', 'y2'],
      stackAccessors: ['x'],
      yScaleToDataExtent: false,
      data: TestDataset.BARCHART_2Y0G,
      hideInLegend: false,
    };
    seriesSpecs.set(spec1.id, spec1);
    seriesSpecs.set(spec2.id, spec2);
    const splittedDataSeries = getSplittedSeries(seriesSpecs);
    expect(splittedDataSeries.splittedSeries.get(getSpecId('spec1'))).toMatchSnapshot();
    expect(splittedDataSeries.splittedSeries.get(getSpecId('spec2'))).toMatchSnapshot();
  });
  test('should compute data series for stacked specs', () => {
    const seriesSpecs = new Map<SpecId, BasicSeriesSpec>();
    const spec1: BasicSeriesSpec = {
      id: getSpecId('spec1'),
      groupId: getGroupId('group'),
      seriesType: 'line',
      yScaleType: ScaleType.Log,
      xScaleType: ScaleType.Linear,
      xAccessor: 'x',
      yAccessors: ['y'],
      yScaleToDataExtent: false,
      data: TestDataset.BARCHART_1Y0G,
      hideInLegend: false,
    };
    const spec2: BasicSeriesSpec = {
      id: getSpecId('spec2'),
      groupId: getGroupId('group2'),
      seriesType: 'line',
      yScaleType: ScaleType.Log,
      xScaleType: ScaleType.Linear,
      xAccessor: 'x',
      yAccessors: ['y1', 'y2'],
      stackAccessors: ['x'],
      yScaleToDataExtent: false,
      data: TestDataset.BARCHART_2Y0G,
      hideInLegend: false,
    };
    seriesSpecs.set(spec1.id, spec1);
    seriesSpecs.set(spec2.id, spec2);
    const splittedDataSeries = getSplittedSeries(seriesSpecs);
    const stackedDataSeries = getFormattedDataseries([spec1, spec2], splittedDataSeries.splittedSeries);
    expect(stackedDataSeries.stacked).toMatchSnapshot();
  });
  test('should get series color map', () => {
    const spec1: BasicSeriesSpec = {
      id: getSpecId('spec1'),
      groupId: getGroupId('group'),
      seriesType: 'line',
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

    const dataSeriesValuesA: DataSeriesColorsValues = {
      specId: getSpecId('spec1'),
      colorValues: ['a', 'b', 'c'],
    };

    const chartColors: ColorConfig = {
      vizColors: ['elastic_charts_c1', 'elastic_charts_c2'],
      defaultVizColor: 'elastic_charts',
    };

    const seriesColors = new Map();
    seriesColors.set('spec1', dataSeriesValuesA);

    const emptyCustomColors = new Map();

    const defaultColorMap = getSeriesColorMap(seriesColors, chartColors, emptyCustomColors);
    const expectedDefaultColorMap = new Map();
    expectedDefaultColorMap.set('spec1', 'elastic_charts_c1');
    expect(defaultColorMap).toEqual(expectedDefaultColorMap);

    const customColors: Map<string, string> = new Map();
    customColors.set('spec1', 'custom_color');

    const customizedColorMap = getSeriesColorMap(seriesColors, chartColors, customColors);
    const expectedCustomizedColorMap = new Map();
    expectedCustomizedColorMap.set('spec1', 'custom_color');
    expect(customizedColorMap).toEqual(expectedCustomizedColorMap);
  });
  test('should only include deselectedDataSeries when splitting series if deselectedDataSeries is defined', () => {
    const seriesSpecs = new Map<SpecId, BasicSeriesSpec>();
    const specId = getSpecId('splitSpec');

    const splitSpec: BasicSeriesSpec = {
      id: specId,
      groupId: getGroupId('group'),
      seriesType: 'line',
      yScaleType: ScaleType.Log,
      xScaleType: ScaleType.Linear,
      xAccessor: 'x',
      yAccessors: ['y1', 'y2'],
      stackAccessors: ['x'],
      yScaleToDataExtent: false,
      data: TestDataset.BARCHART_2Y0G,
      hideInLegend: false,
    };

    seriesSpecs.set(splitSpec.id, splitSpec);

    const allSeries = getSplittedSeries(seriesSpecs, null);
    expect(allSeries.splittedSeries.get(specId)!.length).toBe(2);

    const emptyDeselected = getSplittedSeries(seriesSpecs, []);
    expect(emptyDeselected.splittedSeries.get(specId)!.length).toBe(2);

    const deselectedDataSeries: DataSeriesColorsValues[] = [
      {
        specId,
        colorValues: ['y1'],
      },
    ];
    const subsetSplit = getSplittedSeries(seriesSpecs, deselectedDataSeries);
    expect(subsetSplit.splittedSeries.get(specId)!.length).toBe(1);
  });

  test('should sort series color by series spec sort index', () => {
    const spec1Id = getSpecId('spec1');
    const spec2Id = getSpecId('spec2');
    const spec3Id = getSpecId('spec3');

    const colorValuesMap = new Map();
    const dataSeriesValues1: DataSeriesColorsValues = {
      specId: spec1Id,
      colorValues: [],
      specSortIndex: 0,
    };

    const dataSeriesValues2: DataSeriesColorsValues = {
      specId: spec2Id,
      colorValues: [],
      specSortIndex: 1,
    };

    const dataSeriesValues3: DataSeriesColorsValues = {
      specId: spec3Id,
      colorValues: [],
      specSortIndex: 3,
    };

    colorValuesMap.set(spec3Id, dataSeriesValues3);
    colorValuesMap.set(spec1Id, dataSeriesValues1);
    colorValuesMap.set(spec2Id, dataSeriesValues2);

    const descSortedColorValues = new Map();
    descSortedColorValues.set(spec1Id, dataSeriesValues1);
    descSortedColorValues.set(spec2Id, dataSeriesValues2);
    descSortedColorValues.set(spec3Id, dataSeriesValues3);

    expect(getSortedDataSeriesColorsValuesMap(colorValuesMap)).toEqual(descSortedColorValues);

    const ascSortedColorValues = new Map();
    dataSeriesValues1.specSortIndex = 2;
    dataSeriesValues2.specSortIndex = 1;
    dataSeriesValues3.specSortIndex = 0;

    ascSortedColorValues.set(spec3Id, dataSeriesValues3);
    ascSortedColorValues.set(spec2Id, dataSeriesValues2);
    ascSortedColorValues.set(spec1Id, dataSeriesValues1);

    expect(getSortedDataSeriesColorsValuesMap(colorValuesMap)).toEqual(ascSortedColorValues);

    // Any series with undefined sort order should come last
    const undefinedSortedColorValues = new Map();
    dataSeriesValues1.specSortIndex = 1;
    dataSeriesValues2.specSortIndex = undefined;
    dataSeriesValues3.specSortIndex = 0;

    undefinedSortedColorValues.set(spec3Id, dataSeriesValues3);
    undefinedSortedColorValues.set(spec1Id, dataSeriesValues1);
    undefinedSortedColorValues.set(spec2Id, dataSeriesValues2);

    expect(getSortedDataSeriesColorsValuesMap(colorValuesMap)).toEqual(undefinedSortedColorValues);
  });
});
