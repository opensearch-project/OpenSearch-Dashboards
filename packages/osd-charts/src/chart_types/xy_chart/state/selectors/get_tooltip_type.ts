import createCachedSelector from 're-reselect';
import { getSettingsSpecSelector } from '../../../../state/selectors/get_settings_specs';
import { SettingsSpec, TooltipType, isTooltipType, isTooltipProps } from '../../../../specs/settings';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';

export const getTooltipTypeSelector = createCachedSelector(
  [getSettingsSpecSelector],
  getTooltipType,
)(getChartIdSelector);

export function getTooltipType(settings: SettingsSpec): TooltipType | undefined {
  const { tooltip } = settings;
  if (tooltip === undefined || tooltip === null) {
    return undefined;
  }
  if (isTooltipType(tooltip)) {
    return tooltip;
  }
  if (isTooltipProps(tooltip)) {
    return tooltip.type || undefined;
  }
  return undefined;
}
