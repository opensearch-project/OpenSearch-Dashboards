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

import React, { RefObject } from 'react';

import { ChartTypes } from '../..';
import { LegendItemExtraValues } from '../../../commons/legend';
import { SeriesKey } from '../../../commons/series_id';
import { Tooltip } from '../../../components/tooltip';
import { InternalChartState, GlobalChartState, BackwardRef } from '../../../state/chart_state';
import { htmlIdGenerator } from '../../../utils/commons';
import { XYChart } from '../renderer/canvas/xy_chart';
import { Annotations } from '../renderer/dom/annotations';
import { BrushTool } from '../renderer/dom/brush';
import { Crosshair } from '../renderer/dom/crosshair';
import { Highlighter } from '../renderer/dom/highlighter';
import { computeLegendSelector } from './selectors/compute_legend';
import { getPointerCursorSelector } from './selectors/get_cursor_pointer';
import { getHighlightedValuesSelector } from './selectors/get_highlighted_values';
import { getLegendItemsLabelsSelector } from './selectors/get_legend_items_labels';
import { getSeriesSpecsSelector } from './selectors/get_specs';
import { getTooltipAnchorPositionSelector } from './selectors/get_tooltip_position';
import { getTooltipInfoSelector } from './selectors/get_tooltip_values_highlighted_geoms';
import { isBrushAvailableSelector } from './selectors/is_brush_available';
import { isBrushingSelector } from './selectors/is_brushing';
import { isChartEmptySelector } from './selectors/is_chart_empty';
import { isTooltipVisibleSelector } from './selectors/is_tooltip_visible';
import { createOnBrushEndCaller } from './selectors/on_brush_end_caller';
import { createOnElementClickCaller } from './selectors/on_element_click_caller';
import { createOnElementOutCaller } from './selectors/on_element_out_caller';
import { createOnElementOverCaller } from './selectors/on_element_over_caller';
import { createOnPointerMoveCaller } from './selectors/on_pointer_move_caller';

/** @internal */
export class XYAxisChartState implements InternalChartState {
  chartType: ChartTypes;
  legendId: string;

  onElementClickCaller: (state: GlobalChartState) => void;
  onElementOverCaller: (state: GlobalChartState) => void;
  onElementOutCaller: (state: GlobalChartState) => void;
  onBrushEndCaller: (state: GlobalChartState) => void;
  onPointerMoveCaller: (state: GlobalChartState) => void;

  constructor() {
    this.onElementClickCaller = createOnElementClickCaller();
    this.onElementOverCaller = createOnElementOverCaller();
    this.onElementOutCaller = createOnElementOutCaller();
    this.onBrushEndCaller = createOnBrushEndCaller();
    this.onPointerMoveCaller = createOnPointerMoveCaller();
    this.chartType = ChartTypes.XYAxis;
    this.legendId = htmlIdGenerator()('legend');
  }

  isInitialized(globalState: GlobalChartState) {
    return globalState.specsInitialized && getSeriesSpecsSelector(globalState).length > 0;
  }

  isBrushAvailable(globalState: GlobalChartState) {
    return isBrushAvailableSelector(globalState);
  }

  isBrushing(globalState: GlobalChartState) {
    return isBrushingSelector(globalState);
  }

  isChartEmpty(globalState: GlobalChartState) {
    return isChartEmptySelector(globalState);
  }

  getLegendItemsLabels(globalState: GlobalChartState) {
    return getLegendItemsLabelsSelector(globalState);
  }

  getLegendItems(globalState: GlobalChartState) {
    return computeLegendSelector(globalState);
  }

  getLegendExtraValues(globalState: GlobalChartState): Map<SeriesKey, LegendItemExtraValues> {
    return getHighlightedValuesSelector(globalState);
  }

  chartRenderer(containerRef: BackwardRef, forwardStageRef: RefObject<HTMLCanvasElement>) {
    return (
      <>
        <Crosshair />
        <XYChart forwardStageRef={forwardStageRef} />
        <Tooltip getChartContainerRef={containerRef} />
        <Annotations getChartContainerRef={containerRef} />
        <Highlighter />
        <BrushTool />
      </>
    );
  }

  getPointerCursor(globalState: GlobalChartState) {
    return getPointerCursorSelector(globalState);
  }

  isTooltipVisible(globalState: GlobalChartState) {
    return isTooltipVisibleSelector(globalState);
  }

  getTooltipInfo(globalState: GlobalChartState) {
    return getTooltipInfoSelector(globalState);
  }

  getTooltipAnchor(globalState: GlobalChartState) {
    return getTooltipAnchorPositionSelector(globalState);
  }

  eventCallbacks(globalState: GlobalChartState) {
    this.onElementOverCaller(globalState);
    this.onElementOutCaller(globalState);
    this.onElementClickCaller(globalState);
    this.onBrushEndCaller(globalState);
    this.onPointerMoveCaller(globalState);
  }
}
