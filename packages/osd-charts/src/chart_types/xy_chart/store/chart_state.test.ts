import { LegendItem } from '../legend/legend';
import { GeometryValue, IndexedGeometry } from '../rendering/rendering';
import {
  AnnotationDomainTypes,
  AnnotationSpec,
  AnnotationTypes,
  AxisSpec,
  BarSeriesSpec,
  Position,
  RectAnnotationSpec,
} from '../utils/specs';
import { LIGHT_THEME } from '../../../utils/themes/light_theme';
import { mergeWithDefaultTheme } from '../../../utils/themes/theme';
import { getAnnotationId, getAxisId, getGroupId, getSpecId } from '../../../utils/ids';
import { TooltipType, TooltipValue } from '../utils/interactions';
import { ScaleBand } from '../../../utils/scales/scale_band';
import { ScaleContinuous } from '../../../utils/scales/scale_continuous';
import { ScaleType } from '../../../utils/scales/scales';
import { ChartStore } from './chart_state';

describe('Chart Store', () => {
  let store = new ChartStore();

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
    hideInLegend: false,
  };

  const firstLegendItem: LegendItem = {
    key: 'color1',
    color: 'foo',
    label: 'bar',
    value: {
      specId: SPEC_ID,
      colorValues: [],
    },
    displayValue: {
      raw: 'last',
      formatted: 'formatted-last',
    },
  };

  const secondLegendItem: LegendItem = {
    key: 'color2',
    color: 'baz',
    label: 'qux',
    value: {
      specId: SPEC_ID,
      colorValues: [],
    },
    displayValue: {
      raw: 'last',
      formatted: 'formatted-last',
    },
  };
  beforeEach(() => {
    store = new ChartStore();
    store.updateParentDimensions(600, 600, 0, 0);
    store.computeChart();
  });

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
    store.addSeriesSpec(spec);
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
    store.legendItems = new Map([[firstLegendItem.key, firstLegendItem], [secondLegendItem.key, secondLegendItem]]);

    store.highlightedLegendItemKey.set(null);
    expect(store.highlightedLegendItem.get()).toBe(null);

    store.highlightedLegendItemKey.set(secondLegendItem.key);
    expect(store.highlightedLegendItem.get()).toEqual(secondLegendItem);
  });

  test('can respond to legend item mouseover event', () => {
    const legendListener = jest.fn(
      (): void => {
        return;
      },
    );

    store.legendItems = new Map([[firstLegendItem.key, firstLegendItem], [secondLegendItem.key, secondLegendItem]]);
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
      (): void => {
        return;
      },
    );

    store.legendItems = new Map([[firstLegendItem.key, firstLegendItem], [secondLegendItem.key, secondLegendItem]]);
    store.selectedLegendItemKey.set(null);
    store.onLegendItemClickListener = undefined;

    store.onLegendItemClick(firstLegendItem.key);
    // TODO reenable this after re-configuring onLegendItemClick
    // expect(store.selectedLegendItemKey.get()).toBe(firstLegendItem.key);
    expect(legendListener).not.toBeCalled();

    store.setOnLegendItemClickListener(legendListener);
    store.onLegendItemClick(firstLegendItem.key);
    // TODO reenable this after re-configuring onLegendItemClick
    // expect(store.selectedLegendItemKey.get()).toBe(null);
    // expect(legendListener).toBeCalledWith(null);

    // store.setOnLegendItemClickListener(legendListener);
    // store.onLegendItemClick(secondLegendItem.key);
    // expect(store.selectedLegendItemKey.get()).toBe(secondLegendItem.key);
    expect(legendListener).toBeCalledWith(secondLegendItem.value);
  });

  test('can respond to a legend item plus click event', () => {
    const legendListener = jest.fn(
      (): void => {
        return;
      },
    );

    store.legendItems = new Map([[firstLegendItem.key, firstLegendItem], [secondLegendItem.key, secondLegendItem]]);
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
      (): void => {
        return;
      },
    );

    store.legendItems = new Map([[firstLegendItem.key, firstLegendItem], [secondLegendItem.key, secondLegendItem]]);
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

    store.legendItems = new Map([[firstLegendItem.key, firstLegendItem], [secondLegendItem.key, secondLegendItem]]);
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

    store.legendItems = new Map([[firstLegendItem.key, firstLegendItem], [secondLegendItem.key, secondLegendItem]]);
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
    const clickListener = (): void => {
      return;
    };
    store.setOnElementClickListener(clickListener);

    expect(store.onElementClickListener).toEqual(clickListener);
  });

  test('can set a brush end listener', () => {
    const brushEndListener = (): void => {
      return;
    };
    store.setOnBrushEndListener(brushEndListener);

    expect(store.onBrushEndListener).toEqual(brushEndListener);
  });

  test('can set a cursor hover listener', () => {
    const listener = (): void => {
      return;
    };
    store.setOnCursorUpdateListener(listener);

    expect(store.onCursorUpdateListener).toEqual(listener);
  });

  test('can remove listeners', () => {
    store.removeElementClickListener();
    expect(store.onElementClickListener).toBeUndefined();

    store.removeElementOverListener();
    expect(store.onElementOverListener).toBeUndefined();

    store.removeElementOutListener();
    expect(store.onElementOutListener).toBeUndefined();

    store.removeOnLegendItemOverListener();
    expect(store.onLegendItemOverListener).toBeUndefined();

    store.removeOnLegendItemPlusClickListener();
    expect(store.onLegendItemPlusClickListener).toBeUndefined();

    store.removeOnLegendItemMinusClickListener();
    expect(store.onLegendItemMinusClickListener).toBeUndefined();

    store.removeOnCursorUpdateListener();
    expect(store.onCursorUpdateListener).toBeUndefined();
  });

  test('can respond to a brush end event', () => {
    const brushEndListener = jest.fn<void, [number, number]>(
      (): void => {
        return;
      },
    );

    const start1 = { x: 0, y: 0 };
    const start2 = { x: 100, y: 0 };
    const end1 = { x: 600, y: 0 };
    const end2 = { x: 300, y: 0 };
    store.chartTheme = mergeWithDefaultTheme(
      {
        chartMargins: {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
        },
      },
      LIGHT_THEME,
    );
    store.addSeriesSpec(spec);
    store.computeChart();
    store.onBrushEndListener = undefined;
    store.onBrushStart();
    expect(store.isBrushing.get()).toBe(false);
    store.onBrushEnd(start1, end1);
    expect(brushEndListener).not.toBeCalled();

    store.setOnBrushEndListener(brushEndListener);
    store.onBrushStart();
    expect(store.isBrushing.get()).toBe(true);
    store.onBrushEnd(start1, start1);
    expect(brushEndListener).not.toBeCalled();

    store.onBrushEnd(start1, end1);
    expect(brushEndListener.mock.calls[0][0]).toBe(1);
    expect(brushEndListener.mock.calls[0][1]).toBe(4);

    store.onBrushEnd(start2, end2);
    expect(brushEndListener.mock.calls[1][0]).toBe(1.5);
    expect(brushEndListener.mock.calls[1][1]).toBe(2.5);
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

  test('can add and remove an annotation spec', () => {
    const annotationId = getAnnotationId('annotation');
    const groupId = getGroupId('group');

    const customStyle = {
      line: {
        strokeWidth: 30,
        stroke: '#f00000',
        opacity: 0.32,
      },
      details: {
        fontSize: 90,
        fontFamily: 'custom-font',
        fontStyle: 'custom-style',
        fill: 'custom-color',
        padding: 20,
      },
    };

    const lineAnnotation: AnnotationSpec = {
      annotationType: 'line',
      annotationId,
      domainType: AnnotationDomainTypes.YDomain,
      dataValues: [{ dataValue: 2, details: 'foo' }],
      groupId,
      style: customStyle,
    };

    store.addAnnotationSpec(lineAnnotation);

    const expectedAnnotationSpecs = new Map();
    expectedAnnotationSpecs.set(annotationId, lineAnnotation);

    expect(store.annotationSpecs).toEqual(expectedAnnotationSpecs);

    store.removeAnnotationSpec(annotationId);
    expect(store.annotationSpecs).toEqual(new Map());

    const rectAnnotation: RectAnnotationSpec = {
      annotationId: getAnnotationId('rect'),
      groupId: GROUP_ID,
      annotationType: 'rectangle',
      dataValues: [{ coordinates: { x0: 1, x1: 2, y0: 3, y1: 5 } }],
    };
    store.addAnnotationSpec(rectAnnotation);
    expectedAnnotationSpecs.clear();
    expectedAnnotationSpecs.set(rectAnnotation.annotationId, rectAnnotation);
    expect(store.annotationSpecs).toEqual(expectedAnnotationSpecs);
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
    store.legendItems = new Map([[firstLegendItem.key, firstLegendItem], [secondLegendItem.key, secondLegendItem]]);

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
      seriesKey: 'a',
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

  describe('can use a custom tooltip header formatter', () => {
    jest.unmock('../crosshair/crosshair_utils');
    jest.resetModules();

    beforeEach(() => {
      const axisSpec: AxisSpec = {
        id: AXIS_ID,
        groupId: spec.groupId,
        hide: true,
        showOverlappingTicks: false,
        showOverlappingLabels: false,
        position: Position.Bottom,
        tickSize: 30,
        tickPadding: 10,
        tickFormat: (value: any) => `foo ${value}`,
      };

      store.addAxisSpec(axisSpec);
      store.addSeriesSpec(spec);
      store.tooltipType.set(TooltipType.Crosshairs);
      store.computeChart();
    });

    test('with no tooltipHeaderFormatter defined, should return value formatted using xAxis tickFormatter', () => {
      store.tooltipHeaderFormatter = undefined;
      store.setCursorPosition(10, 10);
      expect(store.tooltipData[0].value).toBe('foo 1');
    });

    test('with tooltipHeaderFormatter defined, should return value formatted', () => {
      store.tooltipHeaderFormatter = (value: TooltipValue) => `${value}`;
      store.setCursorPosition(10, 10);
      expect(store.tooltipData[0].value).toBe(1);
    });

    test('should update cursor postion with hover event', () => {
      const legendListener = jest.fn(
        (): void => {
          return;
        },
      );

      store.legendItems = new Map([[firstLegendItem.key, firstLegendItem], [secondLegendItem.key, secondLegendItem]]);
      store.selectedLegendItemKey.set(null);
      store.onCursorUpdateListener = undefined;

      store.setCursorPosition(1, 1);
      expect(legendListener).not.toBeCalled();

      store.setOnCursorUpdateListener(legendListener);
      store.setCursorPosition(1, 1);
      expect(legendListener).toBeCalled();
    });
  });

  test('can disable brush based on scale and listener', () => {
    store.xScale = undefined;
    expect(store.isBrushEnabled()).toBe(false);
    store.xScale = new ScaleContinuous(ScaleType.Linear, [0, 100], [0, 100]);
    store.onBrushEndListener = undefined;
    expect(store.isBrushEnabled()).toBe(false);
    store.setOnBrushEndListener(() => ({}));
    expect(store.isBrushEnabled()).toBe(true);
    store.xScale = new ScaleBand([0, 100], [0, 100]);
    expect(store.isBrushEnabled()).toBe(false);
  });

  test('can disable tooltip on brushing', () => {
    store.addSeriesSpec(spec);
    store.setOnBrushEndListener(() => ({}));
    const tooltipValue: TooltipValue = {
      name: 'a',
      value: 'a',
      color: 'a',
      isHighlighted: false,
      isXValue: false,
      seriesKey: 'a',
    };
    store.xScale = new ScaleContinuous(ScaleType.Linear, [0, 100], [0, 100]);
    store.cursorPosition.x = 1;
    store.cursorPosition.y = 1;
    store.tooltipType.set(TooltipType.Crosshairs);
    store.tooltipData.replace([tooltipValue]);
    store.onBrushStart();
    expect(store.isBrushing.get()).toBe(true);
    expect(store.isTooltipVisible.get()).toBe(false);

    store.cursorPosition.x = 1;
    store.cursorPosition.y = 1;
    store.tooltipType.set(TooltipType.Crosshairs);
    store.tooltipData.replace([tooltipValue]);
    store.onBrushEnd({ x: 0, y: 0 }, { x: 1, y: 1 });
    expect(store.isBrushing.get()).toBe(false);
    expect(store.isTooltipVisible.get()).toBe(true);
  });
  test('handle click on chart', () => {
    const barStyle = {
      rect: {
        opacity: 1,
      },
      rectBorder: {
        strokeWidth: 1,
        visible: false,
      },
      displayValue: {
        fill: 'black',
        fontFamily: '',
        fontSize: 2,
        offsetX: 0,
        offsetY: 0,
        padding: 2,
      },
    };
    const geom1: IndexedGeometry = {
      color: 'red',
      geometryId: {
        specId: getSpecId('specId1'),
        seriesKey: [2],
      },
      value: {
        x: 0,
        y: 1,
        accessor: 'y1',
      },
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      seriesStyle: barStyle,
    };
    const geom2: IndexedGeometry = {
      color: 'blue',
      geometryId: {
        specId: getSpecId('specId2'),
        seriesKey: [2],
      },
      value: {
        x: 0,
        y: 3,
        accessor: 'y1',
      },
      x: 50,
      y: 0,
      width: 0,
      height: 0,
      seriesStyle: barStyle,
    };
    const clickListener = jest.fn<void, [GeometryValue[]]>(
      (): void => {
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
    expect(clickListener.mock.calls[0][0]).toEqual([geom1.value]);

    store.highlightedGeometries.replace([geom1, geom2]);
    store.handleChartClick();
    expect(clickListener).toBeCalledTimes(2);
    expect(clickListener.mock.calls[1][0]).toEqual([geom1.value, geom2.value]);
  });
  test('can compute annotation tooltip state', () => {
    const scale = new ScaleContinuous(ScaleType.Linear, [0, 100], [0, 100]);

    store.rawCursorPosition.x = -1;
    store.rawCursorPosition.y = 0;

    expect(store.annotationTooltipState.get()).toBe(null);

    store.xScale = undefined;
    expect(store.annotationTooltipState.get()).toBe(null);

    store.xScale = scale;

    store.yScales = undefined;
    expect(store.annotationTooltipState.get()).toBe(null);

    store.yScales = new Map();
    store.yScales.set(GROUP_ID, scale);

    store.rawCursorPosition.x = 0;
    expect(store.annotationTooltipState.get()).toBe(null);

    // If there's a rect annotation & there's also a highlight chart element tooltip, ignore annotation tooltip
    store.rawCursorPosition.x = 18;
    store.rawCursorPosition.y = 9;
    store.chartDimensions = { width: 10, height: 20, top: 5, left: 15 };

    const annotationDimensions = [{ rect: { x: 2, y: 3, width: 3, height: 5 } }];
    const rectAnnotationSpec: RectAnnotationSpec = {
      annotationId: getAnnotationId('rect'),
      groupId: GROUP_ID,
      annotationType: 'rectangle',
      dataValues: [{ coordinates: { x0: 1, x1: 2, y0: 3, y1: 5 } }],
    };

    store.annotationSpecs.set(rectAnnotationSpec.annotationId, rectAnnotationSpec);
    store.annotationDimensions.set(rectAnnotationSpec.annotationId, annotationDimensions);

    const highlightedTooltipValue = {
      name: 'foo',
      value: 1,
      color: 'color',
      isHighlighted: true,
      isXValue: false,
      seriesKey: 'foo',
    };
    const unhighlightedTooltipValue = {
      name: 'foo',
      value: 1,
      color: 'color',
      isHighlighted: false,
      isXValue: false,
      seriesKey: 'foo',
    };

    const expectedRectTooltipState = {
      isVisible: true,
      transform: 'translate(0, 0)',
      annotationType: AnnotationTypes.Rectangle,
      top: 4,
      left: 5,
    };
    store.tooltipData.push(unhighlightedTooltipValue);
    expect(store.annotationTooltipState.get()).toEqual(expectedRectTooltipState);

    store.tooltipData.push(highlightedTooltipValue);
    expect(store.annotationTooltipState.get()).toBe(null);
  });
  test('can get tooltipValues by seriesKeys', () => {
    store.tooltipData.clear();

    expect(store.legendItemTooltipValues.get()).toEqual(new Map());

    const headerValue: TooltipValue = {
      name: 'header',
      value: 'foo',
      color: 'a',
      isHighlighted: false,
      isXValue: true,
      seriesKey: 'headerSeries',
    };

    store.tooltipData.replace([headerValue]);
    expect(store.legendItemTooltipValues.get()).toEqual(new Map());

    const tooltipValue: TooltipValue = {
      name: 'a',
      value: 123,
      color: 'a',
      isHighlighted: false,
      isXValue: false,
      seriesKey: 'seriesKey',
    };
    store.tooltipData.replace([headerValue, tooltipValue]);

    const expectedTooltipValues = new Map();
    expectedTooltipValues.set('seriesKey', 123);
    expect(store.legendItemTooltipValues.get()).toEqual(expectedTooltipValues);
  });
  describe('can determine if crosshair cursor is visible', () => {
    const brushEndListener = (): void => {
      return;
    };

    beforeEach(() => {
      store.xScale = new ScaleContinuous(ScaleType.Linear, [0, 100], [0, 100]);
    });

    test('when cursor is outside of chart bounds', () => {
      store.cursorPosition.x = -1;
      store.cursorPosition.y = -1;
      store.onBrushEndListener = brushEndListener;
      expect(store.isCrosshairCursorVisible.get()).toBe(false);
    });

    test('when cursor is within chart bounds and brush enabled', () => {
      store.cursorPosition.x = 10;
      store.cursorPosition.y = 10;
      store.onBrushEndListener = brushEndListener;
      expect(store.isCrosshairCursorVisible.get()).toBe(true);
    });

    test('when cursor is within chart bounds and brush disabled', () => {
      store.cursorPosition.x = 10;
      store.cursorPosition.y = 10;
      store.onBrushEndListener = undefined;
      expect(store.isCrosshairCursorVisible.get()).toBe(false);
    });
  });
  test('should set tooltip type to follow when single value x scale', () => {
    const singleValueSpec: BarSeriesSpec = {
      id: SPEC_ID,
      groupId: GROUP_ID,
      seriesType: 'bar',
      yScaleToDataExtent: false,
      data: [{ x: 1, y: 1, g: 0 }],
      xAccessor: 'x',
      yAccessors: ['y'],
      xScaleType: ScaleType.Linear,
      yScaleType: ScaleType.Linear,
      hideInLegend: false,
    };

    store.addSeriesSpec(singleValueSpec);
    store.computeChart();
    expect(store.tooltipType.get()).toBe(TooltipType.Follow);
  });

  describe('isActiveChart', () => {
    it('should return true if no activeChartId is defined', () => {
      store.activeChartId = undefined;
      expect(store.isActiveChart.get()).toBe(true);
    });

    it('should return true if activeChartId is defined and matches chart id', () => {
      store.activeChartId = store.id;
      expect(store.isActiveChart.get()).toBe(true);
    });

    it('should return false if activeChartId is defined and does NOT match chart id', () => {
      store.activeChartId = '123';
      expect(store.isActiveChart.get()).toBe(false);
    });
  });

  describe('setActiveChartId', () => {
    it('should set activeChartId with value', () => {
      store.activeChartId = undefined;
      store.setActiveChartId('test-id');
      expect(store.activeChartId).toBe('test-id');
    });

    it('should set activeChartId to undefined if no value', () => {
      store.activeChartId = 'test';
      store.setActiveChartId();
      expect(store.activeChartId).toBeUndefined();
    });
  });

  describe('setCursorValue', () => {
    const getPosition = jest.fn();
    // TODO: fix mocking implementation
    jest.doMock('../crosshair/crosshair_utils', () => ({
      getPosition,
    }));

    const scale = new ScaleContinuous(ScaleType.Linear, [0, 100], [0, 100]);
    beforeEach(() => {
      // @ts-ignore
      store.setCursorPosition = jest.fn();
    });

    it('should not call setCursorPosition if xScale is not defined', () => {
      store.xScale = undefined;
      store.setCursorValue(1);
      expect(store.setCursorPosition).not.toBeCalled();
    });

    it.skip('should call getPosition with args', () => {
      (getPosition as jest.Mock).mockReturnValue(undefined);
      store.xScale = scale;
      store.setCursorValue(1);
      expect(getPosition).toBeCalledWith(1, store.xScale);
    });

    it.skip('should not call setCursorPosition if xPosition is not defined', () => {
      store.xScale = scale;
      (getPosition as jest.Mock).mockReturnValue(undefined);
      store.setCursorValue(1);
      expect(store.setCursorPosition).not.toBeCalled();
    });

    it('should call setCursorPosition with correct args', () => {
      store.xScale = scale;
      store.chartDimensions.left = 10;
      store.chartDimensions.top = 10;
      (getPosition as jest.Mock).mockReturnValue(20);
      store.setCursorValue(20);
      expect(store.setCursorPosition).toBeCalledWith(30, 10, false);
    });
  });
});
