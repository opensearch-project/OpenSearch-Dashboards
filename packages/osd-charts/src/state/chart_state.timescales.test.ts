import { DateTime } from 'luxon';
import { LineSeriesSpec } from '../lib/series/specs';
import { LIGHT_THEME } from '../lib/themes/light_theme';
import { mergeWithDefaultTheme } from '../lib/themes/theme';
import { getGroupId, getSpecId } from '../lib/utils/ids';
import { ScaleType } from '../lib/utils/scales/scales';
import { ChartStore } from './chart_state';

describe('Render chart', () => {
  describe('line, utc-time, day interval', () => {
    let store: ChartStore;
    const day1 = 1546300800000; // 2019-01-01T00:00:00.000Z
    const day2 = day1 + 1000 * 60 * 60 * 24;
    const day3 = day2 + 1000 * 60 * 60 * 24;
    beforeEach(() => {
      store = new ChartStore();

      const lineSeries: LineSeriesSpec = {
        id: getSpecId('lines'),
        groupId: getGroupId('line'),
        seriesType: 'line',
        xScaleType: ScaleType.Time,
        yScaleType: ScaleType.Linear,
        xAccessor: 0,
        yAccessors: [1],
        data: [[day1, 10], [day2, 22], [day3, 6]],
        yScaleToDataExtent: false,
      };
      store.chartTheme = mergeWithDefaultTheme(
        {
          chartPaddings: { top: 0, left: 0, bottom: 0, right: 0 },
          chartMargins: { top: 0, left: 0, bottom: 0, right: 0 },
        },
        LIGHT_THEME,
      );

      store.addSeriesSpec(lineSeries);
      store.updateParentDimensions(100, 100, 0, 0);
    });
    test('check rendered geometries', () => {
      expect(store.geometries).toBeTruthy();
      expect(store.geometries!.lines).toBeDefined();
      expect(store.geometries!.lines.length).toBe(1);
      expect(store.geometries!.lines[0].points.length).toBe(3);
    });
    test('check mouse position correctly return inverted value', () => {
      store.setCursorPosition(15, 10); // check first valid tooltip
      expect(store.tooltipData.length).toBe(2); // x value + y value
      expect(store.tooltipData[0].value).toBe(`${day1}`); // x value
      expect(store.tooltipData[1].value).toBe('10'); // y value
      store.setCursorPosition(35, 10); // check first valid tooltip
      expect(store.tooltipData.length).toBe(2); // x value + y value
      expect(store.tooltipData[0].value).toBe(`${day2}`); // x value
      expect(store.tooltipData[1].value).toBe('22'); // y value
      store.setCursorPosition(76, 10); // check first valid tooltip
      expect(store.tooltipData.length).toBe(2); // x value + y value
      expect(store.tooltipData[0].value).toBe(`${day3}`); // x value
      expect(store.tooltipData[1].value).toBe('6'); // y value
    });
  });
  describe('line, utc-time, 5m interval', () => {
    let store: ChartStore;
    const date1 = 1546300800000; // 2019-01-01T00:00:00.000Z
    const date2 = date1 + 1000 * 60 * 5;
    const date3 = date2 + 1000 * 60 * 5;
    beforeEach(() => {
      store = new ChartStore();

      const lineSeries: LineSeriesSpec = {
        id: getSpecId('lines'),
        groupId: getGroupId('line'),
        seriesType: 'line',
        xScaleType: ScaleType.Time,
        yScaleType: ScaleType.Linear,
        xAccessor: 0,
        yAccessors: [1],
        data: [[date1, 10], [date2, 22], [date3, 6]],
        yScaleToDataExtent: false,
      };
      store.chartTheme = mergeWithDefaultTheme(
        {
          chartPaddings: { top: 0, left: 0, bottom: 0, right: 0 },
          chartMargins: { top: 0, left: 0, bottom: 0, right: 0 },
        },
        LIGHT_THEME,
      );

      store.addSeriesSpec(lineSeries);
      store.updateParentDimensions(100, 100, 0, 0);
    });
    test('check rendered geometries', () => {
      expect(store.geometries).toBeTruthy();
      expect(store.geometries!.lines).toBeDefined();
      expect(store.geometries!.lines.length).toBe(1);
      expect(store.geometries!.lines[0].points.length).toBe(3);
    });
    test('check mouse position correctly return inverted value', () => {
      store.setCursorPosition(15, 10); // check first valid tooltip
      expect(store.tooltipData.length).toBe(2); // x value + y value
      expect(store.tooltipData[0].value).toBe(`${date1}`); // x value
      expect(store.tooltipData[1].value).toBe('10'); // y value
      store.setCursorPosition(35, 10); // check first valid tooltip
      expect(store.tooltipData.length).toBe(2); // x value + y value
      expect(store.tooltipData[0].value).toBe(`${date2}`); // x value
      expect(store.tooltipData[1].value).toBe('22'); // y value
      store.setCursorPosition(76, 10); // check first valid tooltip
      expect(store.tooltipData.length).toBe(2); // x value + y value
      expect(store.tooltipData[0].value).toBe(`${date3}`); // x value
      expect(store.tooltipData[1].value).toBe('6'); // y value
    });
  });
  describe('line, non utc-time, 5m + 1s interval', () => {
    let store: ChartStore;
    const date1 = DateTime.fromISO('2019-01-01T00:00:01.000-0300', { setZone: true }).toMillis();
    const date2 = date1 + 1000 * 60 * 5;
    const date3 = date2 + 1000 * 60 * 5;
    beforeEach(() => {
      store = new ChartStore();

      const lineSeries: LineSeriesSpec = {
        id: getSpecId('lines'),
        groupId: getGroupId('line'),
        seriesType: 'line',
        xScaleType: ScaleType.Time,
        yScaleType: ScaleType.Linear,
        xAccessor: 0,
        yAccessors: [1],
        data: [[date1, 10], [date2, 22], [date3, 6]],
        yScaleToDataExtent: false,
      };
      store.chartTheme = mergeWithDefaultTheme(
        {
          chartPaddings: { top: 0, left: 0, bottom: 0, right: 0 },
          chartMargins: { top: 0, left: 0, bottom: 0, right: 0 },
        },
        LIGHT_THEME,
      );

      store.addSeriesSpec(lineSeries);
      store.updateParentDimensions(100, 100, 0, 0);
    });
    test('check rendered geometries', () => {
      expect(store.geometries).toBeTruthy();
      expect(store.geometries!.lines).toBeDefined();
      expect(store.geometries!.lines.length).toBe(1);
      expect(store.geometries!.lines[0].points.length).toBe(3);
    });
    test('check scale values', () => {
      const xValues = [date1, date2, date3];
      expect(store.xScale!.minInterval).toBe(1000 * 60 * 5);
      expect(store.xScale!.domain).toEqual([date1, date3]);
      expect(store.xScale!.range).toEqual([0, 100]);
      expect(store.xScale!.invert(0)).toBe(date1);
      expect(store.xScale!.invert(50)).toBe(date2);
      expect(store.xScale!.invert(100)).toBe(date3);
      expect(store.xScale!.invertWithStep(5, xValues)).toBe(date1);
      expect(store.xScale!.invertWithStep(20, xValues)).toBe(date1);
      expect(store.xScale!.invertWithStep(30, xValues)).toBe(date2);
      expect(store.xScale!.invertWithStep(50, xValues)).toBe(date2);
      expect(store.xScale!.invertWithStep(70, xValues)).toBe(date2);
      expect(store.xScale!.invertWithStep(80, xValues)).toBe(date3);
      expect(store.xScale!.invertWithStep(100, xValues)).toBe(date3);
    });
    test('check mouse position correctly return inverted value', () => {
      store.setCursorPosition(15, 10); // check first valid tooltip
      expect(store.tooltipData.length).toBe(2); // x value + y value
      expect(store.tooltipData[0].value).toBe(`${date1}`); // x value
      expect(store.tooltipData[1].value).toBe('10'); // y value
      store.setCursorPosition(35, 10); // check first valid tooltip
      expect(store.tooltipData.length).toBe(2); // x value + y value
      expect(store.tooltipData[0].value).toBe(`${date2}`); // x value
      expect(store.tooltipData[1].value).toBe('22'); // y value
      store.setCursorPosition(76, 10); // check first valid tooltip
      expect(store.tooltipData.length).toBe(2); // x value + y value
      expect(store.tooltipData[0].value).toBe(`${date3}`); // x value
      expect(store.tooltipData[1].value).toBe('6'); // y value
    });
  });
});
