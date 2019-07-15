/* eslint @typescript-eslint/no-object-literal-type-assertion: off */
import { computeSeriesDomains } from '../../state/utils';
import { getGroupId, getSpecId, SpecId } from '../utils/ids';
import { ScaleType } from '../utils/scales/scales';
import { CurveType } from './curves';
import { AreaGeometry, IndexedGeometry, PointGeometry, renderArea } from './rendering';
import { computeXScale, computeYScales } from './scales';
import { AreaSeriesSpec } from './specs';
import { LIGHT_THEME } from '../themes/light_theme';
const SPEC_ID = getSpecId('spec_1');
const GROUP_ID = getGroupId('group_1');

describe('Rendering points - areas', () => {
  describe('Empty line for missing data', () => {
    const pointSeriesSpec: AreaSeriesSpec = {
      id: SPEC_ID,
      groupId: GROUP_ID,
      seriesType: 'area',
      yScaleToDataExtent: false,
      data: [[0, 10], [1, 5]],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Ordinal,
      yScaleType: ScaleType.Linear,
    };
    const pointSeriesMap = new Map<SpecId, AreaSeriesSpec>();
    pointSeriesMap.set(SPEC_ID, pointSeriesSpec);
    const pointSeriesDomains = computeSeriesDomains(pointSeriesMap, new Map());
    const xScale = computeXScale(pointSeriesDomains.xDomain, pointSeriesMap.size, 0, 100);
    const yScales = computeYScales(pointSeriesDomains.yDomain, 100, 0);
    let renderedArea: {
      areaGeometry: AreaGeometry;
      indexedGeometries: Map<any, IndexedGeometry[]>;
    };

    beforeEach(() => {
      renderedArea = renderArea(
        25, // adding a ideal 25px shift, generally applied by renderGeometries
        [],
        xScale,
        yScales.get(GROUP_ID)!,
        'red',
        CurveType.LINEAR,
        SPEC_ID,
        false,
        [],
        0,
        LIGHT_THEME.areaSeriesStyle,
      );
    });
    test('Render geometry but empty upper and lower lines and area paths', () => {
      const {
        areaGeometry: { lines, area, color, geometryId, transform },
      } = renderedArea;
      expect(lines.length).toBe(0);
      expect(area).toBe('');
      expect(color).toBe('red');
      expect(geometryId.seriesKey).toEqual([]);
      expect(geometryId.specId).toEqual(SPEC_ID);
      expect(transform).toEqual({ x: 25, y: 0 });
    });
  });
  describe('Single series area chart - ordinal', () => {
    const pointSeriesSpec: AreaSeriesSpec = {
      id: SPEC_ID,
      groupId: GROUP_ID,
      seriesType: 'area',
      yScaleToDataExtent: false,
      data: [[0, 10], [1, 5]],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Ordinal,
      yScaleType: ScaleType.Linear,
    };
    const pointSeriesMap = new Map<SpecId, AreaSeriesSpec>();
    pointSeriesMap.set(SPEC_ID, pointSeriesSpec);
    const pointSeriesDomains = computeSeriesDomains(pointSeriesMap, new Map());
    const xScale = computeXScale(pointSeriesDomains.xDomain, pointSeriesMap.size, 0, 100);
    const yScales = computeYScales(pointSeriesDomains.yDomain, 100, 0);
    let renderedArea: {
      areaGeometry: AreaGeometry;
      indexedGeometries: Map<any, IndexedGeometry[]>;
    };

    beforeEach(() => {
      renderedArea = renderArea(
        25, // adding a ideal 25px shift, generally applied by renderGeometries
        pointSeriesDomains.formattedDataSeries.nonStacked[0].dataSeries[0].data,
        xScale,
        yScales.get(GROUP_ID)!,
        'red',
        CurveType.LINEAR,
        SPEC_ID,
        false,
        [],
        0,
        LIGHT_THEME.areaSeriesStyle,
      );
    });
    test('Can render an line and area paths', () => {
      const {
        areaGeometry: { lines, area, color, geometryId, transform },
      } = renderedArea;
      expect(lines[0]).toBe('M0,0L50,50');
      expect(area).toBe('M0,0L50,50L50,100L0,100Z');
      expect(color).toBe('red');
      expect(geometryId.seriesKey).toEqual([]);
      expect(geometryId.specId).toEqual(SPEC_ID);
      expect(transform).toEqual({ x: 25, y: 0 });
    });

    test('Can render two points', () => {
      const {
        areaGeometry: { points },
        indexedGeometries,
      } = renderedArea;

      expect(points[0]).toEqual({
        x: 0,
        y: 0,
        radius: 10,
        color: 'red',
        geometryId: {
          specId: SPEC_ID,
          seriesKey: [],
        },
        value: {
          accessor: 'y1',
          x: 0,
          y: 10,
        },

        transform: {
          x: 25,
          y: 0,
        },
      } as PointGeometry);
      expect(points[1]).toEqual({
        x: 50,
        y: 50,
        radius: 10,
        color: 'red',
        geometryId: {
          specId: SPEC_ID,
          seriesKey: [],
        },
        value: {
          accessor: 'y1',
          x: 1,
          y: 5,
        },
        transform: {
          x: 25,
          y: 0,
        },
      } as PointGeometry);
      expect(indexedGeometries.size).toEqual(points.length);
    });
  });
  describe('Multi series area chart - ordinal', () => {
    const spec1Id = getSpecId('point1');
    const spec2Id = getSpecId('point2');
    const pointSeriesSpec1: AreaSeriesSpec = {
      id: spec1Id,
      groupId: GROUP_ID,
      seriesType: 'area',
      yScaleToDataExtent: false,
      data: [[0, 10], [1, 5]],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Ordinal,
      yScaleType: ScaleType.Linear,
    };
    const pointSeriesSpec2: AreaSeriesSpec = {
      id: spec2Id,
      groupId: GROUP_ID,
      seriesType: 'area',
      yScaleToDataExtent: false,
      data: [[0, 20], [1, 10]],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Ordinal,
      yScaleType: ScaleType.Linear,
    };
    const pointSeriesMap = new Map<SpecId, AreaSeriesSpec>();
    pointSeriesMap.set(spec1Id, pointSeriesSpec1);
    pointSeriesMap.set(spec2Id, pointSeriesSpec2);
    const pointSeriesDomains = computeSeriesDomains(pointSeriesMap, new Map());
    const xScale = computeXScale(pointSeriesDomains.xDomain, pointSeriesMap.size, 0, 100);
    const yScales = computeYScales(pointSeriesDomains.yDomain, 100, 0);

    let firstLine: {
      areaGeometry: AreaGeometry;
      indexedGeometries: Map<any, IndexedGeometry[]>;
    };
    let secondLine: {
      areaGeometry: AreaGeometry;
      indexedGeometries: Map<any, IndexedGeometry[]>;
    };

    beforeEach(() => {
      firstLine = renderArea(
        25, // adding a ideal 25px shift, generally applied by renderGeometries
        pointSeriesDomains.formattedDataSeries.nonStacked[0].dataSeries[0].data,
        xScale,
        yScales.get(GROUP_ID)!,
        'red',
        CurveType.LINEAR,
        spec1Id,
        false,
        [],
        0,
        LIGHT_THEME.areaSeriesStyle,
      );
      secondLine = renderArea(
        25, // adding a ideal 25px shift, generally applied by renderGeometries
        pointSeriesDomains.formattedDataSeries.nonStacked[0].dataSeries[1].data,
        xScale,
        yScales.get(GROUP_ID)!,
        'blue',
        CurveType.LINEAR,
        spec2Id,
        false,
        [],
        0,
        LIGHT_THEME.areaSeriesStyle,
      );
    });

    test('Can render two ordinal areas', () => {
      expect(firstLine.areaGeometry.lines[0]).toBe('M0,50L50,75');
      expect(firstLine.areaGeometry.area).toBe('M0,50L50,75L50,100L0,100Z');
      expect(firstLine.areaGeometry.color).toBe('red');
      expect(firstLine.areaGeometry.geometryId.seriesKey).toEqual([]);
      expect(firstLine.areaGeometry.geometryId.specId).toEqual(spec1Id);
      expect(firstLine.areaGeometry.transform).toEqual({ x: 25, y: 0 });

      expect(secondLine.areaGeometry.lines[0]).toBe('M0,0L50,50');
      expect(secondLine.areaGeometry.area).toBe('M0,0L50,50L50,100L0,100Z');
      expect(secondLine.areaGeometry.color).toBe('blue');
      expect(secondLine.areaGeometry.geometryId.seriesKey).toEqual([]);
      expect(secondLine.areaGeometry.geometryId.specId).toEqual(spec2Id);
      expect(secondLine.areaGeometry.transform).toEqual({ x: 25, y: 0 });
    });
    test('can render first spec points', () => {
      const {
        areaGeometry: { points },
        indexedGeometries,
      } = firstLine;
      expect(points.length).toEqual(2);
      expect(points[0]).toEqual({
        x: 0,
        y: 50,
        radius: 10,
        color: 'red',
        geometryId: {
          specId: spec1Id,
          seriesKey: [],
        },
        value: {
          accessor: 'y1',
          x: 0,
          y: 10,
        },
        transform: {
          x: 25,
          y: 0,
        },
      } as PointGeometry);
      expect(points[1]).toEqual({
        x: 50,
        y: 75,
        radius: 10,
        color: 'red',
        geometryId: {
          specId: spec1Id,
          seriesKey: [],
        },
        value: {
          accessor: 'y1',
          x: 1,
          y: 5,
        },
        transform: {
          x: 25,
          y: 0,
        },
      } as PointGeometry);
      expect(indexedGeometries.size).toEqual(points.length);
    });
    test('can render second spec points', () => {
      const {
        areaGeometry: { points },
        indexedGeometries,
      } = secondLine;
      expect(points.length).toEqual(2);
      expect(points[0]).toEqual({
        x: 0,
        y: 0,
        radius: 10,
        color: 'blue',
        geometryId: {
          specId: spec2Id,
          seriesKey: [],
        },
        value: {
          accessor: 'y1',
          x: 0,
          y: 20,
        },
        transform: {
          x: 25,
          y: 0,
        },
      } as PointGeometry);
      expect(points[1]).toEqual({
        x: 50,
        y: 50,
        radius: 10,
        color: 'blue',
        geometryId: {
          specId: spec2Id,
          seriesKey: [],
        },
        value: {
          accessor: 'y1',
          x: 1,
          y: 10,
        },
        transform: {
          x: 25,
          y: 0,
        },
      } as PointGeometry);
      expect(indexedGeometries.size).toEqual(points.length);
    });
  });
  describe('Single series area chart - linear', () => {
    const pointSeriesSpec: AreaSeriesSpec = {
      id: SPEC_ID,
      groupId: GROUP_ID,
      seriesType: 'area',
      yScaleToDataExtent: false,
      data: [[0, 10], [1, 5]],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Linear,
      yScaleType: ScaleType.Linear,
    };
    const pointSeriesMap = new Map<SpecId, AreaSeriesSpec>();
    pointSeriesMap.set(SPEC_ID, pointSeriesSpec);
    const pointSeriesDomains = computeSeriesDomains(pointSeriesMap, new Map());
    const xScale = computeXScale(pointSeriesDomains.xDomain, pointSeriesMap.size, 0, 100);
    const yScales = computeYScales(pointSeriesDomains.yDomain, 100, 0);

    let renderedArea: {
      areaGeometry: AreaGeometry;
      indexedGeometries: Map<any, IndexedGeometry[]>;
    };

    beforeEach(() => {
      renderedArea = renderArea(
        0, // not applied any shift, renderGeometries applies it only with mixed charts
        pointSeriesDomains.formattedDataSeries.nonStacked[0].dataSeries[0].data,
        xScale,
        yScales.get(GROUP_ID)!,
        'red',
        CurveType.LINEAR,
        SPEC_ID,
        false,
        [],
        0,
        LIGHT_THEME.areaSeriesStyle,
      );
    });
    test('Can render a linear area', () => {
      expect(renderedArea.areaGeometry.lines[0]).toBe('M0,0L100,50');
      expect(renderedArea.areaGeometry.area).toBe('M0,0L100,50L100,100L0,100Z');
      expect(renderedArea.areaGeometry.color).toBe('red');
      expect(renderedArea.areaGeometry.geometryId.seriesKey).toEqual([]);
      expect(renderedArea.areaGeometry.geometryId.specId).toEqual(SPEC_ID);
      expect(renderedArea.areaGeometry.transform).toEqual({ x: 0, y: 0 });
    });
    test('Can render two points', () => {
      const {
        areaGeometry: { points },
        indexedGeometries,
      } = renderedArea;
      expect(points[0]).toEqual({
        x: 0,
        y: 0,
        radius: 10,
        color: 'red',
        geometryId: {
          specId: SPEC_ID,
          seriesKey: [],
        },
        value: {
          accessor: 'y1',
          x: 0,
          y: 10,
        },
        transform: {
          x: 0,
          y: 0,
        },
      } as PointGeometry);
      expect(points[1]).toEqual({
        x: 100,
        y: 50,
        radius: 10,
        color: 'red',
        geometryId: {
          specId: SPEC_ID,
          seriesKey: [],
        },
        value: {
          accessor: 'y1',
          x: 1,
          y: 5,
        },
        transform: {
          x: 0,
          y: 0,
        },
      } as PointGeometry);
      expect(indexedGeometries.size).toEqual(points.length);
    });
  });
  describe('Multi series area chart - linear', () => {
    const spec1Id = getSpecId('point1');
    const spec2Id = getSpecId('point2');
    const pointSeriesSpec1: AreaSeriesSpec = {
      id: spec1Id,
      groupId: GROUP_ID,
      seriesType: 'area',
      yScaleToDataExtent: false,
      data: [[0, 10], [1, 5]],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Linear,
      yScaleType: ScaleType.Linear,
    };
    const pointSeriesSpec2: AreaSeriesSpec = {
      id: spec2Id,
      groupId: GROUP_ID,
      seriesType: 'area',
      yScaleToDataExtent: false,
      data: [[0, 20], [1, 10]],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Linear,
      yScaleType: ScaleType.Linear,
    };
    const pointSeriesMap = new Map<SpecId, AreaSeriesSpec>();
    pointSeriesMap.set(spec1Id, pointSeriesSpec1);
    pointSeriesMap.set(spec2Id, pointSeriesSpec2);
    const pointSeriesDomains = computeSeriesDomains(pointSeriesMap, new Map());
    const xScale = computeXScale(pointSeriesDomains.xDomain, pointSeriesMap.size, 0, 100);
    const yScales = computeYScales(pointSeriesDomains.yDomain, 100, 0);

    let firstLine: {
      areaGeometry: AreaGeometry;
      indexedGeometries: Map<any, IndexedGeometry[]>;
    };
    let secondLine: {
      areaGeometry: AreaGeometry;
      indexedGeometries: Map<any, IndexedGeometry[]>;
    };

    beforeEach(() => {
      firstLine = renderArea(
        0, // not applied any shift, renderGeometries applies it only with mixed charts
        pointSeriesDomains.formattedDataSeries.nonStacked[0].dataSeries[0].data,
        xScale,
        yScales.get(GROUP_ID)!,
        'red',
        CurveType.LINEAR,
        spec1Id,
        false,
        [],
        0,
        LIGHT_THEME.areaSeriesStyle,
      );
      secondLine = renderArea(
        0, // not applied any shift, renderGeometries applies it only with mixed charts
        pointSeriesDomains.formattedDataSeries.nonStacked[0].dataSeries[1].data,
        xScale,
        yScales.get(GROUP_ID)!,
        'blue',
        CurveType.LINEAR,
        spec2Id,
        false,
        [],
        0,
        LIGHT_THEME.areaSeriesStyle,
      );
    });
    test('can render two linear areas', () => {
      expect(firstLine.areaGeometry.lines[0]).toBe('M0,50L100,75');
      expect(firstLine.areaGeometry.area).toBe('M0,50L100,75L100,100L0,100Z');
      expect(firstLine.areaGeometry.color).toBe('red');
      expect(firstLine.areaGeometry.geometryId.seriesKey).toEqual([]);
      expect(firstLine.areaGeometry.geometryId.specId).toEqual(spec1Id);
      expect(firstLine.areaGeometry.transform).toEqual({ x: 0, y: 0 });

      expect(secondLine.areaGeometry.lines[0]).toBe('M0,0L100,50');
      expect(secondLine.areaGeometry.area).toBe('M0,0L100,50L100,100L0,100Z');
      expect(secondLine.areaGeometry.color).toBe('blue');
      expect(secondLine.areaGeometry.geometryId.seriesKey).toEqual([]);
      expect(secondLine.areaGeometry.geometryId.specId).toEqual(spec2Id);
      expect(secondLine.areaGeometry.transform).toEqual({ x: 0, y: 0 });
    });
    test('can render first spec points', () => {
      const {
        areaGeometry: { points },
        indexedGeometries,
      } = firstLine;
      expect(points.length).toEqual(2);
      expect(points[0]).toEqual({
        x: 0,
        y: 50,
        radius: 10,
        color: 'red',
        geometryId: {
          specId: spec1Id,
          seriesKey: [],
        },
        value: {
          accessor: 'y1',
          x: 0,
          y: 10,
        },
        transform: {
          x: 0,
          y: 0,
        },
      } as PointGeometry);
      expect(points[1]).toEqual({
        x: 100,
        y: 75,
        radius: 10,
        color: 'red',
        geometryId: {
          specId: spec1Id,
          seriesKey: [],
        },
        value: {
          accessor: 'y1',
          x: 1,
          y: 5,
        },
        transform: {
          x: 0,
          y: 0,
        },
      } as PointGeometry);
      expect(indexedGeometries.size).toEqual(points.length);
    });
    test('can render second spec points', () => {
      const {
        areaGeometry: { points },
        indexedGeometries,
      } = secondLine;
      expect(points.length).toEqual(2);
      expect(points[0]).toEqual({
        x: 0,
        y: 0,
        radius: 10,
        color: 'blue',
        geometryId: {
          specId: spec2Id,
          seriesKey: [],
        },
        value: {
          accessor: 'y1',
          x: 0,
          y: 20,
        },
        transform: {
          x: 0,
          y: 0,
        },
      } as PointGeometry);
      expect(points[1]).toEqual({
        x: 100,
        y: 50,
        radius: 10,
        color: 'blue',
        geometryId: {
          specId: spec2Id,
          seriesKey: [],
        },
        value: {
          accessor: 'y1',
          x: 1,
          y: 10,
        },
        transform: {
          x: 0,
          y: 0,
        },
      } as PointGeometry);
      expect(indexedGeometries.size).toEqual(points.length);
    });
  });
  describe('Single series area chart - time', () => {
    const pointSeriesSpec: AreaSeriesSpec = {
      id: SPEC_ID,
      groupId: GROUP_ID,
      seriesType: 'area',
      yScaleToDataExtent: false,
      data: [[1546300800000, 10], [1546387200000, 5]],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Time,
      yScaleType: ScaleType.Linear,
    };
    const pointSeriesMap = new Map<SpecId, AreaSeriesSpec>();
    pointSeriesMap.set(SPEC_ID, pointSeriesSpec);
    const pointSeriesDomains = computeSeriesDomains(pointSeriesMap, new Map());
    const xScale = computeXScale(pointSeriesDomains.xDomain, pointSeriesMap.size, 0, 100);
    const yScales = computeYScales(pointSeriesDomains.yDomain, 100, 0);

    let renderedArea: {
      areaGeometry: AreaGeometry;
      indexedGeometries: Map<any, IndexedGeometry[]>;
    };

    beforeEach(() => {
      renderedArea = renderArea(
        0, // not applied any shift, renderGeometries applies it only with mixed charts
        pointSeriesDomains.formattedDataSeries.nonStacked[0].dataSeries[0].data,
        xScale,
        yScales.get(GROUP_ID)!,
        'red',
        CurveType.LINEAR,
        SPEC_ID,
        false,
        [],
        0,
        LIGHT_THEME.areaSeriesStyle,
      );
    });
    test('Can render a time area', () => {
      expect(renderedArea.areaGeometry.lines[0]).toBe('M0,0L100,50');
      expect(renderedArea.areaGeometry.area).toBe('M0,0L100,50L100,100L0,100Z');
      expect(renderedArea.areaGeometry.color).toBe('red');
      expect(renderedArea.areaGeometry.geometryId.seriesKey).toEqual([]);
      expect(renderedArea.areaGeometry.geometryId.specId).toEqual(SPEC_ID);
      expect(renderedArea.areaGeometry.transform).toEqual({ x: 0, y: 0 });
    });
    test('Can render two points', () => {
      const {
        areaGeometry: { points },
        indexedGeometries,
      } = renderedArea;
      expect(points[0]).toEqual({
        x: 0,
        y: 0,
        radius: 10,
        color: 'red',
        geometryId: {
          specId: SPEC_ID,
          seriesKey: [],
        },
        value: {
          accessor: 'y1',
          x: 1546300800000,
          y: 10,
        },
        transform: {
          x: 0,
          y: 0,
        },
      } as PointGeometry);
      expect(points[1]).toEqual({
        x: 100,
        y: 50,
        radius: 10,
        color: 'red',
        geometryId: {
          specId: SPEC_ID,
          seriesKey: [],
        },
        value: {
          accessor: 'y1',
          x: 1546387200000,
          y: 5,
        },
        transform: {
          x: 0,
          y: 0,
        },
      } as PointGeometry);
      expect(indexedGeometries.size).toEqual(points.length);
    });
  });
  describe('Multi series area chart - time', () => {
    const spec1Id = getSpecId('point1');
    const spec2Id = getSpecId('point2');
    const pointSeriesSpec1: AreaSeriesSpec = {
      id: spec1Id,
      groupId: GROUP_ID,
      seriesType: 'area',
      yScaleToDataExtent: false,
      data: [[1546300800000, 10], [1546387200000, 5]],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Time,
      yScaleType: ScaleType.Linear,
    };
    const pointSeriesSpec2: AreaSeriesSpec = {
      id: spec2Id,
      groupId: GROUP_ID,
      seriesType: 'area',
      yScaleToDataExtent: false,
      data: [[1546300800000, 20], [1546387200000, 10]],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Time,
      yScaleType: ScaleType.Linear,
    };
    const pointSeriesMap = new Map<SpecId, AreaSeriesSpec>();
    pointSeriesMap.set(spec1Id, pointSeriesSpec1);
    pointSeriesMap.set(spec2Id, pointSeriesSpec2);
    const pointSeriesDomains = computeSeriesDomains(pointSeriesMap, new Map());
    const xScale = computeXScale(pointSeriesDomains.xDomain, pointSeriesMap.size, 0, 100);
    const yScales = computeYScales(pointSeriesDomains.yDomain, 100, 0);

    let firstLine: {
      areaGeometry: AreaGeometry;
      indexedGeometries: Map<any, IndexedGeometry[]>;
    };
    let secondLine: {
      areaGeometry: AreaGeometry;
      indexedGeometries: Map<any, IndexedGeometry[]>;
    };

    beforeEach(() => {
      firstLine = renderArea(
        0, // not applied any shift, renderGeometries applies it only with mixed charts
        pointSeriesDomains.formattedDataSeries.nonStacked[0].dataSeries[0].data,
        xScale,
        yScales.get(GROUP_ID)!,
        'red',
        CurveType.LINEAR,
        spec1Id,
        false,
        [],
        0,
        LIGHT_THEME.areaSeriesStyle,
      );
      secondLine = renderArea(
        0, // not applied any shift, renderGeometries applies it only with mixed charts
        pointSeriesDomains.formattedDataSeries.nonStacked[0].dataSeries[1].data,
        xScale,
        yScales.get(GROUP_ID)!,
        'blue',
        CurveType.LINEAR,
        spec2Id,
        false,
        [],
        0,
        LIGHT_THEME.areaSeriesStyle,
      );
    });
    test('can render first spec points', () => {
      const {
        areaGeometry: { points },
        indexedGeometries,
      } = firstLine;
      expect(points.length).toEqual(2);
      expect(points[0]).toEqual({
        x: 0,
        y: 50,
        radius: 10,
        color: 'red',
        geometryId: {
          specId: spec1Id,
          seriesKey: [],
        },
        value: {
          accessor: 'y1',
          x: 1546300800000,
          y: 10,
        },
        transform: {
          x: 0,
          y: 0,
        },
      } as PointGeometry);
      expect(points[1]).toEqual({
        x: 100,
        y: 75,
        radius: 10,
        color: 'red',
        geometryId: {
          specId: spec1Id,
          seriesKey: [],
        },
        value: {
          accessor: 'y1',
          x: 1546387200000,
          y: 5,
        },
        transform: {
          x: 0,
          y: 0,
        },
      } as PointGeometry);
      expect(indexedGeometries.size).toEqual(points.length);
    });
    test('can render second spec points', () => {
      const {
        areaGeometry: { points },
        indexedGeometries,
      } = secondLine;
      expect(points.length).toEqual(2);
      expect(points[0]).toEqual({
        x: 0,
        y: 0,
        radius: 10,
        color: 'blue',
        geometryId: {
          specId: spec2Id,
          seriesKey: [],
        },
        value: {
          accessor: 'y1',
          x: 1546300800000,
          y: 20,
        },
        transform: {
          x: 0,
          y: 0,
        },
      } as PointGeometry);
      expect(points[1]).toEqual({
        x: 100,
        y: 50,
        radius: 10,
        color: 'blue',
        geometryId: {
          specId: spec2Id,
          seriesKey: [],
        },
        value: {
          accessor: 'y1',
          x: 1546387200000,
          y: 10,
        },
        transform: {
          x: 0,
          y: 0,
        },
      } as PointGeometry);
      expect(indexedGeometries.size).toEqual(points.length);
    });
  });
  describe('Single series area chart - y log', () => {
    const pointSeriesSpec: AreaSeriesSpec = {
      id: SPEC_ID,
      groupId: GROUP_ID,
      seriesType: 'area',
      yScaleToDataExtent: false,
      data: [[0, 10], [1, 5], [2, null], [3, 5], [4, 5], [5, 0], [6, 10], [7, 10], [8, 10]],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Linear,
      yScaleType: ScaleType.Log,
    };
    const pointSeriesMap = new Map<SpecId, AreaSeriesSpec>();
    pointSeriesMap.set(SPEC_ID, pointSeriesSpec);
    const pointSeriesDomains = computeSeriesDomains(pointSeriesMap, new Map());
    const xScale = computeXScale(pointSeriesDomains.xDomain, pointSeriesMap.size, 0, 90);
    const yScales = computeYScales(pointSeriesDomains.yDomain, 100, 0);

    let renderedArea: {
      areaGeometry: AreaGeometry;
      indexedGeometries: Map<any, IndexedGeometry[]>;
    };

    beforeEach(() => {
      renderedArea = renderArea(
        0, // not applied any shift, renderGeometries applies it only with mixed charts
        pointSeriesDomains.formattedDataSeries.nonStacked[0].dataSeries[0].data,
        xScale,
        yScales.get(GROUP_ID)!,
        'red',
        CurveType.LINEAR,
        SPEC_ID,
        false,
        [],
        0,
        LIGHT_THEME.areaSeriesStyle,
      );
    });
    test('Can render a splitted area and line', () => {
      // expect(renderedArea.lineGeometry.line).toBe('ss');
      expect(renderedArea.areaGeometry.lines[0].split('M').length - 1).toBe(3);
      expect(renderedArea.areaGeometry.area.split('M').length - 1).toBe(3);
      expect(renderedArea.areaGeometry.color).toBe('red');
      expect(renderedArea.areaGeometry.geometryId.seriesKey).toEqual([]);
      expect(renderedArea.areaGeometry.geometryId.specId).toEqual(SPEC_ID);
      expect(renderedArea.areaGeometry.transform).toEqual({ x: 0, y: 0 });
    });
    test('Can render points points', () => {
      const {
        areaGeometry: { points },
        indexedGeometries,
      } = renderedArea;
      // all the points minus the undefined ones on a log scale
      expect(points.length).toBe(7);
      // all the points expect null geometries
      expect(indexedGeometries.size).toEqual(8);
      const nullIndexdGeometry = indexedGeometries.get(2)!;
      expect(nullIndexdGeometry).toBeUndefined();

      const zeroValueIndexdGeometry = indexedGeometries.get(5)!;
      expect(zeroValueIndexdGeometry).toBeDefined();
      expect(zeroValueIndexdGeometry.length).toBe(1);
      // moved to the bottom of the chart
      expect(zeroValueIndexdGeometry[0].y).toBe(100);
      // 0 radius point
      expect((zeroValueIndexdGeometry[0] as PointGeometry).radius).toBe(0);
    });
  });
});
