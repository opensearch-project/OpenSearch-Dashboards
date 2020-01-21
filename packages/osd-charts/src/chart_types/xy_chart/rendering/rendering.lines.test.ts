import { computeSeriesDomains } from '../state/utils';
import { ScaleType } from '../../../utils/scales/scales';
import { CurveType } from '../../../utils/curves';
import { renderLine } from './rendering';
import { computeXScale, computeYScales } from '../utils/scales';
import { LineSeriesSpec, DomainRange, SeriesTypes } from '../utils/specs';
import { LIGHT_THEME } from '../../../utils/themes/light_theme';
import { LineGeometry, IndexedGeometry, PointGeometry } from '../../../utils/geometry';
import { GroupId } from '../../../utils/ids';
import { ChartTypes } from '../..';
import { SpecTypes } from '../../../specs/settings';

const SPEC_ID = 'spec_1';
const GROUP_ID = 'group_1';

describe('Rendering points - line', () => {
  describe('Empty line for missing data', () => {
    const pointSeriesSpec: LineSeriesSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Series,
      id: SPEC_ID,
      groupId: GROUP_ID,
      seriesType: SeriesTypes.Line,
      yScaleToDataExtent: false,
      data: [
        [0, 10],
        [1, 5],
      ],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Ordinal,
      yScaleType: ScaleType.Linear,
    };
    const pointSeriesMap = [pointSeriesSpec];
    const pointSeriesDomains = computeSeriesDomains(pointSeriesMap, new Map());
    const xScale = computeXScale({
      xDomain: pointSeriesDomains.xDomain,
      totalBarsInCluster: pointSeriesMap.length,
      range: [0, 100],
    });
    const yScales = computeYScales({ yDomains: pointSeriesDomains.yDomain, range: [100, 0] });
    let renderedLine: {
      lineGeometry: LineGeometry;
      indexedGeometries: Map<any, IndexedGeometry[]>;
    };

    beforeEach(() => {
      renderedLine = renderLine(
        25, // adding a ideal 25px shift, generally applied by renderGeometries
        { ...pointSeriesDomains.formattedDataSeries.nonStacked[0].dataSeries[0], data: [] },
        xScale,
        yScales.get(GROUP_ID)!,
        'red',
        CurveType.LINEAR,
        false,
        0,
        LIGHT_THEME.lineSeriesStyle,
      );
    });
    test('Can render the geometry without a line', () => {
      const { lineGeometry } = renderedLine;
      expect(lineGeometry.line).toBe('');
      expect(lineGeometry.color).toBe('red');
      expect(lineGeometry.seriesIdentifier.seriesKeys).toEqual([1]);
      expect(lineGeometry.seriesIdentifier.specId).toEqual(SPEC_ID);
      expect(lineGeometry.transform).toEqual({ x: 25, y: 0 });
    });
  });
  describe('Single series line chart - ordinal', () => {
    const pointSeriesSpec: LineSeriesSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Series,
      id: SPEC_ID,
      groupId: GROUP_ID,
      seriesType: SeriesTypes.Line,
      yScaleToDataExtent: false,
      data: [
        [0, 10],
        [1, 5],
      ],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Ordinal,
      yScaleType: ScaleType.Linear,
    };
    const pointSeriesMap = [pointSeriesSpec];
    const pointSeriesDomains = computeSeriesDomains(pointSeriesMap, new Map());
    const xScale = computeXScale({
      xDomain: pointSeriesDomains.xDomain,
      totalBarsInCluster: pointSeriesMap.length,
      range: [0, 100],
    });
    const yScales = computeYScales({ yDomains: pointSeriesDomains.yDomain, range: [100, 0] });
    let renderedLine: {
      lineGeometry: LineGeometry;
      indexedGeometries: Map<any, IndexedGeometry[]>;
    };

    beforeEach(() => {
      renderedLine = renderLine(
        25, // adding a ideal 25px shift, generally applied by renderGeometries
        pointSeriesDomains.formattedDataSeries.nonStacked[0].dataSeries[0],
        xScale,
        yScales.get(GROUP_ID)!,
        'red',
        CurveType.LINEAR,
        false,
        0,
        LIGHT_THEME.lineSeriesStyle,
      );
    });
    test('Can render a line', () => {
      const { lineGeometry } = renderedLine;
      expect(lineGeometry.line).toBe('M0,0L50,50');
      expect(lineGeometry.color).toBe('red');
      expect(lineGeometry.seriesIdentifier.seriesKeys).toEqual([1]);
      expect(lineGeometry.seriesIdentifier.specId).toEqual(SPEC_ID);
      expect(lineGeometry.transform).toEqual({ x: 25, y: 0 });
    });
    test('Can render two points', () => {
      const {
        lineGeometry: { points },
        indexedGeometries,
      } = renderedLine;

      expect(points[0]).toEqual(({
        x: 0,
        y: 0,
        radius: 10,
        color: 'red',
        seriesIdentifier: {
          specId: SPEC_ID,
          key: 'spec{spec_1}yAccessor{1}splitAccessors{}',
          yAccessor: 1,
          splitAccessors: new Map(),
          seriesKeys: [1],
        },
        styleOverrides: undefined,
        value: {
          accessor: 'y1',
          x: 0,
          y: 10,
        },
        transform: {
          x: 25,
          y: 0,
        },
      } as unknown) as PointGeometry);
      expect(points[1]).toEqual(({
        x: 50,
        y: 50,
        radius: 10,
        color: 'red',
        seriesIdentifier: {
          specId: SPEC_ID,
          key: 'spec{spec_1}yAccessor{1}splitAccessors{}',
          yAccessor: 1,
          splitAccessors: new Map(),
          seriesKeys: [1],
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
      } as unknown) as PointGeometry);
      expect(indexedGeometries.size).toEqual(points.length);
    });
  });
  describe('Multi series line chart - ordinal', () => {
    const spec1Id = 'point1';
    const spec2Id = 'point2';
    const pointSeriesSpec1: LineSeriesSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Series,
      id: spec1Id,
      groupId: GROUP_ID,
      seriesType: SeriesTypes.Line,
      yScaleToDataExtent: false,
      data: [
        [0, 10],
        [1, 5],
      ],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Ordinal,
      yScaleType: ScaleType.Linear,
    };
    const pointSeriesSpec2: LineSeriesSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Series,
      id: spec2Id,
      groupId: GROUP_ID,
      seriesType: SeriesTypes.Line,
      yScaleToDataExtent: false,
      data: [
        [0, 20],
        [1, 10],
      ],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Ordinal,
      yScaleType: ScaleType.Linear,
    };
    const pointSeriesMap = [pointSeriesSpec1, pointSeriesSpec2];
    const pointSeriesDomains = computeSeriesDomains(pointSeriesMap, new Map());
    const xScale = computeXScale({
      xDomain: pointSeriesDomains.xDomain,
      totalBarsInCluster: pointSeriesMap.length,
      range: [0, 100],
    });
    const yScales = computeYScales({ yDomains: pointSeriesDomains.yDomain, range: [100, 0] });

    let firstLine: {
      lineGeometry: LineGeometry;
      indexedGeometries: Map<any, IndexedGeometry[]>;
    };
    let secondLine: {
      lineGeometry: LineGeometry;
      indexedGeometries: Map<any, IndexedGeometry[]>;
    };

    beforeEach(() => {
      firstLine = renderLine(
        25, // adding a ideal 25px shift, generally applied by renderGeometries
        pointSeriesDomains.formattedDataSeries.nonStacked[0].dataSeries[0],
        xScale,
        yScales.get(GROUP_ID)!,
        'red',
        CurveType.LINEAR,
        false,
        0,
        LIGHT_THEME.lineSeriesStyle,
      );
      secondLine = renderLine(
        25, // adding a ideal 25px shift, generally applied by renderGeometries
        pointSeriesDomains.formattedDataSeries.nonStacked[0].dataSeries[1],
        xScale,
        yScales.get(GROUP_ID)!,
        'blue',
        CurveType.LINEAR,
        false,
        0,
        LIGHT_THEME.lineSeriesStyle,
      );
    });

    test('Can render two ordinal lines', () => {
      expect(firstLine.lineGeometry.line).toBe('M0,50L50,75');
      expect(firstLine.lineGeometry.color).toBe('red');
      expect(firstLine.lineGeometry.seriesIdentifier.seriesKeys).toEqual([1]);
      expect(firstLine.lineGeometry.seriesIdentifier.specId).toEqual(spec1Id);
      expect(firstLine.lineGeometry.transform).toEqual({ x: 25, y: 0 });

      expect(secondLine.lineGeometry.line).toBe('M0,0L50,50');
      expect(secondLine.lineGeometry.color).toBe('blue');
      expect(secondLine.lineGeometry.seriesIdentifier.seriesKeys).toEqual([1]);
      expect(secondLine.lineGeometry.seriesIdentifier.specId).toEqual(spec2Id);
      expect(secondLine.lineGeometry.transform).toEqual({ x: 25, y: 0 });
    });
    test('can render first spec points', () => {
      const {
        lineGeometry: { points },
        indexedGeometries,
      } = firstLine;
      expect(points.length).toEqual(2);
      expect(points[0]).toEqual(({
        x: 0,
        y: 50,
        radius: 10,
        color: 'red',
        seriesIdentifier: {
          specId: spec1Id,
          key: 'spec{point1}yAccessor{1}splitAccessors{}',
          yAccessor: 1,
          splitAccessors: new Map(),
          seriesKeys: [1],
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
      } as unknown) as PointGeometry);
      expect(points[1]).toEqual(({
        x: 50,
        y: 75,
        color: 'red',
        radius: 10,
        seriesIdentifier: {
          specId: spec1Id,
          key: 'spec{point1}yAccessor{1}splitAccessors{}',
          yAccessor: 1,
          splitAccessors: new Map(),
          seriesKeys: [1],
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
      } as unknown) as PointGeometry);
      expect(indexedGeometries.size).toEqual(points.length);
    });
    test('can render second spec points', () => {
      const {
        lineGeometry: { points },
        indexedGeometries,
      } = secondLine;
      expect(points.length).toEqual(2);
      expect(points[0]).toEqual(({
        x: 0,
        y: 0,
        color: 'blue',
        radius: 10,
        seriesIdentifier: {
          specId: spec2Id,
          key: 'spec{point2}yAccessor{1}splitAccessors{}',
          yAccessor: 1,
          splitAccessors: new Map(),
          seriesKeys: [1],
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
      } as unknown) as PointGeometry);
      expect(points[1]).toEqual(({
        x: 50,
        y: 50,
        color: 'blue',
        radius: 10,
        seriesIdentifier: {
          specId: spec2Id,
          key: 'spec{point2}yAccessor{1}splitAccessors{}',
          yAccessor: 1,
          splitAccessors: new Map(),
          seriesKeys: [1],
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
      } as unknown) as PointGeometry);
      expect(indexedGeometries.size).toEqual(points.length);
    });
  });
  describe('Single series line chart - linear', () => {
    const pointSeriesSpec: LineSeriesSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Series,
      id: SPEC_ID,
      groupId: GROUP_ID,
      seriesType: SeriesTypes.Line,
      yScaleToDataExtent: false,
      data: [
        [0, 10],
        [1, 5],
      ],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Linear,
      yScaleType: ScaleType.Linear,
    };
    const pointSeriesMap = [pointSeriesSpec];
    const pointSeriesDomains = computeSeriesDomains(pointSeriesMap, new Map());
    const xScale = computeXScale({
      xDomain: pointSeriesDomains.xDomain,
      totalBarsInCluster: pointSeriesMap.length,
      range: [0, 100],
    });
    const yScales = computeYScales({ yDomains: pointSeriesDomains.yDomain, range: [100, 0] });

    let renderedLine: {
      lineGeometry: LineGeometry;
      indexedGeometries: Map<any, IndexedGeometry[]>;
    };

    beforeEach(() => {
      renderedLine = renderLine(
        0, // not applied any shift, renderGeometries applies it only with mixed charts
        pointSeriesDomains.formattedDataSeries.nonStacked[0].dataSeries[0],
        xScale,
        yScales.get(GROUP_ID)!,
        'red',
        CurveType.LINEAR,
        false,
        0,
        LIGHT_THEME.lineSeriesStyle,
      );
    });
    test('Can render a linear line', () => {
      expect(renderedLine.lineGeometry.line).toBe('M0,0L100,50');
      expect(renderedLine.lineGeometry.color).toBe('red');
      expect(renderedLine.lineGeometry.seriesIdentifier.seriesKeys).toEqual([1]);
      expect(renderedLine.lineGeometry.seriesIdentifier.specId).toEqual(SPEC_ID);
      expect(renderedLine.lineGeometry.transform).toEqual({ x: 0, y: 0 });
    });
    test('Can render two points', () => {
      const {
        lineGeometry: { points },
        indexedGeometries,
      } = renderedLine;
      expect(points[0]).toEqual(({
        x: 0,
        y: 0,
        color: 'red',
        radius: 10,
        seriesIdentifier: {
          specId: SPEC_ID,
          key: 'spec{spec_1}yAccessor{1}splitAccessors{}',
          yAccessor: 1,
          splitAccessors: new Map(),
          seriesKeys: [1],
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
      } as unknown) as PointGeometry);
      expect(points[1]).toEqual(({
        x: 100,
        y: 50,
        color: 'red',
        radius: 10,
        seriesIdentifier: {
          specId: SPEC_ID,
          key: 'spec{spec_1}yAccessor{1}splitAccessors{}',
          yAccessor: 1,
          splitAccessors: new Map(),
          seriesKeys: [1],
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
      } as unknown) as PointGeometry);
      expect(indexedGeometries.size).toEqual(points.length);
    });
  });
  describe('Multi series line chart - linear', () => {
    const spec1Id = 'point1';
    const spec2Id = 'point2';
    const pointSeriesSpec1: LineSeriesSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Series,
      id: spec1Id,
      groupId: GROUP_ID,
      seriesType: SeriesTypes.Line,
      yScaleToDataExtent: false,
      data: [
        [0, 10],
        [1, 5],
      ],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Linear,
      yScaleType: ScaleType.Linear,
    };
    const pointSeriesSpec2: LineSeriesSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Series,
      id: spec2Id,
      groupId: GROUP_ID,
      seriesType: SeriesTypes.Line,
      yScaleToDataExtent: false,
      data: [
        [0, 20],
        [1, 10],
      ],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Linear,
      yScaleType: ScaleType.Linear,
    };
    const pointSeriesMap = [pointSeriesSpec1, pointSeriesSpec2];
    const pointSeriesDomains = computeSeriesDomains(pointSeriesMap, new Map());
    const xScale = computeXScale({
      xDomain: pointSeriesDomains.xDomain,
      totalBarsInCluster: pointSeriesMap.length,
      range: [0, 100],
    });
    const yScales = computeYScales({ yDomains: pointSeriesDomains.yDomain, range: [100, 0] });

    let firstLine: {
      lineGeometry: LineGeometry;
      indexedGeometries: Map<any, IndexedGeometry[]>;
    };
    let secondLine: {
      lineGeometry: LineGeometry;
      indexedGeometries: Map<any, IndexedGeometry[]>;
    };

    beforeEach(() => {
      firstLine = renderLine(
        0, // not applied any shift, renderGeometries applies it only with mixed charts
        pointSeriesDomains.formattedDataSeries.nonStacked[0].dataSeries[0],
        xScale,
        yScales.get(GROUP_ID)!,
        'red',
        CurveType.LINEAR,
        false,
        0,
        LIGHT_THEME.lineSeriesStyle,
      );
      secondLine = renderLine(
        0, // not applied any shift, renderGeometries applies it only with mixed charts
        pointSeriesDomains.formattedDataSeries.nonStacked[0].dataSeries[1],
        xScale,
        yScales.get(GROUP_ID)!,
        'blue',
        CurveType.LINEAR,
        false,
        0,
        LIGHT_THEME.lineSeriesStyle,
      );
    });
    test('can render two linear lines', () => {
      expect(firstLine.lineGeometry.line).toBe('M0,50L100,75');
      expect(firstLine.lineGeometry.color).toBe('red');
      expect(firstLine.lineGeometry.seriesIdentifier.seriesKeys).toEqual([1]);
      expect(firstLine.lineGeometry.seriesIdentifier.specId).toEqual(spec1Id);
      expect(firstLine.lineGeometry.transform).toEqual({ x: 0, y: 0 });

      expect(secondLine.lineGeometry.line).toBe('M0,0L100,50');
      expect(secondLine.lineGeometry.color).toBe('blue');
      expect(secondLine.lineGeometry.seriesIdentifier.seriesKeys).toEqual([1]);
      expect(secondLine.lineGeometry.seriesIdentifier.specId).toEqual(spec2Id);
      expect(secondLine.lineGeometry.transform).toEqual({ x: 0, y: 0 });
    });
    test('can render first spec points', () => {
      const {
        lineGeometry: { points },
        indexedGeometries,
      } = firstLine;
      expect(points.length).toEqual(2);
      expect(points[0]).toEqual(({
        x: 0,
        y: 50,
        radius: 10,
        color: 'red',
        seriesIdentifier: {
          specId: spec1Id,
          key: 'spec{point1}yAccessor{1}splitAccessors{}',
          yAccessor: 1,
          splitAccessors: new Map(),
          seriesKeys: [1],
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
      } as unknown) as PointGeometry);
      expect(points[1]).toEqual(({
        x: 100,
        y: 75,
        radius: 10,
        color: 'red',
        seriesIdentifier: {
          specId: spec1Id,
          key: 'spec{point1}yAccessor{1}splitAccessors{}',
          yAccessor: 1,
          splitAccessors: new Map(),
          seriesKeys: [1],
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
      } as unknown) as PointGeometry);
      expect(indexedGeometries.size).toEqual(points.length);
    });
    test('can render second spec points', () => {
      const {
        lineGeometry: { points },
        indexedGeometries,
      } = secondLine;
      expect(points.length).toEqual(2);
      expect(points[0]).toEqual(({
        x: 0,
        y: 0,
        color: 'blue',
        radius: 10,
        seriesIdentifier: {
          specId: spec2Id,
          key: 'spec{point2}yAccessor{1}splitAccessors{}',
          yAccessor: 1,
          splitAccessors: new Map(),
          seriesKeys: [1],
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
      } as unknown) as PointGeometry);
      expect(points[1]).toEqual(({
        x: 100,
        y: 50,
        color: 'blue',
        radius: 10,
        seriesIdentifier: {
          specId: spec2Id,
          key: 'spec{point2}yAccessor{1}splitAccessors{}',
          yAccessor: 1,
          splitAccessors: new Map(),
          seriesKeys: [1],
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
      } as unknown) as PointGeometry);
      expect(indexedGeometries.size).toEqual(points.length);
    });
  });
  describe('Single series line chart - time', () => {
    const pointSeriesSpec: LineSeriesSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Series,
      id: SPEC_ID,
      groupId: GROUP_ID,
      seriesType: SeriesTypes.Line,
      yScaleToDataExtent: false,
      data: [
        [1546300800000, 10],
        [1546387200000, 5],
      ],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Time,
      yScaleType: ScaleType.Linear,
    };
    const pointSeriesMap = [pointSeriesSpec];
    const pointSeriesDomains = computeSeriesDomains(pointSeriesMap, new Map());
    const xScale = computeXScale({
      xDomain: pointSeriesDomains.xDomain,
      totalBarsInCluster: pointSeriesMap.length,
      range: [0, 100],
    });
    const yScales = computeYScales({ yDomains: pointSeriesDomains.yDomain, range: [100, 0] });

    let renderedLine: {
      lineGeometry: LineGeometry;
      indexedGeometries: Map<any, IndexedGeometry[]>;
    };

    beforeEach(() => {
      renderedLine = renderLine(
        0, // not applied any shift, renderGeometries applies it only with mixed charts
        pointSeriesDomains.formattedDataSeries.nonStacked[0].dataSeries[0],
        xScale,
        yScales.get(GROUP_ID)!,
        'red',
        CurveType.LINEAR,
        false,
        0,
        LIGHT_THEME.lineSeriesStyle,
      );
    });
    test('Can render a time line', () => {
      expect(renderedLine.lineGeometry.line).toBe('M0,0L100,50');
      expect(renderedLine.lineGeometry.color).toBe('red');
      expect(renderedLine.lineGeometry.seriesIdentifier.seriesKeys).toEqual([1]);
      expect(renderedLine.lineGeometry.seriesIdentifier.specId).toEqual(SPEC_ID);
      expect(renderedLine.lineGeometry.transform).toEqual({ x: 0, y: 0 });
    });
    test('Can render two points', () => {
      const {
        lineGeometry: { points },
        indexedGeometries,
      } = renderedLine;
      expect(points[0]).toEqual(({
        x: 0,
        y: 0,
        radius: 10,
        color: 'red',
        seriesIdentifier: {
          specId: SPEC_ID,
          key: 'spec{spec_1}yAccessor{1}splitAccessors{}',
          yAccessor: 1,
          splitAccessors: new Map(),
          seriesKeys: [1],
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
      } as unknown) as PointGeometry);
      expect(points[1]).toEqual(({
        x: 100,
        y: 50,
        radius: 10,
        color: 'red',
        seriesIdentifier: {
          specId: SPEC_ID,
          key: 'spec{spec_1}yAccessor{1}splitAccessors{}',
          yAccessor: 1,
          splitAccessors: new Map(),
          seriesKeys: [1],
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
      } as unknown) as PointGeometry);
      expect(indexedGeometries.size).toEqual(points.length);
    });
  });
  describe('Multi series line chart - time', () => {
    const spec1Id = 'point1';
    const spec2Id = 'point2';
    const pointSeriesSpec1: LineSeriesSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Series,
      id: spec1Id,
      groupId: GROUP_ID,
      seriesType: SeriesTypes.Line,
      yScaleToDataExtent: false,
      data: [
        [1546300800000, 10],
        [1546387200000, 5],
      ],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Time,
      yScaleType: ScaleType.Linear,
    };
    const pointSeriesSpec2: LineSeriesSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Series,
      id: spec2Id,
      groupId: GROUP_ID,
      seriesType: SeriesTypes.Line,
      yScaleToDataExtent: false,
      data: [
        [1546300800000, 20],
        [1546387200000, 10],
      ],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Time,
      yScaleType: ScaleType.Linear,
    };
    const pointSeriesMap = [pointSeriesSpec1, pointSeriesSpec2];
    const pointSeriesDomains = computeSeriesDomains(pointSeriesMap, new Map());
    const xScale = computeXScale({
      xDomain: pointSeriesDomains.xDomain,
      totalBarsInCluster: pointSeriesMap.length,
      range: [0, 100],
    });
    const yScales = computeYScales({ yDomains: pointSeriesDomains.yDomain, range: [100, 0] });

    let firstLine: {
      lineGeometry: LineGeometry;
      indexedGeometries: Map<any, IndexedGeometry[]>;
    };
    let secondLine: {
      lineGeometry: LineGeometry;
      indexedGeometries: Map<any, IndexedGeometry[]>;
    };

    beforeEach(() => {
      firstLine = renderLine(
        0, // not applied any shift, renderGeometries applies it only with mixed charts
        pointSeriesDomains.formattedDataSeries.nonStacked[0].dataSeries[0],
        xScale,
        yScales.get(GROUP_ID)!,
        'red',
        CurveType.LINEAR,
        false,
        0,
        LIGHT_THEME.lineSeriesStyle,
      );
      secondLine = renderLine(
        0, // not applied any shift, renderGeometries applies it only with mixed charts
        pointSeriesDomains.formattedDataSeries.nonStacked[0].dataSeries[1],
        xScale,
        yScales.get(GROUP_ID)!,
        'blue',
        CurveType.LINEAR,
        false,
        0,
        LIGHT_THEME.lineSeriesStyle,
      );
    });
    test('can render first spec points', () => {
      const {
        lineGeometry: { points },
        indexedGeometries,
      } = firstLine;
      expect(points.length).toEqual(2);
      expect(points[0]).toEqual(({
        x: 0,
        y: 50,
        radius: 10,
        color: 'red',
        seriesIdentifier: {
          specId: spec1Id,
          key: 'spec{point1}yAccessor{1}splitAccessors{}',
          yAccessor: 1,
          splitAccessors: new Map(),
          seriesKeys: [1],
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
      } as unknown) as PointGeometry);
      expect(points[1]).toEqual(({
        x: 100,
        y: 75,
        radius: 10,
        color: 'red',
        seriesIdentifier: {
          specId: spec1Id,
          key: 'spec{point1}yAccessor{1}splitAccessors{}',
          yAccessor: 1,
          splitAccessors: new Map(),
          seriesKeys: [1],
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
      } as unknown) as PointGeometry);
      expect(indexedGeometries.size).toEqual(points.length);
    });
    test('can render second spec points', () => {
      const {
        lineGeometry: { points },
        indexedGeometries,
      } = secondLine;
      expect(points.length).toEqual(2);
      expect(points[0]).toEqual(({
        x: 0,
        y: 0,
        radius: 10,
        color: 'blue',
        seriesIdentifier: {
          specId: spec2Id,
          key: 'spec{point2}yAccessor{1}splitAccessors{}',
          yAccessor: 1,
          splitAccessors: new Map(),
          seriesKeys: [1],
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
      } as unknown) as PointGeometry);
      expect(points[1]).toEqual(({
        x: 100,
        y: 50,
        radius: 10,
        color: 'blue',
        seriesIdentifier: {
          specId: spec2Id,
          key: 'spec{point2}yAccessor{1}splitAccessors{}',
          yAccessor: 1,
          splitAccessors: new Map(),
          seriesKeys: [1],
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
      } as unknown) as PointGeometry);
      expect(indexedGeometries.size).toEqual(points.length);
    });
  });
  describe('Single series line chart - y log', () => {
    const pointSeriesSpec: LineSeriesSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Series,
      id: SPEC_ID,
      groupId: GROUP_ID,
      seriesType: SeriesTypes.Line,
      yScaleToDataExtent: false,
      data: [
        [0, 10],
        [1, 5],
        [2, null],
        [3, 5],
        [4, 5],
        [5, 0],
        [6, 10],
        [7, 10],
        [8, 10],
      ],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Linear,
      yScaleType: ScaleType.Log,
    };
    const pointSeriesMap = [pointSeriesSpec];
    const pointSeriesDomains = computeSeriesDomains(pointSeriesMap, new Map());
    const xScale = computeXScale({
      xDomain: pointSeriesDomains.xDomain,
      totalBarsInCluster: pointSeriesMap.length,
      range: [0, 90],
    });
    const yScales = computeYScales({ yDomains: pointSeriesDomains.yDomain, range: [100, 0] });

    let renderedLine: {
      lineGeometry: LineGeometry;
      indexedGeometries: Map<any, IndexedGeometry[]>;
    };

    beforeEach(() => {
      renderedLine = renderLine(
        0, // not applied any shift, renderGeometries applies it only with mixed charts
        pointSeriesDomains.formattedDataSeries.nonStacked[0].dataSeries[0],
        xScale,
        yScales.get(GROUP_ID)!,
        'red',
        CurveType.LINEAR,
        false,
        0,
        LIGHT_THEME.lineSeriesStyle,
      );
    });
    test('Can render a splitted line', () => {
      // expect(renderedLine.lineGeometry.line).toBe('ss');
      expect(renderedLine.lineGeometry.line.split('M').length - 1).toBe(3);
      expect(renderedLine.lineGeometry.color).toBe('red');
      expect(renderedLine.lineGeometry.seriesIdentifier.seriesKeys).toEqual([1]);
      expect(renderedLine.lineGeometry.seriesIdentifier.specId).toEqual(SPEC_ID);
      expect(renderedLine.lineGeometry.transform).toEqual({ x: 0, y: 0 });
    });
    test('Can render points', () => {
      const {
        lineGeometry: { points },
        indexedGeometries,
      } = renderedLine;
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
      expect((zeroValueIndexdGeometry[0] as PointGeometry).y).toBe(100);
      // 0 radius point
      expect((zeroValueIndexdGeometry[0] as PointGeometry).radius).toBe(0);
    });
  });
  describe('Remove points datum is not in domain', () => {
    const pointSeriesSpec: LineSeriesSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Series,
      id: SPEC_ID,
      groupId: GROUP_ID,
      seriesType: SeriesTypes.Line,
      yScaleToDataExtent: false,
      data: [
        [0, 0],
        [1, 1],
        [2, 10],
        [3, 3],
      ],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Linear,
      yScaleType: ScaleType.Linear,
    };
    const customYDomain = new Map<GroupId, DomainRange>();
    customYDomain.set(GROUP_ID, {
      max: 1,
    });
    const pointSeriesDomains = computeSeriesDomains([pointSeriesSpec], customYDomain, [], {
      max: 2,
    });
    const xScale = computeXScale({
      xDomain: pointSeriesDomains.xDomain,
      totalBarsInCluster: 1,
      range: [0, 100],
    });
    const yScales = computeYScales({ yDomains: pointSeriesDomains.yDomain, range: [100, 0] });
    let renderedLine: {
      lineGeometry: LineGeometry;
      indexedGeometries: Map<any, IndexedGeometry[]>;
    };

    beforeEach(() => {
      renderedLine = renderLine(
        25, // adding a ideal 25px shift, generally applied by renderGeometries
        pointSeriesDomains.formattedDataSeries.nonStacked[0].dataSeries[0],
        xScale,
        yScales.get(GROUP_ID)!,
        'red',
        CurveType.LINEAR,
        false,
        0,
        LIGHT_THEME.lineSeriesStyle,
      );
    });
    test('Can render two points', () => {
      const {
        lineGeometry: { points },
        indexedGeometries,
      } = renderedLine;
      // will not render the 3rd point that is out of y domain
      expect(points.length).toBe(2);
      // will keep the 3rd point as an indexedGeometry
      expect(indexedGeometries.size).toEqual(3);
      expect(points[0]).toEqual(({
        x: 0,
        y: 100,
        radius: 10,
        color: 'red',
        seriesIdentifier: {
          specId: SPEC_ID,
          key: 'spec{spec_1}yAccessor{1}splitAccessors{}',
          yAccessor: 1,
          splitAccessors: new Map(),
          seriesKeys: [1],
        },
        value: {
          accessor: 'y1',
          x: 0,
          y: 0,
        },
        transform: {
          x: 25,
          y: 0,
        },
      } as unknown) as PointGeometry);
      expect(points[1]).toEqual(({
        x: 50,
        y: 0,
        radius: 10,
        color: 'red',
        seriesIdentifier: {
          specId: SPEC_ID,
          key: 'spec{spec_1}yAccessor{1}splitAccessors{}',
          yAccessor: 1,
          splitAccessors: new Map(),
          seriesKeys: [1],
        },
        value: {
          accessor: 'y1',
          x: 1,
          y: 1,
        },
        transform: {
          x: 25,
          y: 0,
        },
      } as unknown) as PointGeometry);
    });
  });
});
