import createCachedSelector from 're-reselect';
import { getSettingsSpecSelector } from '../../../../state/selectors/get_settings_specs';
import { computeSeriesGeometriesSelector } from './compute_series_geometries';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';
// import { isChartAnimatable } from '../utils';

export const isChartAnimatableSelector = createCachedSelector(
  [computeSeriesGeometriesSelector, getSettingsSpecSelector],
  () => {
    // const { geometriesCounts } = seriesGeometries;
    // temporary disabled until
    // https://github.com/elastic/elastic-charts/issues/89 and https://github.com/elastic/elastic-charts/issues/41
    // return isChartAnimatable(geometriesCounts, settingsSpec.animateData);
    return false;
  },
)(getChartIdSelector);
