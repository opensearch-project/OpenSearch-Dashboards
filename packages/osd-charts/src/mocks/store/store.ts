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

import { chartStoreReducer, GlobalChartState } from '../../state/chart_state';
import { createStore, Store } from 'redux';
import { specParsing, upsertSpec, specParsed } from '../../state/actions/specs';
import { Spec } from '../../specs';
import { updateParentDimensions } from '../../state/actions/chart_settings';

/** @internal */
export class MockStore {
  static default(
    { width, height, top, left } = { width: 100, height: 100, top: 0, left: 0 },
    chartId = 'chartId',
  ): Store<GlobalChartState> {
    const storeReducer = chartStoreReducer(chartId);
    const store = createStore(storeReducer);
    store.dispatch(updateParentDimensions({ width, height, top, left }));
    return store;
  }

  static addSpecs(specs: Spec | Array<Spec>, store: Store<GlobalChartState>) {
    store.dispatch(specParsing());
    if (Array.isArray(specs)) {
      const actions = specs.map(upsertSpec);
      actions.forEach(store.dispatch);
    } else {
      store.dispatch(upsertSpec(specs));
    }
    store.dispatch(specParsed());
  }

  static updateDimensions(
    { width, height, top, left } = { width: 100, height: 100, top: 0, left: 0 },
    store: Store<GlobalChartState>,
  ) {
    store.dispatch(updateParentDimensions({ width, height, top, left }));
  }
}
