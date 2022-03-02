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

import { MockGlobalSpec, MockSeriesSpec } from '../../../../mocks/specs/specs';
import { MockStore } from '../../../../mocks/store/store';
import { ScaleType } from '../../../../scales/constants';
import { onPointerMove } from '../../../../state/actions/mouse';
import { GlobalChartState } from '../../../../state/chart_state';
import { getTooltipInfoAndGeometriesSelector } from './get_tooltip_values_highlighted_geoms';

describe('Highlight points', () => {
  describe('On Ordinal area chart', () => {
    let store: Store<GlobalChartState>;
    beforeEach(() => {
      store = MockStore.default({ width: 300, height: 300, top: 0, left: 0 }, 'chartId');
      MockStore.addSpecs(
        [
          MockGlobalSpec.settingsNoMargins(),
          MockSeriesSpec.area({
            data: [
              { x: 0, y: 2 },
              { x: 1, y: 2 },
              { x: 2, y: 3 },
            ],
            xScaleType: ScaleType.Ordinal,
          }),
        ],
        store,
      );
    });
    it('On ordinal area chart, it should correctly highlight points', () => {
      store.dispatch(onPointerMove({ x: 50, y: 100 }, 0));
      const { highlightedGeometries } = getTooltipInfoAndGeometriesSelector(store.getState());
      expect(highlightedGeometries).toHaveLength(1);
    });
    it('On ordinal area chart, it should not highlight points if not within the buffer', () => {
      store.dispatch(onPointerMove({ x: 5, y: 100 }, 0));
      const { highlightedGeometries } = getTooltipInfoAndGeometriesSelector(store.getState());
      expect(highlightedGeometries).toHaveLength(0);
    });
  });
});
