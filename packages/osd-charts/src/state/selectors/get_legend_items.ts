import { GlobalChartState } from '../chart_state';
import { LegendItem } from '../../chart_types/xy_chart/legend/legend';

const EMPTY_LEGEND_LIST = new Map<string, LegendItem>();
export const getLegendItemsSelector = (state: GlobalChartState): Map<string, LegendItem> => {
  if (state.internalChartState) {
    return state.internalChartState.getLegendItems(state);
  } else {
    return EMPTY_LEGEND_LIST;
  }
};
