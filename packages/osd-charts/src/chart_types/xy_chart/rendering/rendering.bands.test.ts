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

import { MockGlobalSpec, MockSeriesSpec } from '../../../mocks/specs';
import { MockStore } from '../../../mocks/store';
import { ScaleType } from '../../../scales/constants';
import { computeSeriesGeometriesSelector } from '../state/selectors/compute_series_geometries';

const SPEC_ID = 'spec_1';
const GROUP_ID = 'group_1';

describe('Rendering bands - areas', () => {
  describe('Single band area chart', () => {
    const pointSeriesSpec = MockSeriesSpec.area({
      id: SPEC_ID,
      data: [
        [0, 2, 10],
        [1, 3, 5],
      ],
      xAccessor: 0,
      y0Accessors: [1],
      yAccessors: [2],
      xScaleType: ScaleType.Ordinal,
      yScaleType: ScaleType.Linear,
    });
    const store = MockStore.default();
    const settings = MockGlobalSpec.settingsNoMargins({ theme: { colors: { vizColors: ['red', 'blue'] } } });
    MockStore.addSpecs([pointSeriesSpec, settings], store);
    const {
      geometries: { areas },
    } = computeSeriesGeometriesSelector(store.getState());

    test('Can render upper and lower lines and area paths', () => {
      const [
        {
          value: { lines, area, color, seriesIdentifier, transform },
        },
      ] = areas;
      expect(lines.length).toBe(2);
      expect(lines[0]).toBe('M0,0L50,50');
      expect(lines[1]).toBe('M0,80L50,70');
      expect(area).toBe('M0,0L50,50L50,70L0,80Z');
      expect(color).toBe('red');
      expect(seriesIdentifier.seriesKeys).toEqual([2]);
      expect(seriesIdentifier.specId).toEqual(SPEC_ID);
      expect(transform).toEqual({ x: 25, y: 0 });
    });

    test('Can render two points', () => {
      const [
        {
          value: { points },
        },
      ] = areas;
      expect(points).toMatchSnapshot();
    });
  });
  describe('Single band area chart with null values', () => {
    const pointSeriesSpec = MockSeriesSpec.area({
      id: SPEC_ID,
      groupId: GROUP_ID,
      data: [
        [0, 2, 10],
        [1, 2, null],
        [2, 3, 5],
        [3, 3, 5],
      ],
      xAccessor: 0,
      y0Accessors: [1],
      yAccessors: [2],
      xScaleType: ScaleType.Ordinal,
      yScaleType: ScaleType.Linear,
    });
    const store = MockStore.default();
    const settings = MockGlobalSpec.settingsNoMargins({ theme: { colors: { vizColors: ['red', 'blue'] } } });
    MockStore.addSpecs([pointSeriesSpec, settings], store);
    const {
      geometries: { areas },
    } = computeSeriesGeometriesSelector(store.getState());

    test('Can render upper and lower lines and area paths', () => {
      const [
        {
          value: { lines, area, color, seriesIdentifier, transform },
        },
      ] = areas;
      expect(lines.length).toBe(2);
      expect(lines[0]).toBe('M0,0ZM50,50L75,50');
      expect(lines[1]).toBe('M0,80ZM50,70L75,70');
      expect(area).toBe('M0,0L0,80ZM50,50L75,50L75,70L50,70Z');
      expect(color).toBe('red');
      expect(seriesIdentifier.seriesKeys).toEqual([2]);
      expect(seriesIdentifier.specId).toEqual(SPEC_ID);
      expect(transform).toEqual({ x: 12.5, y: 0 });
    });

    test('Can render two points', () => {
      const [
        {
          value: { points },
        },
      ] = areas;
      expect(points).toMatchSnapshot();
    });
  });
  describe('Single series band bar chart - ordinal', () => {
    const barSeriesSpec = MockSeriesSpec.bar({
      id: SPEC_ID,
      groupId: GROUP_ID,
      data: [
        [0, 2, 10],
        [1, 3, null],
        [2, 3, 5],
        [3, 4, 8],
      ],
      xAccessor: 0,
      y0Accessors: [1],
      yAccessors: [2],
      xScaleType: ScaleType.Ordinal,
      yScaleType: ScaleType.Linear,
    });
    const store = MockStore.default();
    const settings = MockGlobalSpec.settingsNoMargins({ theme: { colors: { vizColors: ['red', 'blue'] } } });
    MockStore.addSpecs([barSeriesSpec, settings], store);
    const {
      geometries: {
        bars: [{ value: bars }],
      },
    } = computeSeriesGeometriesSelector(store.getState());

    test('Can render two bars', () => {
      expect(bars).toMatchSnapshot();
    });
  });
});
