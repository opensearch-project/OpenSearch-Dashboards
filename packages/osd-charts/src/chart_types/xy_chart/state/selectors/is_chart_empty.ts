import createCachedSelector from 're-reselect';
import { isAllSeriesDeselected } from '../utils';
import { computeLegendSelector } from './compute_legend';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';
export const isChartEmptySelector = createCachedSelector([computeLegendSelector], (legendItems): boolean => {
  return isAllSeriesDeselected(legendItems);
})(getChartIdSelector);
