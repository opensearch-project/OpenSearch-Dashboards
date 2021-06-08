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

// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable jest/no-conditional-expect */

import { Store } from 'redux';

import { ChartType } from '../..';
import { Rect } from '../../../geoms/types';
import { MockGlobalSpec, MockSeriesSpec } from '../../../mocks/specs/specs';
import { MockStore } from '../../../mocks/store';
import { ScaleType } from '../../../scales/constants';
import { SettingsSpec, XScaleType, XYBrushArea } from '../../../specs';
import { SpecType, TooltipType, BrushAxis } from '../../../specs/constants';
import { onExternalPointerEvent } from '../../../state/actions/events';
import { onPointerMove, onMouseDown, onMouseUp } from '../../../state/actions/mouse';
import { GlobalChartState } from '../../../state/chart_state';
import { getSettingsSpecSelector } from '../../../state/selectors/get_settings_specs';
import { Position, RecursivePartial } from '../../../utils/common';
import { AxisStyle } from '../../../utils/themes/theme';
import { BarSeriesSpec, BasicSeriesSpec, AxisSpec, SeriesType } from '../utils/specs';
import { computeSeriesGeometriesSelector } from './selectors/compute_series_geometries';
import { getCursorBandPositionSelector } from './selectors/get_cursor_band';
import { getProjectedPointerPositionSelector } from './selectors/get_projected_pointer_position';
import {
  getHighlightedGeomsSelector,
  getTooltipInfoAndGeometriesSelector,
} from './selectors/get_tooltip_values_highlighted_geoms';
import { isTooltipVisibleSelector } from './selectors/is_tooltip_visible';
import { createOnBrushEndCaller } from './selectors/on_brush_end_caller';
import { createOnClickCaller } from './selectors/on_click_caller';
import { createOnElementOutCaller } from './selectors/on_element_out_caller';
import { createOnElementOverCaller } from './selectors/on_element_over_caller';
import { createOnPointerMoveCaller } from './selectors/on_pointer_move_caller';

const SPEC_ID = 'spec_1';
const GROUP_ID = 'group_1';

const ordinalBarSeries = MockSeriesSpec.bar({
  id: SPEC_ID,
  groupId: GROUP_ID,
  data: [
    [0, 10],
    [1, 5],
  ],
  xAccessor: 0,
  yAccessors: [1],
  xScaleType: ScaleType.Ordinal,
  yScaleType: ScaleType.Linear,
  hideInLegend: false,
});
const linearBarSeries = MockSeriesSpec.bar({
  chartType: ChartType.XYAxis,
  specType: SpecType.Series,
  id: SPEC_ID,
  groupId: GROUP_ID,
  seriesType: SeriesType.Bar,
  data: [
    [0, 10],
    [1, 5],
  ],
  xAccessor: 0,
  yAccessors: [1],
  xScaleType: ScaleType.Linear,
  yScaleType: ScaleType.Linear,
  hideInLegend: false,
});
const chartTop = 10;
const chartLeft = 10;
const settingSpec = MockGlobalSpec.settings({
  tooltip: {
    type: TooltipType.VerticalCursor,
  },
  hideDuplicateAxes: false,
  theme: {
    chartPaddings: { top: 0, left: 0, bottom: 0, right: 0 },
    chartMargins: { top: 10, left: 10, bottom: 0, right: 0 },
    scales: {
      barsPadding: 0,
    },
  },
});

function initStore(spec: BasicSeriesSpec) {
  const store = MockStore.default({ width: 100, height: 100, top: chartTop, left: chartLeft }, 'chartId');
  MockStore.addSpecs([settingSpec, spec], store);
  return store;
}

describe('Chart state pointer interactions', () => {
  let store: Store<GlobalChartState>;
  const onElementOutCaller = createOnElementOutCaller();
  const onElementOverCaller = createOnElementOverCaller();
  beforeEach(() => {
    store = initStore(ordinalBarSeries);
  });
  test('check initial geoms', () => {
    const { geometries } = computeSeriesGeometriesSelector(store.getState());
    expect(geometries).toBeDefined();
    expect(geometries.bars).toBeDefined();
    expect(geometries.bars[0].value.length).toBe(2);
  });

  test('can convert/limit mouse pointer positions relative to chart projection', () => {
    store.dispatch(onPointerMove({ x: 20, y: 20 }, 0));
    let projectedPointerPosition = getProjectedPointerPositionSelector(store.getState());
    expect(projectedPointerPosition.x).toBe(10);
    expect(projectedPointerPosition.y).toBe(10);

    store.dispatch(onPointerMove({ x: 10, y: 10 }, 1));
    projectedPointerPosition = getProjectedPointerPositionSelector(store.getState());
    expect(projectedPointerPosition.x).toBe(0);
    expect(projectedPointerPosition.y).toBe(0);
    store.dispatch(onPointerMove({ x: 5, y: 5 }, 2));
    projectedPointerPosition = getProjectedPointerPositionSelector(store.getState());
    expect(projectedPointerPosition.x).toBe(-1);
    expect(projectedPointerPosition.y).toBe(-1);
    store.dispatch(onPointerMove({ x: 200, y: 20 }, 3));
    projectedPointerPosition = getProjectedPointerPositionSelector(store.getState());
    expect(projectedPointerPosition.x).toBe(-1);
    expect(projectedPointerPosition.y).toBe(10);
    store.dispatch(onPointerMove({ x: 20, y: 200 }, 4));
    projectedPointerPosition = getProjectedPointerPositionSelector(store.getState());
    expect(projectedPointerPosition.x).toBe(10);
    expect(projectedPointerPosition.y).toBe(-1);
    store.dispatch(onPointerMove({ x: 200, y: 200 }, 5));
    projectedPointerPosition = getProjectedPointerPositionSelector(store.getState());
    expect(projectedPointerPosition.x).toBe(-1);
    expect(projectedPointerPosition.y).toBe(-1);
    store.dispatch(onPointerMove({ x: -20, y: -20 }, 6));
    projectedPointerPosition = getProjectedPointerPositionSelector(store.getState());
    expect(projectedPointerPosition.x).toBe(-1);
    expect(projectedPointerPosition.y).toBe(-1);
  });

  test('call onElementOut if moving the mouse out from the chart', () => {
    const onOutListener = jest.fn((): undefined => undefined);
    const settingsWithListeners: SettingsSpec = {
      ...settingSpec,
      onElementOut: onOutListener,
    };

    MockStore.addSpecs([ordinalBarSeries, settingsWithListeners], store);
    // registering the out/over listener caller
    store.subscribe(() => {
      onElementOutCaller(store.getState());
      onElementOverCaller(store.getState());
    });
    store.dispatch(onPointerMove({ x: 20, y: 20 }, 0));
    expect(onOutListener).toBeCalledTimes(0);

    // no more calls after the first out one outside chart
    store.dispatch(onPointerMove({ x: 5, y: 5 }, 1));
    expect(onOutListener).toBeCalledTimes(1);
    store.dispatch(onPointerMove({ x: 3, y: 3 }, 2));
    expect(onOutListener).toBeCalledTimes(1);
  });

  test('can respond to tooltip types changes', () => {
    let updatedSettings: SettingsSpec = {
      ...settingSpec,
      tooltip: {
        type: TooltipType.None,
      },
    };
    MockStore.addSpecs([ordinalBarSeries, updatedSettings], store);
    store.dispatch(onPointerMove({ x: 10, y: 10 + 70 }, 0));
    const tooltipInfo = getTooltipInfoAndGeometriesSelector(store.getState());
    // no tooltip values exist if we have a TooltipType === None
    expect(tooltipInfo.tooltip.values.length).toBe(0);
    let isTooltipVisible = isTooltipVisibleSelector(store.getState());
    expect(isTooltipVisible.visible).toBe(false);

    updatedSettings = {
      ...settingSpec,
      tooltip: {
        type: TooltipType.Follow,
      },
    };
    MockStore.addSpecs([ordinalBarSeries, updatedSettings], store);
    store.dispatch(onPointerMove({ x: 10, y: 10 + 70 }, 1));
    const { geometriesIndex } = computeSeriesGeometriesSelector(store.getState());
    expect(geometriesIndex.size).toBe(2);
    const highlightedGeometries = getHighlightedGeomsSelector(store.getState());
    expect(highlightedGeometries.length).toBe(1);
    isTooltipVisible = isTooltipVisibleSelector(store.getState());
    expect(isTooltipVisible.visible).toBe(true);
  });

  describe('mouse over with Ordinal scale', () => {
    mouseOverTestSuite(ScaleType.Ordinal);
  });
  describe('mouse over with Linear scale', () => {
    mouseOverTestSuite(ScaleType.Linear);
  });

  it.todo('add test for point series');
  it.todo('add test for mixed series');
  it.todo('add test for clicks');
});

function mouseOverTestSuite(scaleType: XScaleType) {
  let store: Store<GlobalChartState>;
  let onOverListener: jest.Mock<undefined>;
  let onOutListener: jest.Mock<undefined>;
  let onPointerUpdateListener: jest.Mock<undefined>;
  const spec = scaleType === ScaleType.Ordinal ? ordinalBarSeries : linearBarSeries;
  beforeEach(() => {
    store = initStore(spec);
    onOverListener = jest.fn((): undefined => undefined);
    onOutListener = jest.fn((): undefined => undefined);
    onPointerUpdateListener = jest.fn((): undefined => undefined);
    const settingsWithListeners: SettingsSpec = {
      ...settingSpec,
      onElementOver: onOverListener,
      onElementOut: onOutListener,
      onPointerUpdate: onPointerUpdateListener,
    };
    MockStore.addSpecs([spec, settingsWithListeners], store);
    const onElementOutCaller = createOnElementOutCaller();
    const onElementOverCaller = createOnElementOverCaller();
    const onPointerMoveCaller = createOnPointerMoveCaller();
    store.subscribe(() => {
      const state = store.getState();
      onElementOutCaller(state);
      onElementOverCaller(state);
      onPointerMoveCaller(state);
    });
    const tooltipInfo = getTooltipInfoAndGeometriesSelector(store.getState());
    expect(tooltipInfo.tooltip.values).toEqual([]);
  });

  test('store is correctly configured', () => {
    // checking this to avoid broken tests due to nested describe and before
    const seriesGeoms = computeSeriesGeometriesSelector(store.getState());
    expect(seriesGeoms.scales.xScale).not.toBeUndefined();
    expect(seriesGeoms.scales.yScales).not.toBeUndefined();
  });

  test('avoid call pointer update listener if moving over the same element', () => {
    store.dispatch(onPointerMove({ x: chartLeft + 10, y: chartTop + 10 }, 0));
    expect(onPointerUpdateListener).toBeCalledTimes(1);

    const tooltipInfo1 = getTooltipInfoAndGeometriesSelector(store.getState());
    expect(tooltipInfo1.tooltip.values.length).toBe(1);
    // avoid calls
    store.dispatch(onPointerMove({ x: chartLeft + 12, y: chartTop + 12 }, 1));
    expect(onPointerUpdateListener).toBeCalledTimes(1);

    const tooltipInfo2 = getTooltipInfoAndGeometriesSelector(store.getState());
    expect(tooltipInfo2.tooltip.values.length).toBe(1);
    expect(tooltipInfo1).toEqual(tooltipInfo2);
  });

  test('call pointer update listener on move', () => {
    store.dispatch(onPointerMove({ x: chartLeft + 10, y: chartTop + 10 }, 0));
    expect(onPointerUpdateListener).toBeCalledTimes(1);
    expect(onPointerUpdateListener.mock.calls[0][0]).toEqual({
      chartId: 'chartId',
      scale: scaleType,
      type: 'Over',
      unit: undefined,
      value: 0,
    });

    // avoid multiple calls for the same value
    store.dispatch(onPointerMove({ x: chartLeft + 50, y: chartTop + 10 }, 1));
    expect(onPointerUpdateListener).toBeCalledTimes(2);
    expect(onPointerUpdateListener.mock.calls[1][0]).toEqual({
      chartId: 'chartId',
      scale: scaleType,
      type: 'Over',
      unit: undefined,
      value: 1,
    });

    store.dispatch(onPointerMove({ x: chartLeft + 200, y: chartTop + 10 }, 1));
    expect(onPointerUpdateListener).toBeCalledTimes(3);
    expect(onPointerUpdateListener.mock.calls[2][0]).toEqual({
      chartId: 'chartId',
      type: 'Out',
    });
  });

  test('handle only external pointer update', () => {
    store.dispatch(
      onExternalPointerEvent({
        chartId: 'chartId',
        scale: scaleType,
        type: 'Over',
        unit: undefined,
        value: 0,
      }),
    );
    let cursorBandPosition = getCursorBandPositionSelector(store.getState());
    expect(cursorBandPosition).toBeUndefined();

    store.dispatch(
      onExternalPointerEvent({
        chartId: 'differentChart',
        scale: scaleType,
        type: 'Over',
        unit: undefined,
        value: 0,
      }),
    );
    cursorBandPosition = getCursorBandPositionSelector(store.getState());
    expect(cursorBandPosition).toBeDefined();
  });

  test.skip('can determine which tooltip to display if chart & annotation tooltips possible', () => {
    // const annotationDimensions = [{ rect: { x: 49, y: -1, width: 3, height: 99 } }];
    // const rectAnnotationSpec: RectAnnotationSpec = {
    //   id: 'rect',
    //   groupId: GROUP_ID,
    //   annotationType: 'rectangle',
    //   dataValues: [{ coordinates: { x0: 1, x1: 1.5, y0: 0.5, y1: 10 } }],
    // };
    // store.annotationSpecs.set(rectAnnotationSpec.annotationId, rectAnnotationSpec);
    // store.annotationDimensions.set(rectAnnotationSpec.annotationId, annotationDimensions);
    // debugger;
    // // isHighlighted false, chart tooltip true; should show annotationTooltip only
    // store.setCursorPosition(chartLeft + 51, chartTop + 1);
    // expect(store.isTooltipVisible.get()).toBe(false);
  });

  test('can hover top-left corner of the first bar', () => {
    let tooltipInfo = getTooltipInfoAndGeometriesSelector(store.getState());
    expect(tooltipInfo.tooltip.values).toEqual([]);
    store.dispatch(onPointerMove({ x: chartLeft + 0, y: chartTop + 0 }, 0));
    let projectedPointerPosition = getProjectedPointerPositionSelector(store.getState());
    expect(projectedPointerPosition).toMatchObject({ x: 0, y: 0 });
    const cursorBandPosition = getCursorBandPositionSelector(store.getState());
    expect(cursorBandPosition).toBeDefined();
    expect((cursorBandPosition as Rect).x).toBe(chartLeft + 0);
    expect((cursorBandPosition as Rect).width).toBe(45);
    let isTooltipVisible = isTooltipVisibleSelector(store.getState());
    expect(isTooltipVisible.visible).toBe(true);
    tooltipInfo = getTooltipInfoAndGeometriesSelector(store.getState());
    expect(tooltipInfo.tooltip.values.length).toBe(1);
    expect(tooltipInfo.highlightedGeometries.length).toBe(1);
    expect(onOverListener).toBeCalledTimes(1);
    expect(onOutListener).toBeCalledTimes(0);
    expect(onOverListener.mock.calls[0][0]).toEqual([
      [
        {
          x: 0,
          y: 10,
          accessor: 'y1',
          mark: null,
          datum: [0, 10],
        },
        {
          key: 'groupId{group_1}spec{spec_1}yAccessor{1}splitAccessors{}',
          seriesKeys: [1],
          specId: 'spec_1',
          splitAccessors: new Map(),
          yAccessor: 1,
        },
      ],
    ]);

    store.dispatch(onPointerMove({ x: chartLeft - 1, y: chartTop - 1 }, 1));
    projectedPointerPosition = getProjectedPointerPositionSelector(store.getState());
    expect(projectedPointerPosition).toMatchObject({ x: -1, y: -1 });
    isTooltipVisible = isTooltipVisibleSelector(store.getState());
    expect(isTooltipVisible.visible).toBe(false);
    tooltipInfo = getTooltipInfoAndGeometriesSelector(store.getState());
    expect(tooltipInfo.tooltip.values.length).toBe(0);
    expect(tooltipInfo.highlightedGeometries.length).toBe(0);
    expect(onOverListener).toBeCalledTimes(1);
    expect(onOutListener).toBeCalledTimes(1);
  });

  test('can hover bottom-left corner of the first bar', () => {
    store.dispatch(onPointerMove({ x: chartLeft + 0, y: chartTop + 89 }, 0));
    let projectedPointerPosition = getProjectedPointerPositionSelector(store.getState());
    expect(projectedPointerPosition).toMatchObject({ x: 0, y: 89 });
    const cursorBandPosition = getCursorBandPositionSelector(store.getState());
    expect(cursorBandPosition).toBeDefined();
    expect((cursorBandPosition as Rect).x).toBe(chartLeft + 0);
    expect((cursorBandPosition as Rect).width).toBe(45);
    let isTooltipVisible = isTooltipVisibleSelector(store.getState());
    expect(isTooltipVisible.visible).toBe(true);
    let tooltipInfo = getTooltipInfoAndGeometriesSelector(store.getState());
    expect(tooltipInfo.highlightedGeometries.length).toBe(1);
    expect(tooltipInfo.tooltip.values.length).toBe(1);
    expect(onOverListener).toBeCalledTimes(1);
    expect(onOutListener).toBeCalledTimes(0);
    expect(onOverListener.mock.calls[0][0]).toEqual([
      [
        {
          x: 0,
          y: 10,
          accessor: 'y1',
          mark: null,
          datum: [0, 10],
        },
        {
          key: 'groupId{group_1}spec{spec_1}yAccessor{1}splitAccessors{}',
          seriesKeys: [1],
          specId: 'spec_1',
          splitAccessors: new Map(),
          yAccessor: 1,
        },
      ],
    ]);
    store.dispatch(onPointerMove({ x: chartLeft - 1, y: chartTop + 89 }, 1));
    projectedPointerPosition = getProjectedPointerPositionSelector(store.getState());
    expect(projectedPointerPosition).toMatchObject({ x: -1, y: 89 });
    isTooltipVisible = isTooltipVisibleSelector(store.getState());
    expect(isTooltipVisible.visible).toBe(false);
    tooltipInfo = getTooltipInfoAndGeometriesSelector(store.getState());
    expect(tooltipInfo.tooltip.values.length).toBe(0);
    expect(tooltipInfo.highlightedGeometries.length).toBe(0);
    expect(onOverListener).toBeCalledTimes(1);
    expect(onOutListener).toBeCalledTimes(1);
  });

  test('can hover top-right corner of the first bar', () => {
    let scaleOffset = 0;
    if (scaleType !== ScaleType.Ordinal) {
      scaleOffset = 1;
    }
    store.dispatch(onPointerMove({ x: chartLeft + 44 + scaleOffset, y: chartTop + 0 }, 0));
    let projectedPointerPosition = getProjectedPointerPositionSelector(store.getState());
    expect(projectedPointerPosition).toMatchObject({ x: 44 + scaleOffset, y: 0 });
    let cursorBandPosition = getCursorBandPositionSelector(store.getState());
    expect(cursorBandPosition).toBeDefined();
    expect((cursorBandPosition as Rect).x).toBe(chartLeft + 0);
    expect((cursorBandPosition as Rect).width).toBe(45);
    let isTooltipVisible = isTooltipVisibleSelector(store.getState());
    expect(isTooltipVisible.visible).toBe(true);
    let tooltipInfo = getTooltipInfoAndGeometriesSelector(store.getState());
    expect(tooltipInfo.highlightedGeometries.length).toBe(1);
    expect(tooltipInfo.tooltip.values.length).toBe(1);
    expect(onOverListener).toBeCalledTimes(1);
    expect(onOutListener).toBeCalledTimes(0);
    expect(onOverListener.mock.calls[0][0]).toEqual([
      [
        {
          x: 0,
          y: 10,
          accessor: 'y1',
          mark: null,
          datum: [0, 10],
        },
        {
          key: 'groupId{group_1}spec{spec_1}yAccessor{1}splitAccessors{}',
          seriesKeys: [1],
          specId: 'spec_1',
          splitAccessors: new Map(),
          yAccessor: 1,
        },
      ],
    ]);

    store.dispatch(onPointerMove({ x: chartLeft + 45 + scaleOffset, y: chartTop + 0 }, 1));
    projectedPointerPosition = getProjectedPointerPositionSelector(store.getState());
    expect(projectedPointerPosition).toMatchObject({ x: 45 + scaleOffset, y: 0 });
    cursorBandPosition = getCursorBandPositionSelector(store.getState());
    expect(cursorBandPosition).toBeDefined();
    expect((cursorBandPosition as Rect).x).toBe(chartLeft + 45);
    expect((cursorBandPosition as Rect).width).toBe(45);
    isTooltipVisible = isTooltipVisibleSelector(store.getState());
    expect(isTooltipVisible.visible).toBe(true);
    tooltipInfo = getTooltipInfoAndGeometriesSelector(store.getState());
    expect(tooltipInfo.tooltip.values.length).toBe(1);
    expect(tooltipInfo.highlightedGeometries.length).toBe(0);
    expect(onOverListener).toBeCalledTimes(1);
    expect(onOutListener).toBeCalledTimes(1);
  });

  test('can hover bottom-right corner of the first bar', () => {
    let scaleOffset = 0;
    if (scaleType !== ScaleType.Ordinal) {
      scaleOffset = 1;
    }
    store.dispatch(onPointerMove({ x: chartLeft + 44 + scaleOffset, y: chartTop + 89 }, 0));
    let projectedPointerPosition = getProjectedPointerPositionSelector(store.getState());
    expect(projectedPointerPosition).toMatchObject({ x: 44 + scaleOffset, y: 89 });
    let cursorBandPosition = getCursorBandPositionSelector(store.getState());
    expect(cursorBandPosition).toBeDefined();
    expect((cursorBandPosition as Rect).x).toBe(chartLeft + 0);
    expect((cursorBandPosition as Rect).width).toBe(45);
    let isTooltipVisible = isTooltipVisibleSelector(store.getState());
    expect(isTooltipVisible.visible).toBe(true);
    let tooltipInfo = getTooltipInfoAndGeometriesSelector(store.getState());
    expect(tooltipInfo.highlightedGeometries.length).toBe(1);
    expect(tooltipInfo.tooltip.values.length).toBe(1);
    expect(onOverListener).toBeCalledTimes(1);
    expect(onOutListener).toBeCalledTimes(0);
    expect(onOverListener.mock.calls[0][0]).toEqual([
      [
        {
          x: (spec.data[0] as Array<any>)[0],
          y: (spec.data[0] as Array<any>)[1],
          accessor: 'y1',
          mark: null,
          datum: [(spec.data[0] as Array<any>)[0], (spec.data[0] as Array<any>)[1]],
        },
        {
          key: 'groupId{group_1}spec{spec_1}yAccessor{1}splitAccessors{}',
          seriesKeys: [1],
          specId: 'spec_1',
          splitAccessors: new Map(),
          yAccessor: 1,
        },
      ],
    ]);

    store.dispatch(onPointerMove({ x: chartLeft + 45 + scaleOffset, y: chartTop + 89 }, 1));
    projectedPointerPosition = getProjectedPointerPositionSelector(store.getState());
    expect(projectedPointerPosition).toMatchObject({ x: 45 + scaleOffset, y: 89 });
    cursorBandPosition = getCursorBandPositionSelector(store.getState());
    expect(cursorBandPosition).toBeDefined();
    expect((cursorBandPosition as Rect).x).toBe(chartLeft + 45);
    expect((cursorBandPosition as Rect).width).toBe(45);
    isTooltipVisible = isTooltipVisibleSelector(store.getState());
    expect(isTooltipVisible.visible).toBe(true);
    tooltipInfo = getTooltipInfoAndGeometriesSelector(store.getState());
    expect(tooltipInfo.tooltip.values.length).toBe(1);
    // we are over the second bar here
    expect(tooltipInfo.highlightedGeometries.length).toBe(1);
    expect(onOverListener).toBeCalledTimes(2);
    expect(onOverListener.mock.calls[1][0]).toEqual([
      [
        {
          x: (spec.data[1] as Array<any>)[0],
          y: (spec.data[1] as Array<any>)[1],
          accessor: 'y1',
          mark: null,
          datum: [(spec.data[1] as Array<any>)[0], (spec.data[1] as Array<any>)[1]],
        },
        {
          key: 'groupId{group_1}spec{spec_1}yAccessor{1}splitAccessors{}',
          seriesKeys: [1],
          specId: 'spec_1',
          splitAccessors: new Map(),
          yAccessor: 1,
        },
      ],
    ]);

    expect(onOutListener).toBeCalledTimes(0);

    store.dispatch(onPointerMove({ x: chartLeft + 47 + scaleOffset, y: chartTop + 89 }, 2));
  });

  test('can hover top-right corner of the chart', () => {
    expect(onOverListener).toBeCalledTimes(0);
    expect(onOutListener).toBeCalledTimes(0);
    let tooltipInfo = getTooltipInfoAndGeometriesSelector(store.getState());
    expect(tooltipInfo.highlightedGeometries.length).toBe(0);
    expect(tooltipInfo.tooltip.values.length).toBe(0);

    store.dispatch(onPointerMove({ x: chartLeft + 89, y: chartTop + 0 }, 0));
    const projectedPointerPosition = getProjectedPointerPositionSelector(store.getState());
    expect(projectedPointerPosition).toMatchObject({ x: 89, y: 0 });
    const cursorBandPosition = getCursorBandPositionSelector(store.getState());
    expect(cursorBandPosition).toBeDefined();
    expect((cursorBandPosition as Rect).x).toBe(chartLeft + 45);
    expect((cursorBandPosition as Rect).width).toBe(45);

    const isTooltipVisible = isTooltipVisibleSelector(store.getState());
    expect(isTooltipVisible.visible).toBe(true);
    tooltipInfo = getTooltipInfoAndGeometriesSelector(store.getState());
    expect(tooltipInfo.highlightedGeometries.length).toBe(0);
    expect(tooltipInfo.tooltip.values.length).toBe(1);
    expect(onOverListener).toBeCalledTimes(0);
    expect(onOutListener).toBeCalledTimes(0);
  });

  test('will call only one time the listener with the same values', () => {
    expect(onOverListener).toBeCalledTimes(0);
    expect(onOutListener).toBeCalledTimes(0);
    let halfWidth = 45;
    if (scaleType !== ScaleType.Ordinal) {
      halfWidth = 46;
    }
    let timeCounter = 0;
    for (let i = 0; i < halfWidth; i++) {
      store.dispatch(onPointerMove({ x: chartLeft + i, y: chartTop + 89 }, timeCounter));
      expect(onOverListener).toBeCalledTimes(1);
      expect(onOutListener).toBeCalledTimes(0);
      timeCounter++;
    }
    for (let i = halfWidth; i < 90; i++) {
      store.dispatch(onPointerMove({ x: chartLeft + i, y: chartTop + 89 }, timeCounter));
      expect(onOverListener).toBeCalledTimes(2);
      expect(onOutListener).toBeCalledTimes(0);
      timeCounter++;
    }
    for (let i = 0; i < halfWidth; i++) {
      store.dispatch(onPointerMove({ x: chartLeft + i, y: chartTop + 0 }, timeCounter));
      expect(onOverListener).toBeCalledTimes(3);
      expect(onOutListener).toBeCalledTimes(0);
      timeCounter++;
    }
    for (let i = halfWidth; i < 90; i++) {
      store.dispatch(onPointerMove({ x: chartLeft + i, y: chartTop + 0 }, timeCounter));
      expect(onOverListener).toBeCalledTimes(3);
      expect(onOutListener).toBeCalledTimes(1);
      timeCounter++;
    }
  });

  test('can hover bottom-right corner of the chart', () => {
    store.dispatch(onPointerMove({ x: chartLeft + 89, y: chartTop + 89 }, 0));
    const projectedPointerPosition = getProjectedPointerPositionSelector(store.getState());
    // store.setCursorPosition(chartLeft + 99, chartTop + 99);
    expect(projectedPointerPosition).toMatchObject({ x: 89, y: 89 });
    const cursorBandPosition = getCursorBandPositionSelector(store.getState());
    expect(cursorBandPosition).toBeDefined();
    expect((cursorBandPosition as Rect).x).toBe(chartLeft + 45);
    expect((cursorBandPosition as Rect).width).toBe(45);
    const isTooltipVisible = isTooltipVisibleSelector(store.getState());
    expect(isTooltipVisible.visible).toBe(true);
    const tooltipInfo = getTooltipInfoAndGeometriesSelector(store.getState());
    expect(tooltipInfo.highlightedGeometries.length).toBe(1);
    expect(tooltipInfo.tooltip.values.length).toBe(1);
    expect(onOverListener).toBeCalledTimes(1);
    expect(onOverListener.mock.calls[0][0]).toEqual([
      [
        {
          x: 1,
          y: 5,
          accessor: 'y1',
          mark: null,
          datum: [1, 5],
        },
        {
          key: 'groupId{group_1}spec{spec_1}yAccessor{1}splitAccessors{}',
          seriesKeys: [1],
          specId: 'spec_1',
          splitAccessors: new Map(),
          yAccessor: 1,
        },
      ],
    ]);
    expect(onOutListener).toBeCalledTimes(0);
  });

  describe.skip('can position tooltip within chart when xScale is a single value scale', () => {
    beforeEach(() => {
      // const singleValueScale =
      //   store.xScale!.type === ScaleType.Ordinal
      //     ? new ScaleBand(['a'], [0, 0])
      //     : new ScaleContinuous({ type: ScaleType.Linear, domain: [1, 1], range: [0, 0] });
      // store.xScale = singleValueScale;
    });
    test.skip('horizontal chart rotation', () => {
      // store.setCursorPosition(chartLeft + 99, chartTop + 99);
      // const expectedTransform = `translateX(${chartLeft}px) translateX(-0%) translateY(109px) translateY(-100%)`;
      // expect(store.tooltipPosition.transform).toBe(expectedTransform);
    });

    test.skip('vertical chart rotation', () => {
      // store.chartRotation = 90;
      // store.setCursorPosition(chartLeft + 99, chartTop + 99);
      // const expectedTransform = `translateX(109px) translateX(-100%) translateY(${chartTop}px) translateY(-0%)`;
      // expect(store.tooltipPosition.transform).toBe(expectedTransform);
    });
  });
  describe('can format tooltip values on rotated chart', () => {
    let leftAxis: AxisSpec;
    let bottomAxis: AxisSpec;
    let currentSettingSpec: SettingsSpec;
    const style: RecursivePartial<AxisStyle> = {
      tickLine: {
        size: 0,
        padding: 0,
      },
    };
    beforeEach(() => {
      leftAxis = {
        chartType: ChartType.XYAxis,
        specType: SpecType.Axis,
        hide: true,
        id: 'yaxis',
        groupId: GROUP_ID,
        position: Position.Left,
        tickFormat: (value) => `left ${Number(value)}`,
        showOverlappingLabels: false,
        showOverlappingTicks: false,
        style,
      };
      bottomAxis = {
        chartType: ChartType.XYAxis,
        specType: SpecType.Axis,
        hide: true,
        id: 'xaxis',
        groupId: GROUP_ID,
        position: Position.Bottom,
        tickFormat: (value) => `bottom ${Number(value)}`,
        showOverlappingLabels: false,
        showOverlappingTicks: false,
        style,
      };
      currentSettingSpec = getSettingsSpecSelector(store.getState());
    });

    test('chart 0 rotation', () => {
      MockStore.addSpecs([spec, leftAxis, bottomAxis, currentSettingSpec], store);
      store.dispatch(onPointerMove({ x: chartLeft + 0, y: chartTop + 89 }, 0));
      const tooltipInfo = getTooltipInfoAndGeometriesSelector(store.getState());
      expect(tooltipInfo.tooltip.header?.value).toBe(0);
      expect(tooltipInfo.tooltip.header?.formattedValue).toBe('bottom 0');
      expect(tooltipInfo.tooltip.values[0].value).toBe(10);
      expect(tooltipInfo.tooltip.values[0].formattedValue).toBe('left 10');
    });

    test('chart 90 deg rotated', () => {
      const updatedSettings: SettingsSpec = {
        ...currentSettingSpec,
        rotation: 90,
      };
      MockStore.addSpecs([spec, leftAxis, bottomAxis, updatedSettings], store);

      store.dispatch(onPointerMove({ x: chartLeft + 0, y: chartTop + 89 }, 0));
      const tooltipInfo = getTooltipInfoAndGeometriesSelector(store.getState());
      expect(tooltipInfo.tooltip.header?.value).toBe(1);
      expect(tooltipInfo.tooltip.header?.formattedValue).toBe('left 1');
      expect(tooltipInfo.tooltip.values[0].value).toBe(5);
      expect(tooltipInfo.tooltip.values[0].formattedValue).toBe('bottom 5');
    });
  });
  describe('brush', () => {
    test('can respond to a brush end event', () => {
      const brushEndListener = jest.fn<void, [XYBrushArea]>((): void => undefined);
      const onBrushCaller = createOnBrushEndCaller();
      store.subscribe(() => {
        onBrushCaller(store.getState());
      });
      const settings = getSettingsSpecSelector(store.getState());
      const updatedSettings: SettingsSpec = {
        ...settings,
        theme: {
          ...settings.theme,
          chartMargins: {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
          },
        },
        onBrushEnd: brushEndListener,
      };
      MockStore.addSpecs(
        [
          {
            ...spec,
            data: [
              [0, 1],
              [1, 1],
              [2, 2],
              [3, 3],
            ],
          } as BarSeriesSpec,
          updatedSettings,
        ],
        store,
      );

      const start1 = { x: 0, y: 0 };
      const end1 = { x: 75, y: 0 };

      store.dispatch(onMouseDown(start1, 0));
      store.dispatch(onPointerMove(end1, 200));
      store.dispatch(onMouseUp(end1, 300));
      if (scaleType === ScaleType.Ordinal) {
        expect(brushEndListener).not.toBeCalled();
      } else {
        expect(brushEndListener).toBeCalled();
        expect(brushEndListener.mock.calls[0][0]).toEqual({ x: [0, 2.5] });
      }
      const start2 = { x: 75, y: 0 };
      const end2 = { x: 100, y: 0 };

      store.dispatch(onMouseDown(start2, 400));
      store.dispatch(onPointerMove(end2, 500));
      store.dispatch(onMouseUp(end2, 600));
      if (scaleType === ScaleType.Ordinal) {
        expect(brushEndListener).not.toBeCalled();
      } else {
        expect(brushEndListener).toBeCalled();
        expect(brushEndListener.mock.calls[1][0]).toEqual({ x: [2.5, 3] });
      }

      const start3 = { x: 75, y: 0 };
      const end3 = { x: 250, y: 0 };
      store.dispatch(onMouseDown(start3, 700));
      store.dispatch(onPointerMove(end3, 800));
      store.dispatch(onMouseUp(end3, 900));
      if (scaleType === ScaleType.Ordinal) {
        expect(brushEndListener).not.toBeCalled();
      } else {
        expect(brushEndListener).toBeCalled();
        expect(brushEndListener.mock.calls[2][0]).toEqual({ x: [2.5, 3] });
      }

      const start4 = { x: 25, y: 0 };
      const end4 = { x: -20, y: 0 };
      store.dispatch(onMouseDown(start4, 1000));
      store.dispatch(onPointerMove(end4, 1100));
      store.dispatch(onMouseUp(end4, 1200));
      if (scaleType === ScaleType.Ordinal) {
        expect(brushEndListener).not.toBeCalled();
      } else {
        expect(brushEndListener).toBeCalled();
        expect(brushEndListener.mock.calls[3][0]).toEqual({ x: [0, 0.5] });
      }

      store.dispatch(onMouseDown({ x: 25, y: 0 }, 1300));
      store.dispatch(onPointerMove({ x: 28, y: 0 }, 1390));
      store.dispatch(onMouseUp({ x: 28, y: 0 }, 1400));
      if (scaleType === ScaleType.Ordinal) {
        expect(brushEndListener).not.toBeCalled();
      } else {
        expect(brushEndListener.mock.calls[4]).toBeUndefined();
      }
    });
    test('can respond to a brush end event on rotated chart', () => {
      const brushEndListener = jest.fn<void, [XYBrushArea]>((): void => undefined);
      const onBrushCaller = createOnBrushEndCaller();
      store.subscribe(() => {
        onBrushCaller(store.getState());
      });
      const settings = getSettingsSpecSelector(store.getState());
      const updatedSettings: SettingsSpec = {
        ...settings,
        rotation: 90,
        theme: {
          ...settings.theme,
          chartMargins: {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
          },
        },
        onBrushEnd: brushEndListener,
      };
      MockStore.addSpecs([spec, updatedSettings], store);

      const start1 = { x: 0, y: 25 };
      const end1 = { x: 0, y: 75 };

      store.dispatch(onMouseDown(start1, 0));
      store.dispatch(onPointerMove(end1, 100));
      store.dispatch(onMouseUp(end1, 200));
      if (scaleType === ScaleType.Ordinal) {
        expect(brushEndListener).not.toBeCalled();
      } else {
        expect(brushEndListener).toBeCalled();
        expect(brushEndListener.mock.calls[0][0]).toEqual({ x: [0, 1] });
      }
      const start2 = { x: 0, y: 75 };
      const end2 = { x: 0, y: 100 };

      store.dispatch(onMouseDown(start2, 400));
      store.dispatch(onPointerMove(end2, 500));
      store.dispatch(onMouseUp(end2, 600));
      if (scaleType === ScaleType.Ordinal) {
        expect(brushEndListener).not.toBeCalled();
      } else {
        expect(brushEndListener).toBeCalled();
        expect(brushEndListener.mock.calls[1][0]).toEqual({ x: [1, 1] });
      }

      const start3 = { x: 0, y: 75 };
      const end3 = { x: 0, y: 200 };
      store.dispatch(onMouseDown(start3, 700));
      store.dispatch(onPointerMove(end3, 800));
      store.dispatch(onMouseUp(end3, 900));
      if (scaleType === ScaleType.Ordinal) {
        expect(brushEndListener).not.toBeCalled();
      } else {
        expect(brushEndListener).toBeCalled();
        expect(brushEndListener.mock.calls[2][0]).toEqual({ x: [1, 1] }); // max of chart
      }

      const start4 = { x: 0, y: 25 };
      const end4 = { x: 0, y: -20 };
      store.dispatch(onMouseDown(start4, 1000));
      store.dispatch(onPointerMove(end4, 1100));
      store.dispatch(onMouseUp(end4, 1200));
      if (scaleType === ScaleType.Ordinal) {
        expect(brushEndListener).not.toBeCalled();
      } else {
        expect(brushEndListener).toBeCalled();
        expect(brushEndListener.mock.calls[3][0]).toEqual({ x: [0, 0] });
      }
    });
    test('can respond to a Y brush', () => {
      const brushEndListener = jest.fn<void, [XYBrushArea]>((): void => undefined);
      const onBrushCaller = createOnBrushEndCaller();
      store.subscribe(() => {
        onBrushCaller(store.getState());
      });
      const settings = getSettingsSpecSelector(store.getState());
      const updatedSettings: SettingsSpec = {
        ...settings,
        brushAxis: BrushAxis.Y,
        theme: {
          ...settings.theme,
          chartMargins: {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
          },
        },
        onBrushEnd: brushEndListener,
      };
      MockStore.addSpecs(
        [
          {
            ...spec,
            data: [
              [0, 1],
              [1, 1],
              [2, 2],
              [3, 3],
            ],
          } as BarSeriesSpec,
          updatedSettings,
        ],
        store,
      );

      const start1 = { x: 0, y: 0 };
      const end1 = { x: 0, y: 75 };

      store.dispatch(onMouseDown(start1, 0));
      store.dispatch(onPointerMove(end1, 100));
      store.dispatch(onMouseUp(end1, 200));
      if (scaleType === ScaleType.Ordinal) {
        expect(brushEndListener).not.toBeCalled();
      } else {
        expect(brushEndListener).toBeCalled();
        expect(brushEndListener.mock.calls[0][0]).toEqual({
          y: [
            {
              groupId: spec.groupId,
              extent: [0.75, 3],
            },
          ],
        });
      }
      const start2 = { x: 0, y: 75 };
      const end2 = { x: 0, y: 100 };

      store.dispatch(onMouseDown(start2, 400));
      store.dispatch(onPointerMove(end2, 500));
      store.dispatch(onMouseUp(end2, 600));
      if (scaleType === ScaleType.Ordinal) {
        expect(brushEndListener).not.toBeCalled();
      } else {
        expect(brushEndListener).toBeCalled();
        expect(brushEndListener.mock.calls[1][0]).toEqual({
          y: [
            {
              groupId: spec.groupId,
              extent: [0, 0.75],
            },
          ],
        });
      }
    });
    test('can respond to rectangular brush', () => {
      const brushEndListener = jest.fn<void, [XYBrushArea]>((): void => undefined);
      const onBrushCaller = createOnBrushEndCaller();
      store.subscribe(() => {
        onBrushCaller(store.getState());
      });
      const settings = getSettingsSpecSelector(store.getState());
      const updatedSettings: SettingsSpec = {
        ...settings,
        brushAxis: BrushAxis.Both,
        theme: {
          ...settings.theme,
          chartMargins: {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
          },
        },
        onBrushEnd: brushEndListener,
      };
      MockStore.addSpecs(
        [
          {
            ...spec,
            data: [
              [0, 1],
              [1, 1],
              [2, 2],
              [3, 3],
            ],
          } as BarSeriesSpec,
          updatedSettings,
        ],
        store,
      );

      const start1 = { x: 0, y: 0 };
      const end1 = { x: 75, y: 75 };

      store.dispatch(onMouseDown(start1, 0));
      store.dispatch(onPointerMove(end1, 100));
      store.dispatch(onMouseUp(end1, 300));
      if (scaleType === ScaleType.Ordinal) {
        expect(brushEndListener).not.toBeCalled();
      } else {
        expect(brushEndListener).toBeCalled();
        expect(brushEndListener.mock.calls[0][0]).toEqual({
          x: [0, 2.5],
          y: [
            {
              groupId: spec.groupId,
              extent: [0.75, 3],
            },
          ],
        });
      }
      const start2 = { x: 75, y: 75 };
      const end2 = { x: 100, y: 100 };

      store.dispatch(onMouseDown(start2, 400));
      store.dispatch(onPointerMove(end2, 500));
      store.dispatch(onMouseUp(end2, 600));
      if (scaleType === ScaleType.Ordinal) {
        expect(brushEndListener).not.toBeCalled();
      } else {
        expect(brushEndListener).toBeCalled();
        expect(brushEndListener.mock.calls[1][0]).toEqual({
          x: [2.5, 3],
          y: [
            {
              groupId: spec.groupId,
              extent: [0, 0.75],
            },
          ],
        });
      }
    });
  });
}

describe('Negative bars click and hover', () => {
  let store: Store<GlobalChartState>;
  let onElementClick: jest.Mock<void, any[]>;
  beforeEach(() => {
    store = MockStore.default({ width: 100, height: 100, top: 0, left: 0 }, 'chartId');
    onElementClick = jest.fn<void, any[]>((): void => undefined);
    const onElementClickCaller = createOnClickCaller();
    store.subscribe(() => {
      onElementClickCaller(store.getState());
    });
    MockStore.addSpecs(
      [
        MockGlobalSpec.settingsNoMargins({
          onElementClick,
        }),
        MockSeriesSpec.bar({
          xAccessor: 0,
          yAccessors: [1],
          data: [
            [0, 10],
            [1, -10],
            [2, 10],
          ],
        }),
      ],
      store,
    );
  });

  test('highlight negative bars', () => {
    store.dispatch(onPointerMove({ x: 50, y: 75 }, 0));
    const highlightedGeoms = getHighlightedGeomsSelector(store.getState());
    expect(highlightedGeoms.length).toBe(1);
    expect(highlightedGeoms[0].value.datum).toEqual([1, -10]);
  });
  test('click negative bars', () => {
    store.dispatch(onPointerMove({ x: 50, y: 75 }, 0));
    store.dispatch(onMouseDown({ x: 50, y: 75 }, 100));
    store.dispatch(onMouseUp({ x: 50, y: 75 }, 200));

    expect(onElementClick).toBeCalled();
    const callArgs = onElementClick.mock.calls[0][0];
    expect(callArgs[0][0].datum).toEqual([1, -10]);
  });
});
