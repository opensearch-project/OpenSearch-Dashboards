import createCachedSelector from 're-reselect';
import { getSettingsSpecSelector } from '../../../../state/selectors/get_settings_specs';
import { getAxisSpecsSelector, getAnnotationSpecsSelector } from './get_specs';
import { computeChartDimensionsSelector } from './compute_chart_dimensions';
import { countBarsInClusterSelector } from './count_bars_in_cluster';
import { isHistogramModeEnabledSelector } from './is_histogram_mode_enabled';
import { computeAnnotationDimensions, AnnotationDimensions } from '../../annotations/annotation_utils';
import { computeSeriesGeometriesSelector } from './compute_series_geometries';
import { AnnotationId } from '../../../../utils/ids';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';

export const computeAnnotationDimensionsSelector = createCachedSelector(
  [
    getAnnotationSpecsSelector,
    computeChartDimensionsSelector,
    getSettingsSpecSelector,
    computeSeriesGeometriesSelector,
    getAxisSpecsSelector,
    countBarsInClusterSelector,
    isHistogramModeEnabledSelector,
    getAxisSpecsSelector,
  ],
  (
    annotationSpecs,
    chartDimensions,
    settingsSpec,
    seriesGeometries,
    axesSpecs,
    totalBarsInCluster,
    isHistogramMode,
  ): Map<AnnotationId, AnnotationDimensions> => {
    const { yScales, xScale } = seriesGeometries.scales;
    return computeAnnotationDimensions(
      annotationSpecs,
      chartDimensions.chartDimensions,
      settingsSpec.rotation,
      yScales,
      xScale,
      axesSpecs,
      totalBarsInCluster,
      isHistogramMode,
    );
  },
)(getChartIdSelector);
