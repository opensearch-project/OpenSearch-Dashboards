import { mergeDomainsByGroupId } from '../lib/axes/axis_utils';
import { IndexedGeometry } from '../lib/series/rendering';
import { DataSeriesColorsValues, getSeriesColorMap } from '../lib/series/series';
import {
  AreaSeriesSpec,
  AxisSpec,
  BarSeriesSpec,
  BasicSeriesSpec,
  LineSeriesSpec,
} from '../lib/series/specs';
import { BARCHART_1Y0G, BARCHART_1Y1G } from '../lib/series/utils/test_dataset';
import { AxisId, getGroupId, getSpecId, SpecId } from '../lib/utils/ids';
import { ScaleType } from '../lib/utils/scales/scales';
import {
  computeSeriesDomains,
  computeSeriesGeometries,
  findDataSeriesByColorValues,
  getUpdatedCustomSeriesColors,
  isChartAnimatable,
  isHorizontalRotation,
  isLineAreaOnlyChart,
  isVerticalRotation,
  mergeGeometriesIndexes,
  updateDeselectedDataSeries,
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

    const deselectedSeries = [dataSeriesValuesA, dataSeriesValuesB];

    expect(findDataSeriesByColorValues(deselectedSeries, dataSeriesValuesA)).toBe(0);
    expect(findDataSeriesByColorValues(deselectedSeries, dataSeriesValuesC)).toBe(-1);
    expect(findDataSeriesByColorValues(null, dataSeriesValuesA)).toBe(-1);
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

    expect(updateDeselectedDataSeries(selectedSeries, dataSeriesValuesC)).toEqual(
      addedSelectedSeries,
    );
    expect(updateDeselectedDataSeries(selectedSeries, dataSeriesValuesA)).toEqual(
      removedSelectedSeries,
    );
    expect(updateDeselectedDataSeries(null, dataSeriesValuesA)).toEqual([dataSeriesValuesA]);
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
  test('can enable the chart animation if we have a valid number of elements', () => {
    const geometriesCounts = {
      points: 0,
      bars: 0,
      areas: 0,
      areasPoints: 0,
      lines: 0,
      linePoints: 0,
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
  describe('Geometries counts', () => {
    test('can compute stacked geometries counts', () => {
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
      const seriesSpecs = new Map<SpecId, BasicSeriesSpec>([
        [area.id, area],
        [line.id, line],
        [bar.id, bar],
      ]);
      const axesSpecs = new Map<AxisId, AxisSpec>();
      const chartRotation = 0;
      const chartDimensions = { width: 100, height: 100, top: 0, left: 0 };
      const chartColors = {
        vizColors: ['violet', 'green', 'blue'],
        defaultVizColor: 'red',
      };
      const domainsByGroupId = mergeDomainsByGroupId(axesSpecs, chartRotation);
      const seriesDomains = computeSeriesDomains(seriesSpecs, domainsByGroupId);
      const seriesColorMap = getSeriesColorMap(seriesDomains.seriesColors, chartColors, new Map());
      const geometries = computeSeriesGeometries(
        seriesSpecs,
        seriesDomains.xDomain,
        seriesDomains.yDomain,
        seriesDomains.formattedDataSeries,
        seriesColorMap,
        chartColors,
        chartDimensions,
        chartRotation,
      );
      expect(geometries.geometriesCounts.bars).toBe(8);
      expect(geometries.geometriesCounts.linePoints).toBe(8);
      expect(geometries.geometriesCounts.areasPoints).toBe(8);
      expect(geometries.geometriesCounts.lines).toBe(2);
      expect(geometries.geometriesCounts.areas).toBe(2);
    });
    test('can compute non stacked geometries indexes', () => {
      const line1: LineSeriesSpec = {
        id: getSpecId('line1'),
        groupId: getGroupId('group1'),
        seriesType: 'line',
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Ordinal,
        xAccessor: 'x',
        yAccessors: ['y'],
        yScaleToDataExtent: false,
        data: BARCHART_1Y0G,
      };
      const line2: LineSeriesSpec = {
        id: getSpecId('line2'),
        groupId: getGroupId('group2'),
        seriesType: 'line',
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Ordinal,
        xAccessor: 'x',
        yAccessors: ['y'],
        yScaleToDataExtent: false,
        data: BARCHART_1Y0G,
      };
      const seriesSpecs = new Map<SpecId, BasicSeriesSpec>([[line1.id, line1], [line2.id, line2]]);
      const axesSpecs = new Map<AxisId, AxisSpec>();
      const chartRotation = 0;
      const chartDimensions = { width: 100, height: 100, top: 0, left: 0 };
      const chartColors = {
        vizColors: ['violet', 'green', 'blue'],
        defaultVizColor: 'red',
      };
      const domainsByGroupId = mergeDomainsByGroupId(axesSpecs, chartRotation);
      const seriesDomains = computeSeriesDomains(seriesSpecs, domainsByGroupId);
      const seriesColorMap = getSeriesColorMap(seriesDomains.seriesColors, chartColors, new Map());
      const geometries = computeSeriesGeometries(
        seriesSpecs,
        seriesDomains.xDomain,
        seriesDomains.yDomain,
        seriesDomains.formattedDataSeries,
        seriesColorMap,
        chartColors,
        chartDimensions,
        chartRotation,
      );
      expect(geometries.geometriesIndex.size).toBe(4);
      expect(geometries.geometriesIndex.get(0)!.length).toBe(2);
      expect(geometries.geometriesIndex.get(1)!.length).toBe(2);
      expect(geometries.geometriesIndex.get(2)!.length).toBe(2);
      expect(geometries.geometriesIndex.get(3)!.length).toBe(2);
    });
    test('can compute stacked geometries indexes', () => {
      const line1: LineSeriesSpec = {
        id: getSpecId('line1'),
        groupId: getGroupId('group1'),
        seriesType: 'line',
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Ordinal,
        xAccessor: 'x',
        yAccessors: ['y'],
        stackAccessors: ['x'],
        yScaleToDataExtent: false,
        data: BARCHART_1Y0G,
      };
      const line2: LineSeriesSpec = {
        id: getSpecId('line2'),
        groupId: getGroupId('group2'),
        seriesType: 'line',
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Ordinal,
        xAccessor: 'x',
        yAccessors: ['y'],
        stackAccessors: ['x'],
        yScaleToDataExtent: false,
        data: BARCHART_1Y0G,
      };
      const seriesSpecs = new Map<SpecId, BasicSeriesSpec>([[line1.id, line1], [line2.id, line2]]);
      const axesSpecs = new Map<AxisId, AxisSpec>();
      const chartRotation = 0;
      const chartDimensions = { width: 100, height: 100, top: 0, left: 0 };
      const chartColors = {
        vizColors: ['violet', 'green', 'blue'],
        defaultVizColor: 'red',
      };
      const domainsByGroupId = mergeDomainsByGroupId(axesSpecs, chartRotation);
      const seriesDomains = computeSeriesDomains(seriesSpecs, domainsByGroupId);
      const seriesColorMap = getSeriesColorMap(seriesDomains.seriesColors, chartColors, new Map());
      const geometries = computeSeriesGeometries(
        seriesSpecs,
        seriesDomains.xDomain,
        seriesDomains.yDomain,
        seriesDomains.formattedDataSeries,
        seriesColorMap,
        chartColors,
        chartDimensions,
        chartRotation,
      );
      expect(geometries.geometriesIndex.size).toBe(4);
      expect(geometries.geometriesIndex.get(0)!.length).toBe(2);
      expect(geometries.geometriesIndex.get(1)!.length).toBe(2);
      expect(geometries.geometriesIndex.get(2)!.length).toBe(2);
      expect(geometries.geometriesIndex.get(3)!.length).toBe(2);
    });
    test('can compute non stacked geometries counts', () => {
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
        yScaleToDataExtent: false,
        data: BARCHART_1Y1G,
      };
      const seriesSpecs = new Map<SpecId, BasicSeriesSpec>([
        [area.id, area],
        [line.id, line],
        [bar.id, bar],
      ]);
      const axesSpecs = new Map<AxisId, AxisSpec>();
      const chartRotation = 0;
      const chartDimensions = { width: 100, height: 100, top: 0, left: 0 };
      const chartColors = {
        vizColors: ['violet', 'green', 'blue'],
        defaultVizColor: 'red',
      };
      const domainsByGroupId = mergeDomainsByGroupId(axesSpecs, chartRotation);
      const seriesDomains = computeSeriesDomains(seriesSpecs, domainsByGroupId);
      const seriesColorMap = getSeriesColorMap(seriesDomains.seriesColors, chartColors, new Map());
      const geometries = computeSeriesGeometries(
        seriesSpecs,
        seriesDomains.xDomain,
        seriesDomains.yDomain,
        seriesDomains.formattedDataSeries,
        seriesColorMap,
        chartColors,
        chartDimensions,
        chartRotation,
      );
      expect(geometries.geometriesCounts.bars).toBe(8);
      expect(geometries.geometriesCounts.linePoints).toBe(8);
      expect(geometries.geometriesCounts.areasPoints).toBe(8);
      expect(geometries.geometriesCounts.lines).toBe(2);
      expect(geometries.geometriesCounts.areas).toBe(2);
    });
    test('can compute line geometries counts', () => {
      const line1: LineSeriesSpec = {
        id: getSpecId('line1'),
        groupId: getGroupId('group2'),
        seriesType: 'line',
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Linear,
        xAccessor: 'x',
        yAccessors: ['y'],
        splitSeriesAccessors: ['g'],
        yScaleToDataExtent: false,
        data: BARCHART_1Y1G,
      };
      const line2: LineSeriesSpec = {
        id: getSpecId('line2'),
        groupId: getGroupId('group2'),
        seriesType: 'line',
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Linear,
        xAccessor: 'x',
        yAccessors: ['y'],
        splitSeriesAccessors: ['g'],
        yScaleToDataExtent: false,
        data: BARCHART_1Y1G,
      };
      const line3: LineSeriesSpec = {
        id: getSpecId('line3'),
        groupId: getGroupId('group2'),
        seriesType: 'line',
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Linear,
        xAccessor: 'x',
        yAccessors: ['y'],
        splitSeriesAccessors: ['g'],
        yScaleToDataExtent: false,
        data: BARCHART_1Y1G,
      };
      const seriesSpecs = new Map<SpecId, BasicSeriesSpec>([
        [line1.id, line1],
        [line2.id, line2],
        [line3.id, line3],
      ]);
      const axesSpecs = new Map<AxisId, AxisSpec>();
      const chartRotation = 0;
      const chartDimensions = { width: 100, height: 100, top: 0, left: 0 };
      const chartColors = {
        vizColors: ['violet', 'green', 'blue'],
        defaultVizColor: 'red',
      };
      const domainsByGroupId = mergeDomainsByGroupId(axesSpecs, chartRotation);
      const seriesDomains = computeSeriesDomains(seriesSpecs, domainsByGroupId);
      const seriesColorMap = getSeriesColorMap(seriesDomains.seriesColors, chartColors, new Map());
      const geometries = computeSeriesGeometries(
        seriesSpecs,
        seriesDomains.xDomain,
        seriesDomains.yDomain,
        seriesDomains.formattedDataSeries,
        seriesColorMap,
        chartColors,
        chartDimensions,
        chartRotation,
      );
      expect(geometries.geometriesCounts.bars).toBe(0);
      expect(geometries.geometriesCounts.linePoints).toBe(24);
      expect(geometries.geometriesCounts.areasPoints).toBe(0);
      expect(geometries.geometriesCounts.lines).toBe(6);
      expect(geometries.geometriesCounts.areas).toBe(0);
    });
    test('can compute area geometries counts', () => {
      const area1: AreaSeriesSpec = {
        id: getSpecId('area1'),
        groupId: getGroupId('group2'),
        seriesType: 'area',
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Linear,
        xAccessor: 'x',
        yAccessors: ['y'],
        splitSeriesAccessors: ['g'],
        yScaleToDataExtent: false,
        data: BARCHART_1Y1G,
      };
      const area2: AreaSeriesSpec = {
        id: getSpecId('area2'),
        groupId: getGroupId('group2'),
        seriesType: 'area',
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Linear,
        xAccessor: 'x',
        yAccessors: ['y'],
        splitSeriesAccessors: ['g'],
        yScaleToDataExtent: false,
        data: BARCHART_1Y1G,
      };
      const area3: AreaSeriesSpec = {
        id: getSpecId('area3'),
        groupId: getGroupId('group2'),
        seriesType: 'area',
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Linear,
        xAccessor: 'x',
        yAccessors: ['y'],
        splitSeriesAccessors: ['g'],
        yScaleToDataExtent: false,
        data: BARCHART_1Y1G,
      };
      const seriesSpecs = new Map<SpecId, BasicSeriesSpec>([
        [area1.id, area1],
        [area2.id, area2],
        [area3.id, area3],
      ]);
      const axesSpecs = new Map<AxisId, AxisSpec>();
      const chartRotation = 0;
      const chartDimensions = { width: 100, height: 100, top: 0, left: 0 };
      const chartColors = {
        vizColors: ['violet', 'green', 'blue'],
        defaultVizColor: 'red',
      };
      const domainsByGroupId = mergeDomainsByGroupId(axesSpecs, chartRotation);
      const seriesDomains = computeSeriesDomains(seriesSpecs, domainsByGroupId);
      const seriesColorMap = getSeriesColorMap(seriesDomains.seriesColors, chartColors, new Map());
      const geometries = computeSeriesGeometries(
        seriesSpecs,
        seriesDomains.xDomain,
        seriesDomains.yDomain,
        seriesDomains.formattedDataSeries,
        seriesColorMap,
        chartColors,
        chartDimensions,
        chartRotation,
      );
      expect(geometries.geometriesCounts.bars).toBe(0);
      expect(geometries.geometriesCounts.linePoints).toBe(0);
      expect(geometries.geometriesCounts.areasPoints).toBe(24);
      expect(geometries.geometriesCounts.lines).toBe(0);
      expect(geometries.geometriesCounts.areas).toBe(6);
    });
    test('can compute bars geometries counts', () => {
      const bars1: BarSeriesSpec = {
        id: getSpecId('bars1'),
        groupId: getGroupId('group2'),
        seriesType: 'bar',
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Linear,
        xAccessor: 'x',
        yAccessors: ['y'],
        splitSeriesAccessors: ['g'],
        yScaleToDataExtent: false,
        data: BARCHART_1Y1G,
      };
      const bars2: BarSeriesSpec = {
        id: getSpecId('bars2'),
        groupId: getGroupId('group2'),
        seriesType: 'bar',
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Linear,
        xAccessor: 'x',
        yAccessors: ['y'],
        splitSeriesAccessors: ['g'],
        yScaleToDataExtent: false,
        data: BARCHART_1Y1G,
      };
      const bars3: BarSeriesSpec = {
        id: getSpecId('bars3'),
        groupId: getGroupId('group2'),
        seriesType: 'bar',
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Linear,
        xAccessor: 'x',
        yAccessors: ['y'],
        splitSeriesAccessors: ['g'],
        yScaleToDataExtent: false,
        data: BARCHART_1Y1G,
      };
      const seriesSpecs = new Map<SpecId, BasicSeriesSpec>([
        [bars1.id, bars1],
        [bars2.id, bars2],
        [bars3.id, bars3],
      ]);
      const axesSpecs = new Map<AxisId, AxisSpec>();
      const chartRotation = 0;
      const chartDimensions = { width: 100, height: 100, top: 0, left: 0 };
      const chartColors = {
        vizColors: ['violet', 'green', 'blue'],
        defaultVizColor: 'red',
      };
      const domainsByGroupId = mergeDomainsByGroupId(axesSpecs, chartRotation);
      const seriesDomains = computeSeriesDomains(seriesSpecs, domainsByGroupId);
      const seriesColorMap = getSeriesColorMap(seriesDomains.seriesColors, chartColors, new Map());
      const geometries = computeSeriesGeometries(
        seriesSpecs,
        seriesDomains.xDomain,
        seriesDomains.yDomain,
        seriesDomains.formattedDataSeries,
        seriesColorMap,
        chartColors,
        chartDimensions,
        chartRotation,
      );
      expect(geometries.geometriesCounts.bars).toBe(24);
      expect(geometries.geometriesCounts.linePoints).toBe(0);
      expect(geometries.geometriesCounts.areasPoints).toBe(0);
      expect(geometries.geometriesCounts.lines).toBe(0);
      expect(geometries.geometriesCounts.areas).toBe(0);
    });
  });
  test('can merge geometry indexes', () => {
    const map1 = new Map<string, IndexedGeometry[]>();
    map1.set('a', [
      {
        radius: 10,
        x: 0,
        y: 0,
        color: '#1EA593',
        value: { x: 0, y: 5, accessor: 'y1' },
        transform: { x: 0, y: 0 },
        geometryId: { specId: getSpecId('line1'), seriesKey: [] },
      },
    ]);
    const map2 = new Map<string, IndexedGeometry[]>();
    map2.set('a', [
      {
        radius: 10,
        x: 0,
        y: 175.8,
        color: '#2B70F7',
        value: { x: 0, y: 2, accessor: 'y1' },
        transform: { x: 0, y: 0 },
        geometryId: { specId: getSpecId('line2'), seriesKey: [] },
      },
    ]);
    const merged = mergeGeometriesIndexes(map1, map2);
    expect(merged.get('a')).toBeDefined();
    expect(merged.get('a')!.length).toBe(2);
  });
});
