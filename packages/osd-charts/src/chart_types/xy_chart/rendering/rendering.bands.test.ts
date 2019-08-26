/* eslint @typescript-eslint/no-object-literal-type-assertion: off */
import { computeSeriesDomains } from '../store/utils';
import { getGroupId, getSpecId, SpecId } from '../../../utils/ids';
import { ScaleType } from '../../../utils/scales/scales';
import { CurveType } from '../../../utils/curves';
import { AreaGeometry, IndexedGeometry, PointGeometry, renderArea, renderBars } from './rendering';
import { computeXScale, computeYScales } from '../utils/scales';
import { AreaSeriesSpec, BarSeriesSpec } from '../utils/specs';
import { LIGHT_THEME } from '../../../utils/themes/light_theme';

const SPEC_ID = getSpecId('spec_1');
const GROUP_ID = getGroupId('group_1');

describe('Rendering bands - areas', () => {
  describe('Empty line for missing data', () => {
    const pointSeriesSpec: AreaSeriesSpec = {
      id: SPEC_ID,
      groupId: GROUP_ID,
      seriesType: 'area',
      yScaleToDataExtent: false,
      data: [[0, 2, 10], [1, 3, 5]],
      xAccessor: 0,
      y0Accessors: [1],
      yAccessors: [2],
      xScaleType: ScaleType.Ordinal,
      yScaleType: ScaleType.Linear,
    };
    const pointSeriesMap = new Map<SpecId, AreaSeriesSpec>();
    pointSeriesMap.set(SPEC_ID, pointSeriesSpec);
    const pointSeriesDomains = computeSeriesDomains(pointSeriesMap, new Map());
    const xScale = computeXScale({
      xDomain: pointSeriesDomains.xDomain,
      totalBarsInCluster: pointSeriesMap.size,
      range: [0, 100],
    });
    const yScales = computeYScales({ yDomains: pointSeriesDomains.yDomain, range: [100, 0] });
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
        true,
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
  describe('Single band area chart', () => {
    const pointSeriesSpec: AreaSeriesSpec = {
      id: SPEC_ID,
      groupId: GROUP_ID,
      seriesType: 'area',
      yScaleToDataExtent: false,
      data: [[0, 2, 10], [1, 3, 5]],
      xAccessor: 0,
      y0Accessors: [1],
      yAccessors: [2],
      xScaleType: ScaleType.Ordinal,
      yScaleType: ScaleType.Linear,
    };
    const pointSeriesMap = new Map<SpecId, AreaSeriesSpec>();
    pointSeriesMap.set(SPEC_ID, pointSeriesSpec);
    const pointSeriesDomains = computeSeriesDomains(pointSeriesMap, new Map());
    const xScale = computeXScale({
      xDomain: pointSeriesDomains.xDomain,
      totalBarsInCluster: pointSeriesMap.size,
      range: [0, 100],
    });
    const yScales = computeYScales({ yDomains: pointSeriesDomains.yDomain, range: [100, 0] });
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
        true,
        [],
        0,
        LIGHT_THEME.areaSeriesStyle,
      );
    });
    test('Can render upper and lower lines and area paths', () => {
      const {
        areaGeometry: { lines, area, color, geometryId, transform },
      } = renderedArea;
      expect(lines.length).toBe(2);
      expect(lines[0]).toBe('M0,0L50,50');
      expect(lines[1]).toBe('M0,80L50,70');
      expect(area).toBe('M0,0L50,50L50,70L0,80Z');
      expect(color).toBe('red');
      expect(geometryId.seriesKey).toEqual([]);
      expect(geometryId.specId).toEqual(SPEC_ID);
      expect(transform).toEqual({ x: 25, y: 0 });
    });

    test('Can render two points', () => {
      const {
        areaGeometry: { points },
      } = renderedArea;
      expect(points.length).toBe(4);
      expect(points[0]).toEqual({
        x: 0,
        y: 80,
        radius: 10,
        color: 'red',
        geometryId: {
          specId: SPEC_ID,
          seriesKey: [],
        },
        value: {
          accessor: 'y0',
          x: 0,
          y: 2,
        },

        transform: {
          x: 25,
          y: 0,
        },
      } as PointGeometry);

      expect(points[1]).toEqual({
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
      expect(points[2]).toEqual({
        x: 50,
        y: 70,
        radius: 10,
        color: 'red',
        geometryId: {
          specId: SPEC_ID,
          seriesKey: [],
        },
        value: {
          accessor: 'y0',
          x: 1,
          y: 3,
        },
        transform: {
          x: 25,
          y: 0,
        },
      } as PointGeometry);
      expect(points[3]).toEqual({
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
    });
  });
  describe('Single band area chart with null values', () => {
    const pointSeriesSpec: AreaSeriesSpec = {
      id: SPEC_ID,
      groupId: GROUP_ID,
      seriesType: 'area',
      yScaleToDataExtent: false,
      data: [[0, 2, 10], [1, 2, null], [2, 3, 5], [3, 3, 5]],
      xAccessor: 0,
      y0Accessors: [1],
      yAccessors: [2],
      xScaleType: ScaleType.Ordinal,
      yScaleType: ScaleType.Linear,
    };
    const pointSeriesMap = new Map<SpecId, AreaSeriesSpec>();
    pointSeriesMap.set(SPEC_ID, pointSeriesSpec);
    const pointSeriesDomains = computeSeriesDomains(pointSeriesMap, new Map());
    const xScale = computeXScale({
      xDomain: pointSeriesDomains.xDomain,
      totalBarsInCluster: pointSeriesMap.size,
      range: [0, 100],
    });
    const yScales = computeYScales({ yDomains: pointSeriesDomains.yDomain, range: [100, 0] });
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
        true,
        [],
        0,
        LIGHT_THEME.areaSeriesStyle,
      );
    });
    test('Can render upper and lower lines and area paths', () => {
      const {
        areaGeometry: { lines, area, color, geometryId, transform },
      } = renderedArea;
      expect(lines.length).toBe(2);
      expect(lines[0]).toBe('M0,0ZM50,50L75,50');
      expect(lines[1]).toBe('M0,80ZM50,70L75,70');
      expect(area).toBe('M0,0L0,80ZM50,50L75,50L75,70L50,70Z');
      expect(color).toBe('red');
      expect(geometryId.seriesKey).toEqual([]);
      expect(geometryId.specId).toEqual(SPEC_ID);
      expect(transform).toEqual({ x: 25, y: 0 });
    });

    test('Can render two points', () => {
      const {
        areaGeometry: { points },
      } = renderedArea;
      // expect(points).toBe(6);
      expect(points.length).toBe(6);
      expect(points[0]).toEqual({
        x: 0,
        y: 80,
        radius: 10,
        color: 'red',
        geometryId: {
          specId: SPEC_ID,
          seriesKey: [],
        },
        value: {
          accessor: 'y0',
          x: 0,
          y: 2,
        },

        transform: {
          x: 25,
          y: 0,
        },
      } as PointGeometry);

      expect(points[1]).toEqual({
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
      expect(points[2]).toEqual({
        x: 50,
        y: 70,
        radius: 10,
        color: 'red',
        geometryId: {
          specId: SPEC_ID,
          seriesKey: [],
        },
        value: {
          accessor: 'y0',
          x: 2,
          y: 3,
        },
        transform: {
          x: 25,
          y: 0,
        },
      } as PointGeometry);
      expect(points[3]).toEqual({
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
          x: 2,
          y: 5,
        },
        transform: {
          x: 25,
          y: 0,
        },
      } as PointGeometry);
      expect(points[4]).toEqual({
        x: 75,
        y: 70,
        radius: 10,
        color: 'red',
        geometryId: {
          specId: SPEC_ID,
          seriesKey: [],
        },
        value: {
          accessor: 'y0',
          x: 3,
          y: 3,
        },
        transform: {
          x: 25,
          y: 0,
        },
      } as PointGeometry);
      expect(points[5]).toEqual({
        x: 75,
        y: 50,
        radius: 10,
        color: 'red',
        geometryId: {
          specId: SPEC_ID,
          seriesKey: [],
        },
        value: {
          accessor: 'y1',
          x: 3,
          y: 5,
        },
        transform: {
          x: 25,
          y: 0,
        },
      } as PointGeometry);
    });
  });
  describe('Single series band bar chart - ordinal', () => {
    const barSeriesSpec: BarSeriesSpec = {
      id: SPEC_ID,
      groupId: GROUP_ID,
      seriesType: 'bar',
      yScaleToDataExtent: false,
      data: [[0, 2, 10], [1, 3, null], [2, 3, 5], [3, 4, 8]],
      xAccessor: 0,
      y0Accessors: [1],
      yAccessors: [2],
      xScaleType: ScaleType.Ordinal,
      yScaleType: ScaleType.Linear,
    };
    const barSeriesMap = new Map<SpecId, BarSeriesSpec>();
    barSeriesMap.set(SPEC_ID, barSeriesSpec);
    const barSeriesDomains = computeSeriesDomains(barSeriesMap, new Map());
    const xScale = computeXScale({
      xDomain: barSeriesDomains.xDomain,
      totalBarsInCluster: barSeriesMap.size,
      range: [0, 100],
    });
    const yScales = computeYScales({ yDomains: barSeriesDomains.yDomain, range: [100, 0] });

    test('Can render two bars', () => {
      const { barGeometries } = renderBars(
        0,
        barSeriesDomains.formattedDataSeries.nonStacked[0].dataSeries[0].data,
        xScale,
        yScales.get(GROUP_ID)!,
        'red',
        SPEC_ID,
        [],
        LIGHT_THEME.barSeriesStyle,
      );
      expect(barGeometries.length).toBe(3);
      expect(barGeometries[0]).toEqual({
        x: 0,
        y: 0,
        width: 25,
        height: 80,
        color: 'red',
        value: {
          accessor: 'y1',
          x: 0,
          y: 10,
        },
        geometryId: {
          specId: SPEC_ID,
          seriesKey: [],
        },
        displayValue: undefined,
        seriesStyle: {
          displayValue: {
            fill: '#777',
            fontFamily: 'sans-serif',
            fontSize: 8,
            fontStyle: 'normal',
            offsetX: 0,
            offsetY: 0,
            padding: 0,
          },
          rect: {
            opacity: 1,
          },
          rectBorder: {
            strokeWidth: 0,
            visible: false,
          },
        },
      });
      expect(barGeometries[1]).toEqual({
        x: 50,
        y: 50,
        width: 25,
        height: 20,
        color: 'red',
        value: {
          accessor: 'y1',
          x: 2,
          y: 5,
        },
        geometryId: {
          specId: SPEC_ID,
          seriesKey: [],
        },
        displayValue: undefined,
        seriesStyle: {
          displayValue: {
            fill: '#777',
            fontFamily: 'sans-serif',
            fontSize: 8,
            fontStyle: 'normal',
            offsetX: 0,
            offsetY: 0,
            padding: 0,
          },
          rect: {
            opacity: 1,
          },
          rectBorder: {
            strokeWidth: 0,
            visible: false,
          },
        },
      });
      expect(barGeometries[2]).toEqual({
        x: 75,
        y: 20,
        width: 25,
        height: 40,
        color: 'red',
        value: {
          accessor: 'y1',
          x: 3,
          y: 8,
        },
        geometryId: {
          specId: SPEC_ID,
          seriesKey: [],
        },
        displayValue: undefined,
        seriesStyle: {
          displayValue: {
            fill: '#777',
            fontFamily: 'sans-serif',
            fontSize: 8,
            fontStyle: 'normal',
            offsetX: 0,
            offsetY: 0,
            padding: 0,
          },
          rect: {
            opacity: 1,
          },
          rectBorder: {
            strokeWidth: 0,
            visible: false,
          },
        },
      });
    });
  });
});
