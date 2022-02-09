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

import { debounce } from 'ts-debounce';

import { ChartType } from '../../chart_types';
import { SpecType, DEFAULT_SETTINGS_SPEC } from '../../specs/constants';
import { SettingsSpec } from '../../specs/settings';
import { GlobalChartState } from '../chart_state';
import { createCustomCachedSelector } from '../create_selector';
import { getSpecsFromStore } from '../utils';

const DEFAULT_POINTER_UPDATE_DEBOUNCE = 16;

/** @internal */
export const getSpecs = (state: GlobalChartState) => state.specs;

/**
 * @internal
 */
export const getSettingsSpecSelector = createCustomCachedSelector(
  [getSpecs],
  (specs): SettingsSpec => {
    const settingsSpecs = getSpecsFromStore<SettingsSpec>(specs, ChartType.Global, SpecType.Settings);
    if (settingsSpecs.length === 1) {
      return handleListenerDebouncing(settingsSpecs[0]);
    }
    return DEFAULT_SETTINGS_SPEC;
  },
);

function handleListenerDebouncing(settings: SettingsSpec): SettingsSpec {
  const delay = settings.pointerUpdateDebounce ?? DEFAULT_POINTER_UPDATE_DEBOUNCE;

  if (settings.onPointerUpdate) settings.onPointerUpdate = debounce(settings.onPointerUpdate, delay);

  return settings;
}
