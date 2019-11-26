import { GlobalChartState } from '../chart_state';

export const getInternalIsBrushingAvailableSelector = (state: GlobalChartState): boolean => {
  if (state.internalChartState) {
    return state.internalChartState.isBrushAvailable(state);
  } else {
    return false;
  }
};
