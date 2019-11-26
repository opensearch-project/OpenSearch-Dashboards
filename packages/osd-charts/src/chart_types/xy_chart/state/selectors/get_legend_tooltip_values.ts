import createCachedSelector from 're-reselect';
import { getSeriesTooltipValues, TooltipLegendValue } from '../../tooltip/tooltip';
import { getTooltipValuesSelector } from './get_tooltip_values_highlighted_geoms';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';

export const getLegendTooltipValuesSelector = createCachedSelector(
  [getTooltipValuesSelector],
  (tooltipData): Map<string, TooltipLegendValue> => {
    return getSeriesTooltipValues(tooltipData);
  },
)(getChartIdSelector);
