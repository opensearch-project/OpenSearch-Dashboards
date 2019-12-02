import createCachedSelector from 're-reselect';
import { computeSeriesDomainsSelector } from './compute_series_domains';
import { getSeriesSpecsSelector } from './get_specs';
import { getSeriesColors } from '../../utils/series';
import { getChartThemeSelector } from '../../../../state/selectors/get_chart_theme';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';
import { getCustomSeriesColors } from '../utils';

export const getSeriesColorsSelector = createCachedSelector(
  [getSeriesSpecsSelector, computeSeriesDomainsSelector, getChartThemeSelector],
  (seriesSpecs, seriesDomainsAndData, chartTheme): Map<string, string> => {
    const updatedCustomSeriesColors = getCustomSeriesColors(seriesSpecs, seriesDomainsAndData.seriesCollection);

    const seriesColorMap = getSeriesColors(
      seriesDomainsAndData.seriesCollection,
      chartTheme.colors,
      updatedCustomSeriesColors,
    );
    return seriesColorMap;
  },
)(getChartIdSelector);
