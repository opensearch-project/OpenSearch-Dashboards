import createCachedSelector from 're-reselect';
import { computeSeriesDomainsSelector } from './compute_series_domains';
import { getSeriesSpecsSelector, getAxisSpecsSelector } from './get_specs';
import { getChartThemeSelector } from '../../../../state/selectors/get_chart_theme';
import { getSeriesColorsSelector } from './get_series_color_map';
import { computeLegend, LegendItem } from '../../legend/legend';
import { GlobalChartState } from '../../../../state/chart_state';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';
import { SeriesKey } from '../../utils/series';

const getDeselectedSeriesSelector = (state: GlobalChartState) => state.interactions.deselectedDataSeries;

export const computeLegendSelector = createCachedSelector(
  [
    getSeriesSpecsSelector,
    computeSeriesDomainsSelector,
    getChartThemeSelector,
    getSeriesColorsSelector,
    getAxisSpecsSelector,
    getDeselectedSeriesSelector,
  ],
  (
    seriesSpecs,
    seriesDomainsAndData,
    chartTheme,
    seriesColors,
    axesSpecs,
    deselectedDataSeries,
  ): Map<SeriesKey, LegendItem> => {
    return computeLegend(
      seriesDomainsAndData.seriesCollection,
      seriesColors,
      seriesSpecs,
      chartTheme.colors.defaultVizColor,
      axesSpecs,
      deselectedDataSeries,
    );
  },
)(getChartIdSelector);
