import React, { RefObject } from 'react';
import { XYChart } from '../renderer/canvas/xy_chart';
import { Highlighter } from '../renderer/dom/highlighter';
import { Crosshair } from '../renderer/dom/crosshair';
import { BrushTool } from '../renderer/dom/brush';
import { InternalChartState, GlobalChartState, BackwardRef } from '../../../state/chart_state';
import { TooltipLegendValue } from '../tooltip/tooltip';
import { ChartTypes } from '../..';
import { AnnotationTooltip } from '../renderer/dom/annotation_tooltips';
import { isBrushAvailableSelector } from './selectors/is_brush_available';
import { isChartEmptySelector } from './selectors/is_chart_empty';
import { computeLegendSelector } from './selectors/compute_legend';
import { getLegendTooltipValuesSelector } from './selectors/get_legend_tooltip_values';
import { getPointerCursorSelector } from './selectors/get_cursor_pointer';
import { isBrushingSelector } from './selectors/is_brushing';
import { isTooltipVisibleSelector } from './selectors/is_tooltip_visible';
import { getTooltipInfoSelector } from './selectors/get_tooltip_values_highlighted_geoms';
import { htmlIdGenerator } from '../../../utils/commons';
import { Tooltip } from '../../../components/tooltip';
import { getTooltipAnchorPositionSelector } from './selectors/get_tooltip_position';

export class XYAxisChartState implements InternalChartState {
  chartType = ChartTypes.XYAxis;
  legendId: string = htmlIdGenerator()('legend');
  isBrushAvailable(globalState: GlobalChartState) {
    return isBrushAvailableSelector(globalState);
  }
  isBrushing(globalState: GlobalChartState) {
    return isBrushingSelector(globalState);
  }
  isChartEmpty(globalState: GlobalChartState) {
    return isChartEmptySelector(globalState);
  }
  getLegendItems(globalState: GlobalChartState) {
    return computeLegendSelector(globalState);
  }
  getLegendItemsValues(globalState: GlobalChartState): Map<string, TooltipLegendValue> {
    return getLegendTooltipValuesSelector(globalState);
  }
  chartRenderer(containerRef: BackwardRef, forwardStageRef: RefObject<HTMLCanvasElement>) {
    return (
      <React.Fragment>
        <Crosshair />
        <XYChart forwardStageRef={forwardStageRef} />
        <Tooltip getChartContainerRef={containerRef} />
        <AnnotationTooltip getChartContainerRef={containerRef} />
        <Highlighter />
        <BrushTool />
      </React.Fragment>
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
}
