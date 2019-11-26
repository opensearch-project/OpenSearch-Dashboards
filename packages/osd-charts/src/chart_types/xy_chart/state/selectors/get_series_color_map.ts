import createCachedSelector from 're-reselect';
import { computeSeriesDomainsSelector } from './compute_series_domains';
import { getSeriesSpecsSelector } from './get_specs';
import { getUpdatedCustomSeriesColors } from '../utils';
import { getSeriesColorMap } from '../../utils/series';
import { getChartThemeSelector } from '../../../../state/selectors/get_chart_theme';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';

export const getSeriesColorMapSelector = createCachedSelector(
  [getSeriesSpecsSelector, computeSeriesDomainsSelector, getChartThemeSelector],
  (seriesSpecs, seriesDomainsAndData, chartTheme): Map<string, string> => {
    const updatedCustomSeriesColors = getUpdatedCustomSeriesColors(seriesSpecs);

    const seriesColorMap = getSeriesColorMap(
      seriesDomainsAndData.seriesColors,
      chartTheme.colors,
      updatedCustomSeriesColors,
    );
    return seriesColorMap;
  },
)(getChartIdSelector);
