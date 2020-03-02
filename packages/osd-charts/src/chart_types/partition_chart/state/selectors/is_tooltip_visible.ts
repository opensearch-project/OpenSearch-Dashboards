import createCachedSelector from 're-reselect';
import { getSettingsSpecSelector } from '../../../../state/selectors/get_settings_specs';

import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';
import { TooltipType, getTooltipType } from '../../../../specs';
import { getTooltipInfoSelector } from './tooltip';

/**
 * The brush is available only for Ordinal xScales charts and
 * if we have configured an onBrushEnd listener
 */
export const isTooltipVisibleSelector = createCachedSelector(
  [getSettingsSpecSelector, getTooltipInfoSelector],
  (settingsSpec, tooltipInfo): boolean => {
    if (getTooltipType(settingsSpec) === TooltipType.None) {
      return false;
    }
    return tooltipInfo.values.length > 0;
  },
)(getChartIdSelector);
