import { GlobalChartState } from '../chart_state';

export const getInternalPointerCursor = (state: GlobalChartState): string => {
  if (state.internalChartState) {
    return state.internalChartState.getPointerCursor(state);
  } else {
    return 'default';
  }
};
