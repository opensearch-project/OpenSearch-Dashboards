import createCachedSelector from 're-reselect';
import { computeSeriesGeometriesSelector } from './compute_series_geometries';
import { Scale } from '../../../../scales';
import { getTooltipSnapSelector } from './get_tooltip_snap';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';

export const isTooltipSnapEnableSelector = createCachedSelector(
  [computeSeriesGeometriesSelector, getTooltipSnapSelector],
  (seriesGeometries, snap) => {
    return isTooltipSnapEnabled(seriesGeometries.scales.xScale, snap);
  },
)(getChartIdSelector);

function isTooltipSnapEnabled(xScale: Scale, snap: boolean) {
  return (xScale && xScale.bandwidth > 0) || snap;
}
