import createCachedSelector from 're-reselect';
import { getSettingsSpecSelector } from '../../../../state/selectors/get_settings_specs';
import { getTooltipAnchorPosition } from '../../crosshair/crosshair_utils';
import { getProjectedPointerPositionSelector } from './get_projected_pointer_position';
import { getComputedScalesSelector } from './get_computed_scales';
import { getCursorBandPositionSelector } from './get_cursor_band';
import { computeChartDimensionsSelector } from './compute_chart_dimensions';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';
import { TooltipAnchorPosition } from '../../../../components/tooltip/utils';

export const getTooltipAnchorPositionSelector = createCachedSelector(
  [
    computeChartDimensionsSelector,
    getSettingsSpecSelector,
    getCursorBandPositionSelector,
    getProjectedPointerPositionSelector,
    getComputedScalesSelector,
  ],
  (
    { chartDimensions },
    settings,
    cursorBandPosition,
    projectedPointerPosition,
    scales,
  ): TooltipAnchorPosition | null => {
    if (!cursorBandPosition) {
      return null;
    }
    return getTooltipAnchorPosition(
      chartDimensions,
      settings.rotation,
      cursorBandPosition,
      projectedPointerPosition,
      scales.xScale.isSingleValue(),
    );
  },
)(getChartIdSelector);
