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

import { ChartType } from '../..';
import { LegendItemExtraValues } from '../../../common/legend';
import { SeriesKey } from '../../../common/series_id';
import { BrushTool } from '../../../components/brush/brush';
import { Tooltip } from '../../../components/tooltip';
import { InternalChartState, GlobalChartState, BackwardRef } from '../../../state/chart_state';
import { getChartContainerDimensionsSelector } from '../../../state/selectors/get_chart_container_dimensions';
import { InitStatus } from '../../../state/selectors/get_internal_is_intialized';
import { htmlIdGenerator } from '../../../utils/common';
import { XYChart } from '../renderer/canvas/xy_chart';
import { Annotations } from '../renderer/dom/annotations';
import { Crosshair } from '../renderer/dom/crosshair';
import { Highlighter } from '../renderer/dom/highlighter';
import { computeChartDimensionsSelector } from './selectors/compute_chart_dimensions';
import { computeLegendSelector } from './selectors/compute_legend';
import { getBrushAreaSelector } from './selectors/get_brush_area';
import { getChartTypeDescriptionSelector } from './selectors/get_chart_type_description';
import { getPointerCursorSelector } from './selectors/get_cursor_pointer';
import { getDebugStateSelector } from './selectors/get_debug_state';
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
import { createOnClickCaller } from './selectors/on_click_caller';
import { createOnElementOutCaller } from './selectors/on_element_out_caller';
import { createOnElementOverCaller } from './selectors/on_element_over_caller';
import { createOnPointerMoveCaller } from './selectors/on_pointer_move_caller';

/** @internal */
export class XYAxisChartState implements InternalChartState {
  chartType: ChartType;

  legendId: string;

  onClickCaller: (state: GlobalChartState) => void;

  onElementOverCaller: (state: GlobalChartState) => void;

  onElementOutCaller: (state: GlobalChartState) => void;

  onBrushEndCaller: (state: GlobalChartState) => void;

  onPointerMoveCaller: (state: GlobalChartState) => void;

  constructor() {
    this.onClickCaller = createOnClickCaller();
    this.onElementOverCaller = createOnElementOverCaller();
    this.onElementOutCaller = createOnElementOutCaller();
    this.onBrushEndCaller = createOnBrushEndCaller();
    this.onPointerMoveCaller = createOnPointerMoveCaller();

    this.chartType = ChartType.XYAxis;
    this.legendId = htmlIdGenerator()('legend');
  }

  isInitialized(globalState: GlobalChartState) {
    return getSeriesSpecsSelector(globalState).length > 0 ? InitStatus.Initialized : InitStatus.SpecNotInitialized;
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

  getMainProjectionArea(globalState: GlobalChartState) {
    return computeChartDimensionsSelector(globalState).chartDimensions;
  }

  getProjectionContainerArea(globalState: GlobalChartState) {
    return getChartContainerDimensionsSelector(globalState);
  }

  getBrushArea(globalState: GlobalChartState) {
    return getBrushAreaSelector(globalState);
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

  chartRenderer(containerRef: BackwardRef, forwardCanvasRef: RefObject<HTMLCanvasElement>) {
    return (
      <>
        <Crosshair />
        <XYChart forwardCanvasRef={forwardCanvasRef} />
        <Tooltip getChartContainerRef={containerRef} />
        <Annotations getChartContainerRef={containerRef} chartAreaRef={forwardCanvasRef} />
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
    this.onClickCaller(globalState);
    this.onBrushEndCaller(globalState);
    this.onPointerMoveCaller(globalState);
  }

  getDebugState(globalState: GlobalChartState) {
    return getDebugStateSelector(globalState);
  }

  getChartTypeDescription(globalState: GlobalChartState) {
    return getChartTypeDescriptionSelector(globalState);
  }
}
