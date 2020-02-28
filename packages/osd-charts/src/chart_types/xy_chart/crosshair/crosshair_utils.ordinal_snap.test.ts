import { computeXScale } from '../utils/scales';
import { BasicSeriesSpec, SeriesTypes } from '../utils/specs';
import { ScaleType } from '../../../scales';
import { getSnapPosition } from './crosshair_utils';
import { computeSeriesDomains } from '../state/utils';
import { ChartTypes } from '../..';
import { SpecTypes } from '../../../specs/settings';

describe('Crosshair utils ordinal scales', () => {
  const barSeries1SpecId = 'barSeries1';
  const barSeries2SpecId = 'barSeries2';
  const lineSeries1SpecId = 'lineSeries1';
  const lineSeries2SpecId = 'lineSeries2';

  const barSeries1: BasicSeriesSpec = {
    chartType: ChartTypes.XYAxis,
    specType: SpecTypes.Series,
    id: barSeries1SpecId,
    groupId: 'group1',
    seriesType: SeriesTypes.Bar,
    data: [
      ['a', 0],
      ['b', 0],
      ['c', 0],
    ],
    xAccessor: 0,
    yAccessors: [1],
    xScaleType: ScaleType.Ordinal,
    yScaleType: ScaleType.Linear,
    yScaleToDataExtent: true,
  };
  const barSeries2: BasicSeriesSpec = {
    chartType: ChartTypes.XYAxis,
    specType: SpecTypes.Series,
    id: barSeries2SpecId,
    groupId: 'group1',
    seriesType: SeriesTypes.Bar,
    data: [
      ['a', 2],
      ['b', 2],
      ['c', 2],
    ],
    xAccessor: 0,
    yAccessors: [1],
    xScaleType: ScaleType.Ordinal,
    yScaleType: ScaleType.Linear,
    yScaleToDataExtent: true,
  };
  const lineSeries1: BasicSeriesSpec = {
    chartType: ChartTypes.XYAxis,
    specType: SpecTypes.Series,
    id: lineSeries1SpecId,
    groupId: 'group1',
    seriesType: SeriesTypes.Line,
    data: [
      ['a', 0],
      ['b', 0],
      ['c', 0],
    ],
    xAccessor: 0,
    yAccessors: [1],
    xScaleType: ScaleType.Ordinal,
    yScaleType: ScaleType.Linear,
    yScaleToDataExtent: true,
  };
  const lineSeries2: BasicSeriesSpec = {
    chartType: ChartTypes.XYAxis,
    specType: SpecTypes.Series,
    id: lineSeries2SpecId,
    groupId: 'group1',
    seriesType: SeriesTypes.Line,
    data: [
      ['a', 2],
      ['b', 2],
      ['c', 2],
    ],
    xAccessor: 0,
    yAccessors: [1],
    xScaleType: ScaleType.Ordinal,
    yScaleType: ScaleType.Linear,
    yScaleToDataExtent: true,
  };

  const barSeries = [barSeries1];
  const barSeriesDomains = computeSeriesDomains(barSeries);

  const multiBarSeries = [barSeries1, barSeries2];
  const multiBarSeriesDomains = computeSeriesDomains(multiBarSeries);

  const lineSeries = [lineSeries1];
  const lineSeriesDomains = computeSeriesDomains(lineSeries);

  const multiLineSeries = [lineSeries1, lineSeries2];
  const multiLineSeriesDomains = computeSeriesDomains(multiLineSeries);

  const mixedLinesBars = [lineSeries1, lineSeries2, barSeries1, barSeries2];
  const mixedLinesBarsSeriesDomains = computeSeriesDomains(mixedLinesBars);

  const barSeriesScale = computeXScale({
    xDomain: barSeriesDomains.xDomain,
    totalBarsInCluster: barSeries.length,
    range: [0, 120],
  });
  const multiBarSeriesScale = computeXScale({
    xDomain: multiBarSeriesDomains.xDomain,
    totalBarsInCluster: multiBarSeries.length,
    range: [0, 120],
  });
  const lineSeriesScale = computeXScale({
    xDomain: lineSeriesDomains.xDomain,
    totalBarsInCluster: lineSeries.length,
    range: [0, 120],
  });
  const multiLineSeriesScale = computeXScale({
    xDomain: multiLineSeriesDomains.xDomain,
    totalBarsInCluster: multiLineSeries.length,
    range: [0, 120],
  });
  const mixedLinesBarsSeriesScale = computeXScale({
    xDomain: mixedLinesBarsSeriesDomains.xDomain,
    totalBarsInCluster: mixedLinesBars.length,
    range: [0, 120],
  });

  test('can snap position on scale ordinal bar', () => {
    let snappedPosition = getSnapPosition('a', barSeriesScale);
    expect(snappedPosition!.band).toEqual(40);
    expect(snappedPosition!.position).toEqual(0);

    snappedPosition = getSnapPosition('b', barSeriesScale);
    expect(snappedPosition!.band).toEqual(40);
    expect(snappedPosition!.position).toEqual(40);

    snappedPosition = getSnapPosition('c', barSeriesScale);
    expect(snappedPosition!.band).toEqual(40);
    expect(snappedPosition!.position).toEqual(80);

    snappedPosition = getSnapPosition('x', barSeriesScale);
    expect(snappedPosition).toBeUndefined();

    snappedPosition = getSnapPosition('a', multiBarSeriesScale, 2);
    expect(snappedPosition!.band).toEqual(40);
    expect(snappedPosition!.position).toEqual(0);

    snappedPosition = getSnapPosition('b', multiBarSeriesScale, 2);
    expect(snappedPosition!.band).toEqual(40);
    expect(snappedPosition!.position).toEqual(40);

    snappedPosition = getSnapPosition('c', multiBarSeriesScale, 2);
    expect(snappedPosition!.band).toEqual(40);
    expect(snappedPosition!.position).toEqual(80);
  });
  test('can snap position on scale ordinal lines', () => {
    let snappedPosition = getSnapPosition('a', lineSeriesScale);
    expect(snappedPosition!.band).toEqual(40);
    expect(snappedPosition!.position).toEqual(0);

    snappedPosition = getSnapPosition('b', lineSeriesScale);
    expect(snappedPosition!.band).toEqual(40);
    expect(snappedPosition!.position).toEqual(40);

    snappedPosition = getSnapPosition('c', lineSeriesScale);
    expect(snappedPosition!.band).toEqual(40);
    expect(snappedPosition!.position).toEqual(80);

    snappedPosition = getSnapPosition('x', lineSeriesScale);
    expect(snappedPosition).toBeUndefined();

    snappedPosition = getSnapPosition('a', multiLineSeriesScale, 2);
    expect(snappedPosition!.band).toEqual(40);
    expect(snappedPosition!.position).toEqual(0);

    snappedPosition = getSnapPosition('b', multiLineSeriesScale, 2);
    expect(snappedPosition!.band).toEqual(40);
    expect(snappedPosition!.position).toEqual(40);

    snappedPosition = getSnapPosition('c', multiLineSeriesScale, 2);
    expect(snappedPosition!.band).toEqual(40);
    expect(snappedPosition!.position).toEqual(80);
  });

  test('can snap position on scale ordinal mixed lines/bars', () => {
    let snappedPosition = getSnapPosition('a', mixedLinesBarsSeriesScale, 4);
    expect(snappedPosition!.band).toEqual(40);
    expect(snappedPosition!.position).toEqual(0);

    snappedPosition = getSnapPosition('b', mixedLinesBarsSeriesScale, 4);
    expect(snappedPosition!.band).toEqual(40);
    expect(snappedPosition!.position).toEqual(40);

    snappedPosition = getSnapPosition('c', mixedLinesBarsSeriesScale, 4);
    expect(snappedPosition!.band).toEqual(40);
    expect(snappedPosition!.position).toEqual(80);

    snappedPosition = getSnapPosition('x', mixedLinesBarsSeriesScale, 4);
    expect(snappedPosition).toBeUndefined();
  });
});
