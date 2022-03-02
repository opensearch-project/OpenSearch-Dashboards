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
  const EMPTY_DATA_SET = MockSeriesSpec.area({
    xScaleType: ScaleType.Linear,
    yAccessors: ['y1'],
    splitSeriesAccessors: ['g'],
    stackAccessors: ['x'],
    data: [],
  });
  const STANDARD_DATA_SET = MockSeriesSpec.area({
    xScaleType: ScaleType.Linear,
    yAccessors: ['y1'],
    splitSeriesAccessors: ['g'],
    stackAccessors: ['x'],
    data: [
      { x: 0, y1: 10, g: 'a' },
      { x: 0, y1: 20, g: 'b' },
      { x: 0, y1: 30, g: 'c' },
    ],
  });
  const WITH_NULL_DATASET = MockSeriesSpec.area({
    xScaleType: ScaleType.Linear,
    yAccessors: ['y1'],
    splitSeriesAccessors: ['g'],
    stackAccessors: ['x'],
    data: [
      { x: 0, y1: 10, g: 'a' },
      { x: 0, y1: null, g: 'b' },
      { x: 0, y1: 30, g: 'c' },
    ],
  });

  const STANDARD_DATA_SET_WY0 = MockSeriesSpec.area({
    xScaleType: ScaleType.Linear,
    yAccessors: ['y1'],
    y0Accessors: ['y0'],
    splitSeriesAccessors: ['g'],
    stackAccessors: ['x'],
    data: [
      { x: 0, y0: 2, y1: 10, g: 'a' },
      { x: 0, y0: 4, y1: 20, g: 'b' },
      { x: 0, y0: 6, y1: 30, g: 'c' },
    ],
  });
  const WITH_NULL_DATASET_WY0 = MockSeriesSpec.area({
    xScaleType: ScaleType.Linear,
    yAccessors: ['y1'],
    y0Accessors: ['y0'],
    splitSeriesAccessors: ['g'],
    stackAccessors: ['x'],
    data: [
      { x: 0, y0: 2, y1: 10, g: 'a' },
      { x: 0, y1: null, g: 'b' },
      { x: 0, y0: 6, y1: 30, g: 'c' },
    ],
  });

  const DATA_SET_WITH_NULL_2 = MockSeriesSpec.area({
    xScaleType: ScaleType.Linear,
    yAccessors: ['y1'],
    splitSeriesAccessors: ['g'],
    stackAccessors: ['x'],
    data: [
      { x: 1, y1: 1, g: 'a' },
      { x: 2, y1: 2, g: 'a' },
      { x: 4, y1: 4, g: 'a' },
      { x: 1, y1: 21, g: 'b' },
      { x: 3, y1: 23, g: 'b' },
    ],
  });

  describe('compute stacked arrays', () => {
    test('with empty values', () => {
      const store = MockStore.default();
      MockStore.addSpecs(EMPTY_DATA_SET, store);
      const { formattedDataSeries } = computeSeriesDomainsSelector(store.getState());
      expect(formattedDataSeries).toHaveLength(0);
    });
    test('with basic values', () => {
      const store = MockStore.default();
      MockStore.addSpecs(STANDARD_DATA_SET, store);
      const { formattedDataSeries } = computeSeriesDomainsSelector(store.getState());

      // stacked series are reverse ordered
      const values = [
        formattedDataSeries[0].data[0].y0,
        formattedDataSeries[0].data[0].y1,
        formattedDataSeries[1].data[0].y1,
        formattedDataSeries[2].data[0].y1,
      ];
      expect(values).toEqual([0, 10, 30, 60]);
    });

    test('with basic values in percentage', () => {
      const store = MockStore.default();
      MockStore.addSpecs(
        MockSeriesSpec.area({
          ...STANDARD_DATA_SET,
          stackMode: StackMode.Percentage,
        }),
        store,
      );
      const { formattedDataSeries } = computeSeriesDomainsSelector(store.getState());

      const values = [
        formattedDataSeries[0].data[0].y0,
        formattedDataSeries[0].data[0].y1,
        formattedDataSeries[1].data[0].y1,
        formattedDataSeries[2].data[0].y1,
      ];
      expect(values).toEqual([0, 0.16666666666666666, 0.5, 1]);
    });
    test('with null values', () => {
      const store = MockStore.default();
      MockStore.addSpecs(WITH_NULL_DATASET, store);
      const { formattedDataSeries } = computeSeriesDomainsSelector(store.getState());

      const values = [
        formattedDataSeries[0].data[0].y0,
        formattedDataSeries[0].data[0].y1,
        formattedDataSeries[1].data[0].y1,
        formattedDataSeries[2].data[0].y1,
      ];
      expect(values).toEqual([0, 10, 10, 40]);
    });
    test('with null values as percentage', () => {
      const store = MockStore.default();
      MockStore.addSpecs(
        MockSeriesSpec.area({
          ...WITH_NULL_DATASET,
          stackMode: StackMode.Percentage,
        }),
        store,
      );
      const { formattedDataSeries } = computeSeriesDomainsSelector(store.getState());

      const values = [
        formattedDataSeries[0].data[0].y0,
        formattedDataSeries[0].data[0].y1,
        formattedDataSeries[1].data[0].y1,
        formattedDataSeries[2].data[0].y1,
      ];
      expect(values).toEqual([0, 0.25, 0.25, 1]);
    });
  });
  describe('Format stacked dataset', () => {
    test('format data without nulls', () => {
      const store = MockStore.default();
      MockStore.addSpecs(STANDARD_DATA_SET, store);
      const { formattedDataSeries } = computeSeriesDomainsSelector(store.getState());

      expect(formattedDataSeries[0].data[0]).toMatchObject({
        initialY0: null,
        initialY1: 10,
        x: 0,
        y0: 0,
        y1: 10,
        mark: null,
      });
      expect(formattedDataSeries[1].data[0]).toMatchObject({
        initialY0: null,
        initialY1: 20,
        x: 0,
        y0: 10,
        y1: 30,
        mark: null,
      });
      expect(formattedDataSeries[2].data[0]).toMatchObject({
        initialY0: null,
        initialY1: 30,
        x: 0,
        y0: 30,
        y1: 60,
        mark: null,
      });
    });
    test('format data with nulls', () => {
      const store = MockStore.default();
      MockStore.addSpecs(WITH_NULL_DATASET, store);
      const { formattedDataSeries } = computeSeriesDomainsSelector(store.getState());

      expect(formattedDataSeries[1].data[0]).toMatchObject({
        initialY0: null,
        initialY1: null,
        x: 0,
        y1: 10,
        y0: 10,
        mark: null,
      });
    });
    test('format data without nulls with y0 values', () => {
      const store = MockStore.default();
      MockStore.addSpecs(STANDARD_DATA_SET_WY0, store);
      const { formattedDataSeries } = computeSeriesDomainsSelector(store.getState());

      expect(formattedDataSeries[0].data[0]).toMatchObject({
        initialY0: 2,
        initialY1: 10,
        x: 0,
        y0: 2,
        y1: 10,
        mark: null,
      });
      expect(formattedDataSeries[1].data[0]).toMatchObject({
        initialY0: 4,
        initialY1: 20,
        x: 0,
        y0: 14,
        y1: 30,
        mark: null,
      });
      expect(formattedDataSeries[2].data[0]).toMatchObject({
        initialY0: 6,
        initialY1: 30,
        x: 0,
        y0: 36,
        y1: 60,
        mark: null,
      });
    });
    test('format data with nulls - missing points', () => {
      const store = MockStore.default();
      MockStore.addSpecs(WITH_NULL_DATASET_WY0, store);
      const { formattedDataSeries } = computeSeriesDomainsSelector(store.getState());

      expect(formattedDataSeries[0].data[0]).toMatchObject({
        initialY0: 2,
        initialY1: 10,
        x: 0,
        y0: 2,
        y1: 10,
        mark: null,
      });
      expect(formattedDataSeries[1].data[0]).toMatchObject({
        initialY0: null,
        initialY1: null,
        x: 0,
        y1: 10,
        y0: 10,
        mark: null,
      });
      expect(formattedDataSeries[2].data[0]).toMatchObject({
        initialY0: 6,
        initialY1: 30,
        x: 0,
        y0: 16,
        y1: 40,
        mark: null,
      });
    });
    test('format data without nulls on second series', () => {
      const store = MockStore.default();
      MockStore.addSpecs(DATA_SET_WITH_NULL_2, store);
      const { formattedDataSeries } = computeSeriesDomainsSelector(store.getState());

      expect(formattedDataSeries).toHaveLength(2);
      expect(formattedDataSeries[0].data).toHaveLength(4);
      expect(formattedDataSeries[1].data).toHaveLength(4);

      expect(formattedDataSeries[0].data[0]).toMatchObject({
        initialY0: null,
        initialY1: 1,
        x: 1,
        y0: 0,
        y1: 1,
        mark: null,
      });
      expect(formattedDataSeries[0].data[1]).toMatchObject({
        initialY0: null,
        initialY1: 2,
        x: 2,
        y0: 0,
        y1: 2,
        mark: null,
      });
      expect(formattedDataSeries[0].data[3]).toMatchObject({
        initialY0: null,
        initialY1: 4,
        x: 4,
        y0: 0,
        y1: 4,
        mark: null,
      });
      expect(formattedDataSeries[1].data[0]).toMatchObject({
        initialY0: null,
        initialY1: 21,
        x: 1,
        y0: 1,
        y1: 22,
        mark: null,
      });
      expect(formattedDataSeries[1].data[2]).toMatchObject({
        initialY0: null,
        initialY1: 23,
        x: 3,
        y0: 0,
        y1: 23,
        mark: null,
      });
    });
  });
  test('Correctly handle 0 values on percentage stack', () => {
    const store = MockStore.default();
    MockStore.addSpecs(
      MockSeriesSpec.area({
        xScaleType: ScaleType.Linear,
        yAccessors: ['y1'],
        splitSeriesAccessors: ['g'],
        stackAccessors: ['x'],
        data: [
          { x: 1, y1: 0, g: 'a' },
          { x: 1, y1: 0, g: 'b' },
        ],
      }),
      store,
    );
    const { formattedDataSeries } = computeSeriesDomainsSelector(store.getState());

    expect(formattedDataSeries[1].data[0]).toMatchObject({
      initialY0: null,
      initialY1: 0,
      x: 1,
      y0: 0,
      y1: 0,
      mark: null,
    });
    expect(formattedDataSeries[0].data[0]).toMatchObject({
      initialY0: null,
      initialY1: 0,
      x: 1,
      y0: 0,
      y1: 0,
      mark: null,
    });
  });
});
