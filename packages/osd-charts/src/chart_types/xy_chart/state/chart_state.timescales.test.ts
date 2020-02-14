import { LineSeriesSpec, SeriesTypes } from '../utils/specs';
import { ScaleType } from '../../../scales';
import { createStore, Store } from 'redux';
import { chartStoreReducer, GlobalChartState } from '../../../state/chart_state';
import { upsertSpec, specParsed } from '../../../state/actions/specs';
import { SettingsSpec, DEFAULT_SETTINGS_SPEC, SpecTypes } from '../../../specs';
import { mergeWithDefaultTheme } from '../../../utils/themes/theme';
import { LIGHT_THEME } from '../../../utils/themes/light_theme';
import { updateParentDimensions } from '../../../state/actions/chart_settings';
import { computeSeriesGeometriesSelector } from './selectors/compute_series_geometries';
import { onPointerMove } from '../../../state/actions/mouse';
import { getTooltipValuesSelector } from './selectors/get_tooltip_values_highlighted_geoms';
import { DateTime } from 'luxon';
import { getComputedScalesSelector } from './selectors/get_computed_scales';
import { ChartTypes } from '../..';

describe('Render chart', () => {
  describe('line, utc-time, day interval', () => {
    let store: Store<GlobalChartState>;
    const day1 = 1546300800000; // 2019-01-01T00:00:00.000Z
    const day2 = day1 + 1000 * 60 * 60 * 24;
    const day3 = day2 + 1000 * 60 * 60 * 24;
    beforeEach(() => {
      const storeReducer = chartStoreReducer('chartId');
      store = createStore(storeReducer);

      const lineSeries: LineSeriesSpec = {
        chartType: ChartTypes.XYAxis,
        specType: SpecTypes.Series,
        id: 'lines',
        groupId: 'line',
        seriesType: SeriesTypes.Line,
        xScaleType: ScaleType.Time,
        yScaleType: ScaleType.Linear,
        xAccessor: 0,
        yAccessors: [1],
        data: [
          [day1, 10],
          [day2, 22],
          [day3, 6],
        ],
        yScaleToDataExtent: false,
      };
      store.dispatch(upsertSpec(lineSeries));

      const settingSpec: SettingsSpec = {
        ...DEFAULT_SETTINGS_SPEC,
        theme: mergeWithDefaultTheme(
          {
            chartPaddings: { top: 0, left: 0, bottom: 0, right: 0 },
            chartMargins: { top: 0, left: 0, bottom: 0, right: 0 },
          },
          LIGHT_THEME,
        ),
      };
      store.dispatch(upsertSpec(settingSpec));
      store.dispatch(specParsed());
      store.dispatch(updateParentDimensions({ width: 100, height: 100, top: 0, left: 0 }));
      const state = store.getState();
      expect(state.specs['lines']).toBeDefined();
      expect(state.chartType).toBe(ChartTypes.XYAxis);
    });
    test('check rendered geometries', () => {
      const { geometries } = computeSeriesGeometriesSelector(store.getState());
      expect(geometries).toBeDefined();
      expect(geometries.lines).toBeDefined();
      expect(geometries.lines.length).toBe(1);
      expect(geometries.lines[0].points.length).toBe(3);
    });
    test('check mouse position correctly return inverted value', () => {
      store.dispatch(onPointerMove({ x: 15, y: 10 }, 0)); // check first valid tooltip
      let tooltip = getTooltipValuesSelector(store.getState());
      expect(tooltip.values.length).toBe(1);
      expect(tooltip.header?.value).toBe(day1);
      expect(tooltip.values[0].value).toBe(10);
      store.dispatch(onPointerMove({ x: 35, y: 10 }, 1)); // check second valid tooltip
      tooltip = getTooltipValuesSelector(store.getState());
      expect(tooltip.values.length).toBe(1);
      expect(tooltip.header?.value).toBe(day2);
      expect(tooltip.values[0].value).toBe(22);
      store.dispatch(onPointerMove({ x: 76, y: 10 }, 2)); // check third valid tooltip
      tooltip = getTooltipValuesSelector(store.getState());
      expect(tooltip.values.length).toBe(1);
      expect(tooltip.header?.value).toBe(day3);
      expect(tooltip.values[0].value).toBe(6);
    });
  });
  describe('line, utc-time, 5m interval', () => {
    let store: Store<GlobalChartState>;
    const date1 = 1546300800000; // 2019-01-01T00:00:00.000Z
    const date2 = date1 + 1000 * 60 * 5;
    const date3 = date2 + 1000 * 60 * 5;
    beforeEach(() => {
      const storeReducer = chartStoreReducer('chartId');
      store = createStore(storeReducer);

      const lineSeries: LineSeriesSpec = {
        chartType: ChartTypes.XYAxis,
        specType: SpecTypes.Series,
        id: 'lines',
        groupId: 'line',
        seriesType: SeriesTypes.Line,
        xScaleType: ScaleType.Time,
        yScaleType: ScaleType.Linear,
        xAccessor: 0,
        yAccessors: [1],
        data: [
          [date1, 10],
          [date2, 22],
          [date3, 6],
        ],
        yScaleToDataExtent: false,
      };
      store.dispatch(upsertSpec(lineSeries));
      const settingSpec: SettingsSpec = {
        ...DEFAULT_SETTINGS_SPEC,
        theme: mergeWithDefaultTheme(
          {
            chartPaddings: { top: 0, left: 0, bottom: 0, right: 0 },
            chartMargins: { top: 0, left: 0, bottom: 0, right: 0 },
          },
          LIGHT_THEME,
        ),
      };
      store.dispatch(upsertSpec(settingSpec));
      store.dispatch(specParsed());
      store.dispatch(updateParentDimensions({ width: 100, height: 100, top: 0, left: 0 }));
      const state = store.getState();
      expect(state.specs['lines']).toBeDefined();
      expect(state.chartType).toBe(ChartTypes.XYAxis);
    });
    test('check rendered geometries', () => {
      const { geometries } = computeSeriesGeometriesSelector(store.getState());
      expect(geometries).toBeDefined();
      expect(geometries.lines).toBeDefined();
      expect(geometries.lines.length).toBe(1);
      expect(geometries.lines[0].points.length).toBe(3);
    });
    test('check mouse position correctly return inverted value', () => {
      store.dispatch(onPointerMove({ x: 15, y: 10 }, 0)); // check first valid tooltip
      let tooltip = getTooltipValuesSelector(store.getState());
      expect(tooltip.values.length).toBe(1);
      expect(tooltip.header?.value).toBe(date1);
      expect(tooltip.values[0].value).toBe(10);
      store.dispatch(onPointerMove({ x: 35, y: 10 }, 1)); // check second valid tooltip
      tooltip = getTooltipValuesSelector(store.getState());
      expect(tooltip.values.length).toBe(1);
      expect(tooltip.header?.value).toBe(date2);
      expect(tooltip.values[0].value).toBe(22);
      store.dispatch(onPointerMove({ x: 76, y: 10 }, 2)); // check third valid tooltip
      tooltip = getTooltipValuesSelector(store.getState());
      expect(tooltip.values.length).toBe(1);
      expect(tooltip.header?.value).toBe(date3);
      expect(tooltip.values[0].value).toBe(6);
    });
  });
  describe('line, non utc-time, 5m + 1s interval', () => {
    let store: Store<GlobalChartState>;
    const date1 = DateTime.fromISO('2019-01-01T00:00:01.000-0300', { setZone: true }).toMillis();
    const date2 = date1 + 1000 * 60 * 5;
    const date3 = date2 + 1000 * 60 * 5;
    beforeEach(() => {
      const storeReducer = chartStoreReducer('chartId');
      store = createStore(storeReducer);
      const lineSeries: LineSeriesSpec = {
        chartType: ChartTypes.XYAxis,
        specType: SpecTypes.Series,
        id: 'lines',
        groupId: 'line',
        seriesType: SeriesTypes.Line,
        xScaleType: ScaleType.Time,
        yScaleType: ScaleType.Linear,
        xAccessor: 0,
        yAccessors: [1],
        data: [
          [date1, 10],
          [date2, 22],
          [date3, 6],
        ],
        yScaleToDataExtent: false,
      };
      store.dispatch(upsertSpec(lineSeries));
      const settingSpec: SettingsSpec = {
        ...DEFAULT_SETTINGS_SPEC,
        theme: mergeWithDefaultTheme(
          {
            chartPaddings: { top: 0, left: 0, bottom: 0, right: 0 },
            chartMargins: { top: 0, left: 0, bottom: 0, right: 0 },
          },
          LIGHT_THEME,
        ),
      };
      store.dispatch(upsertSpec(settingSpec));
      store.dispatch(specParsed());
      store.dispatch(updateParentDimensions({ width: 100, height: 100, top: 0, left: 0 }));
      const state = store.getState();
      expect(state.specs['lines']).toBeDefined();
      expect(state.chartType).toBe(ChartTypes.XYAxis);
    });
    test('check rendered geometries', () => {
      const { geometries } = computeSeriesGeometriesSelector(store.getState());
      expect(geometries).toBeDefined();
      expect(geometries.lines).toBeDefined();
      expect(geometries.lines.length).toBe(1);
      expect(geometries.lines[0].points.length).toBe(3);
    });
    test('check scale values', () => {
      const xValues = [date1, date2, date3];
      const state = store.getState();
      const { xScale } = getComputedScalesSelector(state);

      expect(xScale.minInterval).toBe(1000 * 60 * 5);
      expect(xScale.domain).toEqual([date1, date3]);
      expect(xScale.range).toEqual([0, 100]);
      expect(xScale.invert(0)).toBe(date1);
      expect(xScale.invert(50)).toBe(date2);
      expect(xScale.invert(100)).toBe(date3);
      expect(xScale.invertWithStep(5, xValues)).toEqual({ value: date1, withinBandwidth: true });
      expect(xScale.invertWithStep(20, xValues)).toEqual({ value: date1, withinBandwidth: true });
      expect(xScale.invertWithStep(30, xValues)).toEqual({ value: date2, withinBandwidth: true });
      expect(xScale.invertWithStep(50, xValues)).toEqual({ value: date2, withinBandwidth: true });
      expect(xScale.invertWithStep(70, xValues)).toEqual({ value: date2, withinBandwidth: true });
      expect(xScale.invertWithStep(80, xValues)).toEqual({ value: date3, withinBandwidth: true });
      expect(xScale.invertWithStep(100, xValues)).toEqual({ value: date3, withinBandwidth: true });
    });
    test('check mouse position correctly return inverted value', () => {
      store.dispatch(onPointerMove({ x: 15, y: 10 }, 0)); // check first valid tooltip
      let tooltip = getTooltipValuesSelector(store.getState());
      expect(tooltip.values.length).toBe(1);
      expect(tooltip.header?.value).toBe(date1);
      expect(tooltip.values[0].value).toBe(10);
      store.dispatch(onPointerMove({ x: 35, y: 10 }, 1)); // check second valid tooltip
      tooltip = getTooltipValuesSelector(store.getState());
      expect(tooltip.values.length).toBe(1);
      expect(tooltip.header?.value).toBe(date2);
      expect(tooltip.values[0].value).toBe(22);
      store.dispatch(onPointerMove({ x: 76, y: 10 }, 2)); // check third valid tooltip
      tooltip = getTooltipValuesSelector(store.getState());
      expect(tooltip.values.length).toBe(1);
      expect(tooltip.header?.value).toBe(date3);
      expect(tooltip.values[0].value).toBe(6);
    });
  });
});
