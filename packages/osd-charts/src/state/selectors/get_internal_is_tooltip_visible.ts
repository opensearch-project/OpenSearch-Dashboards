import { GlobalChartState } from '../chart_state';

export const getInternalIsTooltipVisibleSelector = (state: GlobalChartState): boolean => {
  if (state.internalChartState) {
    return state.internalChartState.isTooltipVisible(state);
  } else {
    return false;
  }
};
