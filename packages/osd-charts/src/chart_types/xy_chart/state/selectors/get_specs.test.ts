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

import { getSeriesSpecsSelector } from './get_specs';
import { getInitialState } from '../../../../state/chart_state';
import { MockSeriesSpec } from '../../../../mocks/specs';

describe('selector - get_specs', () => {
  const state = getInitialState('chartId1');
  beforeEach(() => {
    state.specs['bars1'] = MockSeriesSpec.bar({ id: 'bars1' });
    state.specs['bars2'] = MockSeriesSpec.bar({ id: 'bars2' });
  });
  it('shall return the same ref objects', () => {
    const series = getSeriesSpecsSelector(state);
    expect(series.length).toBe(2);
    const seriesSecondCall = getSeriesSpecsSelector({ ...state, specsInitialized: true });
    expect(series).toBe(seriesSecondCall);
  });
});
