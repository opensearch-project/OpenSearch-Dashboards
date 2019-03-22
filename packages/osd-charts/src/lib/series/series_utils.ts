import { GeometryId } from './rendering';
import { DataSeriesColorsValues } from './series';

export function isEqualSeriesKey(a: any[], b: any[]): boolean {
  if (a.length !== b.length) {
    return false;
  }

  for (let i = 0, l = a.length; i < l; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }

  return true;
}

export function belongsToDataSeries(
  geometryValue: GeometryId,
  dataSeriesValues: DataSeriesColorsValues,
): boolean {
  const legendItemSeriesKey = dataSeriesValues.colorValues;
  const legendItemSpecId = dataSeriesValues.specId;

  const geometrySeriesKey = geometryValue.seriesKey;
  const geometrySpecId = geometryValue.specId;

  const hasSameSpecId = legendItemSpecId === geometrySpecId;
  const hasSameSeriesKey = isEqualSeriesKey(legendItemSeriesKey, geometrySeriesKey);

  return hasSameSpecId && hasSameSeriesKey;
}
