/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License. */

import {
  AnnotationDomainTypes,
  AnnotationSpec,
  AnnotationTypes,
  AxisSpec,
  BarSeriesSpec,
  RectAnnotationSpec,
  SeriesTypes,
} from '../utils/specs';
import { Position } from '../../../utils/commons';
import { ScaleType, ScaleContinuous, ScaleBand } from '../../../scales';
import { IndexedGeometry, GeometryValue, BandedAccessorType } from '../../../utils/geometry';
import { AxisTicksDimensions, isDuplicateAxis } from '../utils/axis_utils';
import { AxisId } from '../../../utils/ids';
import { LegendItem } from '../legend/legend';
import { ChartTypes } from '../..';
import { SpecTypes, TooltipValue, TooltipType } from '../../../specs/settings';

describe.skip('Chart Store', () => {
  let store: any = null; //

  const SPEC_ID = 'spec_1';
  const AXIS_ID = 'axis_1';
  const GROUP_ID = 'group_1';

  const spec: BarSeriesSpec = {
    chartType: ChartTypes.XYAxis,
    specType: SpecTypes.Series,
    id: SPEC_ID,
    groupId: GROUP_ID,
    seriesType: SeriesTypes.Bar,
    yScaleToDataExtent: false,
    data: [
      { x: 1, y: 1, g: 0 },
      { x: 2, y: 2, g: 1 },
      { x: 3, y: 3, g: 3 },
    ],
    xAccessor: 'x',
    yAccessors: ['y'],
    xScaleType: ScaleType.Linear,
    yScaleType: ScaleType.Linear,
    hideInLegend: false,
  };

  const firstLegendItem: LegendItem = {
    key: 'color1',
    color: 'foo',
    name: 'bar',
    seriesIdentifier: {
      specId: SPEC_ID,
      yAccessor: 'y1',
      splitAccessors: new Map(),
      seriesKeys: [],
      key: 'color1',
    },
    displayValue: {
      raw: {
        y1: null,
        y0: null,
      },
      formatted: {
        y1: 'formatted-last',
        y0: null,
      },
    },
  };

  const secondLegendItem: LegendItem = {
    key: 'color2',
    color: 'baz',
    name: 'qux',
    seriesIdentifier: {
      specId: SPEC_ID,
      yAccessor: '',
      splitAccessors: new Map(),
      seriesKeys: [],
      key: 'color2',
    },
    displayValue: {
      raw: {
        y1: null,
        y0: null,
      },
      formatted: {
        y1: 'formatted-last',
        y0: null,
      },
    },
  };
  beforeEach(() => {
    store = null; // new ChartStore();
    store.updateParentDimensions(600, 600, 0, 0);
    store.computeChart();
  });

  describe('isDuplicateAxis', () => {
    const AXIS_1_ID = 'spec_1';
    const AXIS_2_ID = 'spec_1';
    const axis1: AxisSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Axis,
      id: AXIS_1_ID,
      groupId: 'group_1',
      hide: false,
      showOverlappingTicks: false,
      showOverlappingLabels: false,
      position: Position.Left,
      tickSize: 30,
      tickPadding: 10,
      tickFormat: (value: any) => `${value}%`,
    };
    const axis2: AxisSpec = {
      ...axis1,
      id: AXIS_2_ID,
      groupId: 'group_2',
    };
    const axisTicksDimensions: AxisTicksDimensions = {
      tickValues: [],
      tickLabels: ['10', '20', '30'],
      maxLabelBboxWidth: 1,
      maxLabelBboxHeight: 1,
      maxLabelTextWidth: 1,
      maxLabelTextHeight: 1,
    };
    let tickMap: Map<AxisId, AxisTicksDimensions>;
    let specMap: AxisSpec[];

    beforeEach(() => {
      tickMap = new Map<AxisId, AxisTicksDimensions>();
      specMap = [];
    });

    it('should return true if axisSpecs and ticks match', () => {
      tickMap.set(AXIS_2_ID, axisTicksDimensions);
      specMap.push(axis2);
      const result = isDuplicateAxis(axis1, axisTicksDimensions, tickMap, specMap);

      expect(result).toBe(true);
    });

    it('should return false if axisSpecs, ticks AND title match', () => {
      tickMap.set(AXIS_2_ID, axisTicksDimensions);
      specMap.push({
        ...axis2,
        title: 'TESTING',
      });
      const result = isDuplicateAxis(
        {
          ...axis1,
          title: 'TESTING',
        },
        axisTicksDimensions,
        tickMap,
        specMap,
      );

      expect(result).toBe(true);
    });

    it('should return true with single tick', () => {
      const newAxisTicksDimensions = {
        ...axisTicksDimensions,
        tickLabels: ['10'],
      };
      tickMap.set(AXIS_2_ID, newAxisTicksDimensions);
      specMap.push(axis2);

      const result = isDuplicateAxis(axis1, newAxisTicksDimensions, tickMap, specMap);

      expect(result).toBe(true);
    });

    it('should return false if axisSpecs and ticks match but title is different', () => {
      tickMap.set(AXIS_2_ID, axisTicksDimensions);
      specMap.push({
        ...axis2,
        title: 'TESTING',
      });
      const result = isDuplicateAxis(
        {
          ...axis1,
          title: 'NOT TESTING',
        },
        axisTicksDimensions,
        tickMap,
        specMap,
      );

      expect(result).toBe(false);
    });

    it('should return false if axisSpecs and ticks match but position is different', () => {
      tickMap.set(AXIS_2_ID, axisTicksDimensions);
      specMap.push(axis2);
      const result = isDuplicateAxis(
        {
          ...axis1,
          position: Position.Top,
        },
        axisTicksDimensions,
        tickMap,
        specMap,
      );

      expect(result).toBe(false);
    });

    it('should return false if tickFormat is different', () => {
      tickMap.set(AXIS_2_ID, {
        ...axisTicksDimensions,
        tickLabels: ['10%', '20%', '30%'],
      });
      specMap.push(axis2);

      const result = isDuplicateAxis(axis1, axisTicksDimensions, tickMap, specMap);

      expect(result).toBe(false);
    });

    it('should return false if tick label count is different', () => {
      tickMap.set(AXIS_2_ID, {
        ...axisTicksDimensions,
        tickLabels: ['10', '20', '25', '30'],
      });
      specMap.push(axis2);

      const result = isDuplicateAxis(axis1, axisTicksDimensions, tickMap, specMap);

      expect(result).toBe(false);
    });

    it("should return false if can't find spec", () => {
      tickMap.set(AXIS_2_ID, axisTicksDimensions);
      const result = isDuplicateAxis(axis1, axisTicksDimensions, tickMap, specMap);

      expect(result).toBe(false);
    });
  });

  test.skip('can add a single spec', () => {
    store.addSeriesSpec(spec);
    store.updateParentDimensions(600, 600, 0, 0);
    store.computeChart();
    const { seriesDomainsAndData } = store;
    expect(seriesDomainsAndData).not.toBeUndefined();
  });

  test.skip('can initialize deselectedDataSeries depending on previous state', () => {
    store.specsInitialized.set(false);
    store.computeChart();
    expect(store.deselectedDataSeries).toEqual([]);
  });

  test.skip('can add an axis', () => {
    store.addSeriesSpec(spec);
    const axisSpec: AxisSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Axis,
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

  test.skip('can set legend visibility', () => {
    store.showLegend.set(false);
    store.setShowLegend(true);

    expect(store.showLegend.get()).toEqual(true);
  });

  test.skip('can get highlighted legend item', () => {
    store.legendItems = new Map([
      [firstLegendItem.key, firstLegendItem],
      [secondLegendItem.key, secondLegendItem],
    ]);

    store.highlightedLegendItemKey.set(null);
    expect(store.highlightedLegendItem.get()).toBe(null);

    store.highlightedLegendItemKey.set(secondLegendItem.key);
    expect(store.highlightedLegendItem.get()).toEqual(secondLegendItem);
  });

  test.skip('can respond to legend item mouseover event', () => {
    const legendListener = jest.fn((): void => {
      return;
    });

    store.legendItems = new Map([
      [firstLegendItem.key, firstLegendItem],
      [secondLegendItem.key, secondLegendItem],
    ]);
    store.highlightedLegendItemKey.set(null);

    store.onLegendItemOver(firstLegendItem.key);
    expect(store.highlightedLegendItemKey.get()).toBe(firstLegendItem.key);

    store.setOnLegendItemOverListener(legendListener);
    store.onLegendItemOver(secondLegendItem.key);
    expect(legendListener).toBeCalledWith(secondLegendItem.seriesIdentifier);

    store.onLegendItemOver(null);
    expect(legendListener).toBeCalledWith(null);

    store.onLegendItemOver('');
    expect(legendListener).toBeCalledWith(null);
  });

  test.skip('can respond to legend item mouseout event', () => {
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

  test.skip('do nothing when mouseover an hidden series', () => {
    const legendListener = jest.fn((): void => {
      return;
    });
    store.setOnLegendItemOverListener(legendListener);

    store.legendItems = new Map([
      [firstLegendItem.key, firstLegendItem],
      [secondLegendItem.key, secondLegendItem],
    ]);
    store.deselectedDataSeries = [];
    store.highlightedLegendItemKey.set(null);

    store.toggleSeriesVisibility(firstLegendItem.key);
    expect(store.deselectedDataSeries).toEqual([firstLegendItem.seriesIdentifier]);
    expect(store.highlightedLegendItemKey.get()).toBe(null);
    store.onLegendItemOver(firstLegendItem.key);
    expect(store.highlightedLegendItemKey.get()).toBe(null);
    store.onLegendItemOut();
    store.toggleSeriesVisibility(firstLegendItem.key);
    expect(store.highlightedLegendItemKey.get()).toEqual(firstLegendItem.key);
    expect(store.deselectedDataSeries).toEqual([]);

    store.onLegendItemOver(firstLegendItem.key);
    expect(store.highlightedLegendItemKey.get()).toBe(firstLegendItem.key);

    store.removeOnLegendItemOutListener();
  });

  test.skip('can respond to legend item click event', () => {
    const legendListener = jest.fn((): void => {
      return;
    });

    store.legendItems = new Map([
      [firstLegendItem.key, firstLegendItem],
      [secondLegendItem.key, secondLegendItem],
    ]);
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
    expect(legendListener).toBeCalledWith(firstLegendItem.seriesIdentifier);
  });

  test.skip('can respond to a legend item plus click event', () => {
    const legendListener = jest.fn((): void => {
      return;
    });

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
    expect(legendListener).toBeCalledWith(firstLegendItem.seriesIdentifier);
  });

  test.skip('can respond to a legend item minus click event', () => {
    const legendListener = jest.fn((): void => {
      return;
    });

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
    expect(legendListener).toBeCalledWith(firstLegendItem.seriesIdentifier);
  });

  test.skip('can toggle series visibility', () => {
    const computeChart = jest.fn((): void => {
      return;
    });

    store.legendItems = new Map([
      [firstLegendItem.key, firstLegendItem],
      [secondLegendItem.key, secondLegendItem],
    ]);
    store.deselectedDataSeries = [];
    store.computeChart = computeChart;

    store.toggleSeriesVisibility('other');
    expect(store.deselectedDataSeries).toEqual([]);
    expect(computeChart).not.toBeCalled();

    store.deselectedDataSeries = [firstLegendItem.seriesIdentifier, secondLegendItem.seriesIdentifier];
    store.toggleSeriesVisibility(firstLegendItem.key);
    expect(store.deselectedDataSeries).toEqual([secondLegendItem.seriesIdentifier]);
    expect(computeChart).toBeCalled();

    store.deselectedDataSeries = [firstLegendItem.seriesIdentifier];
    store.toggleSeriesVisibility(firstLegendItem.key);
    expect(store.deselectedDataSeries).toEqual([]);
  });

  test.skip('can toggle single series visibility', () => {
    const computeChart = jest.fn((): void => {
      return;
    });

    store.legendItems = new Map([
      [firstLegendItem.key, firstLegendItem],
      [secondLegendItem.key, secondLegendItem],
    ]);
    store.deselectedDataSeries = [];
    store.computeChart = computeChart;

    store.toggleSingleSeries('other');
    expect(store.deselectedDataSeries).toEqual([]);
    expect(computeChart).not.toBeCalled();

    store.toggleSingleSeries(firstLegendItem.key);
    expect(store.deselectedDataSeries).toEqual([firstLegendItem.seriesIdentifier]);

    store.toggleSingleSeries(firstLegendItem.key);
    expect(store.deselectedDataSeries).toEqual([secondLegendItem.seriesIdentifier]);
  });

  test.skip('can set an element click listener', () => {
    const clickListener = (): void => {
      return;
    };
    store.setOnElementClickListener(clickListener);

    expect(store.onElementClickListener).toEqual(clickListener);
  });

  test.skip('can set a brush end listener', () => {
    const brushEndListener = (): void => {
      return;
    };
    store.setOnBrushEndListener(brushEndListener);

    expect(store.onBrushEndListener).toEqual(brushEndListener);
  });

  test.skip('can set a cursor hover listener', () => {
    const listener = (): void => {
      return;
    };
    store.setOnCursorUpdateListener(listener);

    expect(store.onCursorUpdateListener).toEqual(listener);
  });

  test.skip('can set a render change listener', () => {
    const listener = (): void => {
      return;
    };
    store.setOnRenderChangeListener(listener);

    expect(store.onRenderChangeListener).toEqual(listener);
  });

  test.skip('should observe chartInitialized value', () => {
    const listener = jest.fn();
    store.chartInitialized.set(false);
    store.setOnRenderChangeListener(listener);
    store.chartInitialized.set(true);

    expect(listener).toBeCalledWith(true);
  });

  test.skip('should observe chartInitialized value only on change', () => {
    const listener = jest.fn();
    store.chartInitialized.set(false);
    store.setOnRenderChangeListener(listener);
    store.chartInitialized.set(false);

    expect(listener).not.toBeCalled();
  });

  test.skip('can remove listeners', () => {
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

    store.removeOnRenderChangeListener();
    expect(store.onRenderChangeListener).toBeUndefined();
  });

  test.skip('can update parent dimensions', () => {
    const computeChart = jest.fn((): void => {
      return;
    });
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

  test.skip('can remove a series spec', () => {
    store.addSeriesSpec(spec);
    store.removeSeriesSpec(SPEC_ID);
    expect(store.seriesSpecs.get(SPEC_ID)).toBe(undefined);
  });

  test.skip('can remove an axis spec', () => {
    const axisSpec: AxisSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Axis,
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
    const annotationId = 'annotation';
    const groupId = 'group';

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
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Annotation,
      annotationType: AnnotationTypes.Line,
      id: annotationId,
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
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Annotation,
      id: 'rect',
      groupId: GROUP_ID,
      annotationType: AnnotationTypes.Rectangle,
      dataValues: [{ coordinates: { x0: 1, x1: 2, y0: 3, y1: 5 } }],
    };
    store.addAnnotationSpec(rectAnnotation);
    expectedAnnotationSpecs.clear();
    expectedAnnotationSpecs.set(rectAnnotation.id, rectAnnotation);
    expect(store.annotationSpecs).toEqual(expectedAnnotationSpecs);
  });

  test.skip('only computes chart if parent dimensions are computed', () => {
    const localStore: any = null; //new ChartStore();

    localStore.parentDimensions = {
      width: 0,
      height: 0,
      top: 0,
      left: 0,
    };

    localStore.computeChart();
    expect(localStore.chartInitialized.get()).toBe(false);
  });

  test.skip('only computes chart if series specs exist', () => {
    const localStore: any = null; //new ChartStore();

    localStore.parentDimensions = {
      width: 100,
      height: 100,
      top: 0,
      left: 0,
    };

    localStore.seriesSpecs = new Map();
    localStore.computeChart();
    expect(localStore.chartInitialized.get()).toBe(false);
  });

  test.skip('can set the color for a series', () => {
    beforeEach(() => {
      store.computeChart = jest.fn();
      store.legendItems = new Map([
        [firstLegendItem.key, firstLegendItem],
        [secondLegendItem.key, secondLegendItem],
      ]);
    });

    it('should set color override', () => {
      store.setSeriesColor(firstLegendItem.key, 'red');
      expect(store.computeChart).toBeCalled();
      expect(store.seriesColorOverrides.get(firstLegendItem.key)).toBe('red');
    });

    it('should not set color override with empty color', () => {
      store.setSeriesColor(firstLegendItem.key, '');
      expect(store.computeChart).not.toBeCalled();
      expect(store.seriesColorOverrides.get(firstLegendItem.key)).toBeUndefined();
    });

    it('should not set color override with empty key', () => {
      store.setSeriesColor('', 'red');
      expect(store.computeChart).not.toBeCalled();
      expect(store.seriesColorOverrides.get(firstLegendItem.key)).toBeUndefined();
    });
  });

  test.skip('can reset selectedDataSeries', () => {
    store.deselectedDataSeries = [firstLegendItem.seriesIdentifier];
    store.resetDeselectedDataSeries();
    expect(store.deselectedDataSeries).toStrictEqual([]);
  });
  test.skip('can update the crosshair visibility', () => {
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

  test.skip('can update the tooltip visibility', () => {
    const tooltipValue: TooltipValue = {
      label: 'a',
      value: 'a',
      color: 'a',
      isHighlighted: false,
      seriesIdentifier: {
        specId: 'a',
        key: 'a',
      },
      valueAccessor: 'y',
      isVisible: true,
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
        chartType: ChartTypes.XYAxis,
        specType: SpecTypes.Axis,
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

    test.skip('with no tooltipHeaderFormatter defined, should return value formatted using xAxis tickFormatter', () => {
      store.tooltipHeaderFormatter = undefined;
      store.setCursorPosition(10, 10);
      expect(store.tooltipData[0].value).toBe('foo 1');
    });

    test.skip('with tooltipHeaderFormatter defined, should return value formatted', () => {
      store.tooltipHeaderFormatter = (value: TooltipValue) => `${value}`;
      store.setCursorPosition(10, 10);
      expect(store.tooltipData[0].value).toBe(1);
    });

    test.skip('should update cursor postion with hover event', () => {
      const legendListener = jest.fn((): void => {
        return;
      });

      store.legendItems = new Map([
        [firstLegendItem.key, firstLegendItem],
        [secondLegendItem.key, secondLegendItem],
      ]);
      store.selectedLegendItemKey.set(null);
      store.onCursorUpdateListener = undefined;

      store.setCursorPosition(1, 1);
      expect(legendListener).not.toBeCalled();

      store.setOnCursorUpdateListener(legendListener);
      store.setCursorPosition(1, 1);
      expect(legendListener).toBeCalled();
    });
  });

  test.skip('can disable brush based on scale and listener', () => {
    store.xScale = undefined;
    expect(store.isBrushEnabled()).toBe(false);
    store.xScale = new ScaleContinuous({ type: ScaleType.Linear, domain: [0, 100], range: [0, 100] });
    store.onBrushEndListener = undefined;
    expect(store.isBrushEnabled()).toBe(false);
    store.setOnBrushEndListener(() => ({}));
    expect(store.isBrushEnabled()).toBe(true);
    store.xScale = new ScaleBand([0, 100], [0, 100]);
    expect(store.isBrushEnabled()).toBe(false);
  });

  test.skip('can disable tooltip on brushing', () => {
    store.addSeriesSpec(spec);
    store.setOnBrushEndListener(() => ({}));
    const tooltipValue: TooltipValue = {
      label: 'a',
      value: 'a',
      color: 'a',
      isHighlighted: false,
      seriesIdentifier: {
        specId: 'a',
        key: 'a',
      },
      valueAccessor: 'y',
      isVisible: true,
    };
    store.xScale = new ScaleContinuous({ type: ScaleType.Linear, domain: [0, 100], range: [0, 100] });
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
  test.skip('handle click on chart', () => {
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
      seriesIdentifier: {
        specId: 'specId1',
        yAccessor: 'y1',
        splitAccessors: new Map(),
        seriesKeys: [2],
        key: '',
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
      seriesIdentifier: {
        specId: 'specId2',
        yAccessor: 'y1',
        splitAccessors: new Map(),
        seriesKeys: [2],
        key: '',
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
    const clickListener = jest.fn<void, [GeometryValue[]]>((): void => {
      return;
    });
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
  test.skip('can compute annotation tooltip state', () => {
    const scale = new ScaleContinuous({ type: ScaleType.Linear, domain: [0, 100], range: [0, 100] });

    store.currentPointerPosition.x = -1;
    store.currentPointerPosition.y = 0;

    expect(store.annotationTooltipState.get()).toBe(null);

    store.xScale = undefined;
    expect(store.annotationTooltipState.get()).toBe(null);

    store.xScale = scale;

    store.yScales = undefined;
    expect(store.annotationTooltipState.get()).toBe(null);

    store.yScales = new Map();
    store.yScales.set(GROUP_ID, scale);

    store.currentPointerPosition.x = 0;
    expect(store.annotationTooltipState.get()).toBe(null);

    // If there's a rect annotation & there's also a highlight chart element tooltip, ignore annotation tooltip
    store.currentPointerPosition.x = 18;
    store.currentPointerPosition.y = 9;
    store.chartDimensions = { width: 10, height: 20, top: 5, left: 15 };

    const annotationDimensions = [{ rect: { x: 2, y: 3, width: 3, height: 5 } }];
    const rectAnnotationSpec: RectAnnotationSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Annotation,
      id: 'rect',
      groupId: GROUP_ID,
      annotationType: AnnotationTypes.Rectangle,
      dataValues: [{ coordinates: { x0: 1, x1: 2, y0: 3, y1: 5 } }],
    };

    store.annotationSpecs.set(rectAnnotationSpec.id, rectAnnotationSpec);
    store.annotationDimensions.set(rectAnnotationSpec.id, annotationDimensions);

    const highlightedTooltipValue: TooltipValue = {
      label: 'foo',
      value: 1,
      color: 'color',
      isHighlighted: true,
      seriesIdentifier: {
        specId: 'a',
        key: 'a',
      },
      valueAccessor: 'y',
      isVisible: true,
    };
    const unhighlightedTooltipValue: TooltipValue = {
      label: 'foo',
      value: 1,
      color: 'color',
      isHighlighted: false,
      seriesIdentifier: {
        specId: 'foo',
        key: 'foo',
      },
      valueAccessor: 'y',
      isVisible: true,
    };

    const expectedRectTooltipState = {
      isVisible: true,
      annotationType: AnnotationTypes.Rectangle,
      anchor: {
        top: store.currentPointerPosition.y - store.chartDimensions.top,
        left: store.currentPointerPosition.x - store.chartDimensions.left,
      },
    };
    store.tooltipData.push(unhighlightedTooltipValue);
    expect(store.annotationTooltipState.get()).toEqual(expectedRectTooltipState);

    store.tooltipData.push(highlightedTooltipValue);
    expect(store.annotationTooltipState.get()).toBe(null);
  });
  test.skip('can get tooltipValues by seriesKeys', () => {
    store.tooltipData.clear();

    expect(store.legendItemTooltipValues.get()).toEqual(new Map());

    const headerValue: TooltipValue = {
      label: 'header',
      value: 'foo',
      color: 'a',
      isHighlighted: false,
      seriesIdentifier: {
        specId: 'headerSeries',
        key: 'headerSeries',
      },
      valueAccessor: BandedAccessorType.Y0,
      isVisible: true,
    };

    store.tooltipData.replace([headerValue]);
    expect(store.legendItemTooltipValues.get()).toEqual(new Map());

    const tooltipValue: TooltipValue = {
      label: 'a',
      value: 123,
      color: 'a',
      isHighlighted: false,
      seriesIdentifier: {
        specId: 'seriesKeys',
        key: 'seriesKeys',
      },
      valueAccessor: BandedAccessorType.Y1,
      isVisible: true,
    };
    store.tooltipData.replace([headerValue, tooltipValue]);

    const expectedTooltipValues = new Map();
    expectedTooltipValues.set('seriesKeys', {
      y0: undefined,
      y1: 123,
    });
    const t = store.legendItemTooltipValues.get();
    expect(t).toEqual(expectedTooltipValues);
  });
  describe('can determine if crosshair cursor is visible', () => {
    const brushEndListener = (): void => {
      return;
    };

    beforeEach(() => {
      store.xScale = new ScaleContinuous({ type: ScaleType.Linear, domain: [0, 100], range: [0, 100] });
    });

    test.skip('when cursor is outside of chart bounds', () => {
      store.cursorPosition.x = -1;
      store.cursorPosition.y = -1;
      store.onBrushEndListener = brushEndListener;
      expect(store.chartCursor.get()).toBe('default');
    });

    test.skip('when cursor is within chart bounds and brush enabled', () => {
      store.cursorPosition.x = 10;
      store.cursorPosition.y = 10;
      store.onBrushEndListener = brushEndListener;
      expect(store.chartCursor.get()).toBe('crosshair');
    });

    test.skip('when cursor is within chart bounds and brush disabled', () => {
      store.cursorPosition.x = 10;
      store.cursorPosition.y = 10;
      store.onBrushEndListener = undefined;
      expect(store.chartCursor.get()).toBe('default');
    });
    test.skip('when cursor is within chart bounds and brush enabled but over one geom', () => {
      store.cursorPosition.x = 10;
      store.cursorPosition.y = 10;
      store.onBrushEndListener = brushEndListener;
      const geom1: IndexedGeometry = {
        color: 'red',
        seriesIdentifier: {
          specId: 'specId1',
          yAccessor: 'y1',
          splitAccessors: new Map(),
          seriesKeys: [2],
          key: '',
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
        seriesStyle: {
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
        },
      };
      store.highlightedGeometries.replace([geom1]);
      expect(store.chartCursor.get()).toBe('crosshair');
      store.onElementClickListener = jest.fn();
      expect(store.chartCursor.get()).toBe('pointer');
    });
  });
  test.skip('should set tooltip type to follow when single value x scale', () => {
    const singleValueSpec: BarSeriesSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Series,
      id: SPEC_ID,
      groupId: GROUP_ID,
      seriesType: SeriesTypes.Bar,
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

  describe.skip('isActiveChart', () => {
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

  describe.skip('setActiveChartId', () => {
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
});
