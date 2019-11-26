import createCachedSelector from 're-reselect';
import { compareByValueAsc } from '../../../../utils/commons';
import { computeSeriesGeometriesSelector } from './compute_series_geometries';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';

export const getGeometriesIndexKeysSelector = createCachedSelector(
  [computeSeriesGeometriesSelector],
  (seriesGeometries): any[] => {
    return [...seriesGeometries.geometriesIndex.keys()].sort(compareByValueAsc);
  },
)(getChartIdSelector);
