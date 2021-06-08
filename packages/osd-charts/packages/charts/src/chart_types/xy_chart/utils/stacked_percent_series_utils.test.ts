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

import { MockSeriesSpec } from '../../../mocks/specs';
import { MockStore } from '../../../mocks/store';
import { ScaleType } from '../../../scales/constants';
import { computeSeriesDomainsSelector } from '../state/selectors/compute_series_domains';
import { StackMode } from './specs';

describe('Stacked Series Utils', () => {
  const STANDARD_DATA_SET = [
    { x: 0, y1: 10, g: 'a' },
    { x: 0, y1: 20, g: 'b' },
    { x: 0, y1: 70, g: 'c' },
  ];

  const WITH_NULL_DATASET = [
    { x: 0, y1: 10, g: 'a' },
    { x: 0, y1: null, g: 'b' },
    { x: 0, y1: 30, g: 'c' },
  ];
  const STANDARD_DATA_SET_WY0 = [
    { x: 0, y0: 2, y1: 10, g: 'a' },
    { x: 0, y0: 4, y1: 20, g: 'b' },
    { x: 0, y0: 6, y1: 70, g: 'c' },
  ];
  const WITH_NULL_DATASET_WY0 = [
    { x: 0, y0: 2, y1: 10, g: 'a' },
    { x: 0, y1: null, g: 'b' },
    { x: 0, y0: 6, y1: 90, mark: null, g: 'c' },
  ];
  const DATA_SET_WITH_NULL_2 = [
    { x: 1, y1: 10, g: 'a' },
    { x: 2, y1: 20, g: 'a' },
    { x: 4, y1: 40, g: 'a' },
    { x: 1, y1: 90, g: 'b' },
    { x: 3, y1: 30, g: 'b' },
  ];

  describe('Format stacked dataset', () => {
    test('format data without nulls', () => {
      const store = MockStore.default();
      MockStore.addSpecs(
        [
          MockSeriesSpec.area({
            xAccessor: 'x',
            yAccessors: ['y1'],
            splitSeriesAccessors: ['g'],
            stackAccessors: ['x'],
            stackMode: StackMode.Percentage,
            data: STANDARD_DATA_SET,
          }),
        ],
        store,
      );
      const { formattedDataSeries } = computeSeriesDomainsSelector(store.getState());

      const [data0] = formattedDataSeries[0].data;
      expect(data0.initialY1).toBe(10);
      expect(data0.y0).toBe(0);
      expect(data0.y1).toBe(0.1);

      const [data1] = formattedDataSeries[1].data;
      expect(data1.initialY1).toBe(20);
      expect(data1.y0).toBe(0.1);
      expect(data1.y1).toBeCloseTo(0.3);

      const [data2] = formattedDataSeries[2].data;
      expect(data2.initialY1).toBe(70);
      expect(data2.y0).toBeCloseTo(0.3);
      expect(data2.y1).toBe(1);
    });
    test('format data with nulls', () => {
      const store = MockStore.default();
      MockStore.addSpecs(
        [
          MockSeriesSpec.area({
            yAccessors: ['y1'],
            splitSeriesAccessors: ['g'],
            stackAccessors: ['x'],
            stackMode: StackMode.Percentage,
            data: WITH_NULL_DATASET,
          }),
        ],
        store,
      );
      const { formattedDataSeries } = computeSeriesDomainsSelector(store.getState());

      const [data0] = formattedDataSeries[0].data;
      expect(data0.initialY1).toBe(10);
      expect(data0.y0).toBe(0);
      expect(data0.y1).toBe(0.25);

      expect(formattedDataSeries[1].data[0]).toMatchObject({
        initialY0: null,
        initialY1: null,
        x: 0,
        y1: 0.25,
        y0: 0.25,
        mark: null,
      });

      const [data2] = formattedDataSeries[2].data;
      expect(data2.initialY1).toBe(30);
      expect(data2.y0).toBe(0.25);
      expect(data2.y1).toBe(1);
    });
    test('format data without nulls with y0 values', () => {
      const store = MockStore.default();
      MockStore.addSpecs(
        [
          MockSeriesSpec.area({
            yAccessors: ['y1'],
            y0Accessors: ['y0'],
            splitSeriesAccessors: ['g'],
            stackAccessors: ['x'],
            stackMode: StackMode.Percentage,
            data: STANDARD_DATA_SET_WY0,
          }),
        ],
        store,
      );
      const { formattedDataSeries } = computeSeriesDomainsSelector(store.getState());

      const [data0] = formattedDataSeries[0].data;
      expect(data0.initialY0).toBe(2);
      expect(data0.initialY1).toBe(10);
      expect(data0.y0).toBe(0.02);
      expect(data0.y1).toBe(0.1);

      const [data1] = formattedDataSeries[1].data;
      expect(data1.initialY0).toBe(4);
      expect(data1.initialY1).toBe(20);
      expect(data1.y0).toBe(0.14);
      expect(data1.y1).toBeCloseTo(0.3, 5);

      const [data2] = formattedDataSeries[2].data;
      expect(data2.initialY0).toBe(6);
      expect(data2.initialY1).toBe(70);
      expect(data2.y0).toBeCloseTo(0.36);
      expect(data2.y1).toBe(1);
    });
    test('format data with nulls - missing points', () => {
      const store = MockStore.default();
      MockStore.addSpecs(
        [
          MockSeriesSpec.area({
            yAccessors: ['y1'],
            y0Accessors: ['y0'],
            splitSeriesAccessors: ['g'],
            stackAccessors: ['x'],
            stackMode: StackMode.Percentage,
            data: WITH_NULL_DATASET_WY0,
          }),
        ],
        store,
      );
      const { formattedDataSeries } = computeSeriesDomainsSelector(store.getState());

      const [data0] = formattedDataSeries[0].data;
      expect(data0.initialY0).toBe(2);
      expect(data0.initialY1).toBe(10);
      expect(data0.y0).toBe(0.02);
      expect(data0.y1).toBe(0.1);

      const [data1] = formattedDataSeries[1].data;
      expect(data1.initialY0).toBe(null);
      expect(data1.initialY1).toBe(null);
      expect(data1.y0).toBe(0.1);
      expect(data1.y1).toBe(0.1);

      const [data2] = formattedDataSeries[2].data;
      expect(data2.initialY0).toBe(6);
      expect(data2.initialY1).toBe(90);
      expect(data2.y0).toBe(0.16);
      expect(data2.y1).toBe(1);
    });
    test('format data without nulls on second series', () => {
      const store = MockStore.default();
      MockStore.addSpecs(
        [
          MockSeriesSpec.area({
            xScaleType: ScaleType.Linear,
            yAccessors: ['y1'],
            y0Accessors: ['y0'],
            splitSeriesAccessors: ['g'],
            stackAccessors: ['x'],
            stackMode: StackMode.Percentage,
            data: DATA_SET_WITH_NULL_2,
          }),
        ],
        store,
      );
      const { formattedDataSeries } = computeSeriesDomainsSelector(store.getState());

      expect(formattedDataSeries).toHaveLength(2);
      expect(formattedDataSeries[0].data).toHaveLength(4);
      expect(formattedDataSeries[1].data).toHaveLength(4);
      expect(formattedDataSeries[0].data[0]).toMatchObject({
        initialY0: null,
        initialY1: 10,
        x: 1,
        y0: 0,
        y1: 0.1,
        mark: null,
      });
      expect(formattedDataSeries[0].data[1]).toMatchObject({
        initialY0: null,
        initialY1: 20,
        x: 2,
        y0: 0,
        y1: 1,
        mark: null,
      });
      expect(formattedDataSeries[0].data[3]).toMatchObject({
        initialY0: null,
        initialY1: 40,
        x: 4,
        y0: 0,
        y1: 1,
        mark: null,
      });
      expect(formattedDataSeries[1].data[0]).toMatchObject({
        initialY0: null,
        initialY1: 90,
        x: 1,
        y0: 0.1,
        y1: 1,
        mark: null,
      });
      expect(formattedDataSeries[1].data[1]).toMatchObject({
        initialY0: null,
        initialY1: null,
        x: 2,
        y0: 1,
        y1: 1,
        mark: null,
        filled: {
          x: 2,
        },
      });
      expect(formattedDataSeries[1].data[2]).toMatchObject({
        initialY0: null,
        initialY1: 30,
        x: 3,
        y0: 0,
        y1: 1,
        mark: null,
      });
    });
  });
});
