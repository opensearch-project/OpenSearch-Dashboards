import { TooltipLegendValue } from '../../chart_types/xy_chart/tooltip/tooltip';
import { GlobalChartState } from '../chart_state';
import { SeriesKey } from '../../chart_types/xy_chart/utils/series';

const EMPTY_ITEM_LIST = new Map<SeriesKey, TooltipLegendValue>();
export const getLegendItemsValuesSelector = (state: GlobalChartState): Map<SeriesKey, TooltipLegendValue> => {
  if (state.internalChartState) {
    return state.internalChartState.getLegendItemsValues(state);
  } else {
    return EMPTY_ITEM_LIST;
  }
};
