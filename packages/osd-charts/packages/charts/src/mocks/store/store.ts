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

import { Cancelable } from 'lodash';
import { createStore, Store } from 'redux';

import { DEFAULT_SETTINGS_SPEC, SettingsSpec, Spec, SpecType } from '../../specs';
import { updateParentDimensions } from '../../state/actions/chart_settings';
import { upsertSpec, specParsed } from '../../state/actions/specs';
import { chartStoreReducer, GlobalChartState } from '../../state/chart_state';
import { getSettingsSpecSelector } from '../../state/selectors/get_settings_specs';
import { mergePartial } from '../../utils/common';

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
    if (Array.isArray(specs)) {
      const actions = specs.map(upsertSpec);
      actions.forEach(store.dispatch);
      if (!specs.some((s) => s.id === DEFAULT_SETTINGS_SPEC.id)) {
        store.dispatch(upsertSpec(DEFAULT_SETTINGS_SPEC));
      }
    } else {
      store.dispatch(upsertSpec(specs));
      if (specs.id !== DEFAULT_SETTINGS_SPEC.id) {
        store.dispatch(upsertSpec(DEFAULT_SETTINGS_SPEC));
      }
    }
    store.dispatch(specParsed());
  }

  static updateDimensions(
    { width, height, top, left } = { width: 100, height: 100, top: 0, left: 0 },
    store: Store<GlobalChartState>,
  ) {
    store.dispatch(updateParentDimensions({ width, height, top, left }));
  }

  /**
   * udpate settings spec in store
   */
  static updateSettings(store: Store<GlobalChartState>, newSettings: Partial<SettingsSpec>) {
    const specs = Object.values(store.getState().specs).map((s) => {
      if (s.specType === SpecType.Settings) {
        return mergePartial(s, newSettings);
      }

      return s;
    });

    MockStore.addSpecs(specs, store);
  }

  /**
   * flush all debounced listeners
   *
   * See packages/charts/src/__mocks__/ts-debounce.ts
   */
  static flush(store: Store<GlobalChartState>) {
    const settings = getSettingsSpecSelector(store.getState());

    // debounce mocked as lodash.debounce to enable flush
    if (settings.onPointerUpdate) ((settings.onPointerUpdate as unknown) as Cancelable).flush();
  }
}
