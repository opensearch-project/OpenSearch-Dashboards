import createCachedSelector from 're-reselect';
import { isTooltipProps, TooltipValueFormatter } from '../../utils/interactions';
import { getSettingsSpecSelector } from '../../../../state/selectors/get_settings_specs';
import { SettingsSpec } from '../../../../specs/settings';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';

export const getTooltipHeaderFormatterSelector = createCachedSelector(
  [getSettingsSpecSelector],
  getTooltipHeaderFormatter,
)(getChartIdSelector);

function getTooltipHeaderFormatter(settings: SettingsSpec): TooltipValueFormatter | undefined {
  const { tooltip } = settings;
  if (tooltip && isTooltipProps(tooltip)) {
    return tooltip.headerFormatter;
  }
  return undefined;
}
