import { BarGeometry } from '../rendering/rendering';
import { computeXScale, computeYScales } from '../utils/scales';
import { DataSeriesColorsValues } from '../utils/series';
import { BarSeriesSpec, BasicSeriesSpec, RectAnnotationSpec, Position } from '../utils/specs';
import { getAnnotationId, getGroupId, getSpecId, getAxisId } from '../../../utils/ids';
import { TooltipType } from '../utils/interactions';
import { ScaleContinuous } from '../../../utils/scales/scale_continuous';
import { ScaleType } from '../../../utils/scales/scales';
import { ChartStore } from './chart_state';
import { computeSeriesDomains } from './utils';
import { ScaleBand } from '../../../utils/scales/scale_band';

const SPEC_ID = getSpecId('spec_1');
const GROUP_ID = getGroupId('group_1');

const ordinalBarSeries: BarSeriesSpec = {
  id: SPEC_ID,
  groupId: GROUP_ID,
  seriesType: 'bar',
  yScaleToDataExtent: false,
  data: [[0, 10], [1, 5]],
  xAccessor: 0,
  yAccessors: [1],
  xScaleType: ScaleType.Ordinal,
  yScaleType: ScaleType.Linear,
  hideInLegend: false,
};
const linearBarSeries: BarSeriesSpec = {
  id: SPEC_ID,
  groupId: GROUP_ID,
  seriesType: 'bar',
  yScaleToDataExtent: false,
  data: [[0, 10], [1, 5]],
  xAccessor: 0,
  yAccessors: [1],
  xScaleType: ScaleType.Linear,
  yScaleType: ScaleType.Linear,
  hideInLegend: false,
};
const chartTop = 10;
const chartLeft = 10;

function initStore(spec: BasicSeriesSpec) {
  const store = new ChartStore();
  store.chartDimensions.width = 100;
  store.chartDimensions.height = 100;
  store.chartDimensions.top = chartTop;
  store.chartDimensions.left = chartLeft;
  store.chartRotation = 0;
  store.seriesDomainsAndData = {
    splittedDataSeries: [],
    formattedDataSeries: {
      stacked: [],
      nonStacked: [],
    },
    seriesColors: new Map<string, DataSeriesColorsValues>(),
    xDomain: {
      scaleType: spec.xScaleType,
      domain: [0, 1],
      isBandScale: true,
      minInterval: 1,
      type: 'xDomain',
    },
    yDomain: [
      {
        scaleType: spec.yScaleType,
        domain: [0, 20],
        isBandScale: false,
        groupId: GROUP_ID,
        type: 'yDomain',
      },
    ],
  };
  store.tooltipType.set(TooltipType.VerticalCursor);
  store.seriesSpecs.set(spec.id, spec);
  return store;
}

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
const indexedGeom1Red: BarGeometry = {
  color: 'red',
  x: 0,
  y: 0,
  width: 50,
  height: 100,
  value: {
    x: 0,
    y: 10,
    accessor: 'y1',
  },
  geometryId: {
    specId: SPEC_ID,
    seriesKey: [],
  },
  seriesStyle: barStyle,
};
const indexedGeom2Blue: BarGeometry = {
  color: 'blue',
  x: 50,
  y: 50,
  width: 50,
  height: 50,
  value: {
    x: 1,
    y: 5,
    accessor: 'y1',
  },
  geometryId: {
    specId: SPEC_ID,
    seriesKey: [],
  },
  seriesStyle: barStyle,
};

describe('Chart state pointer interactions', () => {
  let store: ChartStore;

  beforeEach(() => {
    store = initStore(ordinalBarSeries);
  });

  test('can convert/limit cursor positions relative to chart dimensions', () => {
    store.setCursorPosition(20, 20);
    expect(store.cursorPosition.x).toBe(10);
    expect(store.cursorPosition.y).toBe(10);
    store.setCursorPosition(10, 10);
    expect(store.cursorPosition.x).toBe(0);
    expect(store.cursorPosition.y).toBe(0);
    store.setCursorPosition(5, 5);
    expect(store.cursorPosition.x).toBe(-1);
    expect(store.cursorPosition.y).toBe(-1);
    store.setCursorPosition(200, 20);
    expect(store.cursorPosition.x).toBe(-1);
    expect(store.cursorPosition.y).toBe(10);
    store.setCursorPosition(20, 200);
    expect(store.cursorPosition.x).toBe(10);
    expect(store.cursorPosition.y).toBe(-1);
    store.setCursorPosition(200, 200);
    expect(store.cursorPosition.x).toBe(-1);
    expect(store.cursorPosition.y).toBe(-1);
    store.setCursorPosition(-20, -20);
    expect(store.cursorPosition.x).toBe(-1);
    expect(store.cursorPosition.y).toBe(-1);
  });

  test('call onElementOut if moving the mouse out from the chart', () => {
    store.highlightedGeometries.push(indexedGeom1Red);
    const listener = jest.fn((): undefined => undefined);
    store.setOnElementOutListener(listener);
    store.setCursorPosition(5, 5);
    expect(listener).toBeCalledTimes(1);

    // no more calls after the first out one outside chart
    store.setCursorPosition(5, 5);
    expect(listener).toBeCalledTimes(1);
    store.setCursorPosition(3, 3);
    expect(listener).toBeCalledTimes(1);
  });

  test('can respond to tooltip types changes', () => {
    store.xScale = new ScaleContinuous(
      {
        type: ScaleType.Linear,
        domain: [0, 1],
        range: [0, 100],
      },
      { bandwidth: 50, minInterval: 0.5 },
    );
    store.yScales = new Map();
    store.yScales.set(GROUP_ID, new ScaleContinuous({ type: ScaleType.Linear, domain: [0, 1], range: [0, 100] }));
    store.geometriesIndex.set(0, [indexedGeom1Red]);
    store.geometriesIndexKeys.push(0);
    store.tooltipType.set(TooltipType.None);
    store.setCursorPosition(10, 10 + 70);
    expect(store.tooltipData).toEqual([]);
    expect(store.isTooltipVisible.get()).toBe(false);

    store.tooltipType.set(TooltipType.Follow);
    store.setCursorPosition(10, 10 + 70);
    expect(store.geometriesIndexKeys.length).toBe(1);
    expect(store.isTooltipVisible.get()).toBe(true);
    expect(store.highlightedGeometries.length).toBe(1);
  });

  describe('mouse over with Ordinal scale', () => {
    mouseOverTestSuite(ScaleType.Ordinal);
  });
  describe('mouse over with Linear scale', () => {
    mouseOverTestSuite(ScaleType.Linear);
  });

  // TODO add test for point series
  // TODO add test for mixed series
  // TODO add test for clicks
});

function mouseOverTestSuite(scaleType: ScaleType) {
  let store: ChartStore;
  let onOverListener: jest.Mock<undefined>;
  let onOutListener: jest.Mock<undefined>;

  beforeEach(() => {
    const spec = scaleType === ScaleType.Ordinal ? ordinalBarSeries : linearBarSeries;
    store = initStore(spec);
    const barSeriesMap = new Map();
    barSeriesMap.set(SPEC_ID, spec);
    const barSeriesDomains = computeSeriesDomains(barSeriesMap, new Map());
    const barSeriesScale = computeXScale({
      xDomain: barSeriesDomains.xDomain,
      totalBarsInCluster: barSeriesMap.size,
      range: [0, 100],
    });
    const yScales = computeYScales({ yDomains: barSeriesDomains.yDomain, range: [0, 100] });
    store.xScale = barSeriesScale;
    store.yScales = yScales;
    store.geometriesIndex.set(0, [indexedGeom1Red]);
    store.geometriesIndex.set(1, [indexedGeom2Blue]);
    store.geometriesIndexKeys.push(0);
    store.geometriesIndexKeys.push(1);
    onOverListener = jest.fn((): undefined => undefined);
    onOutListener = jest.fn((): undefined => undefined);
    store.setOnElementOverListener(onOverListener);
    store.setOnElementOutListener(onOutListener);
    expect(store.xScale).not.toBeUndefined();
    expect(store.tooltipData).toEqual([]);
  });

  test('store is correctly configured', () => {
    // checking this to avoid broken tests due to nested describe and before
    expect(store.xScale).not.toBeUndefined();
    expect(store.yScales).not.toBeUndefined();
  });

  test('can determine which tooltip to display if chart & annotation tooltips possible', () => {
    const annotationDimensions = [{ rect: { x: 49, y: -1, width: 2, height: 99 } }];
    const rectAnnotationSpec: RectAnnotationSpec = {
      annotationId: getAnnotationId('rect'),
      groupId: GROUP_ID,
      annotationType: 'rectangle',
      dataValues: [{ coordinates: { x0: 1, x1: 1.5, y0: 0.5, y1: 10 } }],
    };

    store.annotationSpecs.set(rectAnnotationSpec.annotationId, rectAnnotationSpec);
    store.annotationDimensions.set(rectAnnotationSpec.annotationId, annotationDimensions);

    // isHighlighted false, chart tooltip true; should show annotationTooltip only
    store.setCursorPosition(chartLeft + 50, chartTop + 0);
    expect(store.isTooltipVisible.get()).toBe(false);
  });

  test('can hover top-left corner of the first bar', () => {
    expect(store.tooltipData).toEqual([]);
    store.setCursorPosition(chartLeft + 0, chartTop + 0);
    expect(store.cursorPosition).toEqual({ x: 0, y: 0 });
    expect(store.cursorBandPosition.left).toBe(chartLeft + 0);
    expect(store.cursorBandPosition.width).toBe(50);
    expect(store.isTooltipVisible.get()).toBe(true);
    expect(store.tooltipData.length).toBe(2); // x value + 1 y value
    expect(store.highlightedGeometries.length).toBe(1);
    expect(onOverListener).toBeCalledTimes(1);
    expect(onOutListener).toBeCalledTimes(0);
    expect(onOverListener.mock.calls[0][0]).toEqual([indexedGeom1Red.value]);

    store.setCursorPosition(chartLeft - 1, chartTop - 1);
    expect(store.cursorPosition).toEqual({ x: -1, y: -1 });
    expect(store.isTooltipVisible.get()).toBe(false);
    expect(store.tooltipData.length).toBe(0);
    expect(store.highlightedGeometries.length).toBe(0);
    expect(onOverListener).toBeCalledTimes(1);
    expect(onOutListener).toBeCalledTimes(1);
  });

  test('can hover bottom-left corner of the first bar', () => {
    store.setCursorPosition(chartLeft + 0, chartTop + 99);
    expect(store.cursorPosition).toEqual({ x: 0, y: 99 });
    expect(store.cursorBandPosition.left).toBe(chartLeft + 0);
    expect(store.cursorBandPosition.width).toBe(50);
    expect(store.isTooltipVisible.get()).toBe(true);
    expect(store.highlightedGeometries.length).toBe(1);
    expect(store.tooltipData.length).toBe(2); // x value + 1 y value
    expect(onOverListener).toBeCalledTimes(1);
    expect(onOutListener).toBeCalledTimes(0);
    expect(onOverListener.mock.calls[0][0]).toEqual([indexedGeom1Red.value]);

    store.setCursorPosition(chartLeft - 1, chartTop + 99);
    expect(store.cursorPosition).toEqual({ x: -1, y: 99 });
    expect(store.isTooltipVisible.get()).toBe(false);
    expect(store.tooltipData.length).toBe(0);
    expect(store.highlightedGeometries.length).toBe(0);
    expect(onOverListener).toBeCalledTimes(1);
    expect(onOutListener).toBeCalledTimes(1);
  });

  test('can hover top-right corner of the first bar', () => {
    store.setCursorPosition(chartLeft + 49, chartTop + 0);
    expect(store.cursorPosition).toEqual({ x: 49, y: 0 });
    expect(store.cursorBandPosition.left).toBe(chartLeft + 0);
    expect(store.cursorBandPosition.width).toBe(50);
    expect(store.isTooltipVisible.get()).toBe(true);
    expect(store.highlightedGeometries.length).toBe(1);
    expect(store.tooltipData.length).toBe(2);
    expect(onOverListener).toBeCalledTimes(1);
    expect(onOutListener).toBeCalledTimes(0);
    expect(onOverListener.mock.calls[0][0]).toEqual([indexedGeom1Red.value]);

    store.setCursorPosition(chartLeft + 50, chartTop + 0);
    expect(store.cursorPosition).toEqual({ x: 50, y: 0 });
    expect(store.cursorBandPosition.left).toBe(chartLeft + 50);
    expect(store.cursorBandPosition.width).toBe(50);
    expect(store.isTooltipVisible.get()).toBe(true);
    expect(store.tooltipData.length).toBe(2);
    expect(store.highlightedGeometries.length).toBe(0);
    expect(onOverListener).toBeCalledTimes(1);
    expect(onOutListener).toBeCalledTimes(1);
  });

  test('can hover bottom-right corner of the first bar', () => {
    store.setCursorPosition(chartLeft + 49, chartTop + 99);
    expect(store.cursorPosition).toEqual({ x: 49, y: 99 });
    expect(store.cursorBandPosition.left).toBe(chartLeft + 0);
    expect(store.cursorBandPosition.width).toBe(50);
    expect(store.isTooltipVisible.get()).toBe(true);
    expect(store.highlightedGeometries.length).toBe(1);
    expect(store.tooltipData.length).toBe(2);
    expect(onOverListener).toBeCalledTimes(1);
    expect(onOutListener).toBeCalledTimes(0);
    expect(onOverListener.mock.calls[0][0]).toEqual([indexedGeom1Red.value]);

    store.setCursorPosition(chartLeft + 50, chartTop + 99);
    expect(store.cursorPosition).toEqual({ x: 50, y: 99 });
    expect(store.cursorBandPosition.left).toBe(chartLeft + 50);
    expect(store.cursorBandPosition.width).toBe(50);
    expect(store.isTooltipVisible.get()).toBe(true);
    expect(store.tooltipData.length).toBe(2);
    // we are over the second bar here
    expect(store.highlightedGeometries.length).toBe(1);
    expect(onOverListener).toBeCalledTimes(2);
    expect(onOverListener.mock.calls[1][0]).toEqual([indexedGeom2Blue.value]);

    expect(onOutListener).toBeCalledTimes(0);
  });

  test('can hover top-right corner of the chart', () => {
    store.setCursorPosition(chartLeft + 99, chartTop + 0);
    expect(store.cursorPosition).toEqual({ x: 99, y: 0 });
    expect(store.cursorBandPosition.left).toBe(chartLeft + 50);
    expect(store.cursorBandPosition.width).toBe(50);

    expect(store.isTooltipVisible.get()).toBe(true);
    expect(store.highlightedGeometries.length).toBe(0);
    expect(store.tooltipData.length).toBe(2);
    expect(onOverListener).toBeCalledTimes(0);
    expect(onOutListener).toBeCalledTimes(0);
  });

  test('can hover bottom-right corner of the chart', () => {
    store.setCursorPosition(chartLeft + 99, chartTop + 99);
    expect(store.cursorPosition).toEqual({ x: 99, y: 99 });
    expect(store.cursorBandPosition.left).toBe(chartLeft + 50);
    expect(store.cursorBandPosition.width).toBe(50);
    expect(store.isTooltipVisible.get()).toBe(true);
    expect(store.highlightedGeometries.length).toBe(1);
    expect(store.tooltipData.length).toBe(2);
    expect(onOverListener).toBeCalledTimes(1);
    expect(onOverListener.mock.calls[0][0]).toEqual([indexedGeom2Blue.value]);
    expect(onOutListener).toBeCalledTimes(0);
  });

  describe('can position tooltip within chart when xScale is a single value scale', () => {
    beforeEach(() => {
      const singleValueScale =
        store.xScale!.type === ScaleType.Ordinal
          ? new ScaleBand(['a'], [0, 0])
          : new ScaleContinuous({ type: ScaleType.Linear, domain: [1, 1], range: [0, 0] });
      store.xScale = singleValueScale;
    });
    test('horizontal chart rotation', () => {
      store.setCursorPosition(chartLeft + 99, chartTop + 99);
      const expectedTransform = `translateX(${chartLeft}px) translateX(-0%) translateY(109px) translateY(-100%)`;
      expect(store.tooltipPosition.transform).toBe(expectedTransform);
    });

    test('vertical chart rotation', () => {
      store.chartRotation = 90;
      store.setCursorPosition(chartLeft + 99, chartTop + 99);
      const expectedTransform = `translateX(109px) translateX(-100%) translateY(${chartTop}px) translateY(-0%)`;
      expect(store.tooltipPosition.transform).toBe(expectedTransform);
    });
  });
  describe('can format tooltip values on rotated chart', () => {
    beforeEach(() => {
      store.addAxisSpec({
        hide: true,
        id: getAxisId('yaxis'),
        groupId: GROUP_ID,
        position: Position.Left,
        tickFormat: (value) => `left ${Number(value)}`,
        showOverlappingLabels: false,
        showOverlappingTicks: false,
        tickPadding: 0,
        tickSize: 0,
      });
      store.addAxisSpec({
        hide: true,
        id: getAxisId('xaxis'),
        groupId: GROUP_ID,
        position: Position.Bottom,
        tickFormat: (value) => `bottom ${Number(value)}`,
        showOverlappingLabels: false,
        showOverlappingTicks: false,
        tickPadding: 0,
        tickSize: 0,
      });
    });
    test('chart 0 rotation', () => {
      store.setCursorPosition(chartLeft + 0, chartTop + 99);
      expect(store.tooltipData[0].value).toBe('bottom 0');
      expect(store.tooltipData[1].value).toBe('left 10');
    });

    test('chart 90 deg rotated', () => {
      store.chartRotation = 90;
      store.setCursorPosition(chartLeft + 0, chartTop + 99);
      expect(store.tooltipData[0].value).toBe('left 1');
      expect(store.tooltipData[1].value).toBe('bottom 5');
    });
  });
}
