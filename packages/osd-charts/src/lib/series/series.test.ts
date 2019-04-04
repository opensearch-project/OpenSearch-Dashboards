import { ColorConfig } from '../themes/theme';
import { getGroupId, getSpecId, SpecId } from '../utils/ids';
import { ScaleType } from '../utils/scales/scales';
import {
  DataSeriesColorsValues,
  formatStackedDataSeriesValues,
  getFormattedDataseries,
  getSeriesColorMap,
  getSplittedSeries,
  RawDataSeries,
  splitSeries,
} from './series';
import { BasicSeriesSpec } from './specs';
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
        data: [{ x: 1, y: 1 }, { x: 2, y: 2 }, { x: 4, y: 4 }],
      },
      {
        specId: getSpecId('spec1'),
        key: ['b'],
        seriesColorKey: 'b',
        data: [{ x: 1, y: 21 }, { x: 3, y: 23 }],
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
        data: [{ x: 1, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 3 }, { x: 4, y: 4 }],
      },
      {
        specId: getSpecId('spec1'),
        key: ['b'],
        seriesColorKey: 'b',
        data: [{ x: 1, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 3 }, { x: 4, y: 4 }],
      },
      {
        specId: getSpecId('spec1'),
        key: ['b'],
        seriesColorKey: 'b',
        data: [{ x: 1, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 3 }, { x: 4, y: 4 }],
      },
      {
        specId: getSpecId('spec1'),
        key: ['b'],
        seriesColorKey: 'b',
        data: [{ x: 1, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 3 }, { x: 4, y: 4 }],
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
        data: [{ x: 1, y: 1 }, { x: 4, y: 4 }, { x: 2, y: 2 }],
      },
      {
        specId: getSpecId('spec1'),
        key: ['b'],
        seriesColorKey: 'b',
        data: [{ x: 3, y: 23 }, { x: 1, y: 21 }],
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
        data: new Array(maxArrayItems).fill(0).map((d, i) => ({ x: i, y: i })),
      },
      {
        specId: getSpecId('spec1'),
        key: ['b'],
        seriesColorKey: 'b',
        data: new Array(maxArrayItems).fill(0).map((d, i) => ({ x: i, y: i })),
      },
    ];
    const stackedValues = formatStackedDataSeriesValues(dataSeries, false);
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
    const stackedDataSeries = getFormattedDataseries(
      [spec1, spec2],
      splittedDataSeries.splittedSeries,
    );
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

    const deselectedDataSeries: DataSeriesColorsValues[] = [{
      specId,
      colorValues: ['y1'],
    }];
    const subsetSplit = getSplittedSeries(seriesSpecs, deselectedDataSeries);
    expect(subsetSplit.splittedSeries.get(specId)!.length).toBe(1);
  });
});
