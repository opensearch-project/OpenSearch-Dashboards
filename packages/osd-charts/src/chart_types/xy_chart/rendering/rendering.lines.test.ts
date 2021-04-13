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

import { MockPointGeometry } from '../../../mocks';
import { MockSeriesIdentifier } from '../../../mocks/series/series_identifiers';
import { MockGlobalSpec, MockSeriesSpec } from '../../../mocks/specs';
import { MockStore } from '../../../mocks/store';
import { ScaleType } from '../../../scales/constants';
import { Position } from '../../../utils/common';
import { PointGeometry } from '../../../utils/geometry';
import { LIGHT_THEME } from '../../../utils/themes/light_theme';
import { computeSeriesGeometriesSelector } from '../state/selectors/compute_series_geometries';
import { SeriesType } from '../utils/specs';

const SPEC_ID = 'spec_1';
const GROUP_ID = 'group_1';

describe('Rendering points - line', () => {
  describe('Single series line chart - ordinal', () => {
    const pointSeriesSpec = MockSeriesSpec.line({
      id: SPEC_ID,
      groupId: GROUP_ID,
      data: [
        [0, 10],
        [1, 5],
      ],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Ordinal,
      yScaleType: ScaleType.Linear,
    });
    const store = MockStore.default();
    const settings = MockGlobalSpec.settingsNoMargins({ theme: { colors: { vizColors: ['red'] } } });
    MockStore.addSpecs([pointSeriesSpec, settings], store);
    const {
      geometries: { lines },
      geometriesIndex,
    } = computeSeriesGeometriesSelector(store.getState());

    test('Can render a line', () => {
      const [{ value: lineGeometry }] = lines;
      expect(lineGeometry.line).toBe('M0,0L50,50');
      expect(lineGeometry.color).toBe('red');
      expect(lineGeometry.seriesIdentifier.seriesKeys).toEqual([1]);
      expect(lineGeometry.seriesIdentifier.specId).toEqual(SPEC_ID);
      expect(lineGeometry.transform).toEqual({ x: 25, y: 0 });
    });
    test('Can render two points', () => {
      const [
        {
          value: { points },
        },
      ] = lines;

      expect(points[0]).toEqual(
        MockPointGeometry.default({
          x: 0,
          y: 0,
          color: 'red',
          seriesIdentifier: MockSeriesIdentifier.fromSpec(pointSeriesSpec),
          value: {
            accessor: 'y1',
            x: 0,
            y: 10,
            mark: null,
            datum: [0, 10],
          },
          transform: {
            x: 25,
            y: 0,
          },
        }),
      );
      expect(points[1]).toEqual(
        MockPointGeometry.default({
          x: 50,
          y: 50,
          color: 'red',
          seriesIdentifier: MockSeriesIdentifier.fromSpec(pointSeriesSpec),
          value: {
            accessor: 'y1',
            x: 1,
            y: 5,
            mark: null,
            datum: [1, 5],
          },
          transform: {
            x: 25,
            y: 0,
          },
        }),
      );
      expect(geometriesIndex.size).toEqual(points.length);
    });
  });
  describe('Multi series line chart - ordinal', () => {
    const spec1Id = 'point1';
    const spec2Id = 'point2';
    const pointSeriesSpec1 = MockSeriesSpec.line({
      id: spec1Id,
      groupId: GROUP_ID,
      seriesType: SeriesType.Line,
      data: [
        [0, 10],
        [1, 5],
      ],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Ordinal,
      yScaleType: ScaleType.Linear,
    });
    const pointSeriesSpec2 = MockSeriesSpec.line({
      id: spec2Id,
      groupId: GROUP_ID,
      data: [
        [0, 20],
        [1, 10],
      ],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Ordinal,
      yScaleType: ScaleType.Linear,
    });

    const store = MockStore.default();
    const settings = MockGlobalSpec.settingsNoMargins({ theme: { colors: { vizColors: ['red', 'blue'] } } });
    MockStore.addSpecs([pointSeriesSpec1, pointSeriesSpec2, settings], store);
    const {
      geometries: { lines },
      geometriesIndex,
    } = computeSeriesGeometriesSelector(store.getState());

    test('Can render two ordinal lines', () => {
      const [{ value: firstLine }, { value: secondLine }] = lines;
      expect(firstLine.color).toBe('red');
      expect(firstLine.seriesIdentifier.seriesKeys).toEqual([1]);
      expect(firstLine.seriesIdentifier.specId).toEqual(spec1Id);
      expect(firstLine.transform).toEqual({ x: 25, y: 0 });

      expect(secondLine.line).toBe('M0,0L50,50');
      expect(secondLine.color).toBe('blue');
      expect(secondLine.seriesIdentifier.seriesKeys).toEqual([1]);
      expect(secondLine.seriesIdentifier.specId).toEqual(spec2Id);
      expect(secondLine.transform).toEqual({ x: 25, y: 0 });
    });
    test('can render first spec points', () => {
      const [
        {
          value: { points },
        },
      ] = lines;
      expect(points.length).toEqual(2);
      expect(points[0]).toEqual(
        MockPointGeometry.default({
          x: 0,
          y: 50,
          color: 'red',
          seriesIdentifier: MockSeriesIdentifier.fromSpec(pointSeriesSpec1),
          value: {
            accessor: 'y1',
            x: 0,
            y: 10,
            mark: null,
            datum: [0, 10],
          },
          transform: {
            x: 25,
            y: 0,
          },
        }),
      );
      expect(points[1]).toEqual(
        MockPointGeometry.default({
          x: 50,
          y: 75,
          color: 'red',
          seriesIdentifier: MockSeriesIdentifier.fromSpec(pointSeriesSpec1),
          value: {
            accessor: 'y1',
            x: 1,
            y: 5,
            mark: null,
            datum: [1, 5],
          },
          transform: {
            x: 25,
            y: 0,
          },
        }),
      );
      expect(geometriesIndex.size).toEqual(points.length);
    });
    test('can render second spec points', () => {
      const [
        ,
        {
          value: { points },
        },
      ] = lines;
      expect(points.length).toEqual(2);
      expect(points[0]).toEqual(
        MockPointGeometry.default({
          x: 0,
          y: 0,
          color: 'blue',
          seriesIdentifier: MockSeriesIdentifier.fromSpec(pointSeriesSpec2),
          value: {
            accessor: 'y1',
            x: 0,
            y: 20,
            mark: null,
            datum: [0, 20],
          },
          transform: {
            x: 25,
            y: 0,
          },
        }),
      );
      expect(points[1]).toEqual(
        MockPointGeometry.default({
          x: 50,
          y: 50,
          color: 'blue',
          seriesIdentifier: MockSeriesIdentifier.fromSpec(pointSeriesSpec2),
          value: {
            accessor: 'y1',
            x: 1,
            y: 10,
            mark: null,
            datum: [1, 10],
          },
          transform: {
            x: 25,
            y: 0,
          },
        }),
      );
      expect(geometriesIndex.size).toEqual(points.length);
    });
  });
  describe('Single series line chart - linear', () => {
    const pointSeriesSpec = MockSeriesSpec.line({
      id: SPEC_ID,
      groupId: GROUP_ID,
      data: [
        [0, 10],
        [1, 5],
      ],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Linear,
      yScaleType: ScaleType.Linear,
    });

    const store = MockStore.default();
    const settings = MockGlobalSpec.settingsNoMargins({ theme: { colors: { vizColors: ['red', 'blue'] } } });
    MockStore.addSpecs([pointSeriesSpec, settings], store);
    const {
      geometries: { lines },
      geometriesIndex,
    } = computeSeriesGeometriesSelector(store.getState());

    test('Can render a linear line', () => {
      const [{ value: renderedLine }] = lines;
      expect(renderedLine.line).toBe('M0,0L100,50');
      expect(renderedLine.color).toBe('red');
      expect(renderedLine.seriesIdentifier.seriesKeys).toEqual([1]);
      expect(renderedLine.seriesIdentifier.specId).toEqual(SPEC_ID);
      expect(renderedLine.transform).toEqual({ x: 0, y: 0 });
    });
    test('Can render two points', () => {
      const [
        {
          value: { points },
        },
      ] = lines;
      expect(points[0]).toEqual(
        MockPointGeometry.default({
          x: 0,
          y: 0,
          color: 'red',
          seriesIdentifier: MockSeriesIdentifier.fromSpec(pointSeriesSpec),
          value: {
            accessor: 'y1',
            x: 0,
            y: 10,
            mark: null,
            datum: [0, 10],
          },
        }),
      );
      expect(points[1]).toEqual(
        MockPointGeometry.default({
          x: 100,
          y: 50,
          color: 'red',
          seriesIdentifier: MockSeriesIdentifier.fromSpec(pointSeriesSpec),
          value: {
            accessor: 'y1',
            x: 1,
            y: 5,
            mark: null,
            datum: [1, 5],
          },
        }),
      );
      expect(geometriesIndex.size).toEqual(points.length);
    });
  });
  describe('Multi series line chart - linear', () => {
    const spec1Id = 'point1';
    const spec2Id = 'point2';
    const pointSeriesSpec1 = MockSeriesSpec.line({
      id: spec1Id,
      groupId: GROUP_ID,
      data: [
        [0, 10],
        [1, 5],
      ],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Linear,
      yScaleType: ScaleType.Linear,
    });
    const pointSeriesSpec2 = MockSeriesSpec.line({
      id: spec2Id,
      groupId: GROUP_ID,
      data: [
        [0, 20],
        [1, 10],
      ],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Linear,
      yScaleType: ScaleType.Linear,
    });
    const store = MockStore.default();
    const settings = MockGlobalSpec.settingsNoMargins({ theme: { colors: { vizColors: ['red', 'blue'] } } });
    MockStore.addSpecs([pointSeriesSpec1, pointSeriesSpec2, settings], store);
    const {
      geometries: { lines },
      geometriesIndex,
    } = computeSeriesGeometriesSelector(store.getState());

    test('can render two linear lines', () => {
      const [{ value: firstLine }, { value: secondLine }] = lines;
      expect(firstLine.line).toBe('M0,50L100,75');
      expect(firstLine.color).toBe('red');
      expect(firstLine.seriesIdentifier.seriesKeys).toEqual([1]);
      expect(firstLine.seriesIdentifier.specId).toEqual(spec1Id);
      expect(firstLine.transform).toEqual({ x: 0, y: 0 });

      expect(secondLine.line).toBe('M0,0L100,50');
      expect(secondLine.color).toBe('blue');
      expect(secondLine.seriesIdentifier.seriesKeys).toEqual([1]);
      expect(secondLine.seriesIdentifier.specId).toEqual(spec2Id);
      expect(secondLine.transform).toEqual({ x: 0, y: 0 });
    });
    test('can render first spec points', () => {
      const [
        {
          value: { points },
        },
      ] = lines;
      expect(points.length).toEqual(2);
      expect(points[0]).toEqual(
        MockPointGeometry.default({
          x: 0,
          y: 50,
          color: 'red',
          seriesIdentifier: MockSeriesIdentifier.fromSpec(pointSeriesSpec1),
          value: {
            accessor: 'y1',
            x: 0,
            y: 10,
            mark: null,
            datum: [0, 10],
          },
        }),
      );
      expect(points[1]).toEqual(
        MockPointGeometry.default({
          x: 100,
          y: 75,
          color: 'red',
          seriesIdentifier: MockSeriesIdentifier.fromSpec(pointSeriesSpec1),
          value: {
            accessor: 'y1',
            x: 1,
            y: 5,
            mark: null,
            datum: [1, 5],
          },
        }),
      );
      expect(geometriesIndex.size).toEqual(points.length);
    });
    test('can render second spec points', () => {
      const [
        ,
        {
          value: { points },
        },
      ] = lines;
      expect(points.length).toEqual(2);
      expect(points[0]).toEqual(
        MockPointGeometry.default({
          x: 0,
          y: 0,
          color: 'blue',
          seriesIdentifier: MockSeriesIdentifier.fromSpec(pointSeriesSpec2),
          value: {
            accessor: 'y1',
            x: 0,
            y: 20,
            mark: null,
            datum: [0, 20],
          },
        }),
      );
      expect(points[1]).toEqual(
        MockPointGeometry.default({
          x: 100,
          y: 50,
          color: 'blue',
          seriesIdentifier: MockSeriesIdentifier.fromSpec(pointSeriesSpec2),
          value: {
            accessor: 'y1',
            x: 1,
            y: 10,
            mark: null,
            datum: [1, 10],
          },
        }),
      );
      expect(geometriesIndex.size).toEqual(points.length);
    });
  });
  describe('Single series line chart - time', () => {
    const pointSeriesSpec = MockSeriesSpec.line({
      id: SPEC_ID,
      groupId: GROUP_ID,
      data: [
        [1546300800000, 10],
        [1546387200000, 5],
      ],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Time,
      yScaleType: ScaleType.Linear,
    });

    const store = MockStore.default();
    const settings = MockGlobalSpec.settingsNoMargins({ theme: { colors: { vizColors: ['red', 'blue'] } } });
    MockStore.addSpecs([pointSeriesSpec, settings], store);
    const {
      geometries: { lines },
      geometriesIndex,
    } = computeSeriesGeometriesSelector(store.getState());

    test('Can render a time line', () => {
      const [{ value: renderedLine }] = lines;
      expect(renderedLine.line).toBe('M0,0L100,50');
      expect(renderedLine.color).toBe('red');
      expect(renderedLine.seriesIdentifier.seriesKeys).toEqual([1]);
      expect(renderedLine.seriesIdentifier.specId).toEqual(SPEC_ID);
      expect(renderedLine.transform).toEqual({ x: 0, y: 0 });
    });
    test('Can render two points', () => {
      const [
        {
          value: { points },
        },
      ] = lines;
      expect(points[0]).toEqual(
        MockPointGeometry.default({
          x: 0,
          y: 0,
          color: 'red',
          seriesIdentifier: MockSeriesIdentifier.fromSpec(pointSeriesSpec),
          value: {
            accessor: 'y1',
            x: 1546300800000,
            y: 10,
            mark: null,
            datum: [1546300800000, 10],
          },
        }),
      );
      expect(points[1]).toEqual(
        MockPointGeometry.default({
          x: 100,
          y: 50,
          color: 'red',
          seriesIdentifier: MockSeriesIdentifier.fromSpec(pointSeriesSpec),
          value: {
            accessor: 'y1',
            x: 1546387200000,
            y: 5,
            mark: null,
            datum: [1546387200000, 5],
          },
        }),
      );
      expect(geometriesIndex.size).toEqual(points.length);
    });
  });
  describe('Multi series line chart - time', () => {
    const spec1Id = 'point1';
    const spec2Id = 'point2';
    const pointSeriesSpec1 = MockSeriesSpec.line({
      id: spec1Id,
      groupId: GROUP_ID,
      data: [
        [1546300800000, 10],
        [1546387200000, 5],
      ],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Time,
      yScaleType: ScaleType.Linear,
    });
    const pointSeriesSpec2 = MockSeriesSpec.line({
      id: spec2Id,
      groupId: GROUP_ID,
      data: [
        [1546300800000, 20],
        [1546387200000, 10],
      ],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Time,
      yScaleType: ScaleType.Linear,
    });
    const store = MockStore.default();
    const settings = MockGlobalSpec.settingsNoMargins({ theme: { colors: { vizColors: ['red', 'blue'] } } });
    MockStore.addSpecs([pointSeriesSpec1, pointSeriesSpec2, settings], store);
    const {
      geometries: {
        lines: [firstLine, secondLine],
      },
      geometriesIndex,
    } = computeSeriesGeometriesSelector(store.getState());

    test('can render first spec points', () => {
      const {
        value: { points },
      } = firstLine;
      expect(points.length).toEqual(2);
      expect(points[0]).toEqual(
        MockPointGeometry.default({
          x: 0,
          y: 50,
          color: 'red',
          seriesIdentifier: MockSeriesIdentifier.fromSpec(pointSeriesSpec1),
          value: {
            accessor: 'y1',
            x: 1546300800000,
            y: 10,
            mark: null,
            datum: [1546300800000, 10],
          },
        }),
      );
      expect(points[1]).toEqual(
        MockPointGeometry.default({
          x: 100,
          y: 75,
          color: 'red',
          seriesIdentifier: MockSeriesIdentifier.fromSpec(pointSeriesSpec1),
          value: {
            accessor: 'y1',
            x: 1546387200000,
            y: 5,
            mark: null,
            datum: [1546387200000, 5],
          },
        }),
      );
      expect(geometriesIndex.size).toEqual(points.length);
    });
    test('can render second spec points', () => {
      const {
        value: { points },
      } = secondLine;
      expect(points.length).toEqual(2);
      expect(points[0]).toEqual(
        MockPointGeometry.default({
          x: 0,
          y: 0,
          color: 'blue',
          seriesIdentifier: MockSeriesIdentifier.fromSpec(pointSeriesSpec2),
          value: {
            accessor: 'y1',
            x: 1546300800000,
            y: 20,
            mark: null,
            datum: [1546300800000, 20],
          },
          style: {
            stroke: {
              color: {
                r: 0,
                g: 0,
                b: 255,
              },
            },
          },
        }),
      );
      expect(points[1]).toEqual(
        MockPointGeometry.default({
          x: 100,
          y: 50,
          color: 'blue',
          seriesIdentifier: MockSeriesIdentifier.fromSpec(pointSeriesSpec2),
          value: {
            accessor: 'y1',
            x: 1546387200000,
            y: 10,
            mark: null,
            datum: [1546387200000, 10],
          },
          style: {
            stroke: {
              color: {
                r: 0,
                g: 0,
                b: 255,
              },
            },
          },
        }),
      );
      expect(geometriesIndex.size).toEqual(points.length);
    });
  });
  describe('Single series line chart - y log', () => {
    const pointSeriesSpec = MockSeriesSpec.line({
      id: SPEC_ID,
      groupId: GROUP_ID,
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
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Linear,
      yScaleType: ScaleType.Log,
    });
    const store = MockStore.default({ width: 90, height: 100, top: 0, left: 0 });
    const settings = MockGlobalSpec.settingsNoMargins({ theme: { colors: { vizColors: ['red', 'blue'] } } });
    MockStore.addSpecs([pointSeriesSpec, settings], store);
    const {
      geometries: { lines },
      geometriesIndex,
    } = computeSeriesGeometriesSelector(store.getState());

    test('Can render a split line', () => {
      const [{ value: renderedLine }] = lines;
      expect(renderedLine.line.split('M').length - 1).toBe(3);
      expect(renderedLine.color).toBe('red');
      expect(renderedLine.seriesIdentifier.seriesKeys).toEqual([1]);
      expect(renderedLine.seriesIdentifier.specId).toEqual(SPEC_ID);
      expect(renderedLine.transform).toEqual({ x: 0, y: 0 });
    });
    test('Can render points', () => {
      const [
        {
          value: { points },
        },
      ] = lines;
      // all the points minus the undefined ones on a log scale
      expect(points.length).toBe(7);
      // all the points expect null geometries
      expect(geometriesIndex.size).toEqual(8);
      const nullIndexdGeometry = geometriesIndex.find(2)!;
      expect(nullIndexdGeometry).toEqual([]);

      const zeroValueIndexdGeometry = geometriesIndex.find(5)!;
      expect(zeroValueIndexdGeometry).toBeDefined();
      expect(zeroValueIndexdGeometry.length).toBe(1);
      // the zero value is moved vertically to infinity
      expect((zeroValueIndexdGeometry[0] as PointGeometry).y).toBe(Infinity);
      expect((zeroValueIndexdGeometry[0] as PointGeometry).radius).toBe(LIGHT_THEME.lineSeriesStyle.point.radius);
    });
  });
  describe('Remove points datum is not in domain', () => {
    const pointSeriesSpec = MockSeriesSpec.line({
      id: SPEC_ID,
      // groupId: GROUP_ID,
      data: [
        [0, 0],
        [1, 1],
        [2, 10],
        [3, 3],
      ],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Linear,
      yScaleType: ScaleType.Linear,
    });
    const settings = MockGlobalSpec.settingsNoMargins({
      xDomain: { max: 2 },
      theme: { colors: { vizColors: ['red', 'blue'] } },
    });
    const axis = MockGlobalSpec.axis({ position: Position.Left, hide: true, domain: { max: 1 } });
    const store = MockStore.default({ width: 100, height: 100, top: 0, left: 0 });
    MockStore.addSpecs([pointSeriesSpec, axis, settings], store);

    const {
      geometries: { lines },
      geometriesIndex,
    } = computeSeriesGeometriesSelector(store.getState());
    test('Can render two points', () => {
      const [
        {
          value: { points },
        },
      ] = lines;
      // will not render the 3rd point that is out of y domain
      expect(points.length).toBe(2);
      // will keep the 3rd point as an indexedGeometry
      expect(geometriesIndex.size).toEqual(3);
      expect(points[0]).toEqual(
        MockPointGeometry.default({
          x: 0,
          y: 99.5,
          color: 'red',
          seriesIdentifier: MockSeriesIdentifier.fromSpec(pointSeriesSpec),
          value: {
            accessor: 'y1',
            x: 0,
            y: 0,
            mark: null,
            datum: [0, 0],
          },
        }),
      );
      expect(points[1]).toEqual(
        MockPointGeometry.default({
          x: 50,
          y: 0,
          color: 'red',
          seriesIdentifier: MockSeriesIdentifier.fromSpec(pointSeriesSpec),
          value: {
            accessor: 'y1',
            x: 1,
            y: 1,
            mark: null,
            datum: [1, 1],
          },
        }),
      );
    });
  });
});
