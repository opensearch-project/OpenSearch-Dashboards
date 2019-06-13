import { computeXScale } from '../lib/series/scales';
import { BasicSeriesSpec } from '../lib/series/specs';
import { Dimensions } from '../lib/utils/dimensions';
import { getGroupId, getSpecId } from '../lib/utils/ids';
import { ScaleType } from '../lib/utils/scales/scales';
import { getCursorBandPosition, getSnapPosition } from './crosshair_utils';
import { computeSeriesDomains } from './utils';

describe('Crosshair utils linear scale', () => {
  const barSeries1SpecId = getSpecId('barSeries1');
  const barSeries2SpecId = getSpecId('barSeries2');
  const lineSeries1SpecId = getSpecId('lineSeries1');
  const lineSeries2SpecId = getSpecId('lineSeries2');

  const barSeries1: BasicSeriesSpec = {
    id: barSeries1SpecId,
    groupId: getGroupId('group1'),
    seriesType: 'bar',
    data: [[0, 0], [1, 0], [2, 0]],
    xAccessor: 0,
    yAccessors: [1],
    xScaleType: ScaleType.Linear,
    yScaleType: ScaleType.Linear,
    yScaleToDataExtent: true,
  };
  const barSeries2: BasicSeriesSpec = {
    id: barSeries2SpecId,
    groupId: getGroupId('group1'),
    seriesType: 'bar',
    data: [[0, 2], [1, 2], [2, 2]],
    xAccessor: 0,
    yAccessors: [1],
    xScaleType: ScaleType.Linear,
    yScaleType: ScaleType.Linear,
    yScaleToDataExtent: true,
  };
  const lineSeries1: BasicSeriesSpec = {
    id: lineSeries1SpecId,
    groupId: getGroupId('group1'),
    seriesType: 'line',
    data: [[0, 0], [1, 0], [2, 0]],
    xAccessor: 0,
    yAccessors: [1],
    xScaleType: ScaleType.Linear,
    yScaleType: ScaleType.Linear,
    yScaleToDataExtent: true,
  };
  const lineSeries2: BasicSeriesSpec = {
    id: lineSeries2SpecId,
    groupId: getGroupId('group1'),
    seriesType: 'line',
    data: [[0, 2], [1, 2], [2, 2]],
    xAccessor: 0,
    yAccessors: [1],
    xScaleType: ScaleType.Linear,
    yScaleType: ScaleType.Linear,
    yScaleToDataExtent: true,
  };

  const barSeriesMap = new Map();
  barSeriesMap.set(barSeries1SpecId, barSeries1);
  const barSeriesDomains = computeSeriesDomains(barSeriesMap, new Map());

  const multiBarSeriesMap = new Map();
  multiBarSeriesMap.set(barSeries1SpecId, barSeries1);
  multiBarSeriesMap.set(barSeries2SpecId, barSeries2);
  const multiBarSeriesDomains = computeSeriesDomains(multiBarSeriesMap, new Map());

  const lineSeriesMap = new Map();
  lineSeriesMap.set(lineSeries1SpecId, lineSeries1);
  const lineSeriesDomains = computeSeriesDomains(lineSeriesMap, new Map());

  const multiLineSeriesMap = new Map();
  multiLineSeriesMap.set(lineSeries1SpecId, lineSeries1);
  multiLineSeriesMap.set(lineSeries2SpecId, lineSeries2);
  const multiLineSeriesDomains = computeSeriesDomains(multiLineSeriesMap, new Map());

  const mixedLinesBarsMap = new Map();
  mixedLinesBarsMap.set(lineSeries1SpecId, lineSeries1);
  mixedLinesBarsMap.set(lineSeries2SpecId, lineSeries2);
  mixedLinesBarsMap.set(barSeries1SpecId, barSeries1);
  mixedLinesBarsMap.set(barSeries2SpecId, barSeries2);
  const mixedLinesBarsSeriesDomains = computeSeriesDomains(mixedLinesBarsMap, new Map());

  const barSeriesScale = computeXScale(barSeriesDomains.xDomain, barSeriesMap.size, 0, 120);
  const multiBarSeriesScale = computeXScale(multiBarSeriesDomains.xDomain, multiBarSeriesMap.size, 0, 120);
  const lineSeriesScale = computeXScale(lineSeriesDomains.xDomain, lineSeriesMap.size, 0, 120);
  const multiLineSeriesScale = computeXScale(multiLineSeriesDomains.xDomain, multiLineSeriesMap.size, 0, 120);
  const mixedLinesBarsSeriesScale = computeXScale(mixedLinesBarsSeriesDomains.xDomain, mixedLinesBarsMap.size, 0, 120);

  /**
   * if we have lines on a linear scale, the snap position and band should
   * be always the same independently of the number of series
   */
  test('can snap position on linear scale (line/area)', () => {
    let snappedPosition = getSnapPosition(0, lineSeriesScale);
    expect(snappedPosition!.band).toEqual(1);
    expect(snappedPosition!.position).toEqual(0);

    snappedPosition = getSnapPosition(1, lineSeriesScale);
    expect(snappedPosition!.band).toEqual(1);
    expect(snappedPosition!.position).toEqual(60);

    snappedPosition = getSnapPosition(2, lineSeriesScale);
    expect(snappedPosition!.band).toEqual(1);
    expect(snappedPosition!.position).toEqual(120);

    // TODO uncomment this when we will limit the scale function to domain values.
    // snappedPosition = getSnapPosition(3, singleScale);
    // expect(snappedPosition!.band).toEqual(1);
    // expect(snappedPosition!.position).toBeUndefined();

    snappedPosition = getSnapPosition(0, multiLineSeriesScale, 2);
    expect(snappedPosition!.band).toEqual(1);
    expect(snappedPosition!.position).toEqual(0);

    snappedPosition = getSnapPosition(1, multiLineSeriesScale, 2);
    expect(snappedPosition!.band).toEqual(1);
    expect(snappedPosition!.position).toEqual(60);

    snappedPosition = getSnapPosition(2, multiLineSeriesScale, 2);
    expect(snappedPosition!.band).toEqual(1);
    expect(snappedPosition!.position).toEqual(120);
  });

  /**
   * if we have bars on a linear scale, the snap position and band should
   * be always the same independently of the number of series
   */
  test('can snap position on linear scale (bar)', () => {
    let snappedPosition = getSnapPosition(0, barSeriesScale);
    expect(snappedPosition!.band).toEqual(40);
    expect(snappedPosition!.position).toEqual(0);

    snappedPosition = getSnapPosition(1, barSeriesScale);
    expect(snappedPosition!.band).toEqual(40);
    expect(snappedPosition!.position).toEqual(40);

    snappedPosition = getSnapPosition(2, barSeriesScale);
    expect(snappedPosition!.band).toEqual(40);
    expect(snappedPosition!.position).toEqual(80);

    // TODO uncomment this when we will limit the scale function to domain values.
    // snappedPosition = getSnapPosition(3, singleScale);
    // expect(snappedPosition!.band).toEqual(40);
    // expect(snappedPosition!.position).toBeUndefined();

    // test a scale with a value of totalBarsInCluster > 1
    snappedPosition = getSnapPosition(0, multiBarSeriesScale, 2);
    expect(snappedPosition!.band).toEqual(40);
    expect(snappedPosition!.position).toEqual(0);

    snappedPosition = getSnapPosition(1, multiBarSeriesScale, 2);
    expect(snappedPosition!.band).toEqual(40);
    expect(snappedPosition!.position).toEqual(40);

    snappedPosition = getSnapPosition(2, multiBarSeriesScale, 2);
    expect(snappedPosition!.band).toEqual(40);
    expect(snappedPosition!.position).toEqual(80);
  });

  /**
   * if we have bars and lines on a linear scale, the snap position and band should
   * be always the same independently of the number of series
   */
  test('can snap position on linear scale (mixed bars and lines)', () => {
    let snappedPosition = getSnapPosition(0, mixedLinesBarsSeriesScale, 4);
    expect(snappedPosition!.band).toEqual(40);
    expect(snappedPosition!.position).toEqual(0);

    snappedPosition = getSnapPosition(1, mixedLinesBarsSeriesScale, 4);
    expect(snappedPosition!.band).toEqual(40);
    expect(snappedPosition!.position).toEqual(40);

    snappedPosition = getSnapPosition(2, mixedLinesBarsSeriesScale, 4);
    expect(snappedPosition!.band).toEqual(40);
    expect(snappedPosition!.position).toEqual(80);
  });
  test('safeguard cursor band position', () => {
    const chartDimensions: Dimensions = { top: 0, left: 0, width: 120, height: 100 };
    const chartRotation = 0;
    const snapPosition = false;
    let bandPosition = getCursorBandPosition(
      chartRotation,
      chartDimensions,
      { x: 200, y: 0 },
      snapPosition,
      lineSeriesScale,
      [0, 1, 2],
      1,
    );
    expect(bandPosition).toBeUndefined();
    bandPosition = getCursorBandPosition(
      chartRotation,
      chartDimensions,
      { x: 0, y: 200 },
      snapPosition,
      lineSeriesScale,
      [0, 1, 2],
      1,
    );
    expect(bandPosition).toBeUndefined();

    bandPosition = getCursorBandPosition(
      chartRotation,
      chartDimensions,
      { x: -1, y: 0 },
      snapPosition,
      lineSeriesScale,
      [0, 1, 2],
      1,
    );
    expect(bandPosition).toBeUndefined();

    bandPosition = getCursorBandPosition(
      chartRotation,
      chartDimensions,
      { x: 0, y: -1 },
      snapPosition,
      lineSeriesScale,
      [0, 1, 2],
      1,
    );
    expect(bandPosition).toBeUndefined();
  });

  describe('BandPosition line chart', () => {
    const chartDimensions: Dimensions = { top: 0, left: 0, width: 120, height: 100 };

    describe('0 degree rotation, snap disabled', () => {
      const chartRotation = 0;
      const snapPosition = false;

      test('0,0 position', () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 0, y: 0 },
          snapPosition,
          lineSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toEqual({
          left: 0,
          top: 0,
          height: 100,
          width: 1,
        });
      });

      test("changes on y mouse position doesn't change the band position", () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 0, y: 45 },
          snapPosition,
          lineSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toEqual({
          left: 0,
          top: 0,
          height: 100,
          width: 1,
        });
      });

      test('increase of x axis increase the left param 1', () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 40, y: 0 },
          snapPosition,
          lineSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toEqual({
          left: 40,
          top: 0,
          height: 100,
          width: 1,
        });
      });

      test('increase of x axis increase the left param 2', () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 90, y: 0 },
          snapPosition,
          lineSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toEqual({
          left: 90,
          top: 0,
          height: 100,
          width: 1,
        });
      });

      test('limit the band position based on chart dimension', () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 200, y: 0 },
          snapPosition,
          lineSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toBeUndefined();
      });
    });
    describe('0 degree rotation, snap enabled', () => {
      const chartRotation = 0;
      const snapPosition = true;

      test('0,0 position', () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 0, y: 0 },
          snapPosition,
          lineSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toEqual({
          left: 0,
          top: 0,
          height: 100,
          width: 1,
        });
      });

      test("changes on y mouse position doesn't change the band position", () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 0, y: 45 },
          snapPosition,
          lineSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toEqual({
          left: 0,
          top: 0,
          height: 100,
          width: 1,
        });
      });

      test('increase of x axis increase the left param 1', () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 20, y: 0 },
          snapPosition,
          lineSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toEqual({
          left: 0,
          top: 0,
          height: 100,
          width: 1,
        });
      });

      test('increase of x axis increase the left param 2', () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 40, y: 0 },
          snapPosition,
          lineSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toEqual({
          left: 60,
          top: 0,
          height: 100,
          width: 1,
        });
      });

      test('increase of x axis increase the left param 3', () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 95, y: 0 },
          snapPosition,
          lineSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toEqual({
          left: 120,
          top: 0,
          height: 100,
          width: 1,
        });
      });

      test('limit the band position based on chart dimension', () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 200, y: 0 },
          snapPosition,
          lineSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toBeUndefined();
      });
    });

    describe('180 degree rotation, snap disabled', () => {
      const chartRotation = 180;
      const snapPosition = false;

      test('0,0 position', () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 0, y: 0 },
          snapPosition,
          lineSeriesScale,
          [0, 1, 2],
          1,
        );

        expect(bandPosition).toEqual({
          left: 120,
          top: 0,
          height: 100,
          width: 1,
        });
      });

      test("changes on y mouse position doesn't change the band position", () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 0, y: 45 },
          snapPosition,
          lineSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toEqual({
          left: 120,
          top: 0,
          height: 100,
          width: 1,
        });
      });

      test('increase of x axis increase the left param 1', () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 40, y: 0 },
          snapPosition,
          lineSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toEqual({
          left: 80,
          top: 0,
          height: 100,
          width: 1,
        });
      });

      test('increase of x axis increase the left param 2', () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 90, y: 0 },
          snapPosition,
          lineSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toEqual({
          left: 30,
          top: 0,
          height: 100,
          width: 1,
        });
      });

      test('limit the band position based on chart dimension', () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 200, y: 0 },
          snapPosition,
          lineSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toBeUndefined();
      });
    });

    describe('180 degree rotation, snap enabled', () => {
      const chartRotation = 180;
      const snapPosition = true;

      test('0,0 position', () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 0, y: 0 },
          snapPosition,
          lineSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toEqual({
          left: 120,
          top: 0,
          height: 100,
          width: 1,
        });
      });

      test("changes on y mouse position doesn't change the band position", () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 0, y: 45 },
          snapPosition,
          lineSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toEqual({
          left: 120,
          top: 0,
          height: 100,
          width: 1,
        });
      });

      test('increase of x axis increase the left param 1', () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 20, y: 0 },
          snapPosition,
          lineSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toEqual({
          left: 120,
          top: 0,
          height: 100,
          width: 1,
        });
      });

      test('increase of x axis increase the left param 2', () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 40, y: 0 },
          snapPosition,
          lineSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toEqual({
          left: 60,
          top: 0,
          height: 100,
          width: 1,
        });
      });

      test('increase of x axis increase the left param 3', () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 95, y: 0 },
          snapPosition,
          lineSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toEqual({
          left: 0,
          top: 0,
          height: 100,
          width: 1,
        });
      });

      test('limit the band position based on chart dimension', () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 200, y: 0 },
          snapPosition,
          lineSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toBeUndefined();
      });
    });

    describe('90 degree rotation, snap disabled', () => {
      const chartRotation = 90;
      const snapPosition = false;

      test('0,0 position', () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 0, y: 0 },
          snapPosition,
          lineSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toEqual({
          left: 0,
          top: 0,
          height: 1,
          width: 120,
        });
      });

      test("changes on x mouse position doesn't change the band position", () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 45, y: 0 },
          snapPosition,
          lineSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toEqual({
          left: 0,
          top: 45,
          height: 1,
          width: 120,
        });
      });

      test('increase of y mouse position increase the top param 1', () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 0, y: 40 },
          snapPosition,
          lineSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toEqual({
          left: 0,
          top: 0,
          height: 1,
          width: 120,
        });
      });

      test('increase of y mouse position increase the top param 2', () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 0, y: 90 },
          snapPosition,
          lineSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toEqual({
          left: 0,
          top: 0,
          height: 1,
          width: 120,
        });
      });

      test('limit the band position based on chart dimension', () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 0, y: 200 },
          snapPosition,
          lineSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toBeUndefined();
      });
    });

    describe('90 degree rotation, snap enabled', () => {
      const chartRotation = 90;
      const snapPosition = true;

      test('0,0 position', () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 0, y: 0 },
          snapPosition,
          lineSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toEqual({
          left: 0,
          top: 0,
          height: 1,
          width: 120,
        });
      });

      test("changes on x mouse position doesn't change the band position", () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 45, y: 0 },
          snapPosition,
          lineSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toEqual({
          left: 0,
          top: 60,
          height: 1,
          width: 120,
        });
      });

      test('increase of y mouse position increase the top param 1', () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 0, y: 20 },
          snapPosition,
          lineSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toEqual({
          left: 0,
          top: 0,
          height: 1,
          width: 120,
        });
      });

      test('increase of y mouse position increase the top param 2', () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 0, y: 40 },
          snapPosition,
          lineSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toEqual({
          left: 0,
          top: 0,
          height: 1,
          width: 120,
        });
      });

      test('increase of y mouse position increase the top param 3', () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 0, y: 95 },
          snapPosition,
          lineSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toEqual({
          left: 0,
          top: 0,
          height: 1,
          width: 120,
        });
      });

      test('limit the band position based on chart dimension', () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 0, y: 200 },
          snapPosition,
          lineSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toBeUndefined();
      });
    });

    describe('-90 degree rotation, snap disabled', () => {
      const chartRotation = -90;
      const snapPosition = false;

      test('0,0 position', () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 0, y: 0 },
          snapPosition,
          lineSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toEqual({
          left: 0,
          top: 100,
          height: 1,
          width: 120,
        });
      });

      test("changes on x mouse position doesn't change the band position", () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 45, y: 0 },
          snapPosition,
          lineSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toEqual({
          left: 0,
          top: 55,
          height: 1,
          width: 120,
        });
      });

      test('increase of y mouse position increase the top param 1', () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 0, y: 40 },
          snapPosition,
          lineSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toEqual({
          left: 0,
          top: 100,
          height: 1,
          width: 120,
        });
      });

      test('increase of y mouse position increase the top param 2', () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 0, y: 90 },
          snapPosition,
          lineSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toEqual({
          left: 0,
          top: 100,
          height: 1,
          width: 120,
        });
      });

      test('limit the band position based on chart dimension', () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 0, y: 200 },
          snapPosition,
          lineSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toBeUndefined();
      });
    });

    describe('-90 degree rotation, snap enabled', () => {
      const chartRotation = -90;
      const snapPosition = true;

      test('0,0 position', () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 0, y: 0 },
          snapPosition,
          lineSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toEqual({
          left: 0,
          top: 100,
          height: 1,
          width: 120,
        });
      });

      test("changes on x mouse position doesn't change the band position", () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 45, y: 0 },
          snapPosition,
          lineSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toEqual({
          left: 0,
          top: 40,
          height: 1,
          width: 120,
        });
      });

      test('increase of y mouse position increase the top param 1', () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 0, y: 20 },
          snapPosition,
          lineSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toEqual({
          left: 0,
          top: 100,
          height: 1,
          width: 120,
        });
      });

      test('increase of y mouse position increase the top param 2', () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 0, y: 40 },
          snapPosition,
          lineSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toEqual({
          left: 0,
          top: 100,
          height: 1,
          width: 120,
        });
      });

      test('increase of y mouse position increase the top param 3', () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 0, y: 95 },
          snapPosition,
          lineSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toEqual({
          left: 0,
          top: 100,
          height: 1,
          width: 120,
        });
      });

      test('limit the band position based on chart dimension', () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 0, y: 200 },
          snapPosition,
          lineSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toBeUndefined();
      });
    });
  });

  describe('BandPosition bar chart', () => {
    const chartDimensions: Dimensions = { top: 0, left: 0, width: 120, height: 100 };
    describe('0 degree rotation, snap enabled', () => {
      const chartRotation = 0;
      const snapPosition = true;

      test('0,0 position', () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 0, y: 0 },
          snapPosition,
          barSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toEqual({
          left: 0,
          top: 0,
          height: 100,
          width: 40,
        });
      });

      test("changes on y mouse position doesn't change the band position", () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 0, y: 45 },
          snapPosition,
          barSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toEqual({
          left: 0,
          top: 0,
          height: 100,
          width: 40,
        });
      });

      test('increase of x axis increase the left param 1', () => {
        let bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 39, y: 0 },
          snapPosition,
          barSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toEqual({
          left: 0,
          top: 0,
          height: 100,
          width: 40,
        });
        bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 40, y: 0 },
          snapPosition,
          barSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toEqual({
          left: 40,
          top: 0,
          height: 100,
          width: 40,
        });
      });

      test('increase of x axis increase the left param 2', () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 90, y: 0 },
          snapPosition,
          barSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toEqual({
          left: 80,
          top: 0,
          height: 100,
          width: 40,
        });
      });

      test('limit the band position based on chart dimension', () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 200, y: 0 },
          snapPosition,
          barSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toBeUndefined();
      });
    });

    describe('180 degree rotation, snap enabled', () => {
      const chartRotation = 180;
      const snapPosition = true;

      test('0,0 position', () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 0, y: 0 },
          snapPosition,
          barSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toEqual({
          left: 80,
          top: 0,
          height: 100,
          width: 40,
        });
      });

      test("changes on y mouse position doesn't change the band position", () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 0, y: 45 },
          snapPosition,
          barSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toEqual({
          left: 80,
          top: 0,
          height: 100,
          width: 40,
        });
      });

      test('increase of x axis increase the left param 1', () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 40, y: 0 },
          snapPosition,
          barSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toEqual({
          left: 40,
          top: 0,
          height: 100,
          width: 40,
        });
      });

      test('increase of x axis increase the left param 2', () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 90, y: 0 },
          snapPosition,
          barSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toEqual({
          left: 0,
          top: 0,
          height: 100,
          width: 40,
        });
      });

      test('limit the band position based on chart dimension', () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 200, y: 0 },
          snapPosition,
          barSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toBeUndefined();
      });
    });

    describe('90 degree rotation, snap enabled', () => {
      const chartRotation = 90;
      const snapPosition = true;

      test('0,0 position', () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 0, y: 0 },
          snapPosition,
          barSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toEqual({
          left: 0,
          top: 0,
          height: 40,
          width: 120,
        });
      });

      test("changes on x mouse position doesn't change the band position", () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 45, y: 0 },
          snapPosition,
          barSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toEqual({
          left: 0,
          top: 40,
          height: 40,
          width: 120,
        });
      });

      test('increase of y mouse position increase the top param 1', () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 0, y: 40 },
          snapPosition,
          barSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toEqual({
          left: 0,
          top: 0,
          height: 40,
          width: 120,
        });
      });

      test('increase of y mouse position increase the top param 2', () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 0, y: 90 },
          snapPosition,
          barSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toEqual({
          left: 0,
          top: 0,
          height: 40,
          width: 120,
        });
      });

      test('limit the band position based on chart dimension', () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 0, y: 200 },
          snapPosition,
          barSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toBeUndefined();
      });
    });

    describe('-90 degree rotation, snap disabled', () => {
      const chartRotation = -90;
      const snapPosition = true;

      test('0,0 position', () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 0, y: 0 },
          snapPosition,
          barSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toEqual({
          left: 0,
          top: 60,
          height: 40,
          width: 120,
        });
      });

      test("changes on x mouse position doesn't change the band position", () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 45, y: 0 },
          snapPosition,
          barSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toEqual({
          left: 0,
          top: 20,
          height: 40,
          width: 120,
        });
      });

      test('increase of y mouse position increase the top param 1', () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 0, y: 40 },
          snapPosition,
          barSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toEqual({
          left: 0,
          top: 60,
          height: 40,
          width: 120,
        });
      });

      test('increase of y mouse position increase the top param 2', () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 0, y: 90 },
          snapPosition,
          barSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toEqual({
          left: 0,
          top: 60,
          height: 40,
          width: 120,
        });
      });

      test('limit the band position based on chart dimension', () => {
        const bandPosition = getCursorBandPosition(
          chartRotation,
          chartDimensions,
          { x: 0, y: 200 },
          snapPosition,
          barSeriesScale,
          [0, 1, 2],
          1,
        );
        expect(bandPosition).toBeUndefined();
      });
    });
  });
});
