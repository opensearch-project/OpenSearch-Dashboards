import React from 'react';
import { InternalChartState, GlobalChartState, BackwardRef } from '../../../state/chart_state';
import { ChartTypes } from '../..';
import { Partition } from '../renderer/canvas/partition';
import { isTooltipVisibleSelector } from '../state/selectors/is_tooltip_visible';
import { getTooltipInfoSelector } from '../state/selectors/tooltip';
import { Tooltip } from '../../../components/tooltip';

const EMPTY_MAP = new Map();
export class PartitionState implements InternalChartState {
  chartType = ChartTypes.Partition;
  isBrushAvailable() {
    return false;
  }
  isBrushing() {
    return false;
  }
  isChartEmpty() {
    return false;
  }
  getLegendItems() {
    return EMPTY_MAP;
  }
  getLegendItemsValues() {
    return EMPTY_MAP;
  }
  chartRenderer(containerRef: BackwardRef) {
    return (
      <>
        <Tooltip getChartContainerRef={containerRef} />
        <Partition />
      </>
    );
  }
  getPointerCursor() {
    return 'default';
  }
  isTooltipVisible(globalState: GlobalChartState) {
    return isTooltipVisibleSelector(globalState);
  }
  getTooltipInfo(globalState: GlobalChartState) {
    return getTooltipInfoSelector(globalState);
  }
  getTooltipAnchor(state: GlobalChartState) {
    const position = state.interactions.pointer.current.position;
    return {
      isRotated: false,
      x1: position.x,
      y1: position.y,
    };
  }
}
