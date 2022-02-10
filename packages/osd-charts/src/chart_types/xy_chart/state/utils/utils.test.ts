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

// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable jest/no-conditional-expect */

import { MockDataSeries } from '../../../../mocks/series/series';
import { MockSeriesSpec, MockGlobalSpec } from '../../../../mocks/specs';
import { MockStore } from '../../../../mocks/store';
import { SeededDataGenerator } from '../../../../mocks/utils';
import { MockXDomain, MockYDomain } from '../../../../mocks/xy/domains';
import { ScaleContinuous } from '../../../../scales';
import { ScaleType } from '../../../../scales/constants';
import { Spec } from '../../../../specs';
import { BARCHART_1Y0G, BARCHART_1Y1G } from '../../../../utils/data_samples/test_dataset';
import { ContinuousDomain, Range } from '../../../../utils/domain';
import { SpecId } from '../../../../utils/ids';
import { PointShape } from '../../../../utils/themes/theme';
import { getSeriesIndex, XYChartSeriesIdentifier } from '../../utils/series';
import { BasicSeriesSpec, HistogramModeAlignments, SeriesColorAccessorFn } from '../../utils/specs';
import { computeSeriesDomainsSelector } from '../selectors/compute_series_domains';
import { computeSeriesGeometriesSelector } from '../selectors/compute_series_geometries';
import { getScaleConfigsFromSpecs } from '../selectors/get_api_scale_configs';
import {
  computeSeriesDomains,
  computeXScaleOffset,
  isHistogramModeEnabled,
  setBarSeriesAccessors,
  getCustomSeriesColors,
} from './utils';

function getGeometriesFromSpecs(specs: Spec[]) {
  const store = MockStore.default({ width: 100, height: 100, top: 0, left: 0 });
  const settings = MockGlobalSpec.settingsNoMargins({
    theme: {
      colors: {
        vizColors: ['violet', 'green', 'blue'],
        defaultVizColor: 'red',
      },
    },
  });
  MockStore.addSpecs([...specs, settings], store);
  return computeSeriesGeometriesSelector(store.getState());
}

describe('Chart State utils', () => {
  it('should compute and format specifications for non stacked chart', () => {
    const spec1 = MockSeriesSpec.line({
      id: 'spec1',
      groupId: 'group1',
      yScaleType: ScaleType.Log,
      xScaleType: ScaleType.Linear,
      xAccessor: 'x',
      yAccessors: ['y'],
      data: BARCHART_1Y0G,
    });
    const spec2 = MockSeriesSpec.line({
      id: 'spec2',
      groupId: 'group2',
      yScaleType: ScaleType.Log,
      xScaleType: ScaleType.Linear,
      xAccessor: 'x',
      yAccessors: ['y'],
      data: BARCHART_1Y0G,
    });
    const scaleConfig = getScaleConfigsFromSpecs([], [spec1, spec2], MockGlobalSpec.settings());
    const domains = computeSeriesDomains([spec1, spec2], scaleConfig);
    expect(domains.xDomain).toEqual(
      MockXDomain.fromScaleType(ScaleType.Linear, {
        domain: [0, 3],
        isBandScale: false,
        minInterval: 1,
      }),
    );
    expect(domains.yDomains).toEqual([
      MockYDomain.fromScaleType(ScaleType.Log, {
        domain: [0, 10],
        groupId: 'group1',
        isBandScale: false,
        logBase: undefined,
        logMinLimit: undefined,
      }),
      MockYDomain.fromScaleType(ScaleType.Log, {
        domain: [0, 10],
        groupId: 'group2',
        isBandScale: false,
        logBase: undefined,
        logMinLimit: undefined,
      }),
    ]);
    expect(domains.formattedDataSeries).toMatchSnapshot();
  });
  it('should compute and format specifications for stacked chart', () => {
    const spec1 = MockSeriesSpec.line({
      id: 'spec1',
      groupId: 'group1',
      yScaleType: ScaleType.Log,
      xScaleType: ScaleType.Linear,
      xAccessor: 'x',
      yAccessors: ['y'],
      splitSeriesAccessors: ['g'],
      data: BARCHART_1Y1G,
    });
    const spec2 = MockSeriesSpec.line({
      id: 'spec2',
      groupId: 'group2',
      yScaleType: ScaleType.Log,
      xScaleType: ScaleType.Linear,
      xAccessor: 'x',
      yAccessors: ['y'],
      splitSeriesAccessors: ['g'],
      stackAccessors: ['x'],
      data: BARCHART_1Y1G,
    });
    const scaleConfig = getScaleConfigsFromSpecs([], [spec1, spec2], MockGlobalSpec.settings());
    const domains = computeSeriesDomains([spec1, spec2], scaleConfig);
    expect(domains.xDomain).toEqual(
      MockXDomain.fromScaleType(ScaleType.Linear, {
        domain: [0, 3],
        isBandScale: false,
        minInterval: 1,
      }),
    );
    expect(domains.yDomains).toEqual([
      MockYDomain.fromScaleType(ScaleType.Log, {
        domain: [0, 5],
        groupId: 'group1',
        isBandScale: false,
        logBase: undefined,
        logMinLimit: undefined,
      }),
      MockYDomain.fromScaleType(ScaleType.Log, {
        domain: [0, 9],
        groupId: 'group2',
        isBandScale: false,
        logBase: undefined,
        logMinLimit: undefined,
      }),
    ]);
    expect(domains.formattedDataSeries.filter(({ isStacked }) => isStacked)).toMatchSnapshot();
    expect(domains.formattedDataSeries.filter(({ isStacked }) => !isStacked)).toMatchSnapshot();
  });
  it('should check if a SeriesCollectionValue item exists in a list of SeriesCollectionValue', () => {
    const dataSeriesValuesA: XYChartSeriesIdentifier = {
      specId: 'a',
      yAccessor: 'y1',
      splitAccessors: new Map(),
      seriesKeys: ['a', 'b', 'c'],
      key: 'a',
    };
    const dataSeriesValuesB: XYChartSeriesIdentifier = {
      specId: 'b',
      yAccessor: 'y1',
      splitAccessors: new Map(),
      seriesKeys: ['a', 'b', 'c'],
      key: 'b',
    };
    const dataSeriesValuesC: XYChartSeriesIdentifier = {
      specId: 'c',
      yAccessor: 'y1',
      splitAccessors: new Map(),
      seriesKeys: ['a', 'b', 'd'],
      key: 'c',
    };
    const deselectedSeries = [dataSeriesValuesA, dataSeriesValuesB];
    expect(getSeriesIndex(deselectedSeries, dataSeriesValuesA)).toBe(0);
    expect(getSeriesIndex(deselectedSeries, dataSeriesValuesC)).toBe(-1);
    expect(getSeriesIndex([], dataSeriesValuesA)).toBe(-1);
  });

  describe('getCustomSeriesColors', () => {
    const specId1 = 'bar1';
    const specId2 = 'bar2';
    const dg = new SeededDataGenerator();
    const data = dg.generateGroupedSeries(50, 4);
    const targetKey = 'groupId{__global__}spec{bar1}yAccessor{y}splitAccessors{g-b}';

    describe('empty series collection and specs', () => {
      it('should return an empty map', () => {
        const actual = getCustomSeriesColors(MockDataSeries.empty());

        expect(actual.size).toBe(0);
      });
    });

    describe('series collection is not empty', () => {
      it('should return an empty map if no color', () => {
        const barSpec1 = MockSeriesSpec.bar({ id: specId1, data, splitSeriesAccessors: ['g'] });
        const barSpec2 = MockSeriesSpec.bar({ id: specId2, data, splitSeriesAccessors: ['g'] });
        const store = MockStore.default();
        MockStore.addSpecs([barSpec1, barSpec2], store);
        const { formattedDataSeries } = computeSeriesDomainsSelector(store.getState());
        const actual = getCustomSeriesColors(formattedDataSeries);

        expect(actual.size).toBe(0);
      });

      it('should return string color value', () => {
        const color = 'green';
        const barSpec1 = MockSeriesSpec.bar({ id: specId1, data, color });
        const barSpec2 = MockSeriesSpec.bar({ id: specId2, data });
        const store = MockStore.default();
        MockStore.addSpecs([barSpec1, barSpec2], store);
        const { formattedDataSeries } = computeSeriesDomainsSelector(store.getState());
        const actual = getCustomSeriesColors(formattedDataSeries);

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
        const store = MockStore.default();
        MockStore.addSpecs([barSpec1, barSpec2], store);
        const { formattedDataSeries } = computeSeriesDomainsSelector(store.getState());

        it('should return color from color array', () => {
          const actual = getCustomSeriesColors(formattedDataSeries);

          expect(actual.size).toBe(4);
          formattedDataSeries.forEach(({ specId, key }) => {
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
        const store = MockStore.default();
        MockStore.addSpecs([barSpec1, barSpec2], store);
        const { formattedDataSeries } = computeSeriesDomainsSelector(store.getState());

        it('should return color from color function', () => {
          const actual = getCustomSeriesColors(formattedDataSeries);
          expect(actual.size).toBe(1);
          expect(actual.get(targetKey)).toBe('aquamarine');
        });
      });
    });
  });

  describe('Geometries counts', () => {
    test('can compute stacked geometries counts', () => {
      const area = MockSeriesSpec.area({
        id: 'area',
        groupId: 'group1',
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Linear,
        xAccessor: 'x',
        yAccessors: ['y'],
        splitSeriesAccessors: ['g'],
        data: BARCHART_1Y1G,
      });
      const line = MockSeriesSpec.line({
        id: 'line',
        groupId: 'group2',
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Linear,
        xAccessor: 'x',
        yAccessors: ['y'],
        splitSeriesAccessors: ['g'],
        stackAccessors: ['x'],
        data: BARCHART_1Y1G,
      });
      const bar = MockSeriesSpec.bar({
        id: 'bar',
        groupId: 'group2',
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Linear,
        xAccessor: 'x',
        yAccessors: ['y'],
        splitSeriesAccessors: ['g'],
        stackAccessors: ['x'],
        data: BARCHART_1Y1G,
      });
      const geometries = getGeometriesFromSpecs([area, line, bar]);

      expect(geometries.geometriesCounts.bars).toBe(8);
      expect(geometries.geometriesCounts.linePoints).toBe(8);
      expect(geometries.geometriesCounts.areasPoints).toBe(8);
      expect(geometries.geometriesCounts.lines).toBe(2);
      expect(geometries.geometriesCounts.areas).toBe(2);
    });

    test('can compute non stacked geometries indexes', () => {
      const line1 = MockSeriesSpec.line({
        id: 'line1',
        groupId: 'group1',
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Ordinal,
        xAccessor: 'x',
        yAccessors: ['y'],
        data: BARCHART_1Y0G,
      });
      const line2 = MockSeriesSpec.line({
        id: 'line2',
        groupId: 'group2',
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Ordinal,
        xAccessor: 'x',
        yAccessors: ['y'],
        data: BARCHART_1Y0G,
      });
      const geometries = getGeometriesFromSpecs([line1, line2]);

      expect(geometries.geometriesIndex.size).toBe(4);
      expect(geometries.geometriesIndex.find(0)?.length).toBe(2);
      expect(geometries.geometriesIndex.find(1)?.length).toBe(2);
      expect(geometries.geometriesIndex.find(2)?.length).toBe(2);
      expect(geometries.geometriesIndex.find(3)?.length).toBe(2);
    });

    test('can compute stacked geometries indexes', () => {
      const line1 = MockSeriesSpec.line({
        id: 'line1',
        groupId: 'group1',
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Ordinal,
        xAccessor: 'x',
        yAccessors: ['y'],
        stackAccessors: ['x'],
        data: BARCHART_1Y0G,
      });
      const line2 = MockSeriesSpec.line({
        id: 'line2',
        groupId: 'group2',
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Ordinal,
        xAccessor: 'x',
        yAccessors: ['y'],
        stackAccessors: ['x'],
        data: BARCHART_1Y0G,
      });

      const geometries = getGeometriesFromSpecs([line1, line2]);

      expect(geometries.geometriesIndex.size).toBe(4);
      expect(geometries.geometriesIndex.find(0)?.length).toBe(2);
      expect(geometries.geometriesIndex.find(1)?.length).toBe(2);
      expect(geometries.geometriesIndex.find(2)?.length).toBe(2);
      expect(geometries.geometriesIndex.find(3)?.length).toBe(2);
    });

    test('can compute non stacked geometries counts', () => {
      const area = MockSeriesSpec.area({
        id: 'area',
        groupId: 'group1',
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Linear,
        xAccessor: 'x',
        yAccessors: ['y'],
        splitSeriesAccessors: ['g'],
        data: BARCHART_1Y1G,
      });
      const line = MockSeriesSpec.line({
        id: 'line',
        groupId: 'group2',
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Linear,
        xAccessor: 'x',
        yAccessors: ['y'],
        splitSeriesAccessors: ['g'],
        data: BARCHART_1Y1G,
      });
      const bar = MockSeriesSpec.bar({
        id: 'bar',
        groupId: 'group2',
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Linear,
        xAccessor: 'x',
        yAccessors: ['y'],
        splitSeriesAccessors: ['g'],
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
      });
      const geometries = getGeometriesFromSpecs([area, line, bar]);

      expect(geometries.geometriesCounts.bars).toBe(8);
      expect(geometries.geometriesCounts.linePoints).toBe(8);
      expect(geometries.geometriesCounts.areasPoints).toBe(8);
      expect(geometries.geometriesCounts.lines).toBe(2);
      expect(geometries.geometriesCounts.areas).toBe(2);
    });
    test('can compute line geometries counts', () => {
      const line1 = MockSeriesSpec.line({
        id: 'line1',
        groupId: 'group2',
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Linear,
        xAccessor: 'x',
        yAccessors: ['y'],
        splitSeriesAccessors: ['g'],
        data: BARCHART_1Y1G,
      });
      const line2 = MockSeriesSpec.line({
        id: 'line2',
        groupId: 'group2',
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Linear,
        xAccessor: 'x',
        yAccessors: ['y'],
        splitSeriesAccessors: ['g'],
        data: BARCHART_1Y1G,
      });
      const line3 = MockSeriesSpec.line({
        id: 'line3',
        groupId: 'group2',
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Linear,
        xAccessor: 'x',
        yAccessors: ['y'],
        splitSeriesAccessors: ['g'],
        data: BARCHART_1Y1G,
      });

      const geometries = getGeometriesFromSpecs([line1, line2, line3]);

      expect(geometries.geometriesCounts.bars).toBe(0);
      expect(geometries.geometriesCounts.linePoints).toBe(24);
      expect(geometries.geometriesCounts.areasPoints).toBe(0);
      expect(geometries.geometriesCounts.lines).toBe(6);
      expect(geometries.geometriesCounts.areas).toBe(0);
    });
    test('can compute area geometries counts', () => {
      const area1 = MockSeriesSpec.area({
        id: 'area1',
        groupId: 'group2',
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Linear,
        xAccessor: 'x',
        yAccessors: ['y'],
        splitSeriesAccessors: ['g'],
        data: BARCHART_1Y1G,
      });
      const area2 = MockSeriesSpec.area({
        id: 'area2',
        groupId: 'group2',
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Linear,
        xAccessor: 'x',
        yAccessors: ['y'],
        splitSeriesAccessors: ['g'],
        data: BARCHART_1Y1G,
      });
      const area3 = MockSeriesSpec.area({
        id: 'area3',
        groupId: 'group2',
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Linear,
        xAccessor: 'x',
        yAccessors: ['y'],
        splitSeriesAccessors: ['g'],
        data: BARCHART_1Y1G,
      });

      const geometries = getGeometriesFromSpecs([area1, area2, area3]);

      expect(geometries.geometriesCounts.bars).toBe(0);
      expect(geometries.geometriesCounts.linePoints).toBe(0);
      expect(geometries.geometriesCounts.areasPoints).toBe(24);
      expect(geometries.geometriesCounts.lines).toBe(0);
      expect(geometries.geometriesCounts.areas).toBe(6);
    });
    test('can compute line geometries with custom style', () => {
      const line1 = MockSeriesSpec.line({
        id: 'line1',
        groupId: 'group2',
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Linear,
        xAccessor: 'x',
        yAccessors: ['y'],
        splitSeriesAccessors: ['g'],
        lineSeriesStyle: {
          line: {
            strokeWidth: 100,
          },
          point: {
            fill: 'green',
          },
        },
        data: BARCHART_1Y1G,
      });
      const line2 = MockSeriesSpec.line({
        id: 'line2',
        groupId: 'group2',
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Linear,
        xAccessor: 'x',
        yAccessors: ['y'],
        splitSeriesAccessors: ['g'],
        data: BARCHART_1Y1G,
      });
      const line3 = MockSeriesSpec.line({
        id: 'line3',
        groupId: 'group2',
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Linear,
        xAccessor: 'x',
        yAccessors: ['y'],
        splitSeriesAccessors: ['g'],
        data: BARCHART_1Y1G,
      });

      const geometries = getGeometriesFromSpecs([line1, line2, line3]);

      expect(geometries.geometries.lines[0].value.color).toBe('violet');
      expect(geometries.geometries.lines[0].value.seriesLineStyle).toEqual({
        visible: true,
        strokeWidth: 100, // the override strokeWidth
        opacity: 1,
      });
      expect(geometries.geometries.lines[0].value.seriesPointStyle).toEqual({
        visible: true,
        fill: 'green', // the override strokeWidth
        opacity: 1,
        radius: 2,
        strokeWidth: 1,
        shape: PointShape.Circle,
      });
    });
    test('can compute area geometries with custom style', () => {
      const area1 = MockSeriesSpec.area({
        id: 'area1',
        groupId: 'group2',
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Linear,
        xAccessor: 'x',
        yAccessors: ['y'],
        splitSeriesAccessors: ['g'],
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
      });
      const area2 = MockSeriesSpec.area({
        id: 'area2',
        groupId: 'group2',
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Linear,
        xAccessor: 'x',
        yAccessors: ['y'],
        splitSeriesAccessors: ['g'],
        data: BARCHART_1Y1G,
      });
      const area3 = MockSeriesSpec.area({
        id: 'area3',
        groupId: 'group2',
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Linear,
        xAccessor: 'x',
        yAccessors: ['y'],
        splitSeriesAccessors: ['g'],
        data: BARCHART_1Y1G,
      });

      const geometries = getGeometriesFromSpecs([area1, area2, area3]);

      expect(geometries.geometries.areas[0].value.color).toBe('violet');
      expect(geometries.geometries.areas[0].value.seriesAreaStyle).toEqual({
        visible: true,
        fill: 'area-fill-custom-color',
        opacity: 0.2,
      });
      expect(geometries.geometries.areas[0].value.seriesAreaLineStyle).toEqual({
        visible: true,
        strokeWidth: 100,
        opacity: 1,
      });
      expect(geometries.geometries.areas[0].value.seriesPointStyle).toEqual({
        visible: false,
        fill: 'point-fill-custom-color', // the override strokeWidth
        opacity: 1,
        radius: 2,
        strokeWidth: 1,
        shape: PointShape.Circle,
      });
    });
    test('can compute bars geometries counts', () => {
      const bars1 = MockSeriesSpec.bar({
        id: 'bars1',
        groupId: 'group2',
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Linear,
        xAccessor: 'x',
        yAccessors: ['y'],
        splitSeriesAccessors: ['g'],
        data: BARCHART_1Y1G,
      });
      const bars2 = MockSeriesSpec.bar({
        id: 'bars2',
        groupId: 'group2',
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Linear,
        xAccessor: 'x',
        yAccessors: ['y'],
        splitSeriesAccessors: ['g'],
        data: BARCHART_1Y1G,
      });
      const bars3 = MockSeriesSpec.bar({
        id: 'bars3',
        groupId: 'group2',
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Linear,
        xAccessor: 'x',
        yAccessors: ['y'],
        splitSeriesAccessors: ['g'],
        data: BARCHART_1Y1G,
      });

      const geometries = getGeometriesFromSpecs([bars1, bars2, bars3]);

      expect(geometries.geometriesCounts.bars).toBe(24);
      expect(geometries.geometriesCounts.linePoints).toBe(0);
      expect(geometries.geometriesCounts.areasPoints).toBe(0);
      expect(geometries.geometriesCounts.lines).toBe(0);
      expect(geometries.geometriesCounts.areas).toBe(0);
    });
    test('can compute the bar offset in mixed charts', () => {
      const line1 = MockSeriesSpec.line({
        id: 'line1',
        groupId: 'group2',
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Linear,
        xAccessor: 'x',
        yAccessors: ['y'],
        splitSeriesAccessors: ['g'],
        data: BARCHART_1Y1G,
      });
      const bar1 = MockSeriesSpec.bar({
        id: 'line3',
        groupId: 'group2',
        yScaleType: ScaleType.Log,
        xScaleType: ScaleType.Linear,
        xAccessor: 'x',
        yAccessors: ['y'],
        splitSeriesAccessors: ['g'],
        data: BARCHART_1Y1G,
      });

      const geometries = getGeometriesFromSpecs([line1, bar1]);

      expect(geometries.geometries.bars[0].value[0].x).toBe(0);
    });
  });

  test('can compute xScaleOffset dependent on histogram mode', () => {
    const domain: ContinuousDomain = [0, 10];
    const range: Range = [0, 100];
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
    const area = MockSeriesSpec.area({
      id: 'area',
      groupId: 'group1',
      yScaleType: ScaleType.Log,
      xScaleType: ScaleType.Linear,
      xAccessor: 'x',
      yAccessors: ['y'],
      splitSeriesAccessors: ['g'],
      data: BARCHART_1Y1G,
    });
    const line = MockSeriesSpec.line({
      id: 'line',
      groupId: 'group2',
      yScaleType: ScaleType.Log,
      xScaleType: ScaleType.Linear,
      xAccessor: 'x',
      yAccessors: ['y'],
      splitSeriesAccessors: ['g'],
      stackAccessors: ['x'],
      data: BARCHART_1Y1G,
    });
    const basicBar = MockSeriesSpec.bar({
      id: 'bar',
      groupId: 'group2',
      yScaleType: ScaleType.Log,
      xScaleType: ScaleType.Linear,
      xAccessor: 'x',
      yAccessors: ['y'],
      splitSeriesAccessors: ['g'],
      stackAccessors: ['x'],
      data: BARCHART_1Y1G,
    });
    const histogramBar = MockSeriesSpec.histogramBar({
      id: 'histogram',
      groupId: 'group2',
      yScaleType: ScaleType.Log,
      xScaleType: ScaleType.Linear,
      xAccessor: 'x',
      yAccessors: ['y'],
      splitSeriesAccessors: ['g'],
      data: BARCHART_1Y1G,
    });
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
    const area = MockSeriesSpec.area({
      id: 'area',
      groupId: 'group1',
      yScaleType: ScaleType.Log,
      xScaleType: ScaleType.Linear,
      xAccessor: 'x',
      yAccessors: ['y'],
      splitSeriesAccessors: ['g'],
      data: BARCHART_1Y1G,
    });
    const line = MockSeriesSpec.line({
      id: 'line',
      groupId: 'group2',
      yScaleType: ScaleType.Log,
      xScaleType: ScaleType.Linear,
      xAccessor: 'x',
      yAccessors: ['y'],
      splitSeriesAccessors: ['g'],
      stackAccessors: ['x'],
      data: BARCHART_1Y1G,
    });
    const bar = MockSeriesSpec.bar({
      id: 'bar',
      groupId: 'group2',
      yScaleType: ScaleType.Log,
      xScaleType: ScaleType.Linear,
      xAccessor: 'x',
      yAccessors: ['y'],
      splitSeriesAccessors: ['g'],
      stackAccessors: ['foo'],
      data: BARCHART_1Y1G,
    });
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
    const bar2 = MockSeriesSpec.bar({
      id: 'bar2',
      groupId: 'group2',
      yScaleType: ScaleType.Log,
      xScaleType: ScaleType.Linear,
      xAccessor: 'x',
      yAccessors: ['y'],
      splitSeriesAccessors: ['bar'],
      data: BARCHART_1Y1G,
    });
    seriesMap.set(bar2.id, bar2);
    setBarSeriesAccessors(isHistogramEnabled, seriesMap);
    expect(bar2.stackAccessors).toEqual(['y', 'bar']);
  });
});
