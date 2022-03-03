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

import { MockGlobalSpec, MockSeriesSpec } from '../../../../mocks/specs/specs';
import { MockStore } from '../../../../mocks/store/store';
import { DEFAULT_GLOBAL_ID } from '../../utils/specs';
import { computeSeriesGeometriesSelector } from './compute_series_geometries';
import { getScaleConfigsFromSpecsSelector } from './get_api_scale_configs';

describe('GroupIds and useDefaultGroupId', () => {
  it('use the specified useDefaultGroupId to compute scale configs', () => {
    const store = MockStore.default();
    MockStore.addSpecs(
      [
        MockSeriesSpec.bar({
          groupId: 'other',
          useDefaultGroupDomain: 'a different one',
        }),
      ],
      store,
    );
    const scaleConfigs = getScaleConfigsFromSpecsSelector(store.getState());
    expect(scaleConfigs.y['a different one']).toBeDefined();
  });

  it('have 2 different y domains with 2 groups', () => {
    const store = MockStore.default();
    MockStore.addSpecs(
      [
        MockSeriesSpec.bar({ id: 'one' }),
        MockSeriesSpec.bar({
          id: 'two',
          groupId: 'other',
          useDefaultGroupDomain: 'a different one',
        }),
      ],
      store,
    );
    const scaleConfigs = getScaleConfigsFromSpecsSelector(store.getState());
    expect(Object.keys(scaleConfigs.y)).toHaveLength(2);
    expect(scaleConfigs.y['a different one']).toBeDefined();
    expect(scaleConfigs.y[DEFAULT_GLOBAL_ID]).toBeDefined();
  });

  it('have 2 different y domains with 3 groups', () => {
    const store = MockStore.default({ width: 120, height: 100, left: 0, top: 0 });
    MockStore.addSpecs(
      [
        MockGlobalSpec.settingsNoMargins(),
        MockSeriesSpec.bar({ id: 'one', data: [{ x: 1, y: 10 }] }),
        MockSeriesSpec.bar({
          id: 'two',
          groupId: 'other',
          useDefaultGroupDomain: 'a different one',
          data: [{ x: 1, y: 10 }],
        }),
        MockSeriesSpec.bar({
          id: 'three',
          groupId: 'another again',
          useDefaultGroupDomain: 'a different one',
          data: [{ x: 1, y: 10 }],
        }),
      ],
      store,
    );
    const scaleConfigs = getScaleConfigsFromSpecsSelector(store.getState());
    expect(Object.keys(scaleConfigs.y)).toHaveLength(2);
    expect(scaleConfigs.y['a different one']).toBeDefined();
    expect(scaleConfigs.y[DEFAULT_GLOBAL_ID]).toBeDefined();

    const geoms = computeSeriesGeometriesSelector(store.getState());
    const { bars } = geoms.geometries;
    expect(bars).toHaveLength(3);
    expect(bars[0].value[0].width).toBe(40);
    expect(bars[1].value[0].width).toBe(40);
    expect(bars[2].value[0].width).toBe(40);
  });
});
