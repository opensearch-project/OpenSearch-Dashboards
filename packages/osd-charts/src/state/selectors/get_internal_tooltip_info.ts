import { GlobalChartState } from '../chart_state';
import { TooltipInfo } from '../../components/tooltip/types';

export const getInternalTooltipInfoSelector = (state: GlobalChartState): TooltipInfo | undefined => {
  if (state.internalChartState) {
    return state.internalChartState.getTooltipInfo(state);
  } else {
    return undefined;
  }
};
