import createCachedSelector from 're-reselect';
import { computeSeriesDomainsSelector } from './compute_series_domains';
import { countBarsInCluster } from '../../utils/scales';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';

export const countBarsInClusterSelector = createCachedSelector(
  [computeSeriesDomainsSelector],
  (seriesDomainsAndData): number => {
    const { formattedDataSeries } = seriesDomainsAndData;

    const { totalBarsInCluster } = countBarsInCluster(formattedDataSeries.stacked, formattedDataSeries.nonStacked);
    return totalBarsInCluster;
  },
)(getChartIdSelector);
