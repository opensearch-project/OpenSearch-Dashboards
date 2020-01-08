import createCachedSelector from 're-reselect';
import { getSeriesSpecsSelector } from './get_specs';
import { isHistogramModeEnabled } from '../utils';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';

export const isHistogramModeEnabledSelector = createCachedSelector([getSeriesSpecsSelector], (seriesSpecs): boolean => {
  return isHistogramModeEnabled(seriesSpecs);
})(getChartIdSelector);
