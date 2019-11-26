import createCachedSelector from 're-reselect';
import { ComputedScales } from '../utils';
import { computeSeriesGeometriesSelector } from './compute_series_geometries';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';

export const getComputedScalesSelector = createCachedSelector(
  [computeSeriesGeometriesSelector],
  (geometries): ComputedScales => {
    return geometries.scales;
  },
)(getChartIdSelector);
