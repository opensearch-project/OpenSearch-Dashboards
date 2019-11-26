import createCachedSelector from 're-reselect';
import { getSettingsSpecSelector } from '../../../../state/selectors/get_settings_specs';
import { getComputedScalesSelector } from './get_computed_scales';
import { ScaleType } from '../../../../utils/scales/scales';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';

/**
 * The brush is available only for Ordinal xScales charts and
 * if we have configured an onBrushEnd listener
 */
export const isBrushAvailableSelector = createCachedSelector(
  [getSettingsSpecSelector, getComputedScalesSelector],
  (settingsSpec, scales): boolean => {
    if (!scales.xScale) {
      return false;
    }
    return scales.xScale.type !== ScaleType.Ordinal && Boolean(settingsSpec.onBrushEnd);
  },
)(getChartIdSelector);
