import createCachedSelector from 're-reselect';
import { isHistogramModeEnabledSelector } from './is_histogram_mode_enabled';
import { computeSeriesDomainsSelector } from './compute_series_domains';
import { getChartThemeSelector } from '../../../../state/selectors/get_chart_theme';
import { getSeriesSpecsSelector, getAxisSpecsSelector } from './get_specs';
import { getSettingsSpecSelector } from '../../../../state/selectors/get_settings_specs';
import { computeSeriesGeometries, ComputedGeometries } from '../utils';
import { getSeriesColorMapSelector } from './get_series_color_map';
import { computeChartDimensionsSelector } from './compute_chart_dimensions';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';

export const computeSeriesGeometriesSelector = createCachedSelector(
  [
    getSettingsSpecSelector,
    getSeriesSpecsSelector,
    computeSeriesDomainsSelector,
    getSeriesColorMapSelector,
    getChartThemeSelector,
    computeChartDimensionsSelector,
    getAxisSpecsSelector,
    isHistogramModeEnabledSelector,
  ],
  (
    settingsSpec,
    seriesSpecs,
    seriesDomainsAndData,
    seriesColorMap,
    chartTheme,
    chartDimensions,
    axesSpecs,
    isHistogramMode,
  ): ComputedGeometries => {
    const { xDomain, yDomain, formattedDataSeries } = seriesDomainsAndData;
    return computeSeriesGeometries(
      seriesSpecs,
      xDomain,
      yDomain,
      formattedDataSeries,
      seriesColorMap,
      chartTheme,
      chartDimensions.chartDimensions,
      settingsSpec.rotation,
      axesSpecs,
      isHistogramMode,
    );
  },
)(getChartIdSelector);
