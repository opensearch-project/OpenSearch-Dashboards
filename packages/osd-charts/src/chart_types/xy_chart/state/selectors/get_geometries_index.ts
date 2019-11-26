import createCachedSelector from 're-reselect';
import { IndexedGeometry } from '../../../../utils/geometry';
import { computeSeriesGeometriesSelector } from './compute_series_geometries';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';

export const getGeometriesIndexSelector = createCachedSelector(
  [computeSeriesGeometriesSelector],
  (geometries): Map<any, IndexedGeometry[]> => {
    return geometries.geometriesIndex;
  },
)(getChartIdSelector);
