import { DataSeriesColorsValues } from '../lib/series/series';
import {
  AreaSeriesSpec,
  BarSeriesSpec,
  BasicSeriesSpec,
  LineSeriesSpec,
} from '../lib/series/specs';

import { BARCHART_1Y0G, BARCHART_1Y1G } from '../lib/series/utils/test_dataset';

import { getGroupId, getSpecId, SpecId } from '../lib/utils/ids';
import { ScaleType } from '../lib/utils/scales/scales';
import {
  computeSeriesDomains,
  findSelectedDataSeries,
  getAllDataSeriesColorValues,
  getUpdatedCustomSeriesColors,
  isHorizontalRotation,
  isLineAreaOnlyChart,
  isVerticalRotation,
  updateSelectedDataSeries,
} from './utils';

describe('Chart State utils', () => {
  it('should compute and format specifications for non stacked chart', () => {
    const spec1: BasicSeriesSpec = {
      id: getSpecId('spec1'),
      groupId: getGroupId('group1'),
      seriesType: 'line',
      yScaleType: ScaleType.Log,
      xScaleType: ScaleType.Linear,
      xAccessor: 'x',
      yAccessors: ['y'],
      yScaleToDataExtent: false,
      data: BARCHART_1Y0G,
    };
    const spec2: BasicSeriesSpec = {
      id: getSpecId('spec2'),
      groupId: getGroupId('group2'),
      seriesType: 'line',
      yScaleType: ScaleType.Log,
      xScaleType: ScaleType.Linear,
      xAccessor: 'x',
      yAccessors: ['y'],
      yScaleToDataExtent: false,
      data: BARCHART_1Y0G,
    };
    const specs = new Map<SpecId, BasicSeriesSpec>();
    specs.set(spec1.id, spec1);
    specs.set(spec2.id, spec2);
    const domains = computeSeriesDomains(specs, new Map(), undefined);
    expect(domains.xDomain).toEqual({
      domain: [0, 3],
      isBandScale: false,
      scaleType: ScaleType.Linear,
      minInterval: 1,
      type: 'xDomain',
    });
    expect(domains.yDomain).toEqual([
      {
        domain: [0, 10],
        scaleType: ScaleType.Log,
        groupId: 'group1',
        isBandScale: false,
        type: 'yDomain',
      },
      {
        domain: [0, 10],
        scaleType: ScaleType.Log,
        groupId: 'group2',
        isBandScale: false,
        type: 'yDomain',
      },
    ]);
    expect(domains.formattedDataSeries.stacked).toEqual([]);
    expect(domains.formattedDataSeries.nonStacked).toMatchSnapshot();
  });
  it('should compute and format specifications for stacked chart', () => {
    const spec1: BasicSeriesSpec = {
      id: getSpecId('spec1'),
      groupId: getGroupId('group1'),
      seriesType: 'line',
      yScaleType: ScaleType.Log,
      xScaleType: ScaleType.Linear,
      xAccessor: 'x',
      yAccessors: ['y'],
      splitSeriesAccessors: ['g'],
      yScaleToDataExtent: false,
      data: BARCHART_1Y1G,
    };
    const spec2: BasicSeriesSpec = {
      id: getSpecId('spec2'),
      groupId: getGroupId('group2'),
      seriesType: 'line',
      yScaleType: ScaleType.Log,
      xScaleType: ScaleType.Linear,
      xAccessor: 'x',
      yAccessors: ['y'],
      splitSeriesAccessors: ['g'],
      stackAccessors: ['x'],
      yScaleToDataExtent: false,
      data: BARCHART_1Y1G,
    };
    const specs = new Map<SpecId, BasicSeriesSpec>();
    specs.set(spec1.id, spec1);
    specs.set(spec2.id, spec2);
    const domains = computeSeriesDomains(specs, new Map(), undefined);
    expect(domains.xDomain).toEqual({
      domain: [0, 3],
      isBandScale: false,
      scaleType: ScaleType.Linear,
      minInterval: 1,
      type: 'xDomain',
    });
    expect(domains.yDomain).toEqual([
      {
        domain: [0, 5],
        scaleType: ScaleType.Log,
        groupId: 'group1',
        isBandScale: false,
        type: 'yDomain',
      },
      {
        domain: [0, 9],
        scaleType: ScaleType.Log,
        groupId: 'group2',
        isBandScale: false,
        type: 'yDomain',
      },
    ]);
    expect(domains.formattedDataSeries.stacked).toMatchSnapshot();
    expect(domains.formattedDataSeries.nonStacked).toMatchSnapshot();
  });
  it('should check if a DataSeriesColorValues item exists in a list of DataSeriesColorValues', () => {
    const dataSeriesValuesA: DataSeriesColorsValues = {
      specId: getSpecId('a'),
      colorValues: ['a', 'b', 'c'],
    };

    const dataSeriesValuesB: DataSeriesColorsValues = {
      specId: getSpecId('b'),
      colorValues: ['a', 'b', 'c'],
    };

    const dataSeriesValuesC: DataSeriesColorsValues = {
      specId: getSpecId('a'),
      colorValues: ['a', 'b', 'd'],
    };

    const selectedSeries = [dataSeriesValuesA, dataSeriesValuesB];

    expect(findSelectedDataSeries(selectedSeries, dataSeriesValuesA)).toBe(0);
    expect(findSelectedDataSeries(selectedSeries, dataSeriesValuesC)).toBe(-1);
    expect(findSelectedDataSeries(null, dataSeriesValuesA)).toBe(-1);
  });
  it('should update a list of DataSeriesColorsValues given a selected DataSeriesColorValues item', () => {
    const dataSeriesValuesA: DataSeriesColorsValues = {
      specId: getSpecId('a'),
      colorValues: ['a', 'b', 'c'],
    };

    const dataSeriesValuesB: DataSeriesColorsValues = {
      specId: getSpecId('b'),
      colorValues: ['a', 'b', 'c'],
    };

    const dataSeriesValuesC: DataSeriesColorsValues = {
      specId: getSpecId('a'),
      colorValues: ['a', 'b', 'd'],
    };

    const selectedSeries = [dataSeriesValuesA, dataSeriesValuesB];
    const addedSelectedSeries = [dataSeriesValuesA, dataSeriesValuesB, dataSeriesValuesC];
    const removedSelectedSeries = [dataSeriesValuesB];

    expect(updateSelectedDataSeries(selectedSeries, dataSeriesValuesC)).toEqual(
      addedSelectedSeries,
    );
    expect(updateSelectedDataSeries(selectedSeries, dataSeriesValuesA)).toEqual(
      removedSelectedSeries,
    );
    expect(updateSelectedDataSeries(null, dataSeriesValuesA)).toEqual([dataSeriesValuesA]);
  });
  it('should return all of the DataSeriesColorValues on initialization', () => {
    const dataSeriesValuesA: DataSeriesColorsValues = {
      specId: getSpecId('a'),
      colorValues: ['a', 'b', 'c'],
    };

    const dataSeriesValuesB: DataSeriesColorsValues = {
      specId: getSpecId('b'),
      colorValues: ['a', 'b', 'c'],
    };

    const colorMap = new Map();
    colorMap.set('a', dataSeriesValuesA);
    colorMap.set('b', dataSeriesValuesB);

    const expected = [dataSeriesValuesA, dataSeriesValuesB];

    expect(getAllDataSeriesColorValues(colorMap)).toEqual(expected);
  });
  it('should get an updated customSeriesColor based on specs', () => {
    const spec1: BasicSeriesSpec = {
      id: getSpecId('spec1'),
      groupId: getGroupId('group1'),
      seriesType: 'line',
      yScaleType: ScaleType.Log,
      xScaleType: ScaleType.Linear,
      xAccessor: 'x',
      yAccessors: ['y'],
      yScaleToDataExtent: false,
      data: BARCHART_1Y0G,
    };

    const specs = new Map<SpecId, BasicSeriesSpec>();
    specs.set(spec1.id, spec1);

    const emptyCustomSeriesColors = getUpdatedCustomSeriesColors(specs);
    expect(emptyCustomSeriesColors).toEqual(new Map());

    const dataSeriesColorValues = {
      specId: spec1.id,
      colorValues: ['bar'],
    };
    spec1.customSeriesColors = new Map();
    spec1.customSeriesColors.set(dataSeriesColorValues, 'custom_color');

    const updatedCustomSeriesColors = getUpdatedCustomSeriesColors(specs);
    const expectedCustomSeriesColors = new Map();
    expectedCustomSeriesColors.set('specId:{spec1},colors:{bar}', 'custom_color');

    expect(updatedCustomSeriesColors).toEqual(expectedCustomSeriesColors);
  });

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
  test('is an area or line only map', () => {
    const area: AreaSeriesSpec = {
      id: getSpecId('area'),
      groupId: getGroupId('group1'),
      seriesType: 'area',
      yScaleType: ScaleType.Log,
      xScaleType: ScaleType.Linear,
      xAccessor: 'x',
      yAccessors: ['y'],
      splitSeriesAccessors: ['g'],
      yScaleToDataExtent: false,
      data: BARCHART_1Y1G,
    };
    const line: LineSeriesSpec = {
      id: getSpecId('line'),
      groupId: getGroupId('group2'),
      seriesType: 'line',
      yScaleType: ScaleType.Log,
      xScaleType: ScaleType.Linear,
      xAccessor: 'x',
      yAccessors: ['y'],
      splitSeriesAccessors: ['g'],
      stackAccessors: ['x'],
      yScaleToDataExtent: false,
      data: BARCHART_1Y1G,
    };
    const bar: BarSeriesSpec = {
      id: getSpecId('bar'),
      groupId: getGroupId('group2'),
      seriesType: 'bar',
      yScaleType: ScaleType.Log,
      xScaleType: ScaleType.Linear,
      xAccessor: 'x',
      yAccessors: ['y'],
      splitSeriesAccessors: ['g'],
      stackAccessors: ['x'],
      yScaleToDataExtent: false,
      data: BARCHART_1Y1G,
    };
    let seriesMap = new Map<SpecId, BasicSeriesSpec>([
      [area.id, area],
      [line.id, line],
      [bar.id, bar],
    ]);
    expect(isLineAreaOnlyChart(seriesMap)).toBe(false);
    seriesMap = new Map<SpecId, BasicSeriesSpec>([[area.id, area], [line.id, line]]);
    expect(isLineAreaOnlyChart(seriesMap)).toBe(true);
    seriesMap = new Map<SpecId, BasicSeriesSpec>([[area.id, area]]);
    expect(isLineAreaOnlyChart(seriesMap)).toBe(true);
    seriesMap = new Map<SpecId, BasicSeriesSpec>([[line.id, line]]);
    expect(isLineAreaOnlyChart(seriesMap)).toBe(true);
    seriesMap = new Map<SpecId, BasicSeriesSpec>([[bar.id, bar], [getSpecId('bar2'), bar]]);
    expect(isLineAreaOnlyChart(seriesMap)).toBe(false);
  });
});
