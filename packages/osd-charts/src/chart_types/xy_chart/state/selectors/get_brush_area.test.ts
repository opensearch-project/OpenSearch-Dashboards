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
import { ScaleType } from '../../../../scales/constants';
import { BrushAxis } from '../../../../specs/constants';
import { onMouseDown, onMouseUp, onPointerMove } from '../../../../state/actions/mouse';
import { getBrushAreaSelector } from './get_brush_area';

describe('getBrushArea selector', () => {
  describe('compute brush', () => {
    it('along the X axis', () => {
      const store = MockStore.default({ left: 0, top: 0, width: 100, height: 100 });
      const onBrushEnd = jest.fn();
      MockStore.addSpecs(
        [
          MockGlobalSpec.settingsNoMargins({ onBrushEnd }),
          MockSeriesSpec.line({
            xAccessor: 0,
            yAccessors: [1],
            xScaleType: ScaleType.Linear,
            data: [
              [0, 10],
              [0.5, 5],
              [1, 3],
            ],
          }),
        ],
        store,
      );
      store.dispatch(onMouseDown({ x: 10, y: 10 }, 0));
      store.dispatch(onPointerMove({ x: 30, y: 30 }, 1000));
      const xBrushArea = getBrushAreaSelector(store.getState());
      store.dispatch(onMouseUp({ x: 30, y: 30 }, 1100));
      store.getState().internalChartState?.eventCallbacks(store.getState());

      expect(onBrushEnd).toHaveBeenCalled();
      expect(onBrushEnd.mock.calls[0][0].x[0]).toBeCloseTo(0.1);
      expect(onBrushEnd.mock.calls[0][0].x[1]).toBeCloseTo(0.3);

      expect(xBrushArea).toEqual({
        top: 0,
        left: 10,
        width: 20,
        height: 100,
      });
    });

    it('along the Y axis', () => {
      const store = MockStore.default({ left: 0, top: 0, width: 100, height: 100 });
      const onBrushEnd = jest.fn();
      MockStore.addSpecs(
        [
          MockGlobalSpec.settingsNoMargins({ onBrushEnd, brushAxis: BrushAxis.Y }),
          MockSeriesSpec.line({
            xAccessor: 0,
            yAccessors: [1],
            xScaleType: ScaleType.Linear,
            data: [
              [0, 10],
              [0.5, 5],
              [1, 3],
            ],
          }),
        ],
        store,
      );
      store.dispatch(onMouseDown({ x: 10, y: 10 }, 0));
      store.dispatch(onPointerMove({ x: 30, y: 30 }, 1000));
      const yBrushArea = getBrushAreaSelector(store.getState());
      store.dispatch(onMouseUp({ x: 30, y: 30 }, 1100));
      store.getState().internalChartState?.eventCallbacks(store.getState());

      expect(onBrushEnd).toHaveBeenCalled();
      const brushData = onBrushEnd.mock.calls[0][0].y;

      expect(brushData[0].extent[0]).toBeCloseTo(7);
      expect(brushData[0].extent[1]).toBeCloseTo(9);

      expect(yBrushArea).toEqual({
        top: 10,
        left: 0,
        width: 100,
        height: 20,
      });
    });

    it('along both axis', () => {
      const store = MockStore.default({ left: 0, top: 0, width: 100, height: 100 });
      const onBrushEnd = jest.fn();
      MockStore.addSpecs(
        [
          MockGlobalSpec.settingsNoMargins({ onBrushEnd, brushAxis: BrushAxis.Both }),
          MockSeriesSpec.line({
            xAccessor: 0,
            yAccessors: [1],
            xScaleType: ScaleType.Linear,
            data: [
              [0, 10],
              [0.5, 5],
              [1, 3],
            ],
          }),
        ],
        store,
      );
      store.dispatch(onMouseDown({ x: 10, y: 10 }, 0));
      store.dispatch(onPointerMove({ x: 30, y: 30 }, 1000));
      const bothBrushArea = getBrushAreaSelector(store.getState());
      store.dispatch(onMouseUp({ x: 30, y: 30 }, 1100));
      store.getState().internalChartState?.eventCallbacks(store.getState());

      expect(onBrushEnd).toHaveBeenCalled();

      expect(onBrushEnd.mock.calls[0][0].x[0]).toBeCloseTo(0.1);
      expect(onBrushEnd.mock.calls[0][0].x[1]).toBeCloseTo(0.3);
      expect(onBrushEnd.mock.calls[0][0].y[0].extent[0]).toBeCloseTo(7);
      expect(onBrushEnd.mock.calls[0][0].y[0].extent[1]).toBeCloseTo(9);

      expect(bothBrushArea).toEqual({
        top: 10,
        left: 10,
        width: 20,
        height: 20,
      });
    });
  });

  describe('compute brush on a rotated chart', () => {
    it('along the X axis', () => {
      const store = MockStore.default({ left: 0, top: 0, width: 100, height: 100 });
      const onBrushEnd = jest.fn();
      MockStore.addSpecs(
        [
          MockGlobalSpec.settingsNoMargins({ onBrushEnd, rotation: 90 }),
          MockSeriesSpec.line({
            xAccessor: 0,
            yAccessors: [1],
            xScaleType: ScaleType.Linear,
            data: [
              [0, 10],
              [0.5, 5],
              [1, 3],
            ],
          }),
        ],
        store,
      );
      store.dispatch(onMouseDown({ x: 10, y: 10 }, 0));
      store.dispatch(onPointerMove({ x: 30, y: 30 }, 1000));
      const xBrushArea = getBrushAreaSelector(store.getState());
      store.dispatch(onMouseUp({ x: 30, y: 30 }, 1100));
      store.getState().internalChartState?.eventCallbacks(store.getState());

      expect(onBrushEnd).toHaveBeenCalled();
      expect(onBrushEnd.mock.calls[0][0].x[0]).toBeCloseTo(0.1);
      expect(onBrushEnd.mock.calls[0][0].x[1]).toBeCloseTo(0.3);

      expect(xBrushArea).toEqual({
        top: 10,
        left: 0,
        width: 100,
        height: 20,
      });
    });

    it('along the Y axis', () => {
      const store = MockStore.default({ left: 0, top: 0, width: 100, height: 100 });
      const onBrushEnd = jest.fn();
      MockStore.addSpecs(
        [
          MockGlobalSpec.settingsNoMargins({ onBrushEnd, brushAxis: BrushAxis.Y, rotation: 90 }),
          MockSeriesSpec.line({
            xAccessor: 0,
            yAccessors: [1],
            xScaleType: ScaleType.Linear,
            data: [
              [0, 10],
              [0.5, 5],
              [1, 3],
            ],
          }),
        ],
        store,
      );
      store.dispatch(onMouseDown({ x: 10, y: 10 }, 0));
      store.dispatch(onPointerMove({ x: 30, y: 30 }, 1000));
      const yBrushArea = getBrushAreaSelector(store.getState());
      store.dispatch(onMouseUp({ x: 30, y: 30 }, 1100));
      store.getState().internalChartState?.eventCallbacks(store.getState());

      expect(onBrushEnd).toHaveBeenCalled();
      const brushData = onBrushEnd.mock.calls[0][0].y;

      expect(brushData[0].extent[0]).toBeCloseTo(1);
      expect(brushData[0].extent[1]).toBeCloseTo(3);

      expect(yBrushArea).toEqual({
        top: 0,
        left: 10,
        width: 20,
        height: 100,
      });
    });

    it('along both axis', () => {
      const store = MockStore.default({ left: 0, top: 0, width: 100, height: 100 });
      const onBrushEnd = jest.fn();
      MockStore.addSpecs(
        [
          MockGlobalSpec.settingsNoMargins({ onBrushEnd, brushAxis: BrushAxis.Both, rotation: 90 }),
          MockSeriesSpec.line({
            xAccessor: 0,
            yAccessors: [1],
            xScaleType: ScaleType.Linear,
            data: [
              [0, 10],
              [0.5, 5],
              [1, 3],
            ],
          }),
        ],
        store,
      );
      store.dispatch(onMouseDown({ x: 10, y: 10 }, 0));
      store.dispatch(onPointerMove({ x: 30, y: 30 }, 1000));
      const bothBrushArea = getBrushAreaSelector(store.getState());
      store.dispatch(onMouseUp({ x: 30, y: 30 }, 1100));
      store.getState().internalChartState?.eventCallbacks(store.getState());

      expect(onBrushEnd).toHaveBeenCalled();

      expect(onBrushEnd.mock.calls[0][0].x[0]).toBeCloseTo(0.1);
      expect(onBrushEnd.mock.calls[0][0].x[1]).toBeCloseTo(0.3);
      expect(onBrushEnd.mock.calls[0][0].y[0].extent[0]).toBeCloseTo(1);
      expect(onBrushEnd.mock.calls[0][0].y[0].extent[1]).toBeCloseTo(3);

      expect(bothBrushArea).toEqual({
        top: 10,
        left: 10,
        width: 20,
        height: 20,
      });
    });
  });

  describe('limit brush to single panel w/small multiples', () => {
    const store = MockStore.default({ left: 0, top: 0, width: 200, height: 200 });
    const onBrushEnd = jest.fn();
    MockStore.addSpecs(
      [
        MockGlobalSpec.settingsNoMargins({ onBrushEnd }),
        MockGlobalSpec.groupBy({ id: 'hSplit' }),
        MockGlobalSpec.groupBy({ id: 'vSplit' }),
        MockGlobalSpec.smallMultiple({ splitHorizontally: 'hSplit', splitVertically: 'vSplit' }),
        MockSeriesSpec.line({
          id: '1',
          xAccessor: 0,
          yAccessors: [1],
          xScaleType: ScaleType.Linear,
          data: [
            [0, 10],
            [0.5, 5],
            [1, 3],
          ],
        }),
        MockSeriesSpec.line({
          id: '2',
          xAccessor: 0,
          yAccessors: [1],
          xScaleType: ScaleType.Linear,
          data: [
            [0, 5],
            [0.5, 2],
            [1, 6],
          ],
        }),
      ],
      store,
    );

    store.dispatch(onMouseDown({ x: 150, y: 10 }, 0));
    store.dispatch(onPointerMove({ x: 10, y: 150 }, 1000));
    const bothBrushArea = getBrushAreaSelector(store.getState());
    expect(bothBrushArea).toEqual({
      top: 0,
      left: 150,
      width: -50,
      height: 100,
    });

    store.dispatch(onMouseUp({ x: 10, y: 150 }, 1100));
    store.getState().internalChartState?.eventCallbacks(store.getState());

    expect(onBrushEnd).toHaveBeenCalled();

    expect(onBrushEnd.mock.calls[0][0].x[0]).toBeCloseTo(0);
    expect(onBrushEnd.mock.calls[0][0].x[1]).toBeCloseTo(0.5);
  });
});
