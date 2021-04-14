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

import { MockGlobalSpec, MockSeriesSpec } from '../../../mocks/specs';
import { MockStore } from '../../../mocks/store/store';
import { GlobalChartState } from '../../../state/chart_state';
import { getSettingsSpecSelector } from '../../../state/selectors/get_settings_specs';

describe('custom description for screen readers', () => {
  let store: Store<GlobalChartState>;
  beforeEach(() => {
    store = MockStore.default();
    MockStore.addSpecs(
      [
        MockSeriesSpec.bar({
          data: [
            { x: 1, y: 10 },
            { x: 2, y: 5 },
          ],
        }),
        MockGlobalSpec.settings(),
      ],
      store,
    );
  });
  it('should test defaults', () => {
    const state = store.getState();
    const { description, useDefaultSummary } = getSettingsSpecSelector(state);
    expect(description).toBeUndefined();
    expect(useDefaultSummary).toBeTrue();
  });
  it('should allow user to set a custom description for chart', () => {
    MockStore.addSpecs(
      [
        MockGlobalSpec.settings({
          description: 'This is sample Kibana data',
        }),
      ],
      store,
    );
    const state = store.getState();
    const { description } = getSettingsSpecSelector(state);
    expect(description).toBe('This is sample Kibana data');
  });
  it('should be able to disable generated descriptions', () => {
    MockStore.addSpecs(
      [
        MockGlobalSpec.settings({
          useDefaultSummary: false,
        }),
      ],
      store,
    );
    const state = store.getState();
    const { useDefaultSummary } = getSettingsSpecSelector(state);
    expect(useDefaultSummary).toBe(false);
  });
});
