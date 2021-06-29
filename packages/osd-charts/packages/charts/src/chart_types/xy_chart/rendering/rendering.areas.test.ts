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

import { Store } from 'redux';

import { MockGlobalSpec, MockSeriesSpec } from '../../../mocks/specs';
import { MockStore } from '../../../mocks/store';
import { ScaleType } from '../../../scales/constants';
import { Spec } from '../../../specs';
import { GlobalChartState } from '../../../state/chart_state';
import { PointGeometry, AreaGeometry } from '../../../utils/geometry';
import { LIGHT_THEME } from '../../../utils/themes/light_theme';
import { computeSeriesDomainsSelector } from '../state/selectors/compute_series_domains';
import { computeSeriesGeometriesSelector } from '../state/selectors/compute_series_geometries';
import { ComputedGeometries } from '../state/utils/types';
import { IndexedGeometryMap } from '../utils/indexed_geometry_map';
import { AreaSeriesSpec, StackMode } from '../utils/specs';

const SPEC_ID = 'spec_1';
const GROUP_ID = 'group_1';

function initStore(specs: Spec[], vizColors: string[] = ['red'], width = 100): Store<GlobalChartState> {
  const store = MockStore.default({ width, height: 100, top: 0, left: 0 });
  MockStore.addSpecs(
    [
      ...specs,
      MockGlobalSpec.settingsNoMargins({
        theme: {
          colors: {
            vizColors,
          },
        },
      }),
    ],
    store,
  );
  return store;
}

describe('Rendering points - areas', () => {
  test('Missing geometry if no data', () => {
    const store = initStore([
      MockSeriesSpec.area({
        id: SPEC_ID,
        groupId: GROUP_ID,
        xScaleType: ScaleType.Ordinal,
        yScaleType: ScaleType.Linear,
        xAccessor: 0,
        yAccessors: [1],
        data: [],
      }),
    ]);
    const {
      geometries: { areas },
    } = computeSeriesGeometriesSelector(store.getState());
    expect(areas).toHaveLength(0);
  });
  describe('Single series area chart - ordinal', () => {
    let areaGeometry: AreaGeometry;
    let geometriesIndex: IndexedGeometryMap;
    beforeEach(() => {
      const store = initStore([
        MockSeriesSpec.area({
          id: SPEC_ID,
          groupId: GROUP_ID,
          xScaleType: ScaleType.Ordinal,
          yScaleType: ScaleType.Linear,
          xAccessor: 0,
          yAccessors: [1],
          data: [
            [0, 10],
            [1, 5],
          ],
        }),
      ]);
      const geometries = computeSeriesGeometriesSelector(store.getState());
      [{ value: areaGeometry }] = geometries.geometries.areas;
      geometriesIndex = geometries.geometriesIndex;
    });
    test('Can render an line and area paths', () => {
      const { lines, area, color, seriesIdentifier, transform } = areaGeometry;
      expect(lines[0]).toBe('M0,0L50,50');
      expect(area).toBe('M0,0L50,50L50,100L0,100Z');
      expect(color).toBe('red');
      expect(seriesIdentifier.seriesKeys).toEqual([1]);
      expect(seriesIdentifier.specId).toEqual(SPEC_ID);
      expect(transform).toEqual({ x: 25, y: 0 });
    });

    test('Can render two points', () => {
      const { points } = areaGeometry;
      expect(points).toMatchSnapshot();
      expect(geometriesIndex.size).toEqual(points.length);
    });
  });
  describe('Multi series area chart - ordinal', () => {
    let geometries: ComputedGeometries;
    beforeEach(() => {
      const store = initStore(
        [
          MockSeriesSpec.area({
            id: 'spec_1',
            groupId: GROUP_ID,
            xScaleType: ScaleType.Ordinal,
            yScaleType: ScaleType.Linear,
            xAccessor: 0,
            yAccessors: [1],
            data: [
              [0, 10],
              [1, 5],
            ],
          }),
          MockSeriesSpec.area({
            id: 'spec_2',
            groupId: GROUP_ID,
            xScaleType: ScaleType.Ordinal,
            yScaleType: ScaleType.Linear,
            xAccessor: 0,
            yAccessors: [1],
            data: [
              [0, 20],
              [1, 10],
            ],
          }),
        ],
        ['red', 'blue'],
      );
      geometries = computeSeriesGeometriesSelector(store.getState());
    });

    test('Can render two ordinal areas', () => {
      const { areas } = geometries.geometries;
      const [{ value: firstArea }, { value: secondArea }] = areas;
      expect(firstArea.lines[0]).toBe('M0,50L50,75');
      expect(firstArea.area).toBe('M0,50L50,75L50,100L0,100Z');
      expect(firstArea.color).toBe('red');
      expect(firstArea.seriesIdentifier.seriesKeys).toEqual([1]);
      expect(firstArea.seriesIdentifier.specId).toEqual('spec_1');
      expect(firstArea.transform).toEqual({ x: 25, y: 0 });

      expect(secondArea.lines[0]).toBe('M0,0L50,50');
      expect(secondArea.area).toBe('M0,0L50,50L50,100L0,100Z');
      expect(secondArea.color).toBe('blue');
      expect(secondArea.seriesIdentifier.seriesKeys).toEqual([1]);
      expect(secondArea.seriesIdentifier.specId).toEqual('spec_2');
      expect(secondArea.transform).toEqual({ x: 25, y: 0 });
    });
    test('can render first spec points', () => {
      const { areas } = geometries.geometries;
      const [{ value: firstArea }] = areas;
      expect(firstArea.points.length).toEqual(2);
      expect(firstArea.points).toMatchSnapshot();
    });
    test('can render second spec points', () => {
      const { areas } = geometries.geometries;
      const [, { value: secondArea }] = areas;
      expect(secondArea.points.length).toEqual(2);
      expect(secondArea.points).toMatchSnapshot();
    });
    test('has the right number of geometry in the indexes', () => {
      const { areas } = geometries.geometries;
      const [{ value: firstArea }] = areas;
      expect(geometries.geometriesIndex.size).toEqual(firstArea.points.length);
    });
  });

  describe('Single series area chart - linear', () => {
    let geometries: ComputedGeometries;
    const spec = MockSeriesSpec.area({
      id: 'spec_1',
      groupId: GROUP_ID,
      xScaleType: ScaleType.Linear,
      yScaleType: ScaleType.Linear,
      xAccessor: 0,
      yAccessors: [1],
      data: [
        [0, 10],
        [1, 5],
      ],
    });
    beforeEach(() => {
      const store = initStore([spec], ['red']);
      geometries = computeSeriesGeometriesSelector(store.getState());
    });

    test('Can render a linear area', () => {
      const { areas } = geometries.geometries;
      const [{ value: firstArea }] = areas;
      expect(firstArea.lines[0]).toBe('M0,0L100,50');
      expect(firstArea.area).toBe('M0,0L100,50L100,100L0,100Z');
      expect(firstArea.color).toBe('red');
      expect(firstArea.seriesIdentifier.seriesKeys).toEqual([1]);
      expect(firstArea.seriesIdentifier.specId).toEqual(SPEC_ID);
      expect(firstArea.transform).toEqual({ x: 0, y: 0 });
    });
    test('Can render two points', () => {
      const { areas } = geometries.geometries;
      const [{ value: firstArea }] = areas;
      expect(firstArea.points).toMatchSnapshot();
      expect(geometries.geometriesIndex.size).toEqual(firstArea.points.length);
    });
  });

  describe('Multi series area chart - linear', () => {
    let geometries: ComputedGeometries;
    const spec1 = MockSeriesSpec.area({
      id: 'spec_1',
      groupId: GROUP_ID,
      xScaleType: ScaleType.Linear,
      yScaleType: ScaleType.Linear,
      xAccessor: 0,
      yAccessors: [1],
      data: [
        [0, 10],
        [1, 5],
      ],
    });
    const spec2 = MockSeriesSpec.area({
      id: 'spec_2',
      groupId: GROUP_ID,
      xScaleType: ScaleType.Linear,
      yScaleType: ScaleType.Linear,
      xAccessor: 0,
      yAccessors: [1],
      data: [
        [0, 20],
        [1, 10],
      ],
    });
    beforeEach(() => {
      const store = initStore([spec1, spec2], ['red', 'blue']);
      geometries = computeSeriesGeometriesSelector(store.getState());
    });
    test('can render two linear areas', () => {
      const { areas } = geometries.geometries;
      const [{ value: firstArea }, { value: secondArea }] = areas;
      expect(firstArea.lines[0]).toBe('M0,50L100,75');
      expect(firstArea.area).toBe('M0,50L100,75L100,100L0,100Z');
      expect(firstArea.color).toBe('red');
      expect(firstArea.seriesIdentifier.seriesKeys).toEqual([1]);
      expect(firstArea.seriesIdentifier.specId).toEqual('spec_1');
      expect(firstArea.transform).toEqual({ x: 0, y: 0 });

      expect(secondArea.lines[0]).toBe('M0,0L100,50');
      expect(secondArea.area).toBe('M0,0L100,50L100,100L0,100Z');
      expect(secondArea.color).toBe('blue');
      expect(secondArea.seriesIdentifier.seriesKeys).toEqual([1]);
      expect(secondArea.seriesIdentifier.specId).toEqual('spec_2');
      expect(secondArea.transform).toEqual({ x: 0, y: 0 });
    });
    test('can render first spec points', () => {
      const { areas } = geometries.geometries;
      const [{ value: firstArea }] = areas;
      expect(firstArea.points.length).toEqual(2);
      expect(firstArea.points).toMatchSnapshot();
      expect(geometries.geometriesIndex.size).toEqual(firstArea.points.length);
    });
    test('can render second spec points', () => {
      const { areas } = geometries.geometries;
      const [, { value: secondArea }] = areas;
      expect(secondArea.points.length).toEqual(2);
      expect(secondArea.points).toMatchSnapshot();
      expect(geometries.geometriesIndex.size).toEqual(secondArea.points.length);
    });
  });
  describe('Single series area chart - time', () => {
    let geometries: ComputedGeometries;
    const spec = MockSeriesSpec.area({
      id: 'spec_1',
      groupId: GROUP_ID,
      xScaleType: ScaleType.Time,
      yScaleType: ScaleType.Linear,
      xAccessor: 0,
      yAccessors: [1],
      data: [
        [1546300800000, 10],
        [1546387200000, 5],
      ],
    });
    beforeEach(() => {
      const store = initStore([spec], ['red']);
      geometries = computeSeriesGeometriesSelector(store.getState());
    });

    test('Can render a time area', () => {
      const { areas } = geometries.geometries;
      const [{ value: firstArea }] = areas;
      expect(firstArea.lines[0]).toBe('M0,0L100,50');
      expect(firstArea.area).toBe('M0,0L100,50L100,100L0,100Z');
      expect(firstArea.color).toBe('red');
      expect(firstArea.seriesIdentifier.seriesKeys).toEqual([1]);
      expect(firstArea.seriesIdentifier.specId).toEqual(SPEC_ID);
      expect(firstArea.transform).toEqual({ x: 0, y: 0 });
    });
    test('Can render two points', () => {
      const { areas } = geometries.geometries;
      const [{ value: firstArea }] = areas;
      expect(firstArea.points).toMatchSnapshot();
      expect(geometries.geometriesIndex.size).toEqual(firstArea.points.length);
    });
  });
  describe('Multi series area chart - time', () => {
    let geometries: ComputedGeometries;
    const spec1 = MockSeriesSpec.area({
      id: 'spec_1',
      groupId: GROUP_ID,
      xScaleType: ScaleType.Time,
      yScaleType: ScaleType.Linear,
      xAccessor: 0,
      yAccessors: [1],
      data: [
        [1546300800000, 10],
        [1546387200000, 5],
      ],
    });
    const spec2 = MockSeriesSpec.area({
      id: 'spec_2',
      groupId: GROUP_ID,
      xScaleType: ScaleType.Time,
      yScaleType: ScaleType.Linear,
      xAccessor: 0,
      yAccessors: [1],
      data: [
        [1546300800000, 20],
        [1546387200000, 10],
      ],
    });
    beforeEach(() => {
      const store = initStore([spec1, spec2], ['red', 'blue']);
      geometries = computeSeriesGeometriesSelector(store.getState());
    });

    test('can render first spec points', () => {
      const { areas } = geometries.geometries;
      const [{ value: firstArea }] = areas;
      expect(firstArea.points).toMatchSnapshot();
      expect(geometries.geometriesIndex.size).toEqual(firstArea.points.length);
    });
    test('can render second spec points', () => {
      const { areas } = geometries.geometries;
      const [, { value: secondArea }] = areas;

      expect(secondArea.points).toMatchSnapshot();
      expect(geometries.geometriesIndex.size).toEqual(secondArea.points.length);
    });
  });
  describe('Single series area chart - y log', () => {
    let geometries: ComputedGeometries;
    const spec = MockSeriesSpec.area({
      id: 'spec_1',
      groupId: GROUP_ID,
      xScaleType: ScaleType.Linear,
      yScaleType: ScaleType.Log,
      xAccessor: 0,
      yAccessors: [1],
      data: [
        [0, 10],
        [1, 5],
        [2, null],
        [3, 5],
        [4, 5],
        [5, 0],
        [6, 10],
        [7, 10],
        [8, 10],
      ],
    });
    beforeEach(() => {
      const store = initStore([spec], ['red'], 90);
      geometries = computeSeriesGeometriesSelector(store.getState());
    });

    test('Can render a split area and line', () => {
      const { areas } = geometries.geometries;

      const [{ value: firstArea }] = areas;
      expect(firstArea.lines[0].split('M').length - 1).toBe(3);
      expect(firstArea.area.split('M').length - 1).toBe(3);
      expect(firstArea.color).toBe('red');
      expect(firstArea.seriesIdentifier.seriesKeys).toEqual([1]);
      expect(firstArea.seriesIdentifier.specId).toEqual(SPEC_ID);
      expect(firstArea.transform).toEqual({ x: 0, y: 0 });
    });
    test('Can render points', () => {
      const {
        geometriesIndex,
        geometries: { areas },
      } = geometries;
      const [
        {
          value: { points },
        },
      ] = areas;
      // all the points minus the undefined ones on a log scale
      expect(points.length).toBe(7);
      // all the points expect null geometries
      expect(geometriesIndex.size).toEqual(8);
      const nullIndexdGeometry = geometriesIndex.find(2)!;
      expect(nullIndexdGeometry).toEqual([]);

      const zeroValueIndexdGeometry = geometriesIndex.find(5)!;
      expect(zeroValueIndexdGeometry).toBeDefined();
      expect(zeroValueIndexdGeometry.length).toBe(1);
      // moved to the bottom of the chart
      expect(zeroValueIndexdGeometry[0].y).toBe(Infinity);
      // default area theme point radius
      expect((zeroValueIndexdGeometry[0] as PointGeometry).radius).toBe(LIGHT_THEME.areaSeriesStyle.point.radius);
    });
  });
  it('Stacked areas with 0 values', () => {
    const pointSeriesSpec1: AreaSeriesSpec = MockSeriesSpec.area({
      id: 'spec_1',
      data: [
        [1546300800000, 0],
        [1546387200000, 5],
      ],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Time,
      yScaleType: ScaleType.Linear,
      stackAccessors: [0],
      stackMode: StackMode.Percentage,
    });
    const pointSeriesSpec2: AreaSeriesSpec = MockSeriesSpec.area({
      id: 'spec_2',
      data: [
        [1546300800000, 0],
        [1546387200000, 2],
      ],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Time,
      yScaleType: ScaleType.Linear,
      stackAccessors: [0],
      stackMode: StackMode.Percentage,
    });

    const store = initStore([pointSeriesSpec1, pointSeriesSpec2]);
    const domains = computeSeriesDomainsSelector(store.getState());

    expect(domains.formattedDataSeries[0].data).toMatchSnapshot();
  });
  it('Stacked areas with null values', () => {
    const pointSeriesSpec1: AreaSeriesSpec = MockSeriesSpec.area({
      id: 'spec_1',
      data: [
        [1546300800000, null],
        [1546387200000, 5],
      ],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Time,
      yScaleType: ScaleType.Linear,
      stackAccessors: [0],
    });
    const pointSeriesSpec2: AreaSeriesSpec = MockSeriesSpec.area({
      id: 'spec_2',
      data: [
        [1546300800000, 3],
        [1546387200000, null],
      ],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Time,
      yScaleType: ScaleType.Linear,
      stackAccessors: [0],
    });
    const store = initStore([pointSeriesSpec1, pointSeriesSpec2]);
    const domains = computeSeriesDomainsSelector(store.getState());

    expect(domains.formattedDataSeries[0].data).toMatchSnapshot();
    expect(domains.formattedDataSeries[1].data).toMatchSnapshot();
  });
});
