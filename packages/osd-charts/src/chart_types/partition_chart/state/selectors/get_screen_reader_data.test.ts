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

import { MockSeriesSpec } from '../../../../mocks/specs/specs';
import { MockStore } from '../../../../mocks/store';
import { GlobalChartState } from '../../../../state/chart_state';
import { PrimitiveValue } from '../../layout/utils/group_by_rollup';
import { getScreenReaderDataSelector } from './get_screen_reader_data';

describe('Get screen reader data', () => {
  type TestDatum = [string, string, string, number];
  const spec1 = MockSeriesSpec.sunburst({
    data: [
      ['aaa', 'aa', '1', 1],
      ['aaa', 'aa', '3', 1],
      ['aaa', 'bb', '4', 1],
    ],
    valueAccessor: (d: TestDatum) => d[3],
    layers: [
      {
        groupByRollup: (datum: TestDatum) => datum[0],
        nodeLabel: (d: PrimitiveValue) => String(d),
      },
      {
        groupByRollup: (datum: TestDatum) => datum[1],
        nodeLabel: (d: PrimitiveValue) => String(d),
      },
      {
        groupByRollup: (datum: TestDatum) => datum[2],
        nodeLabel: (d: PrimitiveValue) => String(d),
      },
    ],
  });

  const specNoSlice = MockSeriesSpec.sunburst({
    data: [],
    valueAccessor: (d: TestDatum) => d[3],
    layers: [
      {
        groupByRollup: (datum: TestDatum) => datum[0],
        nodeLabel: (d: PrimitiveValue) => String(d),
      },
      {
        groupByRollup: (datum: TestDatum) => datum[1],
        nodeLabel: (d: PrimitiveValue) => String(d),
      },
      {
        groupByRollup: (datum: TestDatum) => datum[2],
        nodeLabel: (d: PrimitiveValue) => String(d),
      },
    ],
  });
  let store: Store<GlobalChartState>;

  beforeEach(() => {
    store = MockStore.default();
  });

  it('should test defaults', () => {
    MockStore.addSpecs([spec1], store);
    const expected = getScreenReaderDataSelector(store.getState());
    expect(expected).toEqual({
      data: [
        { depth: 1, label: 'aaa', panelTitle: '', parentName: 'none', percentage: '100%', value: 3, valueText: '3' },
        { depth: 2, label: 'aa', panelTitle: '', parentName: 'aaa', percentage: '67%', value: 2, valueText: '2' },
        { depth: 3, label: '1', panelTitle: '', parentName: 'aa', percentage: '33%', value: 1, valueText: '1' },
        { depth: 3, label: '3', panelTitle: '', parentName: 'aa', percentage: '33%', value: 1, valueText: '1' },
        { depth: 2, label: 'bb', panelTitle: '', parentName: 'aaa', percentage: '33%', value: 1, valueText: '1' },
        { depth: 3, label: '4', panelTitle: '', parentName: 'bb', percentage: '33%', value: 1, valueText: '1' },
      ],
      hasMultipleLayers: true,
      isSmallMultiple: false,
    });
  });
  it('should compute screen reader data for no slices in pie', () => {
    MockStore.addSpecs([specNoSlice], store);
    const expected = getScreenReaderDataSelector(store.getState());
    expect(expected).toEqual({
      data: [],
      hasMultipleLayers: true,
      isSmallMultiple: false,
    });
  });
});
