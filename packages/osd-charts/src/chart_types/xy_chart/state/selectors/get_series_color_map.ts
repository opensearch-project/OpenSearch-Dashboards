import createCachedSelector from 're-reselect';
import { computeSeriesDomainsSelector } from './compute_series_domains';
import { getSeriesSpecsSelector } from './get_specs';
import { getSeriesColors, SeriesKey } from '../../utils/series';
import { getChartThemeSelector } from '../../../../state/selectors/get_chart_theme';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';
import { getCustomSeriesColors } from '../utils';
import { GlobalChartState } from '../../../../state/chart_state';
import { Color } from '../../../../utils/commons';

function getColorOverrides({ colors }: GlobalChartState) {
  return colors;
}

export const getSeriesColorsSelector = createCachedSelector(
  [getSeriesSpecsSelector, computeSeriesDomainsSelector, getChartThemeSelector, getColorOverrides],
  (seriesSpecs, seriesDomainsAndData, chartTheme, colorOverrides): Map<SeriesKey, Color> => {
    const updatedCustomSeriesColors = getCustomSeriesColors(seriesSpecs, seriesDomainsAndData.seriesCollection);

    const seriesColorMap = getSeriesColors(
      seriesDomainsAndData.seriesCollection,
      chartTheme.colors,
      updatedCustomSeriesColors,
      colorOverrides,
    );
    return seriesColorMap;
  },
)(getChartIdSelector);
