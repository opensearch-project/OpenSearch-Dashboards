import { computeSeriesDomains } from '../store/utils';
import { identity } from '../../../utils/commons';
import { getGroupId, getSpecId, SpecId, GroupId } from '../../../utils/ids';
import { ScaleType } from '../../../utils/scales/scales';
import { renderBars } from './rendering';
import { computeXScale, computeYScales } from '../utils/scales';
import { BarSeriesSpec, DomainRange } from '../utils/specs';
import { LIGHT_THEME } from '../../../utils/themes/light_theme';

const SPEC_ID = getSpecId('spec_1');
const GROUP_ID = getGroupId('group_1');

describe('Rendering bars', () => {
  describe('Single series bar chart - ordinal', () => {
    const barSeriesSpec: BarSeriesSpec = {
      id: SPEC_ID,
      groupId: GROUP_ID,
      seriesType: 'bar',
      yScaleToDataExtent: false,
      data: [[-200, 0], [0, 10], [1, 5]], // first datum should be skipped as it's out of domain
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Ordinal,
      yScaleType: ScaleType.Linear,
    };
    const barSeriesMap = new Map<SpecId, BarSeriesSpec>();
    barSeriesMap.set(SPEC_ID, barSeriesSpec);
    const customDomain = [0, 1];
    const barSeriesDomains = computeSeriesDomains(barSeriesMap, new Map(), customDomain);
    const xScale = computeXScale({
      xDomain: barSeriesDomains.xDomain,
      totalBarsInCluster: barSeriesMap.size,
      range: [0, 100],
    });
    const yScales = computeYScales({ yDomains: barSeriesDomains.yDomain, range: [100, 0] });

    test('Can render two bars within domain', () => {
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

      expect(barGeometries[0]).toEqual({
        x: 0,
        y: 0,
        width: 50,
        height: 100,
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
        width: 50,
        height: 50,
        color: 'red',
        value: {
          accessor: 'y1',
          x: 1,
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
      expect(barGeometries.length).toBe(2);
    });
    test('Can render bars with value labels', () => {
      const valueFormatter = identity;
      const { barGeometries } = renderBars(
        0,
        barSeriesDomains.formattedDataSeries.nonStacked[0].dataSeries[0].data,
        xScale,
        yScales.get(GROUP_ID)!,
        'red',
        SPEC_ID,
        [],
        LIGHT_THEME.barSeriesStyle,
        { valueFormatter, showValueLabel: true, isAlternatingValueLabel: true },
      );
      expect(barGeometries[0].displayValue).toBeDefined();
    });

    test('Can hide value labels if no formatter or showValueLabels is false/undefined', () => {
      const { barGeometries } = renderBars(
        0,
        barSeriesDomains.formattedDataSeries.nonStacked[0].dataSeries[0].data,
        xScale,
        yScales.get(GROUP_ID)!,
        'red',
        SPEC_ID,
        [],
        LIGHT_THEME.barSeriesStyle,
        {},
      );
      expect(barGeometries[0].displayValue).toBeUndefined();
    });

    test('Can render bars with alternating value labels', () => {
      const valueFormatter = identity;
      const { barGeometries } = renderBars(
        0,
        barSeriesDomains.formattedDataSeries.nonStacked[0].dataSeries[0].data,
        xScale,
        yScales.get(GROUP_ID)!,
        'red',
        SPEC_ID,
        [],
        LIGHT_THEME.barSeriesStyle,
        { valueFormatter, showValueLabel: true, isAlternatingValueLabel: true },
      );
      expect(barGeometries[0].displayValue!.text).toBeDefined();
      expect(barGeometries[1].displayValue!.text).toBeUndefined();
    });

    test('Can render bars with contained value labels', () => {
      const valueFormatter = identity;
      const { barGeometries } = renderBars(
        0,
        barSeriesDomains.formattedDataSeries.nonStacked[0].dataSeries[0].data,
        xScale,
        yScales.get(GROUP_ID)!,
        'red',
        SPEC_ID,
        [],
        LIGHT_THEME.barSeriesStyle,
        { valueFormatter, showValueLabel: true, isValueContainedInElement: true },
      );
      expect(barGeometries[0].displayValue!.width).toBe(50);
    });
  });
  describe('Multi series bar chart - ordinal', () => {
    const spec1Id = getSpecId('bar1');
    const spec2Id = getSpecId('bar2');
    const barSeriesSpec1: BarSeriesSpec = {
      id: spec1Id,
      groupId: GROUP_ID,
      seriesType: 'bar',
      yScaleToDataExtent: false,
      data: [[0, 10], [1, 5]],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Ordinal,
      yScaleType: ScaleType.Linear,
    };
    const barSeriesSpec2: BarSeriesSpec = {
      id: spec2Id,
      groupId: GROUP_ID,
      seriesType: 'bar',
      yScaleToDataExtent: false,
      data: [[0, 20], [1, 10]],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Ordinal,
      yScaleType: ScaleType.Linear,
    };
    const barSeriesMap = new Map<SpecId, BarSeriesSpec>();
    barSeriesMap.set(spec1Id, barSeriesSpec1);
    barSeriesMap.set(spec2Id, barSeriesSpec2);
    const barSeriesDomains = computeSeriesDomains(barSeriesMap, new Map());
    const xScale = computeXScale({
      xDomain: barSeriesDomains.xDomain,
      totalBarsInCluster: barSeriesMap.size,
      range: [0, 100],
    });
    const yScales = computeYScales({ yDomains: barSeriesDomains.yDomain, range: [100, 0] });

    test('can render first spec bars', () => {
      const { barGeometries } = renderBars(
        0,
        barSeriesDomains.formattedDataSeries.nonStacked[0].dataSeries[0].data,
        xScale,
        yScales.get(GROUP_ID)!,
        'red',
        spec1Id,
        [],
        LIGHT_THEME.barSeriesStyle,
      );
      expect(barGeometries.length).toEqual(2);
      expect(barGeometries[0]).toEqual({
        x: 0,
        y: 50,
        width: 25,
        height: 50,
        color: 'red',
        value: {
          accessor: 'y1',
          x: 0,
          y: 10,
        },
        geometryId: {
          specId: spec1Id,
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
        y: 75,
        width: 25,
        height: 25,
        color: 'red',
        value: {
          accessor: 'y1',
          x: 1,
          y: 5,
        },
        geometryId: {
          specId: spec1Id,
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
    test('can render second spec bars', () => {
      const { barGeometries } = renderBars(
        1,
        barSeriesDomains.formattedDataSeries.nonStacked[0].dataSeries[1].data,
        xScale,
        yScales.get(GROUP_ID)!,
        'blue',
        spec2Id,
        [],
        LIGHT_THEME.barSeriesStyle,
      );
      expect(barGeometries.length).toEqual(2);
      expect(barGeometries[0]).toEqual({
        x: 25,
        y: 0,
        width: 25,
        height: 100,
        color: 'blue',
        value: {
          accessor: 'y1',
          x: 0,
          y: 20,
        },
        geometryId: {
          specId: spec2Id,
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
        x: 75,
        y: 50,
        width: 25,
        height: 50,
        color: 'blue',
        value: {
          accessor: 'y1',
          x: 1,
          y: 10,
        },
        geometryId: {
          specId: spec2Id,
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
  describe('Single series bar chart - linear', () => {
    const barSeriesSpec: BarSeriesSpec = {
      id: SPEC_ID,
      groupId: GROUP_ID,
      seriesType: 'bar',
      yScaleToDataExtent: false,
      data: [[0, 10], [1, 5]],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Linear,
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
      expect(barGeometries[0]).toEqual({
        x: 0,
        y: 0,
        width: 50,
        height: 100,
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
        width: 50,
        height: 50,
        color: 'red',
        value: {
          accessor: 'y1',
          x: 1,
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
    });
  });
  describe('Single series bar chart - log', () => {
    const barSeriesSpec: BarSeriesSpec = {
      id: SPEC_ID,
      groupId: GROUP_ID,
      seriesType: 'bar',
      yScaleToDataExtent: false,
      data: [[1, 0], [2, 1], [3, 2], [4, 3], [5, 4], [6, 5]],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Linear,
      yScaleType: ScaleType.Log,
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

    test('Can render correct bar height', () => {
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
      expect(barGeometries.length).toBe(6);
      expect(barGeometries[0].height).toBe(0);
      expect(barGeometries[1].height).toBe(0);
      expect(barGeometries[2].height).toBeGreaterThan(0);
      expect(barGeometries[3].height).toBeGreaterThan(0);
    });
  });
  describe('Multi series bar chart - linear', () => {
    const spec1Id = getSpecId('bar1');
    const spec2Id = getSpecId('bar2');
    const barSeriesSpec1: BarSeriesSpec = {
      id: spec1Id,
      groupId: GROUP_ID,
      seriesType: 'bar',
      yScaleToDataExtent: false,
      data: [[0, 10], [1, 5]],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Linear,
      yScaleType: ScaleType.Linear,
    };
    const barSeriesSpec2: BarSeriesSpec = {
      id: spec2Id,
      groupId: GROUP_ID,
      seriesType: 'bar',
      yScaleToDataExtent: false,
      data: [[0, 20], [1, 10]],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Linear,
      yScaleType: ScaleType.Linear,
    };
    const barSeriesMap = new Map<SpecId, BarSeriesSpec>();
    barSeriesMap.set(spec1Id, barSeriesSpec1);
    barSeriesMap.set(spec2Id, barSeriesSpec2);
    const barSeriesDomains = computeSeriesDomains(barSeriesMap, new Map());
    const xScale = computeXScale({
      xDomain: barSeriesDomains.xDomain,
      totalBarsInCluster: barSeriesMap.size,
      range: [0, 100],
    });
    const yScales = computeYScales({ yDomains: barSeriesDomains.yDomain, range: [100, 0] });

    test('can render first spec bars', () => {
      const { barGeometries } = renderBars(
        0,
        barSeriesDomains.formattedDataSeries.nonStacked[0].dataSeries[0].data,
        xScale,
        yScales.get(GROUP_ID)!,
        'red',
        spec1Id,
        [],
        LIGHT_THEME.barSeriesStyle,
      );
      expect(barGeometries.length).toEqual(2);
      expect(barGeometries[0]).toEqual({
        x: 0,
        y: 50,
        width: 25,
        height: 50,
        color: 'red',
        value: {
          accessor: 'y1',
          x: 0,
          y: 10,
        },
        geometryId: {
          specId: spec1Id,
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
        y: 75,
        width: 25,
        height: 25,
        color: 'red',
        value: {
          accessor: 'y1',
          x: 1,
          y: 5,
        },
        geometryId: {
          specId: spec1Id,
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
    test('can render second spec bars', () => {
      const { barGeometries } = renderBars(
        1,
        barSeriesDomains.formattedDataSeries.nonStacked[0].dataSeries[1].data,
        xScale,
        yScales.get(GROUP_ID)!,
        'blue',
        spec2Id,
        [],
        LIGHT_THEME.barSeriesStyle,
      );
      expect(barGeometries.length).toEqual(2);
      expect(barGeometries[0]).toEqual({
        x: 25,
        y: 0,
        width: 25,
        height: 100,
        color: 'blue',
        value: {
          accessor: 'y1',
          x: 0,
          y: 20,
        },
        geometryId: {
          specId: spec2Id,
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
        x: 75,
        y: 50,
        width: 25,
        height: 50,
        color: 'blue',
        value: {
          accessor: 'y1',
          x: 1,
          y: 10,
        },
        geometryId: {
          specId: spec2Id,
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
  describe('Multi series bar chart - time', () => {
    const spec1Id = getSpecId('bar1');
    const spec2Id = getSpecId('bar2');
    const barSeriesSpec1: BarSeriesSpec = {
      id: spec1Id,
      groupId: GROUP_ID,
      seriesType: 'bar',
      yScaleToDataExtent: false,
      data: [[1546300800000, 10], [1546387200000, 5]],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Time,
      yScaleType: ScaleType.Linear,
    };
    const barSeriesSpec2: BarSeriesSpec = {
      id: spec2Id,
      groupId: GROUP_ID,
      seriesType: 'bar',
      yScaleToDataExtent: false,
      data: [[1546300800000, 20], [1546387200000, 10]],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Time,
      yScaleType: ScaleType.Linear,
    };
    const barSeriesMap = new Map<SpecId, BarSeriesSpec>();
    barSeriesMap.set(spec1Id, barSeriesSpec1);
    barSeriesMap.set(spec2Id, barSeriesSpec2);
    const barSeriesDomains = computeSeriesDomains(barSeriesMap, new Map());
    const xScale = computeXScale({
      xDomain: barSeriesDomains.xDomain,
      totalBarsInCluster: barSeriesMap.size,
      range: [0, 100],
    });
    const yScales = computeYScales({ yDomains: barSeriesDomains.yDomain, range: [100, 0] });

    test('can render first spec bars', () => {
      const { barGeometries } = renderBars(
        0,
        barSeriesDomains.formattedDataSeries.nonStacked[0].dataSeries[0].data,
        xScale,
        yScales.get(GROUP_ID)!,
        'red',
        spec1Id,
        [],
        LIGHT_THEME.barSeriesStyle,
      );
      expect(barGeometries.length).toEqual(2);
      expect(barGeometries[0]).toEqual({
        x: 0,
        y: 50,
        width: 25,
        height: 50,
        color: 'red',
        value: {
          accessor: 'y1',
          x: 1546300800000,
          y: 10,
        },
        geometryId: {
          specId: spec1Id,
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
        y: 75,
        width: 25,
        height: 25,
        color: 'red',
        value: {
          accessor: 'y1',
          x: 1546387200000,
          y: 5,
        },
        geometryId: {
          specId: spec1Id,
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
    test('can render second spec bars', () => {
      const { barGeometries } = renderBars(
        1,
        barSeriesDomains.formattedDataSeries.nonStacked[0].dataSeries[1].data,
        xScale,
        yScales.get(GROUP_ID)!,
        'blue',
        spec2Id,
        [],
        LIGHT_THEME.barSeriesStyle,
      );
      expect(barGeometries.length).toEqual(2);
      expect(barGeometries[0]).toEqual({
        x: 25,
        y: 0,
        width: 25,
        height: 100,
        color: 'blue',
        value: {
          accessor: 'y1',
          x: 1546300800000,
          y: 20,
        },
        geometryId: {
          specId: spec2Id,
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
        x: 75,
        y: 50,
        width: 25,
        height: 50,
        color: 'blue',
        value: {
          accessor: 'y1',
          x: 1546387200000,
          y: 10,
        },
        geometryId: {
          specId: spec2Id,
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
  describe('Remove points datum is not in domain', () => {
    const barSeriesSpec: BarSeriesSpec = {
      id: SPEC_ID,
      groupId: GROUP_ID,
      seriesType: 'bar',
      yScaleToDataExtent: false,
      data: [[0, 0], [1, 1], [2, 10], [3, 3]],
      xAccessor: 0,
      yAccessors: [1],
      xScaleType: ScaleType.Linear,
      yScaleType: ScaleType.Linear,
    };
    const barSeriesMap = new Map<SpecId, BarSeriesSpec>();
    barSeriesMap.set(SPEC_ID, barSeriesSpec);
    const customYDomain = new Map<GroupId, DomainRange>();
    customYDomain.set(GROUP_ID, {
      max: 1,
    });
    const barSeriesDomains = computeSeriesDomains(barSeriesMap, customYDomain, {
      max: 2,
    });
    const xScale = computeXScale({
      xDomain: barSeriesDomains.xDomain,
      totalBarsInCluster: barSeriesMap.size,
      range: [0, 100],
    });
    const yScales = computeYScales({ yDomains: barSeriesDomains.yDomain, range: [100, 0] });

    test('Can render 3 bars', () => {
      const { barGeometries, indexedGeometries } = renderBars(
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
      // will be cut by the clipping areas in the rendering component
      expect(barGeometries[2].height).toBe(1000);
      expect(indexedGeometries.size).toBe(3);
    });
  });
});
