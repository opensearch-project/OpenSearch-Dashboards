import { computeSeriesDomains } from '../../state/utils';
import { identity } from '../utils/commons';
import { getGroupId, getSpecId, SpecId } from '../utils/ids';
import { ScaleType } from '../utils/scales/scales';
import { renderBars } from './rendering';
import { computeXScale, computeYScales } from './scales';
import { BarSeriesSpec } from './specs';

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
    const xScale = computeXScale(barSeriesDomains.xDomain, barSeriesMap.size, 0, 100);
    const yScales = computeYScales(barSeriesDomains.yDomain, 100, 0);

    test('Can render two bars within domain', () => {
      const { barGeometries } = renderBars(
        0,
        barSeriesDomains.formattedDataSeries.nonStacked[0].dataSeries[0].data,
        xScale,
        yScales.get(GROUP_ID)!,
        'red',
        SPEC_ID,
        [],
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
    const xScale = computeXScale(barSeriesDomains.xDomain, barSeriesMap.size, 0, 100);
    const yScales = computeYScales(barSeriesDomains.yDomain, 100, 0);

    test('can render first spec bars', () => {
      const { barGeometries } = renderBars(
        0,
        barSeriesDomains.formattedDataSeries.nonStacked[0].dataSeries[0].data,
        xScale,
        yScales.get(GROUP_ID)!,
        'red',
        spec1Id,
        [],
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
    const xScale = computeXScale(barSeriesDomains.xDomain, barSeriesMap.size, 0, 100);
    const yScales = computeYScales(barSeriesDomains.yDomain, 100, 0);

    test('Can render two bars', () => {
      const { barGeometries } = renderBars(
        0,
        barSeriesDomains.formattedDataSeries.nonStacked[0].dataSeries[0].data,
        xScale,
        yScales.get(GROUP_ID)!,
        'red',
        SPEC_ID,
        [],
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
      });
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
    const xScale = computeXScale(barSeriesDomains.xDomain, barSeriesMap.size, 0, 100);
    const yScales = computeYScales(barSeriesDomains.yDomain, 100, 0);

    test('can render first spec bars', () => {
      const { barGeometries } = renderBars(
        0,
        barSeriesDomains.formattedDataSeries.nonStacked[0].dataSeries[0].data,
        xScale,
        yScales.get(GROUP_ID)!,
        'red',
        spec1Id,
        [],
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
    const xScale = computeXScale(barSeriesDomains.xDomain, barSeriesMap.size, 0, 100);
    const yScales = computeYScales(barSeriesDomains.yDomain, 100, 0);

    test('can render first spec bars', () => {
      const { barGeometries } = renderBars(
        0,
        barSeriesDomains.formattedDataSeries.nonStacked[0].dataSeries[0].data,
        xScale,
        yScales.get(GROUP_ID)!,
        'red',
        spec1Id,
        [],
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
      });
    });
  });
});
