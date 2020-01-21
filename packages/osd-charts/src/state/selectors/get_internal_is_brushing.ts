import { GlobalChartState } from '../chart_state';

export const getInternalIsBrushingSelector = (state: GlobalChartState): boolean => {
  if (state.internalChartState) {
    return state.internalChartState.isBrushing(state);
  } else {
    return false;
  }
};
