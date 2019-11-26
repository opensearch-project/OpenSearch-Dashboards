import createCachedSelector from 're-reselect';
import { GlobalChartState } from '../../../../state/chart_state';
import { Dimensions } from '../../../../utils/dimensions';
import { computeChartTransformSelector } from './compute_chart_transform';
import { getChartRotationSelector } from '../../../../state/selectors/get_chart_rotation';
import { computeChartDimensionsSelector } from './compute_chart_dimensions';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';

const getMouseDownPosition = (state: GlobalChartState) => state.interactions.pointer.down;
const getCurrentPointerPosition = (state: GlobalChartState) => {
  return state.interactions.pointer.current.position;
};

export const getBrushAreaSelector = createCachedSelector(
  [
    getMouseDownPosition,
    getCurrentPointerPosition,
    getChartRotationSelector,
    computeChartDimensionsSelector,
    computeChartTransformSelector,
  ],
  (mouseDownPosition, cursorPosition, chartRotation, { chartDimensions }, chartTransform): Dimensions | null => {
    if (!mouseDownPosition) {
      return null;
    }
    const brushStart = {
      x: mouseDownPosition.position.x - chartDimensions.left,
      y: mouseDownPosition.position.y - chartDimensions.top,
    };
    if (chartRotation === 0 || chartRotation === 180) {
      const area = {
        left: brushStart.x,
        top: 0,
        width: cursorPosition.x - brushStart.x - chartDimensions.left,
        height: chartDimensions.height,
      };
      return area;
    } else {
      return {
        left: chartDimensions.left + chartTransform.x,
        top: brushStart.y - chartDimensions.top,
        width: chartDimensions.width,
        height: cursorPosition.y - brushStart.y - chartDimensions.top,
      };
    }
  },
)(getChartIdSelector);
