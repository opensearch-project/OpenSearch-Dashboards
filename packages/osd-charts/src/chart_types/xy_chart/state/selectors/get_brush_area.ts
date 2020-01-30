import createCachedSelector from 're-reselect';
import { GlobalChartState } from '../../../../state/chart_state';
import { Dimensions } from '../../../../utils/dimensions';
import { getChartRotationSelector } from '../../../../state/selectors/get_chart_rotation';
import { computeChartDimensionsSelector } from './compute_chart_dimensions';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';

const getMouseDownPosition = (state: GlobalChartState) => state.interactions.pointer.down;
const getCurrentPointerPosition = (state: GlobalChartState) => {
  return state.interactions.pointer.current.position;
};

export const getBrushAreaSelector = createCachedSelector(
  [getMouseDownPosition, getCurrentPointerPosition, getChartRotationSelector, computeChartDimensionsSelector],
  (mouseDownPosition, cursorPosition, chartRotation, { chartDimensions }): Dimensions | null => {
    if (!mouseDownPosition) {
      return null;
    }
    const brushStart = {
      x: mouseDownPosition.position.x,
      y: mouseDownPosition.position.y,
    };
    if (chartRotation === 0 || chartRotation === 180) {
      const area = {
        left: brushStart.x - chartDimensions.left,
        width: cursorPosition.x - brushStart.x,
        top: 0,
        height: chartDimensions.height,
      };
      return area;
    } else {
      const area = {
        left: 0,
        width: chartDimensions.width,
        top: brushStart.y - chartDimensions.top,
        height: cursorPosition.y - brushStart.y,
      };
      return area;
    }
  },
)(getChartIdSelector);
