import { GeometryValue, IndexedGeometry } from '../lib/series/rendering';
import { DataSeriesColorsValues } from '../lib/series/series';
import { AxisSpec, BarSeriesSpec, Position } from '../lib/series/specs';
import { getAxisId, getGroupId, getSpecId } from '../lib/utils/ids';
import { TooltipType, TooltipValue } from '../lib/utils/interactions';
import { ScaleBand } from '../lib/utils/scales/scale_band';
import { ScaleContinuous } from '../lib/utils/scales/scale_continuous';
import { ScaleType } from '../lib/utils/scales/scales';
import { ChartStore } from './chart_state';

describe('Chart Store', () => {
  const store = new ChartStore();

  const SPEC_ID = getSpecId('spec_1');
  const AXIS_ID = getAxisId('axis_1');
  const GROUP_ID = getGroupId('group_1');

  const spec: BarSeriesSpec = {
    id: SPEC_ID,
    groupId: GROUP_ID,
    seriesType: 'bar',
    yScaleToDataExtent: false,
    data: [{ x: 1, y: 1, g: 0 }, { x: 2, y: 2, g: 1 }, { x: 3, y: 3, g: 3 }],
    xAccessor: 'x',
    yAccessors: ['y'],
    xScaleType: ScaleType.Linear,
    yScaleType: ScaleType.Linear,
  };

  const firstLegendItem = {
    key: 'color1',
    color: 'foo',
    label: 'bar',
    value: {
      specId: SPEC_ID,
      colorValues: [],
    },
  };

  const secondLegendItem = {
    key: 'color2',
    color: 'baz',
    label: 'qux',
    value: {
      specId: SPEC_ID,
      colorValues: [],
    },
  };

  test('can add a single spec', () => {
    store.addSeriesSpec(spec);
    store.updateParentDimensions(600, 600, 0, 0);
    store.computeChart();
    const { seriesDomainsAndData } = store;
    expect(seriesDomainsAndData).not.toBeUndefined();
  });

  test('can initialize deselectedDataSeries depending on previous state', () => {
    store.specsInitialized.set(false);
    store.computeChart();
    expect(store.deselectedDataSeries).toEqual(null);
  });

  test('can add an axis', () => {
    const axisSpec: AxisSpec = {
      id: AXIS_ID,
      groupId: GROUP_ID,
      hide: false,
      showOverlappingTicks: false,
      showOverlappingLabels: false,
      position: Position.Left,
      tickSize: 30,
      tickPadding: 10,
      tickFormat: (value: any) => `value ${value}`,
    };
    store.addAxisSpec(axisSpec);
    store.computeChart();
    const { axesSpecs, axesTicksDimensions, axesPositions, axesVisibleTicks, axesTicks } = store;
    expect(axesSpecs.get(AXIS_ID)).not.toBeUndefined();
    expect(axesTicksDimensions.get(AXIS_ID)).not.toBeUndefined();
    expect(axesPositions.get(AXIS_ID)).not.toBeUndefined();
    expect(axesVisibleTicks.get(AXIS_ID)).not.toBeUndefined();
    expect(axesTicks.get(AXIS_ID)).not.toBeUndefined();
  });

  test('can toggle legend visibility', () => {
    store.toggleLegendCollapsed();
    expect(store.legendCollapsed.get()).toBe(true);

    store.toggleLegendCollapsed();
    expect(store.legendCollapsed.get()).toBe(false);
  });

  test('can set legend visibility', () => {
    store.showLegend.set(false);
    store.setShowLegend(true);

    expect(store.showLegend.get()).toEqual(true);
  });

  test('can get highlighted legend item', () => {
    store.legendItems = new Map([
      [firstLegendItem.key, firstLegendItem],
      [secondLegendItem.key, secondLegendItem],
    ]);

    store.highlightedLegendItemKey.set(null);
    expect(store.highlightedLegendItem.get()).toBe(null);

    store.highlightedLegendItemKey.set(secondLegendItem.key);
    expect(store.highlightedLegendItem.get()).toEqual(secondLegendItem);
  });

  test('can respond to legend item mouseover event', () => {
    const legendListener = jest.fn(
      (ds: DataSeriesColorsValues | null): void => {
        return;
      },
    );

    store.legendItems = new Map([
      [firstLegendItem.key, firstLegendItem],
      [secondLegendItem.key, secondLegendItem],
    ]);
    store.highlightedLegendItemKey.set(null);

    store.onLegendItemOver(firstLegendItem.key);
    expect(store.highlightedLegendItemKey.get()).toBe(firstLegendItem.key);

    store.setOnLegendItemOverListener(legendListener);
    store.onLegendItemOver(secondLegendItem.key);
    expect(legendListener).toBeCalledWith(secondLegendItem.value);

    store.onLegendItemOver(null);
    expect(legendListener).toBeCalledWith(null);

    store.onLegendItemOver('');
    expect(legendListener).toBeCalledWith(null);
  });

  test('can respond to legend item mouseout event', () => {
    const outListener = jest.fn((): undefined => undefined);

    store.highlightedLegendItemKey.set(firstLegendItem.key);

    store.setOnLegendItemOutListener(outListener);

    store.onLegendItemOut();
    expect(store.highlightedLegendItemKey.get()).toBe(null);
    expect(outListener).toBeCalled();

    store.removeOnLegendItemOutListener();
    store.onLegendItemOut();

    expect(outListener.mock.calls.length).toBe(1);
  });

  test('can respond to legend item click event', () => {
    const legendListener = jest.fn(
      (ds: DataSeriesColorsValues | null): void => {
        return;
      },
    );

    store.legendItems = new Map([
      [firstLegendItem.key, firstLegendItem],
      [secondLegendItem.key, secondLegendItem],
    ]);
    store.selectedLegendItemKey.set(null);
    store.onLegendItemClickListener = undefined;

    store.onLegendItemClick(firstLegendItem.key);
    expect(store.selectedLegendItemKey.get()).toBe(firstLegendItem.key);
    expect(legendListener).not.toBeCalled();

    store.setOnLegendItemClickListener(legendListener);
    store.onLegendItemClick(firstLegendItem.key);
    expect(store.selectedLegendItemKey.get()).toBe(null);
    expect(legendListener).toBeCalledWith(null);

    store.setOnLegendItemClickListener(legendListener);
    store.onLegendItemClick(secondLegendItem.key);
    expect(store.selectedLegendItemKey.get()).toBe(secondLegendItem.key);
    expect(legendListener).toBeCalledWith(secondLegendItem.value);
  });

  test('can respond to a legend item plus click event', () => {
    const legendListener = jest.fn(
      (ds: DataSeriesColorsValues | null): void => {
        return;
      },
    );

    store.legendItems = new Map([
      [firstLegendItem.key, firstLegendItem],
      [secondLegendItem.key, secondLegendItem],
    ]);
    store.selectedLegendItemKey.set(null);
    store.onLegendItemPlusClickListener = undefined;

    store.onLegendItemPlusClick();
    expect(legendListener).not.toBeCalled();

    store.setOnLegendItemPlusClickListener(legendListener);
    store.onLegendItemPlusClick();
    expect(legendListener).toBeCalledWith(null);

    store.selectedLegendItemKey.set(firstLegendItem.key);
    store.onLegendItemPlusClick();
    expect(legendListener).toBeCalledWith(firstLegendItem.value);
  });

  test('can respond to a legend item minus click event', () => {
    const legendListener = jest.fn(
      (ds: DataSeriesColorsValues | null): void => {
        return;
      },
    );

    store.legendItems = new Map([
      [firstLegendItem.key, firstLegendItem],
      [secondLegendItem.key, secondLegendItem],
    ]);
    store.selectedLegendItemKey.set(null);
    store.onLegendItemMinusClickListener = undefined;

    store.onLegendItemMinusClick();
    expect(legendListener).not.toBeCalled();

    store.setOnLegendItemMinusClickListener(legendListener);
    store.onLegendItemMinusClick();
    expect(legendListener).toBeCalledWith(null);

    store.selectedLegendItemKey.set(firstLegendItem.key);
    store.onLegendItemMinusClick();
    expect(legendListener).toBeCalledWith(firstLegendItem.value);
  });

  test('can toggle series visibility', () => {
    const computeChart = jest.fn(
      (): void => {
        return;
      },
    );

    store.legendItems = new Map([
      [firstLegendItem.key, firstLegendItem],
      [secondLegendItem.key, secondLegendItem],
    ]);
    store.deselectedDataSeries = null;
    store.computeChart = computeChart;

    store.toggleSeriesVisibility('other');
    expect(store.deselectedDataSeries).toEqual(null);
    expect(computeChart).not.toBeCalled();

    store.deselectedDataSeries = [firstLegendItem.value, secondLegendItem.value];
    store.toggleSeriesVisibility(firstLegendItem.key);
    expect(store.deselectedDataSeries).toEqual([secondLegendItem.value]);
    expect(computeChart).toBeCalled();

    store.deselectedDataSeries = [firstLegendItem.value];
    store.toggleSeriesVisibility(firstLegendItem.key);
    expect(store.deselectedDataSeries).toEqual([]);
  });

  test('can toggle single series visibility', () => {
    const computeChart = jest.fn(
      (): void => {
        return;
      },
    );

    store.legendItems = new Map([
      [firstLegendItem.key, firstLegendItem],
      [secondLegendItem.key, secondLegendItem],
    ]);
    store.deselectedDataSeries = null;
    store.computeChart = computeChart;

    store.toggleSingleSeries('other');
    expect(store.deselectedDataSeries).toEqual(null);
    expect(computeChart).not.toBeCalled();

    store.toggleSingleSeries(firstLegendItem.key);
    expect(store.deselectedDataSeries).toEqual([firstLegendItem.value]);

    store.toggleSingleSeries(firstLegendItem.key);
    expect(store.deselectedDataSeries).toEqual([secondLegendItem.value]);
  });

  test('can set an element click listener', () => {
    const clickListener = (value: GeometryValue[]): void => {
      return;
    };
    store.setOnElementClickListener(clickListener);

    expect(store.onElementClickListener).toEqual(clickListener);
  });

  test('can set a brush end listener', () => {
    const brushEndListener = (min: number, max: number): void => {
      return;
    };
    store.setOnBrushEndListener(brushEndListener);

    expect(store.onBrushEndListener).toEqual(brushEndListener);
  });

  test('can remove listeners', () => {
    store.removeElementClickListener();
    expect(store.onElementClickListener).toEqual(undefined);

    store.removeElementOverListener();
    expect(store.onElementOverListener).toEqual(undefined);

    store.removeElementOutListener();
    expect(store.onElementOutListener).toEqual(undefined);

    store.removeOnLegendItemOverListener();
    expect(store.onLegendItemOverListener).toEqual(undefined);

    store.removeOnLegendItemPlusClickListener();
    expect(store.onLegendItemPlusClickListener).toEqual(undefined);

    store.removeOnLegendItemMinusClickListener();
    expect(store.onLegendItemMinusClickListener).toEqual(undefined);
  });

  test('can respond to a brush end event', () => {
    const brushEndListener = jest.fn(
      (min: number, max: number): void => {
        return;
      },
    );

    const start = { x: 0, y: 0 };
    const end1 = { x: 100, y: 0 };
    const end2 = { x: -100, y: 0 };
    store.chartDimensions.left = 10;

    store.onBrushEndListener = undefined;
    store.onBrushStart();
    expect(store.isBrushing.get()).toBe(false);
    store.onBrushEnd(start, end1);
    expect(brushEndListener).not.toBeCalled();

    store.setOnBrushEndListener(brushEndListener);
    store.onBrushStart();
    expect(store.isBrushing.get()).toBe(true);
    store.onBrushEnd(start, start);
    expect(brushEndListener).not.toBeCalled();

    store.onBrushEnd(start, end1);
    expect(brushEndListener.mock.calls[0][0]).toBeCloseTo(0.9, 1);
    expect(brushEndListener.mock.calls[0][1]).toBeCloseTo(1.5, 1);

    store.onBrushEnd(start, end2);
    expect(brushEndListener.mock.calls[1][0]).toBeCloseTo(0.3, 1);
    expect(brushEndListener.mock.calls[1][1]).toBeCloseTo(0.9, 1);
  });

  test('can update parent dimensions', () => {
    const computeChart = jest.fn(
      (): void => {
        return;
      },
    );
    store.computeChart = computeChart;

    store.parentDimensions = {
      width: 10,
      height: 20,
      top: 5,
      left: 15,
    };

    store.updateParentDimensions(10, 20, 5, 15);
    expect(store.parentDimensions).toEqual({
      width: 10,
      height: 20,
      top: 5,
      left: 15,
    });
    expect(computeChart).not.toBeCalled();

    store.updateParentDimensions(15, 25, 10, 20);
    expect(store.parentDimensions).toEqual({
      width: 15,
      height: 25,
      top: 10,
      left: 20,
    });
    expect(computeChart).toBeCalled();
  });

  test('can remove a series spec', () => {
    store.addSeriesSpec(spec);
    store.removeSeriesSpec(SPEC_ID);
    expect(store.seriesSpecs.get(SPEC_ID)).toBe(undefined);
  });

  test('can remove an axis spec', () => {
    const axisSpec: AxisSpec = {
      id: AXIS_ID,
      groupId: GROUP_ID,
      hide: false,
      showOverlappingTicks: false,
      showOverlappingLabels: false,
      position: Position.Left,
      tickSize: 30,
      tickPadding: 10,
      tickFormat: (value: any) => `value ${value}`,
    };

    store.addAxisSpec(axisSpec);
    store.removeAxisSpec(AXIS_ID);
    expect(store.axesSpecs.get(AXIS_ID)).toBe(undefined);
  });

  test('only computes chart if parent dimensions are computed', () => {
    const localStore = new ChartStore();

    localStore.parentDimensions = {
      width: 0,
      height: 0,
      top: 0,
      left: 0,
    };

    localStore.computeChart();
    expect(localStore.initialized.get()).toBe(false);
  });

  test('only computes chart if series specs exist', () => {
    const localStore = new ChartStore();

    localStore.parentDimensions = {
      width: 100,
      height: 100,
      top: 0,
      left: 0,
    };

    localStore.seriesSpecs = new Map();
    localStore.computeChart();
    expect(localStore.initialized.get()).toBe(false);
  });

  test('can set the color for a series', () => {
    const computeChart = jest.fn(
      (): void => {
        return;
      },
    );
    store.computeChart = computeChart;
    store.legendItems = new Map([
      [firstLegendItem.key, firstLegendItem],
      [secondLegendItem.key, secondLegendItem],
    ]);

    store.setSeriesColor('other', 'foo');
    expect(computeChart).not.toBeCalled();
    expect(store.customSeriesColors).toEqual(new Map());

    store.setSeriesColor(firstLegendItem.key, 'foo');
    expect(computeChart).toBeCalled();
    expect(store.seriesSpecs.get(firstLegendItem.value.specId)).toBeUndefined();

    store.addSeriesSpec(spec);
    store.setSeriesColor(firstLegendItem.key, 'foo');
    const expectedSpecCustomColorSeries = new Map();
    expectedSpecCustomColorSeries.set(firstLegendItem.value, 'foo');
    expect(spec.customSeriesColors).toEqual(expectedSpecCustomColorSeries);

    store.setSeriesColor(secondLegendItem.key, 'bar');
    expectedSpecCustomColorSeries.set(secondLegendItem.value, 'bar');
    expect(spec.customSeriesColors).toEqual(expectedSpecCustomColorSeries);
  });

  test('can reset selectedDataSeries', () => {
    store.deselectedDataSeries = [firstLegendItem.value];
    store.resetDeselectedDataSeries();
    expect(store.deselectedDataSeries).toBe(null);
  });
  test('can update the crosshair visibility', () => {
    store.cursorPosition.x = -1;
    store.cursorPosition.y = 1;
    store.tooltipType.set(TooltipType.Crosshairs);
    expect(store.isCrosshairVisible.get()).toBe(false);

    store.cursorPosition.x = 1;
    store.cursorPosition.x = -1;
    store.tooltipType.set(TooltipType.Crosshairs);
    expect(store.isCrosshairVisible.get()).toBe(false);

    store.cursorPosition.x = 1;
    store.cursorPosition.x = 1;
    store.tooltipType.set(TooltipType.None);
    expect(store.isCrosshairVisible.get()).toBe(false);

    store.cursorPosition.x = 1;
    store.cursorPosition.x = 1;
    store.tooltipType.set(TooltipType.Crosshairs);
    expect(store.isCrosshairVisible.get()).toBe(true);
  });

  test('can update the tooltip visibility', () => {
    const tooltipValue: TooltipValue = {
      name: 'a',
      value: 'a',
      color: 'a',
      isHighlighted: false,
      isXValue: false,
    };
    store.cursorPosition.x = -1;
    store.cursorPosition.y = 1;
    store.tooltipType.set(TooltipType.Crosshairs);
    store.tooltipData.replace([tooltipValue]);
    expect(store.isTooltipVisible.get()).toBe(false);

    store.cursorPosition.x = 1;
    store.cursorPosition.x = -1;
    store.tooltipType.set(TooltipType.Crosshairs);
    store.tooltipData.replace([tooltipValue]);
    expect(store.isTooltipVisible.get()).toBe(false);

    store.cursorPosition.x = 1;
    store.cursorPosition.x = 1;
    store.tooltipType.set(TooltipType.None);
    store.tooltipData.replace([tooltipValue]);
    expect(store.isTooltipVisible.get()).toBe(false);

    store.cursorPosition.x = 1;
    store.cursorPosition.x = 1;
    store.tooltipType.set(TooltipType.Crosshairs);
    store.tooltipData.replace([]);
    expect(store.isTooltipVisible.get()).toBe(false);

    store.cursorPosition.x = 1;
    store.cursorPosition.x = 1;
    store.tooltipType.set(TooltipType.Crosshairs);
    store.tooltipData.replace([tooltipValue]);
    expect(store.isTooltipVisible.get()).toBe(true);
  });

  test('can disable brush based on scale and listener', () => {
    store.xScale = undefined;
    expect(store.isBrushEnabled()).toBe(false);
    store.xScale = new ScaleContinuous([0, 100], [0, 100], ScaleType.Linear);
    store.onBrushEndListener = undefined;
    expect(store.isBrushEnabled()).toBe(false);
    store.setOnBrushEndListener(() => ({}));
    expect(store.isBrushEnabled()).toBe(true);
    store.xScale = new ScaleBand([0, 100], [0, 100]);
    expect(store.isBrushEnabled()).toBe(false);
  });

  test('can disable tooltip on brushing', () => {
    const tooltipValue: TooltipValue = {
      name: 'a',
      value: 'a',
      color: 'a',
      isHighlighted: false,
      isXValue: false,
    };
    store.xScale = new ScaleContinuous([0, 100], [0, 100], ScaleType.Linear);
    store.cursorPosition.x = 1;
    store.cursorPosition.x = 1;
    store.tooltipType.set(TooltipType.Crosshairs);
    store.tooltipData.replace([tooltipValue]);
    store.onBrushStart();
    expect(store.isBrushing.get()).toBe(true);
    expect(store.isTooltipVisible.get()).toBe(false);

    store.cursorPosition.x = 1;
    store.cursorPosition.x = 1;
    store.tooltipType.set(TooltipType.Crosshairs);
    store.tooltipData.replace([tooltipValue]);
    store.onBrushEnd({ x: 0, y: 0 }, { x: 1, y: 1 });
    expect(store.isBrushing.get()).toBe(false);
    expect(store.isTooltipVisible.get()).toBe(true);
  });
  test('handle click on chart', () => {
    const geom1: IndexedGeometry = {
      color: 'red',
      specId: getSpecId('specId1'),
      datum: [0, 1, 2],
      geom: {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      },
      seriesKey: [2],
    };
    const geom2: IndexedGeometry = {
      color: 'blue',
      specId: getSpecId('specId2'),
      datum: [0, 3, 2],
      geom: {
        x: 50,
        y: 0,
        width: 0,
        height: 0,
      },
      seriesKey: [2],
    };
    const clickListener = jest.fn(
      (ds: GeometryValue[]): void => {
        return;
      },
    );
    store.setOnElementClickListener(clickListener);

    store.highlightedGeometries.replace([]);
    store.handleChartClick();
    expect(clickListener).toBeCalledTimes(0);

    store.highlightedGeometries.replace([geom1]);
    store.handleChartClick();
    expect(clickListener).toBeCalledTimes(1);
    expect(clickListener.mock.calls[0][0]).toEqual([geom1]);

    store.highlightedGeometries.replace([geom1, geom2]);
    store.handleChartClick();
    expect(clickListener).toBeCalledTimes(2);
    expect(clickListener.mock.calls[1][0]).toEqual([geom1, geom2]);
  });
});
