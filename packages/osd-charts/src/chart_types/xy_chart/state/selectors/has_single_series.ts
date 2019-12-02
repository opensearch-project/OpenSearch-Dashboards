import createCachedSelector from 're-reselect';
import { computeSeriesDomainsSelector } from './compute_series_domains';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';

export const hasSingleSeriesSelector = createCachedSelector(
  [computeSeriesDomainsSelector],
  (seriesDomainsAndData): boolean => {
    return Boolean(seriesDomainsAndData) && seriesDomainsAndData.seriesCollection.size > 1;
  },
)(getChartIdSelector);
