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
import { upsertSpec, specParsed } from '../../../state/actions/specs';
import { MockSeriesSpec, MockGlobalSpec } from '../../../mocks/specs';
import { updateParentDimensions } from '../../../state/actions/chart_settings';
import { getTooltipInfoAndGeometriesSelector } from './selectors/get_tooltip_values_highlighted_geoms';
import { onPointerMove } from '../../../state/actions/mouse';
import { TooltipType } from '../../../specs';

describe('XYChart - State tooltips', () => {
  let store: Store<GlobalChartState>;
  beforeEach(() => {
    const storeReducer = chartStoreReducer('chartId');
    store = createStore(storeReducer);
    store.dispatch(
      upsertSpec(
        MockSeriesSpec.bar({
          data: [
            { x: 1, y: 10 },
            { x: 2, y: 5 },
          ],
        }),
      ),
    );
    store.dispatch(upsertSpec(MockGlobalSpec.settings()));
    store.dispatch(specParsed());
    store.dispatch(updateParentDimensions({ width: 100, height: 100, top: 0, left: 0 }));
  });

  describe('should compute tooltip values depending on tooltip type', () => {
    it.each<[TooltipType, number, boolean, number]>([
      [TooltipType.None, 0, true, 0],
      [TooltipType.Follow, 1, false, 1],
      [TooltipType.VerticalCursor, 1, false, 1],
      [TooltipType.Crosshairs, 1, false, 1],
    ])('tooltip type %s', (tooltipType, expectedHgeomsLength, expectHeader, expectedTooltipValuesLength) => {
      store.dispatch(onPointerMove({ x: 25, y: 50 }, 0));
      store.dispatch(
        upsertSpec(
          MockGlobalSpec.settings({
            tooltip: {
              type: tooltipType,
            },
          }),
        ),
      );
      store.dispatch(specParsed());
      const state = store.getState();
      const tooltipValues = getTooltipInfoAndGeometriesSelector(state);
      expect(tooltipValues.tooltip.values).toHaveLength(expectedTooltipValuesLength);
      expect(tooltipValues.tooltip.header === null).toBe(expectHeader);
      expect(tooltipValues.highlightedGeometries).toHaveLength(expectedHgeomsLength);
    });
  });
});
