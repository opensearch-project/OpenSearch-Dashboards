import createCachedSelector from 're-reselect';
import { GlobalChartState } from '../../../../state/chart_state';
import { isBrushAvailableSelector } from './is_brush_available';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';

const getPointerSelector = (state: GlobalChartState) => state.interactions.pointer;

export const isBrushingSelector = createCachedSelector(
  [isBrushAvailableSelector, getPointerSelector],
  (isBrushAvailable, pointer): boolean => {
    if (!isBrushAvailable) {
      return false;
    }

    return pointer.dragging;
  },
)(getChartIdSelector);
