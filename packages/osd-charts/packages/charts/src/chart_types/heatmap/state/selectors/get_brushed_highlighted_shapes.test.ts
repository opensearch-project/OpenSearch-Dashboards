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
import { onMouseDown, onMouseUp, onPointerMove } from '../../../../state/actions/mouse';
import { GlobalChartState } from '../../../../state/chart_state';
import { createOnBrushEndCaller } from './on_brush_end_caller';

describe('Heatmap brush', () => {
  let store: Store<GlobalChartState>;
  let onBrushEndMock = jest.fn();

  beforeEach(() => {
    store = MockStore.default({ width: 300, height: 300, top: 0, left: 0 }, 'chartId');
    onBrushEndMock = jest.fn();
    MockStore.addSpecs(
      [
        MockGlobalSpec.settingsNoMargins(),
        MockSeriesSpec.heatmap({
          xScaleType: ScaleType.Ordinal,
          data: [
            { x: 'a', y: 'ya', value: 1 },
            { x: 'b', y: 'ya', value: 2 },
            { x: 'c', y: 'ya', value: 3 },
            { x: 'a', y: 'yb', value: 4 },
            { x: 'b', y: 'yb', value: 5 },
            { x: 'c', y: 'yb', value: 6 },
            { x: 'a', y: 'yc', value: 7 },
            { x: 'b', y: 'yc', value: 8 },
            { x: 'c', y: 'yc', value: 9 },
          ],
          config: {
            grid: {
              cellHeight: {
                max: 'fill',
              },
              cellWidth: {
                max: 'fill',
              },
            },
            xAxisLabel: {
              visible: false,
            },
            yAxisLabel: {
              visible: false,
            },
            margin: { top: 0, bottom: 0, left: 0, right: 0 },
            onBrushEnd: onBrushEndMock,
          },
        }),
      ],
      store,
    );
  });

  it('should brush on categorical scale', () => {
    const caller = createOnBrushEndCaller();
    store.dispatch(onPointerMove({ x: 50, y: 50 }, 0));
    store.dispatch(onMouseDown({ x: 50, y: 50 }, 100));
    store.dispatch(onPointerMove({ x: 150, y: 250 }, 200));
    store.dispatch(onMouseUp({ x: 150, y: 250 }, 300));
    caller(store.getState());
    expect(onBrushEndMock).toBeCalledTimes(1);
    const brushEvent = onBrushEndMock.mock.calls[0][0];
    expect(brushEvent.cells).toHaveLength(6);
    expect(brushEvent.x).toEqual(['a', 'b']);
    expect(brushEvent.y).toEqual(['ya', 'yb', 'yc']);
  });
});
