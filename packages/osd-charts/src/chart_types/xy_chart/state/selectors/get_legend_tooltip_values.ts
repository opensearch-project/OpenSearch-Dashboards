import createCachedSelector from 're-reselect';
import { getSeriesTooltipValues, TooltipLegendValue } from '../../tooltip/tooltip';
import { getTooltipInfoSelector } from './get_tooltip_values_highlighted_geoms';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';
import { SeriesKey } from '../../utils/series';

export const getLegendTooltipValuesSelector = createCachedSelector(
  [getTooltipInfoSelector],
  ({ values }): Map<SeriesKey, TooltipLegendValue> => {
    return getSeriesTooltipValues(values);
  },
)(getChartIdSelector);
