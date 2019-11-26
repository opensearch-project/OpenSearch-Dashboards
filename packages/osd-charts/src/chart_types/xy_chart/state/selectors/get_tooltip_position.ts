import createCachedSelector from 're-reselect';
import { getSettingsSpecSelector } from '../../../../state/selectors/get_settings_specs';
import { getTooltipPosition, TooltipPosition } from '../../crosshair/crosshair_utils';
import { getProjectedPointerPositionSelector } from './get_projected_pointer_position';
import { getComputedScalesSelector } from './get_computed_scales';
import { getCursorBandPositionSelector } from './get_cursor_band';
import { computeChartDimensionsSelector } from './compute_chart_dimensions';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';

export const getTooltipPositionSelector = createCachedSelector(
  [
    computeChartDimensionsSelector,
    getSettingsSpecSelector,
    getCursorBandPositionSelector,
    getProjectedPointerPositionSelector,
    getComputedScalesSelector,
  ],
  ({ chartDimensions }, settings, cursorBandPosition, projectedPointerPosition, scales): TooltipPosition | null => {
    if (!cursorBandPosition) {
      return null;
    }
    return getTooltipPosition(
      chartDimensions,
      settings.rotation,
      cursorBandPosition,
      projectedPointerPosition,
      scales.xScale.isSingleValue(),
    );
  },
)(getChartIdSelector);
