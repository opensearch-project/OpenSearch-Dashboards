import { GeometryValue } from '../lib/series/rendering';
import { DataSeriesColorsValues } from '../lib/series/series';
import { AxisSpec, BarSeriesSpec, Position } from '../lib/series/specs';
import { getAxisId, getGroupId, getSpecId } from '../lib/utils/ids';
import { ScaleType } from '../lib/utils/scales/scales';
import { ChartStore, TooltipData } from './chart_state';

describe('Chart Store', () => {
  const mockedRect = {
    x: 0,
    y: 0,
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    width: 10,
    height: 12,
    toJSON: () => '',
  };
  const originalGetBBox = SVGElement.prototype.getBBox;
  beforeEach(
    () =>
      (SVGElement.prototype.getBBox = () => {
        return mockedRect;
      }),
  );
  afterEach(() => (SVGElement.prototype.getBBox = originalGetBBox));

  const store = new ChartStore();

  const SPEC_ID = getSpecId('spec_1');
  const AXIS_ID = getAxisId('axis_1');
  const GROUP_ID = getGroupId('group_1');

  const spec: BarSeriesSpec = {
    id: SPEC_ID,
    groupId: GROUP_ID,
    seriesType: 'bar',
    yScaleToDataExtent: false,
    data: [{ x: 1, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 3 }],
    xAccessor: 'x',
    yAccessors: ['y'],
    xScaleType: ScaleType.Linear,
    yScaleType: ScaleType.Linear,
  };

  const firstLegendItem = {
    color: 'foo', label: 'bar', value: {
      specId: SPEC_ID,
      colorValues: [],
    },
  };

  const secondLegendItem = {
    color: 'baz', label: 'qux', value: {
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

  test('can initialize selectedDataSeries depending on previous state', () => {
    const selectedDataSeries = [{ specId: SPEC_ID, colorValues: [] }];

    store.selectedDataSeries = null;
    store.computeChart();
    expect(store.selectedDataSeries).toEqual(selectedDataSeries);

    store.selectedDataSeries = selectedDataSeries;
    store.specsInitialized.set(true);
    store.computeChart();
    expect(store.selectedDataSeries).toEqual(selectedDataSeries);
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

  test('can respond to chart element mouseover event', () => {
    const tooltipPosition = {
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    };

    const tooltipDatum = {
      x: 0,
      y: 0,
    };

    const tooltipData: TooltipData = {
      value: {
        datum: tooltipDatum,
        seriesKey: [],
        specId: SPEC_ID,
      },
      position: tooltipPosition,
    };

    const tooltipDataInvalidSpecId: TooltipData = {
      value: {
        datum: tooltipDatum,
        seriesKey: [],
        specId: getSpecId(''),
      },
      position: tooltipPosition,
    };

    const elementListener = jest.fn((value: GeometryValue): void => { return; });

    store.onOverElement(tooltipDataInvalidSpecId);
    expect(store.tooltipData.get()).toEqual(null);
    expect(store.showTooltip.get()).toBe(false);

    store.setOnElementOverListener(elementListener);
    store.addSeriesSpec(spec);
    store.onOverElement(tooltipData);
    expect(store.tooltipData.get()).toEqual([['Value', 'value 0'], ['X Value', 0]]);
    expect(store.showTooltip.get()).toBe(true);
    expect(elementListener).toBeCalled();
  });

  test('can respond to chart element mouseout event', () => {
    const outListener = jest.fn((): undefined => undefined);

    store.showTooltip.set(true);

    store.onOutElement();
    expect(store.showTooltip.get()).toBe(false);

    store.setOnElementOutListener(outListener);

    store.onOutElement();
    expect(outListener).toBeCalled();
  });

  test('can set tooltip position', () => {
    const position = { x: 10, y: 20 };
    store.setTooltipPosition(position.x, position.y);

    expect(store.tooltipPosition.get()).toEqual(position);
  });

  test('can set legend visibility', () => {
    store.showLegend.set(false);
    store.setShowLegend(true);

    expect(store.showLegend.get()).toEqual(true);
  });

  test('can get highlighted legend item', () => {
    store.legendItems = [firstLegendItem, secondLegendItem];

    store.highlightedLegendItemIndex.set(null);
    expect(store.highlightedLegendItem.get()).toBe(null);

    store.highlightedLegendItemIndex.set(1);
    expect(store.highlightedLegendItem.get()).toEqual(secondLegendItem);
  });

  test('can respond to legend item mouseover event', () => {
    const legendListener = jest.fn((ds: DataSeriesColorsValues | null): void => { return; });

    store.legendItems = [firstLegendItem, secondLegendItem];
    store.highlightedLegendItemIndex.set(null);

    store.onLegendItemOver(0);
    expect(store.highlightedLegendItemIndex.get()).toBe(0);

    store.setOnLegendItemOverListener(legendListener);
    store.onLegendItemOver(1);
    expect(legendListener).toBeCalledWith(secondLegendItem.value);

    store.onLegendItemOver(-1);
    expect(legendListener).toBeCalledWith(null);

    store.onLegendItemOver(3);
    expect(legendListener).toBeCalledWith(null);
  });

  test('can respond to legend item mouseout event', () => {
    const outListener = jest.fn((): undefined => undefined);

    store.highlightedLegendItemIndex.set(0);

    store.setOnLegendItemOutListener(outListener);

    store.onLegendItemOut();
    expect(store.highlightedLegendItemIndex.get()).toBe(null);
    expect(outListener).toBeCalled();

    store.removeOnLegendItemOutListener();
    store.onLegendItemOut();

    expect(outListener.mock.calls.length).toBe(1);
  });

  test('can respond to legend item click event', () => {
    const legendListener = jest.fn((ds: DataSeriesColorsValues | null): void => { return; });

    store.legendItems = [firstLegendItem, secondLegendItem];
    store.selectedLegendItemIndex.set(null);
    store.onLegendItemClickListener = undefined;

    store.onLegendItemClick(0);
    expect(store.selectedLegendItemIndex.get()).toBe(0);
    expect(legendListener).not.toBeCalled();

    store.setOnLegendItemClickListener(legendListener);
    store.onLegendItemClick(0);
    expect(store.selectedLegendItemIndex.get()).toBe(null);
    expect(legendListener).toBeCalledWith(null);

    store.setOnLegendItemClickListener(legendListener);
    store.onLegendItemClick(1);
    expect(store.selectedLegendItemIndex.get()).toBe(1);
    expect(legendListener).toBeCalledWith(secondLegendItem.value);
  });

  test('can respond to a legend item plus click event', () => {
    const legendListener = jest.fn((ds: DataSeriesColorsValues | null): void => { return; });

    store.legendItems = [firstLegendItem, secondLegendItem];
    store.selectedLegendItemIndex.set(null);
    store.onLegendItemPlusClickListener = undefined;

    store.onLegendItemPlusClick();
    expect(legendListener).not.toBeCalled();

    store.setOnLegendItemPlusClickListener(legendListener);
    store.onLegendItemPlusClick();
    expect(legendListener).toBeCalledWith(null);

    store.selectedLegendItemIndex.set(0);
    store.onLegendItemPlusClick();
    expect(legendListener).toBeCalledWith(firstLegendItem.value);
  });

  test('can respond to a legend item minus click event', () => {
    const legendListener = jest.fn((ds: DataSeriesColorsValues | null): void => { return; });

    store.legendItems = [firstLegendItem, secondLegendItem];
    store.selectedLegendItemIndex.set(null);
    store.onLegendItemMinusClickListener = undefined;

    store.onLegendItemMinusClick();
    expect(legendListener).not.toBeCalled();

    store.setOnLegendItemMinusClickListener(legendListener);
    store.onLegendItemMinusClick();
    expect(legendListener).toBeCalledWith(null);

    store.selectedLegendItemIndex.set(0);
    store.onLegendItemMinusClick();
    expect(legendListener).toBeCalledWith(firstLegendItem.value);
  });

  test('can toggle series visibility', () => {
    const computeChart = jest.fn((): void => { return; });

    store.legendItems = [firstLegendItem, secondLegendItem];
    store.selectedDataSeries = null;
    store.computeChart = computeChart;

    store.toggleSeriesVisibility(3);
    expect(store.selectedDataSeries).toEqual(null);
    expect(computeChart).not.toBeCalled();

    store.selectedDataSeries = [firstLegendItem.value, secondLegendItem.value];
    store.toggleSeriesVisibility(0);
    expect(store.selectedDataSeries).toEqual([secondLegendItem.value]);
    expect(computeChart).toBeCalled();

    store.selectedDataSeries = [firstLegendItem.value];
    store.toggleSeriesVisibility(0);
    expect(store.selectedDataSeries).toEqual([]);
  });

  test('can toggle single series visibility', () => {
    const computeChart = jest.fn((): void => { return; });

    store.legendItems = [firstLegendItem, secondLegendItem];
    store.selectedDataSeries = null;
    store.computeChart = computeChart;

    store.toggleSingleSeries(3);
    expect(store.selectedDataSeries).toEqual(null);
    expect(computeChart).not.toBeCalled();

    store.toggleSingleSeries(0);
    expect(store.selectedDataSeries).toEqual([firstLegendItem.value]);

    store.toggleSingleSeries(0);
    expect(store.selectedDataSeries).toEqual([secondLegendItem.value]);
  });

  test('can set an element click listener', () => {
    const clickListener = (value: GeometryValue): void => { return; };
    store.setOnElementClickListener(clickListener);

    expect(store.onElementClickListener).toEqual(clickListener);
  });

  test('can set a brush end listener', () => {
    const brushEndListener = (min: number, max: number): void => { return; };
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
    const brushEndListener = jest.fn((min: number, max: number): void => { return; });

    const start = { x: 0, y: 0 };
    const end1 = { x: 100, y: 0 };
    const end2 = { x: -100, y: 0 };
    store.chartDimensions.left = 10;

    store.onBrushEndListener = undefined;
    store.onBrushEnd(start, end1);
    expect(brushEndListener).not.toBeCalled();

    store.setOnBrushEndListener(brushEndListener);

    store.onBrushEnd(start, start);
    expect(brushEndListener).not.toBeCalled();

    store.onBrushEnd(start, end1);
    expect(brushEndListener.mock.calls[0][0]).toEqual(0.9426386233269598);
    expect(brushEndListener.mock.calls[0][1]).toEqual(1.5162523900573615);

    store.onBrushEnd(start, end2);
    expect(brushEndListener.mock.calls[1][0]).toEqual(0.36902485659655826);
    expect(brushEndListener.mock.calls[1][1]).toEqual(0.9426386233269598);
  });

  test('can determine if brush is enabled', () => {
    expect(store.isBrushEnabled()).toBe(true);

    store.xScale = undefined;
    expect(store.isBrushEnabled()).toBe(false);
  });

  test('can update parent dimensions', () => {
    const computeChart = jest.fn((): void => { return; });
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
    const computeChart = jest.fn((): void => { return; });
    store.computeChart = computeChart;
    store.legendItems = [firstLegendItem, secondLegendItem];

    const expectedCustomColors = new Map();
    expectedCustomColors.set(firstLegendItem.label, 'foo');

    store.setSeriesColor(-1, 'foo');
    expect(computeChart).not.toBeCalled();
    expect(store.customSeriesColors).toEqual(new Map());

    store.setSeriesColor(0, 'foo');
    expect(computeChart).toBeCalled();
    expect(store.customSeriesColors).toEqual(expectedCustomColors);
  });

  test('can reset selectedDataSeries', () => {
    store.selectedDataSeries = [firstLegendItem.value];
    store.resetSelectedDataSeries();
    expect(store.selectedDataSeries).toBe(null);
  });
});
