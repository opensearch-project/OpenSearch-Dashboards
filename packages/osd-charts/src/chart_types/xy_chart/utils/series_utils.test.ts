import { getSpecId } from '../../../utils/ids';
import { GeometryId } from '../rendering/rendering';
import { DataSeriesColorsValues } from './series';
import { belongsToDataSeries, isEqualSeriesKey } from './series_utils';

describe('Series utility functions', () => {
  test('can compare series keys for identity', () => {
    const seriesKeyA = ['a', 'b', 'c'];
    const seriesKeyB = ['a', 'b', 'c'];
    const seriesKeyC = ['a', 'b', 'd'];
    const seriesKeyD = ['d'];
    const seriesKeyE = ['b', 'a', 'c'];

    expect(isEqualSeriesKey(seriesKeyA, seriesKeyB)).toBe(true);
    expect(isEqualSeriesKey(seriesKeyB, seriesKeyC)).toBe(false);
    expect(isEqualSeriesKey(seriesKeyA, seriesKeyD)).toBe(false);
    expect(isEqualSeriesKey(seriesKeyA, seriesKeyE)).toBe(false);
    expect(isEqualSeriesKey(seriesKeyA, [])).toBe(false);
  });

  test('can determine if a geometry id belongs to a data series', () => {
    const geometryIdA: GeometryId = {
      specId: getSpecId('a'),
      seriesKey: ['a', 'b', 'c'],
    };

    const dataSeriesValuesA: DataSeriesColorsValues = {
      specId: getSpecId('a'),
      colorValues: ['a', 'b', 'c'],
    };

    const dataSeriesValuesB: DataSeriesColorsValues = {
      specId: getSpecId('b'),
      colorValues: ['a', 'b', 'c'],
    };

    const dataSeriesValuesC: DataSeriesColorsValues = {
      specId: getSpecId('a'),
      colorValues: ['a', 'b', 'd'],
    };

    expect(belongsToDataSeries(geometryIdA, dataSeriesValuesA)).toBe(true);
    expect(belongsToDataSeries(geometryIdA, dataSeriesValuesB)).toBe(false);
    expect(belongsToDataSeries(geometryIdA, dataSeriesValuesC)).toBe(false);
  });
});
