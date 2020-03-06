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

import { getSettingsSpecSelector } from './get_settings_specs';
import { getInitialState } from '../chart_state';
import { DEFAULT_SETTINGS_SPEC } from '../../specs';
describe('selectors - getSettingsSpecSelector', () => {
  const state = getInitialState('chartId1');
  it('shall return the same reference', () => {
    const settings = getSettingsSpecSelector(state);
    expect(settings).toBe(DEFAULT_SETTINGS_SPEC);
  });
  it('shall avoid recomputations', () => {
    getSettingsSpecSelector(state);
    expect(getSettingsSpecSelector.recomputations()).toBe(1);
    getSettingsSpecSelector(state);
    expect(getSettingsSpecSelector.recomputations()).toBe(1);
    getSettingsSpecSelector({ ...state, specsInitialized: true });
    expect(getSettingsSpecSelector.recomputations()).toBe(1);
    getSettingsSpecSelector({ ...state, parentDimensions: { width: 100, height: 100, top: 100, left: 100 } });
    expect(getSettingsSpecSelector.recomputations()).toBe(1);
  });
  it('shall return new settings if settings changed', () => {
    const updatedSettings = {
      ...DEFAULT_SETTINGS_SPEC,
      rotation: 90,
    };
    const updatedState = {
      ...state,
      specs: {
        [DEFAULT_SETTINGS_SPEC.id]: updatedSettings,
      },
    };
    const settingsSpecToCheck = getSettingsSpecSelector(updatedState);
    expect(settingsSpecToCheck).toBe(updatedSettings);
    expect(getSettingsSpecSelector.recomputations()).toBe(2);
    getSettingsSpecSelector(updatedState);
    expect(getSettingsSpecSelector.recomputations()).toBe(2);
  });
});
