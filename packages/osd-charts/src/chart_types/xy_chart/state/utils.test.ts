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
  AreaSeriesSpec,
  AxisSpec,
  BarSeriesSpec,
  BasicSeriesSpec,
  HistogramModeAlignments,
  LineSeriesSpec,
  SeriesTypes,
  SeriesColorAccessorFn,
} from '../utils/specs';
import { BARCHART_1Y0G, BARCHART_1Y1G } from '../../../utils/data_samples/test_dataset';
import { LIGHT_THEME } from '../../../utils/themes/light_theme';
import { SpecId } from '../../../utils/ids';
import { ScaleType, ScaleContinuous } from '../../../scales';
import {
  computeSeriesDomains,
  computeSeriesGeometries,
  computeXScaleOffset,
  isAllSeriesDeselected,
  isChartAnimatable,
  isHistogramModeEnabled,
  isHorizontalRotation,
  isLineAreaOnlyChart,
  isVerticalRotation,
  mergeGeometriesIndexes,
  setBarSeriesAccessors,
  getCustomSeriesColors,
} from './utils';
import { IndexedGeometry, BandedAccessorType } from '../../../utils/geometry';
import { mergeYCustomDomainsByGroupId } from './selectors/merge_y_custom_domains';
import { updateDeselectedDataSeries } from './utils';
import { ChartTypes } from '../..';
import { MockSeriesSpecs, MockSeriesSpec } from '../../../mocks/specs';
import { MockSeriesCollection } from '../../../mocks/series/series_identifiers';
import { SeededDataGenerator } from '../../../mocks/utils';
import { SeriesCollectionValue, getSeriesIndex, getSeriesColors } from '../utils/series';
import { SpecTypes } from '../../../specs/settings';
import { ColorOverrides } from '../../../state/chart_state';
import { LegendItem } from '../../../commons/legend';

describe('Chart State utils', () => {
  const emptySeriesOverrides: ColorOverrides = {
    temporary: {},
    persisted: {},
  };

  it('should compute and format specifications for non stacked chart', () => {
    const spec1: BasicSeriesSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Series,
      id: 'spec1',
      groupId: 'group1',
      seriesType: SeriesTypes.Line,
      yScaleType: ScaleType.Log,
      xScaleType: ScaleType.Linear,
      xAccessor: 'x',
      yAccessors: ['y'],
      yScaleToDataExtent: false,
      data: BARCHART_1Y0G,
    };
    const spec2: BasicSeriesSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Series,
      id: 'spec2',
      groupId: 'group2',
      seriesType: SeriesTypes.Line,
      yScaleType: ScaleType.Log,
      xScaleType: ScaleType.Linear,
      xAccessor: 'x',
      yAccessors: ['y'],
      yScaleToDataExtent: false,
      data: BARCHART_1Y0G,
    };
    const domains = computeSeriesDomains([spec1, spec2], new Map(), undefined);
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
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Series,
      id: 'spec1',
      groupId: 'group1',
      seriesType: SeriesTypes.Line,
      yScaleType: ScaleType.Log,
      xScaleType: ScaleType.Linear,
      xAccessor: 'x',
      yAccessors: ['y'],
      splitSeriesAccessors: ['g'],
      yScaleToDataExtent: false,
      data: BARCHART_1Y1G,
    };
    const spec2: BasicSeriesSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Series,
      id: 'spec2',
      groupId: 'group2',
      seriesType: SeriesTypes.Line,
      yScaleType: ScaleType.Log,
      xScaleType: ScaleType.Linear,
      xAccessor: 'x',
      yAccessors: ['y'],
      splitSeriesAccessors: ['g'],
      stackAccessors: ['x'],
      yScaleToDataExtent: false,
      data: BARCHART_1Y1G,
    };
    const domains = computeSeriesDomains([spec1, spec2], new Map(), undefined);
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
  it('should check if a SeriesCollectionValue item exists in a list of SeriesCollectionValue', () => {
    const dataSeriesValuesA: SeriesCollectionValue = {
      seriesIdentifier: {
        specId: 'a',
        yAccessor: 'y1',
        splitAccessors: new Map(),
        seriesKeys: ['a', 'b', 'c'],
        key: 'a',
      },
    };
    const dataSeriesValuesB: SeriesCollectionValue = {
      seriesIdentifier: {
        specId: 'b',
        yAccessor: 'y1',
        splitAccessors: new Map(),
        seriesKeys: ['a', 'b', 'c'],
        key: 'b',
      },
    };
    const dataSeriesValuesC: SeriesCollectionValue = {
      seriesIdentifier: {
        specId: 'c',
        yAccessor: 'y1',
        splitAccessors: new Map(),
        seriesKeys: ['a', 'b', 'd'],
        key: 'c',
      },
    };
    const deselectedSeries = [dataSeriesValuesA.seriesIdentifier, dataSeriesValuesB.seriesIdentifier];
    expect(getSeriesIndex(deselectedSeries, dataSeriesValuesA.seriesIdentifier)).toBe(0);
    expect(getSeriesIndex(deselectedSeries, dataSeriesValuesC.seriesIdentifier)).toBe(-1);
    expect(getSeriesIndex([], dataSeriesValuesA.seriesIdentifier)).toBe(-1);
  });
  it('should update a list of SeriesCollectionValue given a selected SeriesCollectionValue item', () => {
    const dataSeriesValuesA: SeriesCollectionValue = {
      seriesIdentifier: {
        specId: 'a',
        yAccessor: 'y1',
        splitAccessors: new Map(),
        seriesKeys: ['a', 'b', 'c'],
        key: 'a',
      },
    };
    const dataSeriesValuesB: SeriesCollectionValue = {
      seriesIdentifier: {
        specId: 'b',
        yAccessor: 'y1',
        splitAccessors: new Map(),
        seriesKeys: ['a', 'b', 'c'],
        key: 'b',
      },
    };
    const dataSeriesValuesC: SeriesCollectionValue = {
      seriesIdentifier: {
        specId: 'a',
        yAccessor: 'y1',
        splitAccessors: new Map(),
        seriesKeys: ['a', 'b', 'd'],
        key: 'd',
      },
    };
    const selectedSeries = [dataSeriesValuesA.seriesIdentifier, dataSeriesValuesB.seriesIdentifier];
    const addedSelectedSeries = [
      dataSeriesValuesA.seriesIdentifier,
      dataSeriesValuesB.seriesIdentifier,
      dataSeriesValuesC.seriesIdentifier,
    ];
    const removedSelectedSeries = [dataSeriesValuesB.seriesIdentifier];

    expect(updateDeselectedDataSeries(selectedSeries, dataSeriesValuesC.seriesIdentifier)).toEqual(addedSelectedSeries);
    expect(updateDeselectedDataSeries(selectedSeries, dataSeriesValuesA.seriesIdentifier)).toEqual(
      removedSelectedSeries,
    );
    expect(updateDeselectedDataSeries([], dataSeriesValuesA.seriesIdentifier)).toEqual([
      dataSeriesValuesA.seriesIdentifier,
    ]);
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
      yScaleToDataExtent: false,
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
      yScaleToDataExtent: false,
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
      yScaleToDataExtent: false,
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

  describe('getCustomSeriesColors', () => {
    const specId1 = 'bar1';
    const specId2 = 'bar2';
    const dg = new SeededDataGenerator();
    // 4 groups generated
    const data = dg.generateGroupedSeries(50, 4);
    const targetKey = 'spec{bar1}yAccessor{y}splitAccessors{g-b}';

    describe('empty series collection and specs', () => {
      it('it should return an empty map', () => {
        const actual = getCustomSeriesColors(MockSeriesSpecs.empty(), MockSeriesCollection.empty());

        expect(actual.size).toBe(0);
      });
    });

    describe('series collection is not empty', () => {
      it('it should return an empty map if no color', () => {
        const barSpec1 = MockSeriesSpec.bar({ id: specId1, data, splitSeriesAccessors: ['g'] });
        const barSpec2 = MockSeriesSpec.bar({ id: specId2, data, splitSeriesAccessors: ['g'] });
        const barSeriesSpecs = MockSeriesSpecs.fromSpecs([barSpec1, barSpec2]);
        const barSeriesCollection = MockSeriesCollection.fromSpecs(barSeriesSpecs);
        const actual = getCustomSeriesColors(barSeriesSpecs, barSeriesCollection);

        expect(actual.size).toBe(0);
      });

      it('it should return string color value', () => {
        const color = 'green';
        const barSpec1 = MockSeriesSpec.bar({ id: specId1, data, color });
        const barSpec2 = MockSeriesSpec.bar({ id: specId2, data });
        const barSeriesSpecs = MockSeriesSpecs.fromSpecs([barSpec1, barSpec2]);
        const barSeriesCollection = MockSeriesCollection.fromSpecs(barSeriesSpecs);
        const actual = getCustomSeriesColors(barSeriesSpecs, barSeriesCollection);

        expect([...actual.values()]).toEqualArrayOf(color);
      });

      describe('with customSeriesColors array', () => {
        const customSeriesColors = ['red', 'blue', 'green'];
        const barSpec1 = MockSeriesSpec.bar({
          id: specId1,
          data,
          color: customSeriesColors,
          splitSeriesAccessors: ['g'],
        });
        const barSpec2 = MockSeriesSpec.bar({ id: specId2, data, splitSeriesAccessors: ['g'] });
        const barSeriesSpecs = MockSeriesSpecs.fromSpecs([barSpec1, barSpec2]);
        const barSeriesCollection = MockSeriesCollection.fromSpecs(barSeriesSpecs);

        it('it should return color from color array', () => {
          const actual = getCustomSeriesColors(barSeriesSpecs, barSeriesCollection);

          expect(actual.size).toBe(4);
          barSeriesCollection.forEach(({ seriesIdentifier: { specId, key } }) => {
            const color = actual.get(key);
            if (specId === specId1) {
              expect(customSeriesColors).toContainEqual(color);
            } else {
              expect(color).toBeUndefined();
            }
          });
        });
      });

      describe('with color function', () => {
        const color: SeriesColorAccessorFn = ({ yAccessor, splitAccessors }) => {
          if (yAccessor === 'y' && splitAccessors.get('g') === 'b') {
            return 'aquamarine';
          }

          return null;
        };
        const barSpec1 = MockSeriesSpec.bar({
          id: specId1,
          yAccessors: ['y'],
          data,
          color,
          splitSeriesAccessors: ['g'],
        });
        const barSpec2 = MockSeriesSpec.bar({ id: specId2, data, splitSeriesAccessors: ['g'] });
        const barSeriesSpecs = MockSeriesSpecs.fromSpecs([barSpec1, barSpec2]);
        const barSeriesCollection = MockSeriesCollection.fromSpecs(barSeriesSpecs);

        it('it should return color from color function', () => {
          const actual = getCustomSeriesColors(barSeriesSpecs, barSeriesCollection);

          expect(actual.size).toBe(1);
          expect(actual.get(targetKey)).toBe('aquamarine');
        });
      });
    });
  });

  describe('Geometries counts', () => {
    test('can compute stacked geometries counts', () => {
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
        yScaleToDataExtent: false,
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
        yScaleToDataExtent: false,
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
        yScaleToDataExtent: false,
        data: BARCHART_1Y1G,
      };
      const seriesSpecs: BasicSeriesSpec[] = [area, line, bar];
      const axesSpecs: AxisSpec[] = [];
      const chartRotation = 0;
      const chartDimensions = { width: 100, height: 100, top: 0, left: 0 };
      const chartColors = {
        vizColors: ['violet', 'green', 'blue'],
        defaultVizColor: 'red',
      };
      const chartTheme = { ...LIGHT_THEME, colors: chartColors };
      const domainsByGroupId = mergeYCustomDomainsByGroupId(axesSpecs, chartRotation);
      const seriesDomains = computeSeriesDomains(seriesSpecs, domainsByGroupId, undefined);
      const seriesColorMap = getSeriesColors(
        seriesDomains.seriesCollection,
        chartColors,
        new Map(),
        emptySeriesOverrides,
      );
      const geometries = computeSeriesGeometries(
        seriesSpecs,
        seriesDomains.xDomain,
        seriesDomains.yDomain,
        seriesDomains.formattedDataSeries,
        seriesColorMap,
        chartTheme,
        chartDimensions,
        chartRotation,
        axesSpecs,
        false,
      );
      expect(geometries.geometriesCounts.bars).toBe(8);
      expect(geometries.geometriesCounts.linePoints).toBe(8);
      expect(geometries.geometriesCounts.areasPoints).toBe(8);
      expect(geometries.geometriesCounts.lines).toBe(2);
      expect(geometries.geometriesCounts.areas).toBe(2);
    });
    test('can compute non stacked geometries indexes', () => {
      const line1: LineSeriesSpec = {
        chartType: ChartTypes.XYAxis,
        specType: SpecTypes.Series,
        id: 'line1',
        groupId: 'group1',
        seriesType: SeriesTypes.Line,
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Ordinal,
        xAccessor: 'x',
        yAccessors: ['y'],
        yScaleToDataExtent: false,
        data: BARCHART_1Y0G,
      };
      const line2: LineSeriesSpec = {
        chartType: ChartTypes.XYAxis,
        specType: SpecTypes.Series,
        id: 'line2',
        groupId: 'group2',
        seriesType: SeriesTypes.Line,
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Ordinal,
        xAccessor: 'x',
        yAccessors: ['y'],
        yScaleToDataExtent: false,
        data: BARCHART_1Y0G,
      };
      const seriesSpecs: BasicSeriesSpec[] = [line1, line2];
      const axesSpecs: AxisSpec[] = [];
      const chartRotation = 0;
      const chartDimensions = { width: 100, height: 100, top: 0, left: 0 };
      const chartColors = {
        vizColors: ['violet', 'green', 'blue'],
        defaultVizColor: 'red',
      };
      const chartTheme = { ...LIGHT_THEME, colors: chartColors };
      const domainsByGroupId = mergeYCustomDomainsByGroupId(axesSpecs, chartRotation);
      const seriesDomains = computeSeriesDomains(seriesSpecs, domainsByGroupId, undefined);
      const seriesColorMap = getSeriesColors(
        seriesDomains.seriesCollection,
        chartColors,
        new Map(),
        emptySeriesOverrides,
      );
      const geometries = computeSeriesGeometries(
        seriesSpecs,
        seriesDomains.xDomain,
        seriesDomains.yDomain,
        seriesDomains.formattedDataSeries,
        seriesColorMap,
        chartTheme,
        chartDimensions,
        chartRotation,
        axesSpecs,
        false,
      );
      expect(geometries.geometriesIndex.size).toBe(4);
      expect(geometries.geometriesIndex.get(0)?.length).toBe(2);
      expect(geometries.geometriesIndex.get(1)?.length).toBe(2);
      expect(geometries.geometriesIndex.get(2)?.length).toBe(2);
      expect(geometries.geometriesIndex.get(3)?.length).toBe(2);
    });
    test('can compute stacked geometries indexes', () => {
      const line1: LineSeriesSpec = {
        chartType: ChartTypes.XYAxis,
        specType: SpecTypes.Series,
        id: 'line1',
        groupId: 'group1',
        seriesType: SeriesTypes.Line,
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Ordinal,
        xAccessor: 'x',
        yAccessors: ['y'],
        stackAccessors: ['x'],
        yScaleToDataExtent: false,
        data: BARCHART_1Y0G,
      };
      const line2: LineSeriesSpec = {
        chartType: ChartTypes.XYAxis,
        specType: SpecTypes.Series,
        id: 'line2',
        groupId: 'group2',
        seriesType: SeriesTypes.Line,
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Ordinal,
        xAccessor: 'x',
        yAccessors: ['y'],
        stackAccessors: ['x'],
        yScaleToDataExtent: false,
        data: BARCHART_1Y0G,
      };
      const seriesSpecs: BasicSeriesSpec[] = [line1, line2];
      const axesSpecs: AxisSpec[] = [];
      const chartRotation = 0;
      const chartDimensions = { width: 100, height: 100, top: 0, left: 0 };
      const chartColors = {
        vizColors: ['violet', 'green', 'blue'],
        defaultVizColor: 'red',
      };
      const chartTheme = { ...LIGHT_THEME, colors: chartColors };
      const domainsByGroupId = mergeYCustomDomainsByGroupId(axesSpecs, chartRotation);
      const seriesDomains = computeSeriesDomains(seriesSpecs, domainsByGroupId, undefined);
      const seriesColorMap = getSeriesColors(
        seriesDomains.seriesCollection,
        chartColors,
        new Map(),
        emptySeriesOverrides,
      );
      const geometries = computeSeriesGeometries(
        seriesSpecs,
        seriesDomains.xDomain,
        seriesDomains.yDomain,
        seriesDomains.formattedDataSeries,
        seriesColorMap,
        chartTheme,
        chartDimensions,
        chartRotation,
        axesSpecs,
        false,
      );
      expect(geometries.geometriesIndex.size).toBe(4);
      expect(geometries.geometriesIndex.get(0)?.length).toBe(2);
      expect(geometries.geometriesIndex.get(1)?.length).toBe(2);
      expect(geometries.geometriesIndex.get(2)?.length).toBe(2);
      expect(geometries.geometriesIndex.get(3)?.length).toBe(2);
    });
    test('can compute non stacked geometries counts', () => {
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
        yScaleToDataExtent: false,
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
        yScaleToDataExtent: false,
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
        yScaleToDataExtent: false,
        data: BARCHART_1Y1G,
        barSeriesStyle: {
          rectBorder: {
            stroke: 'stroke',
            strokeWidth: 123,
            visible: true,
          },
          rect: {
            opacity: 0.2,
          },
        },
        displayValueSettings: {
          showValueLabel: true,
        },
      };
      const seriesSpecs: BasicSeriesSpec[] = [area, line, bar];
      const axesSpecs: AxisSpec[] = [];
      const chartRotation = 0;
      const chartDimensions = { width: 100, height: 100, top: 0, left: 0 };
      const chartColors = {
        vizColors: ['violet', 'green', 'blue'],
        defaultVizColor: 'red',
      };
      const chartTheme = { ...LIGHT_THEME, colors: chartColors };
      const domainsByGroupId = mergeYCustomDomainsByGroupId(axesSpecs, chartRotation);
      const seriesDomains = computeSeriesDomains(seriesSpecs, domainsByGroupId, undefined);
      const seriesColorMap = getSeriesColors(
        seriesDomains.seriesCollection,
        chartColors,
        new Map(),
        emptySeriesOverrides,
      );
      const geometries = computeSeriesGeometries(
        seriesSpecs,
        seriesDomains.xDomain,
        seriesDomains.yDomain,
        seriesDomains.formattedDataSeries,
        seriesColorMap,
        chartTheme,
        chartDimensions,
        chartRotation,
        axesSpecs,
        false,
      );
      expect(geometries.geometriesCounts.bars).toBe(8);
      expect(geometries.geometriesCounts.linePoints).toBe(8);
      expect(geometries.geometriesCounts.areasPoints).toBe(8);
      expect(geometries.geometriesCounts.lines).toBe(2);
      expect(geometries.geometriesCounts.areas).toBe(2);
    });
    test('can compute line geometries counts', () => {
      const line1: LineSeriesSpec = {
        chartType: ChartTypes.XYAxis,
        specType: SpecTypes.Series,
        id: 'line1',
        groupId: 'group2',
        seriesType: SeriesTypes.Line,
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Linear,
        xAccessor: 'x',
        yAccessors: ['y'],
        splitSeriesAccessors: ['g'],
        yScaleToDataExtent: false,
        data: BARCHART_1Y1G,
      };
      const line2: LineSeriesSpec = {
        chartType: ChartTypes.XYAxis,
        specType: SpecTypes.Series,
        id: 'line2',
        groupId: 'group2',
        seriesType: SeriesTypes.Line,
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Linear,
        xAccessor: 'x',
        yAccessors: ['y'],
        splitSeriesAccessors: ['g'],
        yScaleToDataExtent: false,
        data: BARCHART_1Y1G,
      };
      const line3: LineSeriesSpec = {
        chartType: ChartTypes.XYAxis,
        specType: SpecTypes.Series,
        id: 'line3',
        groupId: 'group2',
        seriesType: SeriesTypes.Line,
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Linear,
        xAccessor: 'x',
        yAccessors: ['y'],
        splitSeriesAccessors: ['g'],
        yScaleToDataExtent: false,
        data: BARCHART_1Y1G,
      };
      const seriesSpecs: BasicSeriesSpec[] = [line1, line2, line3];
      const axesSpecs: AxisSpec[] = [];
      const chartRotation = 0;
      const chartDimensions = { width: 100, height: 100, top: 0, left: 0 };
      const chartColors = {
        vizColors: ['violet', 'green', 'blue'],
        defaultVizColor: 'red',
      };
      const chartTheme = { ...LIGHT_THEME, colors: chartColors };
      const domainsByGroupId = mergeYCustomDomainsByGroupId(axesSpecs, chartRotation);
      const seriesDomains = computeSeriesDomains(seriesSpecs, domainsByGroupId, undefined);
      const seriesColorMap = getSeriesColors(
        seriesDomains.seriesCollection,
        chartColors,
        new Map(),
        emptySeriesOverrides,
      );
      const geometries = computeSeriesGeometries(
        seriesSpecs,
        seriesDomains.xDomain,
        seriesDomains.yDomain,
        seriesDomains.formattedDataSeries,
        seriesColorMap,
        chartTheme,
        chartDimensions,
        chartRotation,
        axesSpecs,
        false,
      );
      expect(geometries.geometriesCounts.bars).toBe(0);
      expect(geometries.geometriesCounts.linePoints).toBe(24);
      expect(geometries.geometriesCounts.areasPoints).toBe(0);
      expect(geometries.geometriesCounts.lines).toBe(6);
      expect(geometries.geometriesCounts.areas).toBe(0);
    });
    test('can compute area geometries counts', () => {
      const area1: AreaSeriesSpec = {
        chartType: ChartTypes.XYAxis,
        specType: SpecTypes.Series,
        id: 'area1',
        groupId: 'group2',
        seriesType: SeriesTypes.Area,
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Linear,
        xAccessor: 'x',
        yAccessors: ['y'],
        splitSeriesAccessors: ['g'],
        yScaleToDataExtent: false,
        data: BARCHART_1Y1G,
      };
      const area2: AreaSeriesSpec = {
        chartType: ChartTypes.XYAxis,
        specType: SpecTypes.Series,
        id: 'area2',
        groupId: 'group2',
        seriesType: SeriesTypes.Area,
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Linear,
        xAccessor: 'x',
        yAccessors: ['y'],
        splitSeriesAccessors: ['g'],
        yScaleToDataExtent: false,
        data: BARCHART_1Y1G,
      };
      const area3: AreaSeriesSpec = {
        chartType: ChartTypes.XYAxis,
        specType: SpecTypes.Series,
        id: 'area3',
        groupId: 'group2',
        seriesType: SeriesTypes.Area,
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Linear,
        xAccessor: 'x',
        yAccessors: ['y'],
        splitSeriesAccessors: ['g'],
        yScaleToDataExtent: false,
        data: BARCHART_1Y1G,
      };
      const seriesSpecs: BasicSeriesSpec[] = [area1, area2, area3];
      const axesSpecs: AxisSpec[] = [];
      const chartRotation = 0;
      const chartDimensions = { width: 100, height: 100, top: 0, left: 0 };
      const chartColors = {
        vizColors: ['violet', 'green', 'blue'],
        defaultVizColor: 'red',
      };
      const chartTheme = { ...LIGHT_THEME, colors: chartColors };
      const domainsByGroupId = mergeYCustomDomainsByGroupId(axesSpecs, chartRotation);
      const seriesDomains = computeSeriesDomains(seriesSpecs, domainsByGroupId, undefined);
      const seriesColorMap = getSeriesColors(
        seriesDomains.seriesCollection,
        chartColors,
        new Map(),
        emptySeriesOverrides,
      );
      const geometries = computeSeriesGeometries(
        seriesSpecs,
        seriesDomains.xDomain,
        seriesDomains.yDomain,
        seriesDomains.formattedDataSeries,
        seriesColorMap,
        chartTheme,
        chartDimensions,
        chartRotation,
        axesSpecs,
        false,
      );
      expect(geometries.geometriesCounts.bars).toBe(0);
      expect(geometries.geometriesCounts.linePoints).toBe(0);
      expect(geometries.geometriesCounts.areasPoints).toBe(24);
      expect(geometries.geometriesCounts.lines).toBe(0);
      expect(geometries.geometriesCounts.areas).toBe(6);
    });
    test('can compute line geometries with custom style', () => {
      const line1: LineSeriesSpec = {
        chartType: ChartTypes.XYAxis,
        specType: SpecTypes.Series,
        id: 'line1',
        groupId: 'group2',
        seriesType: SeriesTypes.Line,
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Linear,
        xAccessor: 'x',
        yAccessors: ['y'],
        splitSeriesAccessors: ['g'],
        yScaleToDataExtent: false,
        lineSeriesStyle: {
          line: {
            strokeWidth: 100,
          },
          point: {
            fill: 'green',
          },
        },
        data: BARCHART_1Y1G,
      };
      const line2: LineSeriesSpec = {
        chartType: ChartTypes.XYAxis,
        specType: SpecTypes.Series,
        id: 'line2',
        groupId: 'group2',
        seriesType: SeriesTypes.Line,
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Linear,
        xAccessor: 'x',
        yAccessors: ['y'],
        splitSeriesAccessors: ['g'],
        yScaleToDataExtent: false,
        data: BARCHART_1Y1G,
      };
      const line3: LineSeriesSpec = {
        chartType: ChartTypes.XYAxis,
        specType: SpecTypes.Series,
        id: 'line3',
        groupId: 'group2',
        seriesType: SeriesTypes.Line,
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Linear,
        xAccessor: 'x',
        yAccessors: ['y'],
        splitSeriesAccessors: ['g'],
        yScaleToDataExtent: false,
        data: BARCHART_1Y1G,
      };
      const seriesSpecs: BasicSeriesSpec[] = [line1, line2, line3];
      const axesSpecs: AxisSpec[] = [];
      const chartRotation = 0;
      const chartDimensions = { width: 100, height: 100, top: 0, left: 0 };
      const chartColors = {
        vizColors: ['violet', 'green', 'blue'],
        defaultVizColor: 'red',
      };
      const chartTheme = { ...LIGHT_THEME, colors: chartColors };
      const domainsByGroupId = mergeYCustomDomainsByGroupId(axesSpecs, chartRotation);
      const seriesDomains = computeSeriesDomains(seriesSpecs, domainsByGroupId, undefined);
      const seriesColorMap = getSeriesColors(
        seriesDomains.seriesCollection,
        chartColors,
        new Map(),
        emptySeriesOverrides,
      );
      const geometries = computeSeriesGeometries(
        seriesSpecs,
        seriesDomains.xDomain,
        seriesDomains.yDomain,
        seriesDomains.formattedDataSeries,
        seriesColorMap,
        chartTheme,
        chartDimensions,
        chartRotation,
        axesSpecs,
        false,
      );
      expect(geometries.geometries.lines[0].color).toBe('violet');
      expect(geometries.geometries.lines[0].seriesLineStyle).toEqual({
        visible: true,
        strokeWidth: 100, // the override strokeWidth
        opacity: 1,
      });
      expect(geometries.geometries.lines[0].seriesPointStyle).toEqual({
        visible: true,
        fill: 'green', // the override strokeWidth
        opacity: 1,
        radius: 2,
        strokeWidth: 1,
      });
    });
    test('can compute area geometries with custom style', () => {
      const area1: AreaSeriesSpec = {
        chartType: ChartTypes.XYAxis,
        specType: SpecTypes.Series,
        id: 'area1',
        groupId: 'group2',
        seriesType: SeriesTypes.Area,
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Linear,
        xAccessor: 'x',
        yAccessors: ['y'],
        splitSeriesAccessors: ['g'],
        yScaleToDataExtent: false,
        data: BARCHART_1Y1G,
        areaSeriesStyle: {
          line: {
            strokeWidth: 100,
          },
          point: {
            fill: 'point-fill-custom-color',
          },
          area: {
            fill: 'area-fill-custom-color',
            opacity: 0.2,
          },
        },
      };
      const area2: AreaSeriesSpec = {
        chartType: ChartTypes.XYAxis,
        specType: SpecTypes.Series,
        id: 'area2',
        groupId: 'group2',
        seriesType: SeriesTypes.Area,
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Linear,
        xAccessor: 'x',
        yAccessors: ['y'],
        splitSeriesAccessors: ['g'],
        yScaleToDataExtent: false,
        data: BARCHART_1Y1G,
      };
      const area3: AreaSeriesSpec = {
        chartType: ChartTypes.XYAxis,
        specType: SpecTypes.Series,
        id: 'area3',
        groupId: 'group2',
        seriesType: SeriesTypes.Area,
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Linear,
        xAccessor: 'x',
        yAccessors: ['y'],
        splitSeriesAccessors: ['g'],
        yScaleToDataExtent: false,
        data: BARCHART_1Y1G,
      };
      const seriesSpecs: BasicSeriesSpec[] = [area1, area2, area3];
      const axesSpecs: AxisSpec[] = [];
      const chartRotation = 0;
      const chartDimensions = { width: 100, height: 100, top: 0, left: 0 };
      const chartColors = {
        vizColors: ['violet', 'green', 'blue'],
        defaultVizColor: 'red',
      };
      const chartTheme = { ...LIGHT_THEME, colors: chartColors };
      const domainsByGroupId = mergeYCustomDomainsByGroupId(axesSpecs, chartRotation);
      const seriesDomains = computeSeriesDomains(seriesSpecs, domainsByGroupId, undefined);
      const seriesColorMap = getSeriesColors(
        seriesDomains.seriesCollection,
        chartColors,
        new Map(),
        emptySeriesOverrides,
      );
      const geometries = computeSeriesGeometries(
        seriesSpecs,
        seriesDomains.xDomain,
        seriesDomains.yDomain,
        seriesDomains.formattedDataSeries,
        seriesColorMap,
        chartTheme,
        chartDimensions,
        chartRotation,
        axesSpecs,
        false,
      );
      expect(geometries.geometries.areas[0].color).toBe('violet');
      expect(geometries.geometries.areas[0].seriesAreaStyle).toEqual({
        visible: true,
        fill: 'area-fill-custom-color',
        opacity: 0.2,
      });
      expect(geometries.geometries.areas[0].seriesAreaLineStyle).toEqual({
        visible: true,
        strokeWidth: 100,
        opacity: 1,
      });
      expect(geometries.geometries.areas[0].seriesPointStyle).toEqual({
        visible: false,
        fill: 'point-fill-custom-color', // the override strokeWidth
        opacity: 1,
        radius: 2,
        strokeWidth: 1,
      });
    });
    test('can compute bars geometries counts', () => {
      const bars1: BarSeriesSpec = {
        chartType: ChartTypes.XYAxis,
        specType: SpecTypes.Series,
        id: 'bars1',
        groupId: 'group2',
        seriesType: SeriesTypes.Bar,
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Linear,
        xAccessor: 'x',
        yAccessors: ['y'],
        splitSeriesAccessors: ['g'],
        yScaleToDataExtent: false,
        data: BARCHART_1Y1G,
      };
      const bars2: BarSeriesSpec = {
        chartType: ChartTypes.XYAxis,
        specType: SpecTypes.Series,
        id: 'bars2',
        groupId: 'group2',
        seriesType: SeriesTypes.Bar,
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Linear,
        xAccessor: 'x',
        yAccessors: ['y'],
        splitSeriesAccessors: ['g'],
        yScaleToDataExtent: false,
        data: BARCHART_1Y1G,
      };
      const bars3: BarSeriesSpec = {
        chartType: ChartTypes.XYAxis,
        specType: SpecTypes.Series,
        id: 'bars3',
        groupId: 'group2',
        seriesType: SeriesTypes.Bar,
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Linear,
        xAccessor: 'x',
        yAccessors: ['y'],
        splitSeriesAccessors: ['g'],
        yScaleToDataExtent: false,
        data: BARCHART_1Y1G,
      };
      const seriesSpecs: BasicSeriesSpec[] = [bars1, bars2, bars3];
      const axesSpecs: AxisSpec[] = [];
      const chartRotation = 0;
      const chartDimensions = { width: 100, height: 100, top: 0, left: 0 };
      const chartColors = {
        vizColors: ['violet', 'green', 'blue'],
        defaultVizColor: 'red',
      };
      const chartTheme = { ...LIGHT_THEME, colors: chartColors };
      const domainsByGroupId = mergeYCustomDomainsByGroupId(axesSpecs, chartRotation);
      const seriesDomains = computeSeriesDomains(seriesSpecs, domainsByGroupId, undefined);
      const seriesColorMap = getSeriesColors(
        seriesDomains.seriesCollection,
        chartColors,
        new Map(),
        emptySeriesOverrides,
      );
      const geometries = computeSeriesGeometries(
        seriesSpecs,
        seriesDomains.xDomain,
        seriesDomains.yDomain,
        seriesDomains.formattedDataSeries,
        seriesColorMap,
        chartTheme,
        chartDimensions,
        chartRotation,
        axesSpecs,
        false,
      );
      expect(geometries.geometriesCounts.bars).toBe(24);
      expect(geometries.geometriesCounts.linePoints).toBe(0);
      expect(geometries.geometriesCounts.areasPoints).toBe(0);
      expect(geometries.geometriesCounts.lines).toBe(0);
      expect(geometries.geometriesCounts.areas).toBe(0);
    });
    test('can compute the bar offset in mixed charts', () => {
      const line1: LineSeriesSpec = {
        chartType: ChartTypes.XYAxis,
        specType: SpecTypes.Series,
        id: 'line1',
        groupId: 'group2',
        seriesType: SeriesTypes.Line,
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Linear,
        xAccessor: 'x',
        yAccessors: ['y'],
        splitSeriesAccessors: ['g'],
        yScaleToDataExtent: false,
        data: BARCHART_1Y1G,
      };
      const bar1: BarSeriesSpec = {
        chartType: ChartTypes.XYAxis,
        specType: SpecTypes.Series,
        id: 'line3',
        groupId: 'group2',
        seriesType: SeriesTypes.Bar,
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Linear,
        xAccessor: 'x',
        yAccessors: ['y'],
        splitSeriesAccessors: ['g'],
        yScaleToDataExtent: false,
        data: BARCHART_1Y1G,
      };
      const seriesSpecs: BasicSeriesSpec[] = [line1, bar1];
      const axesSpecs: AxisSpec[] = [];
      const chartRotation = 0;
      const chartDimensions = { width: 100, height: 100, top: 0, left: 0 };
      const chartColors = {
        vizColors: ['violet', 'green', 'blue'],
        defaultVizColor: 'red',
      };
      const chartTheme = {
        ...LIGHT_THEME,
        scales: {
          barsPadding: 0,
          histogramPadding: 0,
        },
      };
      const domainsByGroupId = mergeYCustomDomainsByGroupId(axesSpecs, chartRotation);
      const seriesDomains = computeSeriesDomains(seriesSpecs, domainsByGroupId, undefined);
      const seriesColorMap = getSeriesColors(
        seriesDomains.seriesCollection,
        chartColors,
        new Map(),
        emptySeriesOverrides,
      );
      const geometries = computeSeriesGeometries(
        seriesSpecs,
        seriesDomains.xDomain,
        seriesDomains.yDomain,
        seriesDomains.formattedDataSeries,
        seriesColorMap,
        chartTheme,
        chartDimensions,
        chartRotation,
        axesSpecs,
        false,
      );
      expect(geometries.geometries.bars[0].x).toBe(0);
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
        value: { x: 0, y: 5, accessor: BandedAccessorType.Y1 },
        transform: { x: 0, y: 0 },
        seriesIdentifier: {
          specId: 'line1',
          yAccessor: 'y1',
          splitAccessors: new Map(),
          seriesKeys: [],
          key: '',
        },
      },
    ]);
    const map2 = new Map<string, IndexedGeometry[]>();
    map2.set('a', [
      {
        radius: 10,
        x: 0,
        y: 175.8,
        color: '#2B70F7',
        value: { x: 0, y: 2, accessor: BandedAccessorType.Y1 },
        transform: { x: 0, y: 0 },
        seriesIdentifier: {
          specId: 'line2',
          yAccessor: 'y1',
          splitAccessors: new Map(),
          seriesKeys: [],
          key: '',
        },
      },
    ]);
    const merged = mergeGeometriesIndexes(map1, map2);
    expect(merged.get('a')).toBeDefined();
    expect(merged.get('a')?.length).toBe(2);
  });
  test('can compute xScaleOffset dependent on histogram mode', () => {
    const domain = [0, 10];
    const range: [number, number] = [0, 100];
    const bandwidth = 10;
    const barsPadding = 0.5;
    const scale = new ScaleContinuous(
      {
        type: ScaleType.Linear,
        domain,
        range,
      },
      { bandwidth, minInterval: 0, timeZone: 'utc', totalBarsInCluster: 1, barsPadding },
    );
    const histogramModeEnabled = true;
    const histogramModeDisabled = false;
    expect(computeXScaleOffset(scale, histogramModeDisabled)).toBe(0);
    // default alignment (start)
    expect(computeXScaleOffset(scale, histogramModeEnabled)).toBe(5);
    expect(computeXScaleOffset(scale, histogramModeEnabled, HistogramModeAlignments.Center)).toBe(0);
    expect(computeXScaleOffset(scale, histogramModeEnabled, HistogramModeAlignments.End)).toBe(-5);
  });
  test('can determine if histogram mode is enabled', () => {
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
      yScaleToDataExtent: false,
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
      yScaleToDataExtent: false,
      data: BARCHART_1Y1G,
    };
    const basicBar: BarSeriesSpec = {
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
      yScaleToDataExtent: false,
      data: BARCHART_1Y1G,
    };
    const histogramBar: BarSeriesSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Series,
      id: 'histo',
      groupId: 'group2',
      seriesType: SeriesTypes.Bar,
      yScaleType: ScaleType.Log,
      xScaleType: ScaleType.Linear,
      xAccessor: 'x',
      yAccessors: ['y'],
      splitSeriesAccessors: ['g'],
      stackAccessors: ['x'],
      yScaleToDataExtent: false,
      data: BARCHART_1Y1G,
      enableHistogramMode: true,
    };
    let seriesMap: BasicSeriesSpec[] = [area, line, basicBar, histogramBar];

    expect(isHistogramModeEnabled(seriesMap)).toBe(true);

    seriesMap = [area, line, basicBar];
    expect(isHistogramModeEnabled(seriesMap)).toBe(false);

    seriesMap = [area, line];
    expect(isHistogramModeEnabled(seriesMap)).toBe(false);
  });
  test('can set the bar series accessors dependent on histogram mode', () => {
    const isNotHistogramEnabled = false;
    const isHistogramEnabled = true;
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
      yScaleToDataExtent: false,
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
      yScaleToDataExtent: false,
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
      stackAccessors: ['foo'],
      yScaleToDataExtent: false,
      data: BARCHART_1Y1G,
    };
    const seriesMap = new Map<SpecId, BasicSeriesSpec>([
      [area.id, area],
      [line.id, line],
    ]);
    // should not affect area or line series
    setBarSeriesAccessors(isHistogramEnabled, seriesMap);
    expect(seriesMap).toEqual(seriesMap);
    // add bar series, histogram mode not enabled
    seriesMap.set(bar.id, bar);
    setBarSeriesAccessors(isNotHistogramEnabled, seriesMap);
    // histogram mode
    setBarSeriesAccessors(isHistogramEnabled, seriesMap);
    expect(bar.stackAccessors).toEqual(['foo', 'g']);
    // add another bar
    const bar2: BarSeriesSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Series,
      id: 'bar2',
      groupId: 'group2',
      seriesType: SeriesTypes.Bar,
      yScaleType: ScaleType.Log,
      xScaleType: ScaleType.Linear,
      xAccessor: 'x',
      yAccessors: ['y'],
      splitSeriesAccessors: ['bar'],
      yScaleToDataExtent: false,
      data: BARCHART_1Y1G,
    };
    seriesMap.set(bar2.id, bar2);
    setBarSeriesAccessors(isHistogramEnabled, seriesMap);
    expect(bar2.stackAccessors).toEqual(['y', 'bar']);
  });
  test('displays no data availble if chart is empty', () => {
    const legendItems1: LegendItem[] = [
      {
        color: '#1EA593',
        label: 'a',
        seriesIdentifier: {
          key: 'specId:{bars},colors:{a}',
          specId: 'bars',
        },
        defaultExtra: { raw: 6, formatted: '6.00' },
        isSeriesHidden: true,
      },
      {
        color: '#2B70F7',
        label: 'b',
        seriesIdentifier: {
          key: 'specId:{bars},colors:{b}',
          specId: 'bars',
        },
        defaultExtra: { raw: 2, formatted: '2.00' },
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
        defaultExtra: { raw: 6, formatted: '6.00' },
        isSeriesHidden: false,
      },
      {
        color: '#2B70F7',
        label: 'b',
        seriesIdentifier: {
          key: 'specId:{bars},colors:{b}',
          specId: 'bars',
        },
        defaultExtra: { raw: 2, formatted: '2.00' },
        isSeriesHidden: true,
      },
    ];
    expect(isAllSeriesDeselected(legendItems2)).toBe(false);
  });
});
