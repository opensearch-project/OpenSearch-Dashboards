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

import { GlobalChartState, chartStoreReducer } from '../../../state/chart_state';
import { createStore, Store } from 'redux';
import { upsertSpec, specParsed, specParsing } from '../../../state/actions/specs';
import { MockSeriesSpec } from '../../../mocks/specs';
import { getLegendItemsSelector } from '../../../state/selectors/get_legend_items';

const data = [
  { x: 0, y: 10 },
  { x: 1, y: 10 },
];

describe('XYChart - specs ordering', () => {
  let store: Store<GlobalChartState>;
  beforeEach(() => {
    const storeReducer = chartStoreReducer('chartId');
    store = createStore(storeReducer);
    store.dispatch(specParsing());
  });

  it('the legend respect the insert [A, B, C] order', () => {
    store.dispatch(specParsing());
    store.dispatch(upsertSpec(MockSeriesSpec.bar({ id: 'A', data })));
    store.dispatch(upsertSpec(MockSeriesSpec.bar({ id: 'B', data })));
    store.dispatch(upsertSpec(MockSeriesSpec.bar({ id: 'C', data })));
    store.dispatch(specParsed());

    const legendItems = getLegendItemsSelector(store.getState());
    const names = [...legendItems.values()].map((item) => item.name);
    expect(names).toEqual(['A', 'B', 'C']);
  });
  it('the legend respect the insert order [B, A, C]', () => {
    store.dispatch(specParsing());
    store.dispatch(upsertSpec(MockSeriesSpec.bar({ id: 'B', data })));
    store.dispatch(upsertSpec(MockSeriesSpec.bar({ id: 'A', data })));
    store.dispatch(upsertSpec(MockSeriesSpec.bar({ id: 'C', data })));
    store.dispatch(specParsed());
    const legendItems = getLegendItemsSelector(store.getState());
    const names = [...legendItems.values()].map((item) => item.name);
    expect(names).toEqual(['B', 'A', 'C']);
  });
  it('the legend respect the order when changing properties of existing specs', () => {
    store.dispatch(specParsing());
    store.dispatch(upsertSpec(MockSeriesSpec.bar({ id: 'A', data })));
    store.dispatch(upsertSpec(MockSeriesSpec.bar({ id: 'B', data })));
    store.dispatch(upsertSpec(MockSeriesSpec.bar({ id: 'C', data })));
    store.dispatch(specParsed());

    let legendItems = getLegendItemsSelector(store.getState());
    let names = [...legendItems.values()].map((item) => item.name);
    expect(names).toEqual(['A', 'B', 'C']);

    store.dispatch(specParsing());
    store.dispatch(upsertSpec(MockSeriesSpec.bar({ id: 'A', data })));
    store.dispatch(upsertSpec(MockSeriesSpec.bar({ id: 'B', name: 'B updated', data })));
    store.dispatch(upsertSpec(MockSeriesSpec.bar({ id: 'C', data })));
    store.dispatch(specParsed());

    legendItems = getLegendItemsSelector(store.getState());
    names = [...legendItems.values()].map((item) => item.name);
    expect(names).toEqual(['A', 'B updated', 'C']);
  });
  it('the legend respect the order when changing the order of the specs', () => {
    store.dispatch(specParsing());
    store.dispatch(upsertSpec(MockSeriesSpec.bar({ id: 'A', data })));
    store.dispatch(upsertSpec(MockSeriesSpec.bar({ id: 'B', data })));
    store.dispatch(upsertSpec(MockSeriesSpec.bar({ id: 'C', data })));
    store.dispatch(specParsed());

    let legendItems = getLegendItemsSelector(store.getState());
    let names = [...legendItems.values()].map((item) => item.name);
    expect(names).toEqual(['A', 'B', 'C']);

    store.dispatch(specParsing());
    store.dispatch(upsertSpec(MockSeriesSpec.bar({ id: 'B', data })));
    store.dispatch(upsertSpec(MockSeriesSpec.bar({ id: 'A', data })));
    store.dispatch(upsertSpec(MockSeriesSpec.bar({ id: 'C', data })));
    store.dispatch(specParsed());

    legendItems = getLegendItemsSelector(store.getState());
    names = [...legendItems.values()].map((item) => item.name);
    expect(names).toEqual(['B', 'A', 'C']);
  });
});
