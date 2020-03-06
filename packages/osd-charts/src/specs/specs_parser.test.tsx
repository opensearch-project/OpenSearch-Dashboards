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

import { mount } from 'enzyme';
import * as React from 'react';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import { SpecsParser } from './specs_parser';
import { chartStoreReducer } from '../state/chart_state';
import { BarSeries } from '../';
import { DEFAULT_SETTINGS_SPEC } from './settings';
import { BarSeriesSpec } from '../chart_types/xy_chart/utils/specs';

describe('Specs parser', () => {
  test('can mount the spec parser', () => {
    const storeReducer = chartStoreReducer('chart_id');
    const chartStore = createStore(storeReducer);

    expect(chartStore.getState().specsInitialized).toBe(false);
    const component = (
      <Provider store={chartStore}>
        <SpecsParser />
      </Provider>
    );
    mount(component);
    expect(chartStore.getState().specsInitialized).toBe(true);
  });
  test('can parse few components', () => {
    const storeReducer = chartStoreReducer('chart_id');
    const chartStore = createStore(storeReducer);

    expect(chartStore.getState().specsInitialized).toBe(false);
    const component = (
      <Provider store={chartStore}>
        <SpecsParser>
          <BarSeries
            id="bars"
            xAccessor={0}
            yAccessors={[1]}
            data={[
              [0, 1],
              [1, 2],
            ]}
          />
          <BarSeries
            id="bars"
            xAccessor={0}
            yAccessors={[1]}
            data={[
              [0, 1],
              [1, 2],
            ]}
          />
          <BarSeries
            id="bars2"
            xAccessor={0}
            yAccessors={[1]}
            data={[
              [0, 1],
              [1, 2],
            ]}
          />
        </SpecsParser>
      </Provider>
    );
    mount(component);
    const state = chartStore.getState();
    expect(state.specsInitialized).toBe(true);
    expect(Object.keys(state.specs)).toEqual([DEFAULT_SETTINGS_SPEC.id, 'bars', 'bars2']);
    expect(state.specs['bars']).toBeDefined();
    expect(state.specs['bars2']).toBeDefined();
  });
  test('can update a component', () => {
    const storeReducer = chartStoreReducer('chart_id');
    const chartStore = createStore(storeReducer);

    expect(chartStore.getState().specsInitialized).toBe(false);
    const component = (
      <Provider store={chartStore}>
        <SpecsParser>
          <BarSeries
            id="bars"
            xAccessor={0}
            yAccessors={[1]}
            data={[
              [0, 1],
              [1, 2],
            ]}
          />
        </SpecsParser>
      </Provider>
    );
    const wrapper = mount(component);

    wrapper.setProps({
      children: (
        <SpecsParser>
          <BarSeries
            id="bars"
            xAccessor={1}
            yAccessors={[1]}
            data={[
              [0, 1],
              [1, 2],
            ]}
          />
        </SpecsParser>
      ),
    });
    const state = chartStore.getState();
    expect((state.specs['bars'] as BarSeriesSpec).xAccessor).toBe(1);
  });
  test('set initialization to false on unmount', () => {
    const storeReducer = chartStoreReducer('chart_id');
    const chartStore = createStore(storeReducer);
    const component = mount(
      <Provider store={chartStore}>
        <SpecsParser />
      </Provider>,
    );
    component.unmount();
    expect(chartStore.getState().specsInitialized).toBe(false);
  });
});
