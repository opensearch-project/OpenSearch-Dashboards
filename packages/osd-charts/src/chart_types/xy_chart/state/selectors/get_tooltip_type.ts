import createCachedSelector from 're-reselect';
import { getSettingsSpecSelector } from '../../../../state/selectors/get_settings_specs';
import { getTooltipType } from '../../../../specs/settings';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';

export const getTooltipTypeSelector = createCachedSelector(
  [getSettingsSpecSelector],
  getTooltipType,
)(getChartIdSelector);
