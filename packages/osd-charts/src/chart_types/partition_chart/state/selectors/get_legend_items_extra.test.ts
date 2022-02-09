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

import { MockSeriesSpec, MockGlobalSpec } from '../../../../mocks/specs';
import { MockStore } from '../../../../mocks/store';
import { GlobalChartState } from '../../../../state/chart_state';
import { PrimitiveValue } from '../../layout/utils/group_by_rollup';
import { getLegendItemsExtra } from './get_legend_items_extra';

describe('Partition - Legend item extra values', () => {
  type TestDatum = [string, string, string, number];
  const spec = MockSeriesSpec.sunburst({
    data: [
      ['aaa', 'aa', '1', 1],
      ['aaa', 'aa', '1', 2],
      ['aaa', 'aa', '3', 1],
      ['aaa', 'bb', '4', 1],
      ['aaa', 'bb', '5', 1],
      ['aaa', 'bb', '6', 1],
      ['bbb', 'aa', '7', 1],
      ['bbb', 'aa', '8', 1],
      ['bbb', 'bb', '9', 1],
      ['bbb', 'bb', '10', 1],
      ['bbb', 'cc', '11', 1],
      ['bbb', 'cc', '12', 1],
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
  let store: Store<GlobalChartState>;

  beforeEach(() => {
    store = MockStore.default();
  });

  it('should return all extra values in nested legend', () => {
    MockStore.addSpecs([spec], store);

    const extraValues = getLegendItemsExtra(store.getState());
    expect([...extraValues.keys()]).toEqual([
      '0__0',
      '0__0__0',
      '0__0__0__0',
      '0__0__0__0__0',
      '0__0__0__0__1',
      '0__0__0__1',
      '0__0__0__1__0',
      '0__0__0__1__1',
      '0__0__0__1__2',
      '0__0__1',
      '0__0__1__0',
      '0__0__1__0__0',
      '0__0__1__0__1',
      '0__0__1__1',
      '0__0__1__1__0',
      '0__0__1__1__1',
      '0__0__1__2',
      '0__0__1__2__0',
      '0__0__1__2__1',
    ]);
    expect(extraValues.values()).toMatchSnapshot();
  });

  it('should return extra values in nested legend within max depth of 1', () => {
    const settings = MockGlobalSpec.settings({ legendMaxDepth: 1 });
    MockStore.addSpecs([settings, spec], store);

    const extraValues = getLegendItemsExtra(store.getState());
    expect([...extraValues.keys()]).toEqual(['0__0', '0__0__0', '0__0__1']);
    expect(extraValues.values()).toMatchSnapshot();
  });

  it('should return extra values in nested legend within max depth of 2', () => {
    const settings = MockGlobalSpec.settings({ legendMaxDepth: 2 });
    MockStore.addSpecs([settings, spec], store);

    const extraValues = getLegendItemsExtra(store.getState());
    expect([...extraValues.keys()]).toEqual([
      '0__0',
      '0__0__0',
      '0__0__0__0',
      '0__0__0__1',
      '0__0__1',
      '0__0__1__0',
      '0__0__1__1',
      '0__0__1__2',
    ]);
    expect(extraValues.values()).toMatchSnapshot();
  });

  it('filters all extraValues if depth is 0', () => {
    const settings = MockGlobalSpec.settings({ legendMaxDepth: 0 });
    MockStore.addSpecs([settings, spec], store);

    const extraValues = getLegendItemsExtra(store.getState());
    expect([...extraValues.keys()]).toEqual([]);
  });

  it('filters all extraValues if depth is NaN', () => {
    const settings = MockGlobalSpec.settings({ legendMaxDepth: NaN });
    MockStore.addSpecs([settings, spec], store);

    const extraValues = getLegendItemsExtra(store.getState());
    expect([...extraValues.keys()]).toEqual([]);
  });
});
