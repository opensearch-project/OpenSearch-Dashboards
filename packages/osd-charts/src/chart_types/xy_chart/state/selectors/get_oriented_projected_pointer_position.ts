import { Dimensions } from '../../../../utils/dimensions';
import createCachedSelector from 're-reselect';
import { getProjectedPointerPositionSelector } from './get_projected_pointer_position';
import { Point } from '../../../../utils/point';
import { getOrientedXPosition, getOrientedYPosition } from '../../utils/interactions';
import { SettingsSpec } from '../../../../specs/settings';
import { getSettingsSpecSelector } from '../../../../state/selectors/get_settings_specs';
import { computeChartDimensionsSelector } from './compute_chart_dimensions';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';

export const getOrientedProjectedPointerPositionSelector = createCachedSelector(
  [getProjectedPointerPositionSelector, computeChartDimensionsSelector, getSettingsSpecSelector],
  getOrientedProjectedPointerPosition,
)(getChartIdSelector);

function getOrientedProjectedPointerPosition(
  projectedPointerPosition: Point,
  chartDimensions: { chartDimensions: Dimensions },
  settingsSpec: SettingsSpec,
): Point {
  const xPos = projectedPointerPosition.x;
  const yPos = projectedPointerPosition.y;
  // get the oriented projected pointer position
  const x = getOrientedXPosition(xPos, yPos, settingsSpec.rotation, chartDimensions.chartDimensions);
  const y = getOrientedYPosition(xPos, yPos, settingsSpec.rotation, chartDimensions.chartDimensions);
  return {
    x,
    y,
  };
}
