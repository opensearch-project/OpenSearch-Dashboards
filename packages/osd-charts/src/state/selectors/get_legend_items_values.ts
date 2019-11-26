import { TooltipLegendValue } from '../../chart_types/xy_chart/tooltip/tooltip';
import { GlobalChartState } from '../chart_state';

const EMPTY_ITEM_LIST = new Map<string, TooltipLegendValue>();
export const getLegendItemsValuesSelector = (state: GlobalChartState): Map<string, TooltipLegendValue> => {
  if (state.internalChartState) {
    return state.internalChartState.getLegendItemsValues(state);
  } else {
    return EMPTY_ITEM_LIST;
  }
};
