import { GlobalChartState } from '../chart_state';
import { TooltipAnchorPosition } from '../../components/tooltip/utils';

export const getInternalTooltipAnchorPositionSelector = (state: GlobalChartState): TooltipAnchorPosition | null => {
  if (state.internalChartState) {
    return state.internalChartState.getTooltipAnchor(state);
  } else {
    return null;
  }
};
