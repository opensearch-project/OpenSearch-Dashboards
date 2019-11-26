import createCachedSelector from 're-reselect';
import { Dimensions } from '../../../../utils/dimensions';
import { computeChartDimensionsSelector } from './compute_chart_dimensions';
import { GlobalChartState } from '../../../../state/chart_state';
import { Point } from '../../../../utils/point';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';

const getCurrentPointerPosition = (state: GlobalChartState) => state.interactions.pointer.current.position;

export const getProjectedPointerPositionSelector = createCachedSelector(
  [getCurrentPointerPosition, computeChartDimensionsSelector],
  (currentPointerPosition, chartDimensions): Point => {
    return getProjectedPointerPosition(currentPointerPosition, chartDimensions.chartDimensions);
  },
)(getChartIdSelector);

/**
 * Get the x and y pointer position relative to the chart projection area
 * @param chartAreaPointerPosition the pointer position relative to the chart area
 * @param chartAreaDimensions the chart dimensions
 */
function getProjectedPointerPosition(chartAreaPointerPosition: Point, chartAreaDimensions: Dimensions): Point {
  const { x, y } = chartAreaPointerPosition;
  // get positions relative to chart
  let xPos = x - chartAreaDimensions.left;
  let yPos = y - chartAreaDimensions.top;
  // limit cursorPosition to the chart area
  if (xPos < 0 || xPos >= chartAreaDimensions.width) {
    xPos = -1;
  }
  if (yPos < 0 || yPos >= chartAreaDimensions.height) {
    yPos = -1;
  }
  return {
    x: xPos,
    y: yPos,
  };
}
