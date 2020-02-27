import { GlobalChartState } from '../chart_state';
import { LegendItem } from '../../chart_types/xy_chart/legend/legend';
import { SeriesKey } from '../../chart_types/xy_chart/utils/series';

const EMPTY_LEGEND_LIST = new Map<SeriesKey, LegendItem>();
export const getLegendItemsSelector = (state: GlobalChartState): Map<SeriesKey, LegendItem> => {
  if (state.internalChartState) {
    return state.internalChartState.getLegendItems(state);
  } else {
    return EMPTY_LEGEND_LIST;
  }
};
