import React from 'react';
import { InternalChartState } from '../../../state/chart_state';
import { ChartTypes } from '../..';
import { Partition } from '../renderer/canvas/partition';

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
  chartRenderer() {
    return <Partition />;
  }
  getPointerCursor() {
    return 'default';
  }
  isTooltipVisible() {
    return false;
  }
  getTooltipInfo() {
    return undefined;
  }
  getTooltipAnchor() {
    return null;
  }
}
