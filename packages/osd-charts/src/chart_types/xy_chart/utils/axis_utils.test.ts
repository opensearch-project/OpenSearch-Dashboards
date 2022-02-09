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
 * under the License.
 */

import { DateTime } from 'luxon';
import moment from 'moment-timezone';

import { ChartType } from '../..';
import { MockGlobalSpec, MockSeriesSpec } from '../../../mocks/specs/specs';
import { MockStore } from '../../../mocks/store/store';
import { MockXDomain, MockYDomain } from '../../../mocks/xy/domains';
import { Scale } from '../../../scales';
import { ScaleType } from '../../../scales/constants';
import { SpecType } from '../../../specs/constants';
import { CanvasTextBBoxCalculator } from '../../../utils/bbox/canvas_text_bbox_calculator';
import { SvgTextBBoxCalculator } from '../../../utils/bbox/svg_text_bbox_calculator';
import { Position, mergePartial } from '../../../utils/common';
import { niceTimeFormatter } from '../../../utils/data/formatters';
import { OrdinalDomain } from '../../../utils/domain';
import { AxisId, GroupId } from '../../../utils/ids';
import { LIGHT_THEME } from '../../../utils/themes/light_theme';
import { AxisStyle, TextOffset } from '../../../utils/themes/theme';
import { computeAxesGeometriesSelector } from '../state/selectors/compute_axes_geometries';
import { computeAxisTicksDimensionsSelector } from '../state/selectors/compute_axis_ticks_dimensions';
import { getScale, SmallMultipleScales } from '../state/selectors/compute_small_multiple_scales';
import { getAxesStylesSelector } from '../state/selectors/get_axis_styles';
import { computeGridLinesSelector } from '../state/selectors/get_grid_lines';
import { mergeYCustomDomainsByGroupId } from '../state/selectors/merge_y_custom_domains';
import {
  AxisTick,
  AxisViewModel,
  axisViewModel,
  computeRotatedLabelDimensions,
  getAvailableTicks,
  getAxisPosition,
  getAxesGeometries,
  getHorizontalAxisTickLineProps,
  getMinMaxRange,
  getScaleForAxisSpec,
  getTickLabelProps,
  getVerticalAxisTickLineProps,
  getVisibleTicks,
  isYDomain,
  enableDuplicatedTicks,
  defaultTickFormatter,
} from './axis_utils';
import { computeXScale } from './scales';
import { AxisSpec, DomainRange, DEFAULT_GLOBAL_ID } from './specs';

const NO_ROTATION = 0;

const getCustomStyle = (rotation = 0, padding = 10): AxisStyle =>
  mergePartial(LIGHT_THEME.axes, {
    tickLine: {
      size: 10,
      padding,
    },
    tickLabel: {
      fontSize: 16,
      fontFamily: 'Arial',
      rotation,
    },
  });
const style = getCustomStyle();

describe('Axis computational utils', () => {
  const mockedRect = {
    x: 0,
    y: 0,
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    width: 10,
    height: 10,
    toJSON: () => '',
  };
  const originalGetBBox = SVGElement.prototype.getBoundingClientRect;

  beforeEach(
    () =>
      (SVGElement.prototype.getBoundingClientRect = function () {
        const text = this.textContent || 0;
        return { ...mockedRect, width: Number(text) * 10, height: Number(text) * 10 };
      }),
  );
  afterEach(() => (SVGElement.prototype.getBoundingClientRect = originalGetBBox));

  const chartDim = {
    width: 100,
    height: 100,
    top: 0,
    left: 0,
  };
  const axis1Dims = {
    tickValues: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
    tickLabels: ['0', '0.1', '0.2', '0.3', '0.4', '0.5', '0.6', '0.7', '0.8', '0.9', '1'],
    maxLabelBboxWidth: 10,
    maxLabelBboxHeight: 10,
    maxLabelTextWidth: 10,
    maxLabelTextHeight: 10,
    isHidden: false,
  };
  const verticalAxisSpec = MockGlobalSpec.axis({
    chartType: ChartType.XYAxis,
    specType: SpecType.Axis,
    id: 'axis_1',
    title: 'Axis 1',
    groupId: 'group_1',
    hide: false,
    showOverlappingTicks: false,
    showOverlappingLabels: false,
    position: Position.Left,
    style,
    showGridLines: true,
    integersOnly: false,
  });

  const horizontalAxisSpec = MockGlobalSpec.axis({
    chartType: ChartType.XYAxis,
    specType: SpecType.Axis,
    id: 'axis_2',
    title: 'Axis 2',
    groupId: 'group_1',
    hide: false,
    showOverlappingTicks: false,
    showOverlappingLabels: false,
    position: Position.Top,
    style,
    integersOnly: false,
  });

  const verticalAxisSpecWTitle = MockGlobalSpec.axis({
    chartType: ChartType.XYAxis,
    specType: SpecType.Axis,
    id: 'axis_1',
    groupId: 'group_1',
    title: 'v axis',
    hide: false,
    showOverlappingTicks: false,
    showOverlappingLabels: false,
    position: Position.Left,
    style,
    showGridLines: true,
    integersOnly: false,
  });
  const xAxisWithTime = MockGlobalSpec.axis({
    chartType: ChartType.XYAxis,
    specType: SpecType.Axis,
    id: 'axis_1',
    groupId: 'group_1',
    title: 'v axis',
    hide: false,
    showOverlappingTicks: false,
    showOverlappingLabels: false,
    position: Position.Bottom,
    style,
    tickFormat: niceTimeFormatter([1551438000000, 1551441300000]),
    showGridLines: true,
    integersOnly: false,
  });

  const lineSeriesSpec = MockSeriesSpec.line({
    id: 'line',
    groupId: 'group_1',
    xAccessor: 0,
    yAccessors: [1],
    xScaleType: ScaleType.Linear,
    yScaleType: ScaleType.Linear,
    data: [
      [0, 0],
      [0.5, 0.5],
      [1, 1],
    ],
  });
  const xDomain = MockXDomain.fromScaleType(ScaleType.Linear, {
    domain: [0, 1],
    isBandScale: false,
    minInterval: 0,
  });

  const yDomain = MockYDomain.fromScaleType(ScaleType.Linear, {
    groupId: 'group_1',
    domain: [0, 1],
    isBandScale: false,
  });

  const getSmScales = (smHDomain: OrdinalDomain = [], smVDomain: OrdinalDomain = []): SmallMultipleScales => ({
    horizontal: getScale(smHDomain, chartDim.width),
    vertical: getScale(smVDomain, chartDim.height),
  });

  const emptySmScales = getSmScales();

  const axisTitleStyles = (titleHeight: number, panelTitleHeight?: number) =>
    mergePartial(LIGHT_THEME.axes, {
      axisTitle: {
        fontSize: titleHeight,
        padding: {
          inner: 0,
          outer: 10,
        },
      },
      axisPanelTitle: {
        fontSize: panelTitleHeight,
      },
    });

  const { axes } = LIGHT_THEME;

  test('should compute axis dimensions', () => {
    const bboxCalculator = new SvgTextBBoxCalculator();
    const axisDimensions = axisViewModel(
      verticalAxisSpec,
      xDomain,
      [yDomain],
      1,
      bboxCalculator,
      NO_ROTATION,
      axes,
      (v) => `${v}`,
    );
    expect(axisDimensions).toEqual(axis1Dims);

    const ungroupedAxisSpec = { ...verticalAxisSpec, groupId: 'foo' };
    const result = axisViewModel(
      ungroupedAxisSpec,
      xDomain,
      [yDomain],
      1,
      bboxCalculator,
      NO_ROTATION,
      axes,
      (v) => `${v}`,
      undefined,
      false,
    );

    expect(result).toBeNull();

    bboxCalculator.destroy();
  });

  test('should not compute axis dimensions when spec is configured to hide', () => {
    const bboxCalculator = new CanvasTextBBoxCalculator();
    verticalAxisSpec.hide = true;
    const axisDimensions = axisViewModel(
      verticalAxisSpec,
      xDomain,
      [yDomain],
      1,
      bboxCalculator,
      NO_ROTATION,
      axes,
      (v) => `${v}`,
    );
    expect(axisDimensions).toBe(null);
  });

  test('should compute axis dimensions with timeZone', () => {
    const bboxCalculator = new SvgTextBBoxCalculator();
    const xDomain = MockXDomain.fromScaleType(ScaleType.Time, {
      domain: [1551438000000, 1551441300000],
      isBandScale: false,
      minInterval: 0,
      timeZone: 'utc',
    });
    let axisDimensions = axisViewModel(
      xAxisWithTime,
      xDomain,
      [yDomain],
      1,
      bboxCalculator,
      NO_ROTATION,
      axes,
      (v) => `${v}`,
    );
    expect(axisDimensions).not.toBeNull();
    expect(axisDimensions?.tickLabels[0]).toBe('11:00:00');
    expect(axisDimensions?.tickLabels[11]).toBe('11:55:00');

    axisDimensions = axisViewModel(
      xAxisWithTime,
      {
        ...xDomain,
        timeZone: 'utc+3',
      },
      [yDomain],
      1,
      bboxCalculator,
      NO_ROTATION,
      axes,
      (v) => `${v}`,
    );
    expect(axisDimensions).not.toBeNull();
    expect(axisDimensions?.tickLabels[0]).toBe('14:00:00');
    expect(axisDimensions?.tickLabels[11]).toBe('14:55:00');

    axisDimensions = axisViewModel(
      xAxisWithTime,
      {
        ...xDomain,
        timeZone: 'utc-3',
      },
      [yDomain],
      1,
      bboxCalculator,
      NO_ROTATION,
      axes,
      (v) => `${v}`,
    );
    expect(axisDimensions).not.toBeNull();
    expect(axisDimensions?.tickLabels[0]).toBe('08:00:00');
    expect(axisDimensions?.tickLabels[11]).toBe('08:55:00');

    bboxCalculator.destroy();
  });

  test('should compute dimensions for the bounding box containing a rotated label', () => {
    expect(computeRotatedLabelDimensions({ width: 1, height: 2 }, 0)).toEqual({
      width: 1,
      height: 2,
    });

    const dims90 = computeRotatedLabelDimensions({ width: 1, height: 2 }, 90);
    expect(dims90.width).toBeCloseTo(2);
    expect(dims90.height).toBeCloseTo(1);

    const dims45 = computeRotatedLabelDimensions({ width: 1, height: 1 }, 45);
    expect(dims45.width).toBeCloseTo(Math.sqrt(2));
    expect(dims45.height).toBeCloseTo(Math.sqrt(2));
  });

  test('should generate a valid scale', () => {
    const yScale = getScaleForAxisSpec(verticalAxisSpec, xDomain, [yDomain], 0, 0, [100, 0]);
    expect(yScale).toBeDefined();
    expect(yScale?.bandwidth).toBe(0);
    expect(yScale?.domain).toEqual([0, 1]);
    expect(yScale?.range).toEqual([100, 0]);
    expect(yScale?.ticks()).toEqual([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]);

    const ungroupedAxisSpec = { ...verticalAxisSpec, groupId: 'foo' };
    const nullYScale = getScaleForAxisSpec(ungroupedAxisSpec, xDomain, [yDomain], 0, 0, [100, 0]);
    expect(nullYScale).toBe(null);

    const xScale = getScaleForAxisSpec(horizontalAxisSpec, xDomain, [yDomain], 0, 0, [100, 0]);
    expect(xScale).toBeDefined();
  });

  const axisDimensions: AxisViewModel = {
    maxLabelBboxWidth: 100,
    maxLabelBboxHeight: 100,
    maxLabelTextHeight: 100,
    maxLabelTextWidth: 100,
    tickLabels: [],
    tickValues: [],
    isHidden: false,
  };
  const offset: TextOffset = {
    x: 0,
    y: 0,
    reference: 'global',
  };

  describe('getAvailableTicks', () => {
    test('should compute to end of domain when histogram mode not enabled', () => {
      const scale = getScaleForAxisSpec(verticalAxisSpec, xDomain, [yDomain], 0, 0, [100, 0]);
      const axisPositions = getAvailableTicks(verticalAxisSpec, scale!, 0, false, (v) => `${v}`, 0);
      const expectedAxisPositions = [
        { label: '0', position: 100, value: 0 },
        { label: '0.1', position: 90, value: 0.1 },
        { label: '0.2', position: 80, value: 0.2 },
        { label: '0.3', position: 70, value: 0.3 },
        { label: '0.4', position: 60, value: 0.4 },
        { label: '0.5', position: 50, value: 0.5 },
        { label: '0.6', position: 40, value: 0.6 },
        { label: '0.7', position: 30, value: 0.7 },
        { label: '0.8', position: 20, value: 0.8 },
        { label: '0.9', position: 10, value: 0.9 },
        { label: '1', position: 0, value: 1 },
      ];
      expect(axisPositions).toEqual(expectedAxisPositions);
    });

    test('should compute positions with rotational offset', () => {
      const rotationalOffset = 2;
      const scale = getScaleForAxisSpec(verticalAxisSpec, xDomain, [yDomain], 0, 0, [100, 0]);
      const axisPositions = getAvailableTicks(verticalAxisSpec, scale!, 0, false, (v) => `${v}`, rotationalOffset);
      const expectedAxisPositions = [
        { label: '0', position: 100 + rotationalOffset, value: 0 },
        { label: '0.1', position: 90 + rotationalOffset, value: 0.1 },
        { label: '0.2', position: 80 + rotationalOffset, value: 0.2 },
        { label: '0.3', position: 70 + rotationalOffset, value: 0.3 },
        { label: '0.4', position: 60 + rotationalOffset, value: 0.4 },
        { label: '0.5', position: 50 + rotationalOffset, value: 0.5 },
        { label: '0.6', position: 40 + rotationalOffset, value: 0.6 },
        { label: '0.7', position: 30 + rotationalOffset, value: 0.7 },
        { label: '0.8', position: 20 + rotationalOffset, value: 0.8 },
        { label: '0.9', position: 10 + rotationalOffset, value: 0.9 },
        { label: '1', position: rotationalOffset, value: 1 },
      ];
      expect(axisPositions).toEqual(expectedAxisPositions);
    });

    test('should extend ticks to domain + minInterval in histogram mode for linear scale', () => {
      const enableHistogramMode = true;
      const xBandDomain = MockXDomain.fromScaleType(ScaleType.Linear, {
        domain: [0, 100],
        isBandScale: true,
        minInterval: 10,
      });
      const xScale = getScaleForAxisSpec(horizontalAxisSpec, xBandDomain, [yDomain], 1, 0, [100, 0]);
      const histogramAxisPositions = getAvailableTicks(
        horizontalAxisSpec,
        xScale!,
        1,
        enableHistogramMode,
        (v) => `${v}`,
        0,
      );
      const histogramTickLabels = histogramAxisPositions.map(({ label }: AxisTick) => label);
      expect(histogramTickLabels).toEqual(['0', '10', '20', '30', '40', '50', '60', '70', '80', '90', '100', '110']);
    });

    test('should extend ticks to domain + minInterval in histogram mode for time scale', () => {
      const enableHistogramMode = true;
      const xBandDomain = MockXDomain.fromScaleType(ScaleType.Time, {
        domain: [1560438420000, 1560438510000],
        isBandScale: true,
        minInterval: 90000,
      });
      const xScale = getScaleForAxisSpec(horizontalAxisSpec, xBandDomain, [yDomain], 1, 0, [100, 0]);
      const histogramAxisPositions = getAvailableTicks(
        horizontalAxisSpec,
        xScale!,
        1,
        enableHistogramMode,
        (v) => `${v}`,
        0,
      );
      const histogramTickValues = histogramAxisPositions.map(({ value }: AxisTick) => value);

      const expectedTickValues = [
        1560438420000,
        1560438435000,
        1560438450000,
        1560438465000,
        1560438480000,
        1560438495000,
        1560438510000,
        1560438525000,
        1560438540000,
        1560438555000,
        1560438570000,
        1560438585000,
        1560438600000,
      ];

      expect(histogramTickValues).toEqual(expectedTickValues);
    });

    test('should extend ticks to domain + minInterval in histogram mode for a scale with single datum', () => {
      const enableHistogramMode = true;
      const xBandDomain = MockXDomain.fromScaleType(ScaleType.Time, {
        domain: [1560438420000, 1560438420000], // a single datum scale will have the same value for domain start & end
        isBandScale: true,
        minInterval: 90000,
      });
      const xScale = getScaleForAxisSpec(horizontalAxisSpec, xBandDomain, [yDomain], 1, 0, [100, 0]);
      const histogramAxisPositions = getAvailableTicks(
        horizontalAxisSpec,
        xScale!,
        1,
        enableHistogramMode,
        (v) => `${v}`,
        0,
      );
      const histogramTickValues = histogramAxisPositions.map(({ value }: AxisTick) => value);
      const expectedTickValues = [1560438420000, 1560438510000];

      expect(histogramTickValues).toEqual(expectedTickValues);
    });
  });
  test('should compute visible ticks for a vertical axis', () => {
    const allTicks = [
      { label: '0', position: 100, value: 0 },
      { label: '0.1', position: 90, value: 0.1 },
      { label: '0.2', position: 80, value: 0.2 },
      { label: '0.3', position: 70, value: 0.3 },
      { label: '0.4', position: 60, value: 0.4 },
      { label: '0.5', position: 50, value: 0.5 },
      { label: '0.6', position: 40, value: 0.6 },
      { label: '0.7', position: 30, value: 0.7 },
      { label: '0.8', position: 20, value: 0.8 },
      { label: '0.9', position: 10, value: 0.9 },
      { label: '1', position: 0, value: 1 },
    ];
    const visibleTicks = getVisibleTicks(allTicks, verticalAxisSpec, axis1Dims);
    const expectedVisibleTicks = [
      { label: '1', position: 0, value: 1 },
      { label: '0.9', position: 10, value: 0.9 },
      { label: '0.8', position: 20, value: 0.8 },
      { label: '0.7', position: 30, value: 0.7 },
      { label: '0.6', position: 40, value: 0.6 },
      { label: '0.5', position: 50, value: 0.5 },
      { label: '0.4', position: 60, value: 0.4 },
      { label: '0.3', position: 70, value: 0.3 },
      { label: '0.2', position: 80, value: 0.2 },
      { label: '0.1', position: 90, value: 0.1 },
      { label: '0', position: 100, value: 0 },
    ];
    expect(visibleTicks).toEqual(expectedVisibleTicks);
  });
  test('should compute visible ticks for a horizontal axis', () => {
    const allTicks = [
      { label: '0', position: 100, value: 0 },
      { label: '0.1', position: 90, value: 0.1 },
      { label: '0.2', position: 80, value: 0.2 },
      { label: '0.3', position: 70, value: 0.3 },
      { label: '0.4', position: 60, value: 0.4 },
      { label: '0.5', position: 50, value: 0.5 },
      { label: '0.6', position: 40, value: 0.6 },
      { label: '0.7', position: 30, value: 0.7 },
      { label: '0.8', position: 20, value: 0.8 },
      { label: '0.9', position: 10, value: 0.9 },
      { label: '1', position: 0, value: 1 },
    ];
    const visibleTicks = getVisibleTicks(allTicks, horizontalAxisSpec, axis1Dims);
    const expectedVisibleTicks = [
      { label: '1', position: 0, value: 1 },
      { label: '0.9', position: 10, value: 0.9 },
      { label: '0.8', position: 20, value: 0.8 },
      { label: '0.7', position: 30, value: 0.7 },
      { label: '0.6', position: 40, value: 0.6 },
      { label: '0.5', position: 50, value: 0.5 },
      { label: '0.4', position: 60, value: 0.4 },
      { label: '0.3', position: 70, value: 0.3 },
      { label: '0.2', position: 80, value: 0.2 },
      { label: '0.1', position: 90, value: 0.1 },
      { label: '0', position: 100, value: 0 },
    ];

    expect(visibleTicks).toEqual(expectedVisibleTicks);
  });
  test('should hide some ticks', () => {
    const allTicks = [
      { label: '0', position: 100, value: 0 },
      { label: '0.1', position: 90, value: 0.1 },
      { label: '0.2', position: 80, value: 0.2 },
      { label: '0.3', position: 70, value: 0.3 },
      { label: '0.4', position: 60, value: 0.4 },
      { label: '0.5', position: 50, value: 0.5 },
      { label: '0.6', position: 40, value: 0.6 },
      { label: '0.7', position: 30, value: 0.7 },
      { label: '0.8', position: 20, value: 0.8 },
      { label: '0.9', position: 10, value: 0.9 },
      { label: '1', position: 0, value: 1 },
    ];
    const axis2Dims = {
      axisScaleType: ScaleType.Linear,
      axisScaleDomain: [0, 1],
      tickValues: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
      tickLabels: ['0', '0.1', '0.2', '0.3', '0.4', '0.5', '0.6', '0.7', '0.8', '0.9', '1'],
      maxLabelBboxWidth: 10,
      maxLabelBboxHeight: 20,
      maxLabelTextWidth: 10,
      maxLabelTextHeight: 20,
      isHidden: false,
    };
    const visibleTicks = getVisibleTicks(allTicks, verticalAxisSpec, axis2Dims);
    const expectedVisibleTicks = [
      { label: '1', position: 0, value: 1 },
      { label: '0.8', position: 20, value: 0.8 },
      { label: '0.6', position: 40, value: 0.6 },
      { label: '0.4', position: 60, value: 0.4 },
      { label: '0.2', position: 80, value: 0.2 },
      { label: '0', position: 100, value: 0 },
    ];
    expect(visibleTicks).toEqual(expectedVisibleTicks);
  });
  test('should show all overlapping ticks and labels if configured to', () => {
    const allTicks = [
      { label: '0', position: 100, value: 0 },
      { label: '0.1', position: 90, value: 0.1 },
      { label: '0.2', position: 80, value: 0.2 },
      { label: '0.3', position: 70, value: 0.3 },
      { label: '0.4', position: 60, value: 0.4 },
      { label: '0.5', position: 50, value: 0.5 },
      { label: '0.6', position: 40, value: 0.6 },
      { label: '0.7', position: 30, value: 0.7 },
      { label: '0.8', position: 20, value: 0.8 },
      { label: '0.9', position: 10, value: 0.9 },
      { label: '1', position: 0, value: 1 },
    ];
    const axis2Dims = {
      axisScaleType: ScaleType.Linear,
      axisScaleDomain: [0, 1],
      tickValues: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
      tickLabels: ['0', '0.1', '0.2', '0.3', '0.4', '0.5', '0.6', '0.7', '0.8', '0.9', '1'],
      maxLabelBboxWidth: 10,
      maxLabelBboxHeight: 20,
      maxLabelTextWidth: 10,
      maxLabelTextHeight: 20,
      isHidden: false,
    };

    verticalAxisSpec.showOverlappingTicks = true;
    verticalAxisSpec.showOverlappingLabels = true;
    const visibleOverlappingTicks = getVisibleTicks(allTicks, verticalAxisSpec, axis2Dims);
    const expectedVisibleOverlappingTicks = [
      { label: '1', position: 0, value: 1 },
      { label: '0.9', position: 10, value: 0.9 },
      { label: '0.8', position: 20, value: 0.8 },
      { label: '0.7', position: 30, value: 0.7 },
      { label: '0.6', position: 40, value: 0.6 },
      { label: '0.5', position: 50, value: 0.5 },
      { label: '0.4', position: 60, value: 0.4 },
      { label: '0.3', position: 70, value: 0.3 },
      { label: '0.2', position: 80, value: 0.2 },
      { label: '0.1', position: 90, value: 0.1 },
      { label: '0', position: 100, value: 0 },
    ];
    expect(visibleOverlappingTicks).toEqual(expectedVisibleOverlappingTicks);

    verticalAxisSpec.showOverlappingTicks = true;
    verticalAxisSpec.showOverlappingLabels = false;
    const visibleOverlappingTicksAndLabels = getVisibleTicks(allTicks, verticalAxisSpec, axis2Dims);
    const expectedVisibleOverlappingTicksAndLabels = [
      { label: '1', position: 0, value: 1 },
      { label: '', position: 10, value: 0.9 },
      { label: '0.8', position: 20, value: 0.8 },
      { label: '', position: 30, value: 0.7 },
      { label: '0.6', position: 40, value: 0.6 },
      { label: '', position: 50, value: 0.5 },
      { label: '0.4', position: 60, value: 0.4 },
      { label: '', position: 70, value: 0.3 },
      { label: '0.2', position: 80, value: 0.2 },
      { label: '', position: 90, value: 0.1 },
      { label: '0', position: 100, value: 0 },
    ];
    expect(visibleOverlappingTicksAndLabels).toEqual(expectedVisibleOverlappingTicksAndLabels);
  });
  test('should compute min max range for on 0 deg bottom', () => {
    const minMax = getMinMaxRange(Position.Bottom, 0, {
      width: 100,
      height: 50,
    });
    expect(minMax).toEqual({ minRange: 0, maxRange: 100 });
  });
  test('should compute min max range for on 90 deg bottom', () => {
    const minMax = getMinMaxRange(Position.Bottom, 90, {
      width: 100,
      height: 50,
    });
    expect(minMax).toEqual({ minRange: 0, maxRange: 100 });
  });
  test('should compute min max range for on 180 deg bottom', () => {
    const minMax = getMinMaxRange(Position.Bottom, 180, {
      width: 100,
      height: 50,
    });
    expect(minMax).toEqual({ minRange: 100, maxRange: 0 });
  });
  test('should compute min max range for on -90 deg bottom', () => {
    const minMax = getMinMaxRange(Position.Bottom, -90, {
      width: 100,
      height: 50,
    });
    expect(minMax).toEqual({ minRange: 100, maxRange: 0 });
  });
  test('should compute min max range for on 90 deg Left', () => {
    const minMax = getMinMaxRange(Position.Left, 90, {
      width: 100,
      height: 50,
    });
    expect(minMax).toEqual({ minRange: 0, maxRange: 50 });
  });
  test('should compute min max range for on 180 deg Left', () => {
    const minMax = getMinMaxRange(Position.Left, 180, {
      width: 100,
      height: 50,
    });
    expect(minMax).toEqual({ minRange: 0, maxRange: 50 });
  });
  test('should compute min max range for on -90 deg Right', () => {
    const minMax = getMinMaxRange(Position.Right, -90, {
      width: 100,
      height: 50,
    });
    expect(minMax).toEqual({ minRange: 50, maxRange: 0 });
  });

  test('should compute positions and alignment of tick labels along a vertical axis', () => {
    const tickPosition = 0;
    const axisPosition = {
      top: 0,
      left: 0,
      width: 100,
      height: 10,
    };
    const unrotatedLabelProps = getTickLabelProps(
      getCustomStyle(0, 5),
      tickPosition,
      Position.Left,
      0,
      axisPosition,
      axisDimensions,
      true,
      offset,
    );

    expect(unrotatedLabelProps).toEqual({
      offsetX: -50,
      offsetY: 0,
      textOffsetX: 50,
      textOffsetY: 0,
      x: 85,
      y: 0,
      horizontalAlign: 'right',
      verticalAlign: 'middle',
    });

    const rotatedLabelProps = getTickLabelProps(
      getCustomStyle(90),
      tickPosition,
      Position.Left,
      90,
      axisPosition,
      axisDimensions,
      true,
      offset,
      {
        vertical: 'middle',
        horizontal: 'center',
      },
    );

    expect(rotatedLabelProps).toEqual({
      offsetX: -50,
      offsetY: 0,
      textOffsetX: 0,
      textOffsetY: 0,
      x: 80,
      y: 0,
      horizontalAlign: 'center',
      verticalAlign: 'middle',
    });

    const rightRotatedLabelProps = getTickLabelProps(
      getCustomStyle(90),
      tickPosition,
      Position.Right,
      90,
      axisPosition,
      axisDimensions,
      true,
      offset,
      {
        horizontal: 'center',
        vertical: 'middle',
      },
    );

    expect(rightRotatedLabelProps).toEqual({
      offsetX: 50,
      offsetY: 0,
      textOffsetX: 0,
      textOffsetY: 0,
      x: 20,
      y: 0,
      horizontalAlign: 'center',
      verticalAlign: 'middle',
    });

    const rightUnrotatedLabelProps = getTickLabelProps(
      getCustomStyle(),
      tickPosition,
      Position.Right,
      0,
      axisPosition,
      axisDimensions,
      true,
      offset,
    );

    expect(rightUnrotatedLabelProps).toEqual({
      offsetX: 50,
      offsetY: 0,
      textOffsetX: -50,
      textOffsetY: 0,
      x: 20,
      y: 0,
      horizontalAlign: 'left',
      verticalAlign: 'middle',
    });
  });

  test('should compute positions and alignment of tick labels along a horizontal axis', () => {
    const tickPosition = 0;
    const axisPosition = {
      top: 0,
      left: 0,
      width: 100,
      height: 10,
    };
    const unrotatedLabelProps = getTickLabelProps(
      getCustomStyle(0, 5),
      tickPosition,
      Position.Top,
      0,
      axisPosition,
      axisDimensions,
      true,
      offset,
      {
        horizontal: 'center',
        vertical: 'bottom',
      },
    );

    expect(unrotatedLabelProps).toEqual({
      offsetX: 0,
      offsetY: -50,
      textOffsetY: 50,
      textOffsetX: 0,
      x: 0,
      y: -5,
      horizontalAlign: 'center',
      verticalAlign: 'bottom',
    });

    const rotatedLabelProps = getTickLabelProps(
      getCustomStyle(90),
      tickPosition,
      Position.Top,
      90,
      axisPosition,
      axisDimensions,
      true,
      offset,
    );

    expect(rotatedLabelProps).toEqual({
      offsetX: 0,
      offsetY: -50,
      textOffsetX: 50,
      textOffsetY: 0,
      x: 0,
      y: -10,
      horizontalAlign: 'right',
      verticalAlign: 'middle',
    });

    const bottomRotatedLabelProps = getTickLabelProps(
      getCustomStyle(90),
      tickPosition,
      Position.Bottom,
      90,
      axisPosition,
      axisDimensions,
      true,
      offset,
    );

    expect(bottomRotatedLabelProps).toEqual({
      offsetX: 0,
      offsetY: 50,
      textOffsetX: -50,
      textOffsetY: 0,
      x: 0,
      y: 20,
      horizontalAlign: 'left',
      verticalAlign: 'middle',
    });

    const bottomUnrotatedLabelProps = getTickLabelProps(
      getCustomStyle(90),
      tickPosition,
      Position.Bottom,
      90,
      axisPosition,
      axisDimensions,
      true,
      offset,
      {
        horizontal: 'center',
        vertical: 'top',
      },
    );

    expect(bottomUnrotatedLabelProps).toEqual({
      offsetX: 0,
      offsetY: 50,
      textOffsetX: 0,
      textOffsetY: -50,
      x: 0,
      y: 20,
      horizontalAlign: 'center',
      verticalAlign: 'top',
    });
  });

  test('should compute axis tick line positions', () => {
    const tickPadding = 5;
    const tickSize = 10;
    const tickPosition = 10;
    const axisHeight = 20;

    const leftAxisTickLinePositions = getVerticalAxisTickLineProps(Position.Left, tickPadding, tickSize, tickPosition);

    expect(leftAxisTickLinePositions).toEqual({ x1: 5, y1: 10, x2: -5, y2: 10 });

    const rightAxisTickLinePositions = getVerticalAxisTickLineProps(
      Position.Right,
      tickPadding,
      tickSize,
      tickPosition,
    );

    expect(rightAxisTickLinePositions).toEqual({ x1: 0, y1: 10, x2: 10, y2: 10 });

    const topAxisTickLinePositions = getHorizontalAxisTickLineProps(Position.Top, axisHeight, tickSize, tickPosition);

    expect(topAxisTickLinePositions).toEqual({ x1: 10, y1: 10, x2: 10, y2: 20 });

    const bottomAxisTickLinePositions = getHorizontalAxisTickLineProps(
      Position.Bottom,
      axisHeight,
      tickSize,
      tickPosition,
    );

    expect(bottomAxisTickLinePositions).toEqual({ x1: 10, y1: 0, x2: 10, y2: 10 });
  });

  test('should compute axis ticks positions with title', () => {
    // validate assumptions for test
    expect(verticalAxisSpec.id).toEqual(verticalAxisSpecWTitle.id);

    const axisSpecs = [verticalAxisSpecWTitle];
    const axesStyles = new Map();
    const axisDims = new Map();
    axisDims.set(verticalAxisSpecWTitle.id, axis1Dims);

    let axisTicksPosition = getAxesGeometries(
      {
        chartDimensions: chartDim,
        leftMargin: 0,
      },
      LIGHT_THEME,
      NO_ROTATION,
      axisSpecs,
      axisDims,
      axesStyles,
      xDomain,
      [yDomain],
      emptySmScales,
      1,
      false,
      (v) => `${v}`,
    );

    const verticalAxisGeoms = axisTicksPosition.find(({ axis: { id } }) => id === verticalAxisSpecWTitle.id);
    expect(verticalAxisGeoms?.anchorPoint).toEqual({
      y: 0,
      x: 10,
    });
    expect(verticalAxisGeoms?.size).toEqual({
      width: 50,
      height: 100,
    });

    axisSpecs[0] = verticalAxisSpec;

    axisDims.set(verticalAxisSpec.id, axis1Dims);

    axisTicksPosition = getAxesGeometries(
      {
        chartDimensions: chartDim,
        leftMargin: 0,
      },
      LIGHT_THEME,
      NO_ROTATION,
      axisSpecs,
      axisDims,
      axesStyles,
      xDomain,
      [yDomain],
      emptySmScales,
      1,
      false,
      (v) => `${v}`,
    );
    const verticalAxisSpecWTitleGeoms = axisTicksPosition.find(({ axis: { id } }) => id === verticalAxisSpecWTitle.id);
    expect(verticalAxisSpecWTitleGeoms?.anchorPoint).toEqual({
      y: 0,
      x: 10,
    });
    expect(verticalAxisSpecWTitleGeoms?.size).toEqual({
      width: 30,
      height: 100,
    });
  });

  test('should compute left axis position', () => {
    const axisTitleHeight = 10;
    const cumTopSum = 10;
    const cumBottomSum = 10;
    const cumLeftSum = 10;
    const cumRightSum = 10;

    const leftAxisPosition = getAxisPosition(
      chartDim,
      LIGHT_THEME.chartMargins,
      axisTitleStyles(axisTitleHeight).axisTitle,
      axisTitleStyles(axisTitleHeight).axisPanelTitle,
      verticalAxisSpec,
      axis1Dims,
      emptySmScales,
      cumTopSum,
      cumBottomSum,
      cumLeftSum,
      cumRightSum,
      10,
      0,
      true,
    );

    const expectedLeftAxisPosition = {
      dimensions: {
        height: 100,
        width: 40,
        left: 20,
        top: 0,
      },
      topIncrement: 0,
      bottomIncrement: 0,
      leftIncrement: 50,
      rightIncrement: 0,
    };

    expect(leftAxisPosition).toEqual(expectedLeftAxisPosition);
  });

  test('should compute right axis position', () => {
    const axisTitleHeight = 10;
    const cumTopSum = 10;
    const cumBottomSum = 10;
    const cumLeftSum = 10;
    const cumRightSum = 10;

    verticalAxisSpec.position = Position.Right;
    const rightAxisPosition = getAxisPosition(
      chartDim,
      LIGHT_THEME.chartMargins,
      axisTitleStyles(axisTitleHeight).axisTitle,
      axisTitleStyles(axisTitleHeight).axisPanelTitle,
      verticalAxisSpec,
      axis1Dims,
      emptySmScales,
      cumTopSum,
      cumBottomSum,
      cumLeftSum,
      cumRightSum,
      10,
      0,
      true,
    );

    const expectedRightAxisPosition = {
      dimensions: {
        height: 100,
        width: 40,
        left: 110,
        top: 0,
      },
      topIncrement: 0,
      bottomIncrement: 0,
      leftIncrement: 0,
      rightIncrement: 50,
    };

    expect(rightAxisPosition).toEqual(expectedRightAxisPosition);
  });

  test('should compute top axis position', () => {
    const axisTitleHeight = 10;
    const cumTopSum = 10;
    const cumBottomSum = 10;
    const cumLeftSum = 10;
    const cumRightSum = 10;

    horizontalAxisSpec.position = Position.Top;
    const topAxisPosition = getAxisPosition(
      chartDim,
      LIGHT_THEME.chartMargins,
      axisTitleStyles(axisTitleHeight).axisTitle,
      axisTitleStyles(axisTitleHeight).axisPanelTitle,
      horizontalAxisSpec,
      axis1Dims,
      emptySmScales,
      cumTopSum,
      cumBottomSum,
      cumLeftSum,
      cumRightSum,
      10,
      0,
      true,
    );
    const { size: tickSize, padding: tickPadding } = LIGHT_THEME.axes.tickLine;

    const expectedTopAxisPosition = {
      dimensions: {
        height: axis1Dims.maxLabelBboxHeight + axisTitleHeight + tickSize + tickPadding,
        width: 100,
        left: 0,
        top: cumTopSum + LIGHT_THEME.chartMargins.top,
      },
      topIncrement: 50,
      bottomIncrement: 0,
      leftIncrement: 0,
      rightIncrement: 0,
    };

    expect(topAxisPosition).toEqual(expectedTopAxisPosition);
  });

  test('should compute bottom axis position', () => {
    const axisTitleHeight = 10;
    const cumTopSum = 10;
    const cumBottomSum = 10;
    const cumLeftSum = 10;
    const cumRightSum = 10;

    horizontalAxisSpec.position = Position.Bottom;
    const bottomAxisPosition = getAxisPosition(
      chartDim,
      LIGHT_THEME.chartMargins,
      axisTitleStyles(axisTitleHeight).axisTitle,
      axisTitleStyles(axisTitleHeight).axisPanelTitle,
      horizontalAxisSpec,
      axis1Dims,
      emptySmScales,
      cumTopSum,
      cumBottomSum,
      cumLeftSum,
      cumRightSum,
      10,
      0,
      true,
    );

    const expectedBottomAxisPosition = {
      dimensions: {
        height: 40,
        width: 100,
        left: 0,
        top: 110,
      },
      topIncrement: 0,
      bottomIncrement: 50,
      leftIncrement: 0,
      rightIncrement: 0,
    };

    expect(bottomAxisPosition).toEqual(expectedBottomAxisPosition);
  });

  test('should not compute axis ticks positions if missaligned specs', () => {
    const axisSpecs = [verticalAxisSpec];
    const axisStyles = new Map();
    const axisDims = new Map<AxisId, AxisViewModel>();
    axisDims.set('not_a_mapped_one', axis1Dims);

    const axisTicksPosition = getAxesGeometries(
      {
        chartDimensions: chartDim,
        leftMargin: 0,
      },
      LIGHT_THEME,
      NO_ROTATION,
      axisSpecs,
      axisDims,
      axisStyles,
      xDomain,
      [yDomain],
      emptySmScales,
      1,
      false,
      (v) => `${v}`,
    );
    expect(axisTicksPosition).toHaveLength(0);
    // expect(axisTicksPosition.axisTicks.size).toBe(0);
    // expect(axisTicksPosition.axisGridLinesPositions.size).toBe(0);
    // expect(axisTicksPosition.axisVisibleTicks.size).toBe(0);
  });

  test('should compute axis ticks positions', () => {
    const store = MockStore.default();
    MockStore.addSpecs(
      [
        MockGlobalSpec.settingsNoMargins(),
        lineSeriesSpec,
        MockGlobalSpec.axis({
          ...verticalAxisSpec,
          hide: true,
          gridLine: {
            visible: true,
          },
        }),
      ],
      store,
    );
    const gridLines = computeGridLinesSelector(store.getState());

    const expectedVerticalAxisGridLines = [
      [0, 0, 100, 0],
      [0, 10, 100, 10],
      [0, 20, 100, 20],
      [0, 30, 100, 30],
      [0, 40, 100, 40],
      [0, 50, 100, 50],
      [0, 60, 100, 60],
      [0, 70, 100, 70],
      [0, 80, 100, 80],
      [0, 90, 100, 90],
      [0, 100, 100, 100],
    ];

    const [{ lines }] = gridLines[0].lineGroups;

    expect(lines.map(({ x1, y1, x2, y2 }) => [x1, y1, x2, y2])).toEqual(expectedVerticalAxisGridLines);

    const axisTicksPositionWithTopLegend = computeAxesGeometriesSelector(store.getState());

    const verticalAxisWithTopLegendPosition = axisTicksPositionWithTopLegend.find(
      ({ axis: { id } }) => id === verticalAxisSpec.id,
    );
    // TODO check the root cause of having with at 10 on previous implementation
    expect(verticalAxisWithTopLegendPosition?.size).toEqual({ height: 0, width: 0 });
    expect(verticalAxisWithTopLegendPosition?.anchorPoint).toEqual({ x: 100, y: 0 });

    const ungroupedAxisSpec = { ...verticalAxisSpec, groupId: 'foo' };
    const invalidSpecs = [ungroupedAxisSpec];
    const computeScalelessSpec = () => {
      const axisDims = computeAxisTicksDimensionsSelector(store.getState());
      const axisStyles = getAxesStylesSelector(store.getState());
      getAxesGeometries(
        {
          chartDimensions: chartDim,
          leftMargin: 0,
        },
        LIGHT_THEME,
        NO_ROTATION,
        invalidSpecs,
        axisDims,
        axisStyles,
        xDomain,
        [yDomain],
        emptySmScales,
        1,
        false,
        (v) => `${v}`,
      );
    };

    expect(computeScalelessSpec).toThrowError('Cannot compute scale for axis spec axis_1');
  });

  test('should determine if axis belongs to yDomain', () => {
    const verticalY = isYDomain(Position.Left, 0);
    expect(verticalY).toBe(true);

    const verticalX = isYDomain(Position.Left, 90);
    expect(verticalX).toBe(false);

    const horizontalX = isYDomain(Position.Top, 0);
    expect(horizontalX).toBe(false);

    const horizontalY = isYDomain(Position.Top, 90);
    expect(horizontalY).toBe(true);
  });

  test('should merge axis domains by group id', () => {
    const groupId = 'group_1';
    const domainRange1 = {
      min: 2,
      max: 9,
    };

    verticalAxisSpec.domain = domainRange1;

    const axesSpecs = [verticalAxisSpec];

    // Base case
    const expectedSimpleMap = new Map<GroupId, DomainRange>();
    expectedSimpleMap.set(groupId, { min: 2, max: 9 });

    const simpleDomainsByGroupId = mergeYCustomDomainsByGroupId(axesSpecs, 0);
    expect(simpleDomainsByGroupId).toEqual(expectedSimpleMap);

    // Multiple definitions for the same group
    const domainRange2 = {
      min: 0,
      max: 7,
    };

    const altVerticalAxisSpec = { ...verticalAxisSpec, id: 'axis2' };

    altVerticalAxisSpec.domain = domainRange2;
    axesSpecs.push(altVerticalAxisSpec);

    const expectedMergedMap = new Map<GroupId, DomainRange>();
    expectedMergedMap.set(groupId, { min: 0, max: 9 });

    const mergedDomainsByGroupId = mergeYCustomDomainsByGroupId(axesSpecs, 0);
    expect(mergedDomainsByGroupId).toEqual(expectedMergedMap);

    // xDomain limit (bad config)
    horizontalAxisSpec.domain = {
      min: 5,
      max: 15,
    };
    axesSpecs.push(horizontalAxisSpec);

    const attemptToMerge = () => {
      mergeYCustomDomainsByGroupId(axesSpecs, 0);
    };

    expect(attemptToMerge).toThrowError('[Axis axis_2]: custom domain for xDomain should be defined in Settings');
  });

  test('should merge axis domains by group id: partial upper bounded prevDomain with complete domain', () => {
    const groupId = 'group_1';
    const domainRange1 = {
      max: 9,
    };

    const domainRange2 = {
      min: 0,
      max: 7,
    };

    verticalAxisSpec.domain = domainRange1;

    const axis2 = { ...verticalAxisSpec, id: 'axis2' };

    axis2.domain = domainRange2;
    const axesSpecs = [verticalAxisSpec, axis2];

    const expectedMergedMap = new Map<GroupId, DomainRange>();
    expectedMergedMap.set(groupId, { min: 0, max: 9 });

    const mergedDomainsByGroupId = mergeYCustomDomainsByGroupId(axesSpecs, 0);
    expect(mergedDomainsByGroupId).toEqual(expectedMergedMap);
  });

  test('should merge axis domains by group id: partial lower bounded prevDomain with complete domain', () => {
    const groupId = 'group_1';
    const domainRange1 = {
      min: -1,
    };

    const domainRange2 = {
      min: 0,
      max: 7,
    };

    verticalAxisSpec.domain = domainRange1;
    const axis2 = { ...verticalAxisSpec, id: 'axis2' };

    const axesSpecs = [verticalAxisSpec, axis2];

    axis2.domain = domainRange2;

    const expectedMergedMap = new Map<GroupId, DomainRange>();
    expectedMergedMap.set(groupId, { min: -1, max: 7 });

    const mergedDomainsByGroupId = mergeYCustomDomainsByGroupId(axesSpecs, 0);
    expect(mergedDomainsByGroupId).toEqual(expectedMergedMap);
  });

  test('should merge axis domains by group id: partial upper bounded prevDomain with lower bounded domain', () => {
    const groupId = 'group_1';
    const domainRange1 = {
      max: 9,
    };

    const domainRange2 = {
      min: 0,
    };

    const domainRange3 = {
      min: -1,
    };

    verticalAxisSpec.domain = domainRange1;

    const axesSpecs = [];
    axesSpecs.push(verticalAxisSpec);

    const axis2 = { ...verticalAxisSpec, id: 'axis2' };

    axis2.domain = domainRange2;
    axesSpecs.push(axis2);

    const axis3 = { ...verticalAxisSpec, id: 'axis3' };

    axis3.domain = domainRange3;
    axesSpecs.push(axis3);

    const expectedMergedMap = new Map<GroupId, DomainRange>();
    expectedMergedMap.set(groupId, { min: -1, max: 9 });

    const mergedDomainsByGroupId = mergeYCustomDomainsByGroupId(axesSpecs, 0);
    expect(mergedDomainsByGroupId).toEqual(expectedMergedMap);
  });

  test('should merge axis domains by group id: partial lower bounded prevDomain with upper bounded domain', () => {
    const groupId = 'group_1';
    const domainRange1 = {
      min: 2,
    };

    const domainRange2 = {
      max: 7,
    };

    const domainRange3 = {
      max: 9,
    };

    verticalAxisSpec.domain = domainRange1;

    const axesSpecs = [];
    axesSpecs.push(verticalAxisSpec);

    const axis2 = { ...verticalAxisSpec, id: 'axis2' };

    axis2.domain = domainRange2;
    axesSpecs.push(axis2);

    const axis3 = { ...verticalAxisSpec, id: 'axis3' };

    axis3.domain = domainRange3;
    axesSpecs.push(axis3);

    const expectedMergedMap = new Map<GroupId, DomainRange>();
    expectedMergedMap.set(groupId, { min: 2, max: 9 });

    const mergedDomainsByGroupId = mergeYCustomDomainsByGroupId(axesSpecs, 0);
    expect(mergedDomainsByGroupId).toEqual(expectedMergedMap);
  });

  test('should throw on invalid domain', () => {
    const domainRange1 = {
      min: 9,
      max: 2,
    };

    verticalAxisSpec.domain = domainRange1;

    const axesSpecs = [verticalAxisSpec];

    const attemptToMerge = () => {
      mergeYCustomDomainsByGroupId(axesSpecs, 0);
    };
    const expectedError = '[Axis axis_1]: custom domain is invalid, min is greater than max';

    expect(attemptToMerge).toThrowError(expectedError);
  });

  test('should show unique tick labels if duplicateTicks is set to false', () => {
    const now = DateTime.fromISO('2019-01-11T00:00:00.000').setZone('utc+1').toMillis();
    const oneDay = moment.duration(1, 'day');
    const formatter = niceTimeFormatter([now, oneDay.add(now).asMilliseconds() * 31]);
    const axisSpec: AxisSpec = {
      id: 'bottom',
      position: 'bottom',
      showDuplicatedTicks: false,
      chartType: 'xy_axis',
      specType: 'axis',
      groupId: DEFAULT_GLOBAL_ID,
      hide: false,
      showOverlappingLabels: false,
      showOverlappingTicks: false,
      style,
      tickFormat: formatter,
    };
    const xDomainTime = MockXDomain.fromScaleType(ScaleType.Time, {
      isBandScale: false,
      domain: [1547190000000, 1547622000000],
      minInterval: 86400000,
    });
    const scale: Scale = computeXScale({ xDomain: xDomainTime, totalBarsInCluster: 0, range: [0, 603.5] });
    const offset = 0;
    const tickFormatOption = { timeZone: 'utc+1' };
    expect(enableDuplicatedTicks(axisSpec, scale, offset, (v) => `${v}`, tickFormatOption)).toEqual([
      { value: 1547208000000, label: '2019-01-11', position: 25.145833333333332 },
      { value: 1547251200000, label: '2019-01-12', position: 85.49583333333334 },
      { value: 1547337600000, label: '2019-01-13', position: 206.19583333333333 },
      { value: 1547424000000, label: '2019-01-14', position: 326.8958333333333 },
      { value: 1547510400000, label: '2019-01-15', position: 447.59583333333336 },
      { value: 1547596800000, label: '2019-01-16', position: 568.2958333333333 },
    ]);
  });
  test('should show unique consecutive ticks if duplicateTicks is set to false', () => {
    const axisSpec: AxisSpec = {
      id: 'bottom',
      position: 'bottom',
      showDuplicatedTicks: false,
      chartType: 'xy_axis',
      specType: 'axis',
      groupId: DEFAULT_GLOBAL_ID,
      hide: false,
      showOverlappingLabels: false,
      showOverlappingTicks: false,
      style,
      tickFormat: (d, options) =>
        DateTime.fromMillis(d, { setZone: true, zone: options?.timeZone ?? 'utc+1' }).toFormat('HH:mm'),
    };
    const xDomainTime = MockXDomain.fromScaleType(ScaleType.Time, {
      isBandScale: false,
      timeZone: 'utc+1',
      domain: [1547190000000, 1547622000000],
      minInterval: 86400000,
    });
    const scale: Scale = computeXScale({ xDomain: xDomainTime, totalBarsInCluster: 0, range: [0, 603.5] });
    const offset = 0;
    const tickFormatOption = { timeZone: xDomainTime.timeZone };
    const ticks = enableDuplicatedTicks(axisSpec, scale, offset, (v) => `${v}`, tickFormatOption);
    const tickLabels = ticks.map(({ label }) => ({ label }));
    expect(tickLabels).toEqual([
      { label: '12:00' },
      { label: '00:00' },
      { label: '12:00' },
      { label: '00:00' },
      { label: '12:00' },
      { label: '00:00' },
      { label: '12:00' },
      { label: '00:00' },
      { label: '12:00' },
      { label: '00:00' },
    ]);
  });
  test('should show duplicate tick labels if duplicateTicks is set to true', () => {
    const now = DateTime.fromISO('2019-01-11T00:00:00.000').setZone('utc+1').toMillis();
    const oneDay = moment.duration(1, 'day');
    const formatter = niceTimeFormatter([now, oneDay.add(now).asMilliseconds() * 31]);
    const axisSpec: AxisSpec = {
      id: 'bottom',
      position: 'bottom',
      showDuplicatedTicks: true,
      chartType: 'xy_axis',
      specType: 'axis',
      groupId: DEFAULT_GLOBAL_ID,
      hide: false,
      showOverlappingLabels: false,
      showOverlappingTicks: false,
      style,
      tickFormat: formatter,
    };
    const xDomainTime = MockXDomain.fromScaleType(ScaleType.Time, {
      isBandScale: false,
      domain: [1547190000000, 1547622000000],
      minInterval: 86400000,
    });
    const scale: Scale = computeXScale({ xDomain: xDomainTime, totalBarsInCluster: 0, range: [0, 603.5] });
    const offset = 0;
    const tickFormatOption = { timeZone: 'utc+1' };
    expect(enableDuplicatedTicks(axisSpec, scale, offset, (v) => `${v}`, tickFormatOption)).toEqual([
      { value: 1547208000000, label: '2019-01-11', position: 25.145833333333332 },
      { value: 1547251200000, label: '2019-01-12', position: 85.49583333333334 },
      { value: 1547294400000, label: '2019-01-12', position: 145.84583333333333 },
      { value: 1547337600000, label: '2019-01-13', position: 206.19583333333333 },
      { value: 1547380800000, label: '2019-01-13', position: 266.54583333333335 },
      { value: 1547424000000, label: '2019-01-14', position: 326.8958333333333 },
      { value: 1547467200000, label: '2019-01-14', position: 387.24583333333334 },
      { value: 1547510400000, label: '2019-01-15', position: 447.59583333333336 },
      { value: 1547553600000, label: '2019-01-15', position: 507.9458333333333 },
      { value: 1547596800000, label: '2019-01-16', position: 568.2958333333333 },
    ]);
  });
  test('should use custom tick formatter', () => {
    const now = DateTime.fromISO('2019-01-11T00:00:00.000').setZone('utc+1').toMillis();
    const oneDay = moment.duration(1, 'day');
    const formatter = niceTimeFormatter([now, oneDay.add(now).asMilliseconds() * 31]);
    const axisSpec: AxisSpec = {
      id: 'bottom',
      position: 'bottom',
      showDuplicatedTicks: true,
      chartType: 'xy_axis',
      specType: 'axis',
      groupId: DEFAULT_GLOBAL_ID,
      hide: false,
      showOverlappingLabels: false,
      showOverlappingTicks: false,
      style,
      tickFormat: formatter,
    };
    const xDomainTime = MockXDomain.fromScaleType(ScaleType.Time, {
      isBandScale: false,
      domain: [1547190000000, 1547622000000],
      minInterval: 86400000,
    });
    const scale: Scale = computeXScale({ xDomain: xDomainTime, totalBarsInCluster: 0, range: [0, 603.5] });
    const offset = 0;
    const tickFormatOption = { timeZone: 'utc+1' };
    expect(enableDuplicatedTicks(axisSpec, scale, offset, (v) => `${v}`, tickFormatOption)).toEqual([
      { value: 1547208000000, label: '2019-01-11', position: 25.145833333333332 },
      { value: 1547251200000, label: '2019-01-12', position: 85.49583333333334 },
      { value: 1547294400000, label: '2019-01-12', position: 145.84583333333333 },
      { value: 1547337600000, label: '2019-01-13', position: 206.19583333333333 },
      { value: 1547380800000, label: '2019-01-13', position: 266.54583333333335 },
      { value: 1547424000000, label: '2019-01-14', position: 326.8958333333333 },
      { value: 1547467200000, label: '2019-01-14', position: 387.24583333333334 },
      { value: 1547510400000, label: '2019-01-15', position: 447.59583333333336 },
      { value: 1547553600000, label: '2019-01-15', position: 507.9458333333333 },
      { value: 1547596800000, label: '2019-01-16', position: 568.2958333333333 },
    ]);
  });

  describe('Custom formatting', () => {
    it('should get custom labels for y axis', () => {
      const customFormatter = (v: any) => `${v} custom`;
      const axisSpecs = [verticalAxisSpec];
      const axesStyles = new Map();
      const axisDims = new Map();
      axisDims.set(verticalAxisSpec.id, axis1Dims);

      const axisTicksPosition = getAxesGeometries(
        {
          chartDimensions: chartDim,
          leftMargin: 0,
        },
        LIGHT_THEME,
        NO_ROTATION,
        axisSpecs,
        axisDims,
        axesStyles,
        xDomain,
        [yDomain],
        emptySmScales,
        1,
        false,
        customFormatter,
      );

      const expected = axis1Dims.tickValues.slice().reverse().map(customFormatter);
      const axisPos = axisTicksPosition.find(({ axis: { id } }) => id === verticalAxisSpec.id);
      expect(axisPos?.ticks.map(({ label }) => label)).toEqual(expected);
    });

    it('should not use custom formatter with x axis', () => {
      const customFotmatter = (v: any) => `${v} custom`;
      const axisSpecs = [horizontalAxisSpec];
      const axesStyles = new Map();
      const axisDims = new Map();
      axisDims.set(horizontalAxisSpec.id, axis1Dims);

      const axisTicksPosition = getAxesGeometries(
        {
          chartDimensions: chartDim,
          leftMargin: 0,
        },
        LIGHT_THEME,
        NO_ROTATION,
        axisSpecs,
        axisDims,
        axesStyles,
        xDomain,
        [yDomain],
        emptySmScales,
        1,
        false,
        customFotmatter,
      );

      const expected = axis1Dims.tickValues.slice().map(defaultTickFormatter);
      expect(
        axisTicksPosition.find(({ axis: { id } }) => id === horizontalAxisSpec.id)!.ticks.map(({ label }) => label),
      ).toEqual(expected);
    });

    it('should use custom axis tick formatter to get labels for x axis', () => {
      const customFotmatter = (v: any) => `${v} custom`;
      const customAxisFotmatter = (v: any) => `${v} custom`;
      const spec: AxisSpec = {
        ...horizontalAxisSpec,
        tickFormat: customAxisFotmatter,
      };
      const axisSpecs = [spec];
      const axesStyles = new Map();
      const axisDims = new Map();
      axisDims.set(spec.id, axis1Dims);

      const axisTicksPosition = getAxesGeometries(
        {
          chartDimensions: chartDim,
          leftMargin: 0,
        },
        LIGHT_THEME,
        NO_ROTATION,
        axisSpecs,
        axisDims,
        axesStyles,
        xDomain,
        [yDomain],
        emptySmScales,
        1,
        false,
        customFotmatter,
      );

      const expected = axis1Dims.tickValues.slice().map(customAxisFotmatter);
      expect(axisTicksPosition.find(({ axis: { id } }) => id === spec.id)!.ticks.map(({ label }) => label)).toEqual(
        expected,
      );
    });
  });

  describe('Small multiples', () => {
    const axisStyles = axisTitleStyles(10, 8);
    const cumTopSum = 10;
    const cumBottomSum = 10;
    const cumLeftSum = 10;
    const cumRightSum = 10;
    const smScales = getSmScales(['a'], [0]);

    describe.each(['test', ''])('Axes title positions - title is "%s"', (title) => {
      test('should compute left axis position', () => {
        const leftAxisPosition = getAxisPosition(
          chartDim,
          LIGHT_THEME.chartMargins,
          axisStyles.axisTitle,
          axisStyles.axisPanelTitle,
          { ...verticalAxisSpec, title },
          axis1Dims,
          smScales,
          cumTopSum,
          cumBottomSum,
          cumLeftSum,
          cumRightSum,
          10,
          0,
          true,
        );

        const expectedLeftAxisPosition = {
          dimensions: {
            height: 100,
            width: title ? 56 : 36,
            left: 110,
            top: 0,
          },
          topIncrement: 0,
          bottomIncrement: 0,
          leftIncrement: 0,
          rightIncrement: title ? 66 : 46,
        };

        expect(leftAxisPosition).toEqual(expectedLeftAxisPosition);
      });

      test('should compute right axis position', () => {
        verticalAxisSpec.position = Position.Right;
        const rightAxisPosition = getAxisPosition(
          chartDim,
          LIGHT_THEME.chartMargins,
          axisStyles.axisTitle,
          axisStyles.axisPanelTitle,
          { ...verticalAxisSpec, title },
          axis1Dims,
          smScales,
          cumTopSum,
          cumBottomSum,
          cumLeftSum,
          cumRightSum,
          10,
          0,
          true,
        );

        const expectedRightAxisPosition = {
          dimensions: {
            height: 100,
            width: title ? 56 : 36,
            left: 110,
            top: 0,
          },
          topIncrement: 0,
          bottomIncrement: 0,
          leftIncrement: 0,
          rightIncrement: title ? 66 : 46,
        };

        expect(rightAxisPosition).toEqual(expectedRightAxisPosition);
      });

      test('should compute top axis position', () => {
        horizontalAxisSpec.position = Position.Top;
        const topAxisPosition = getAxisPosition(
          chartDim,
          LIGHT_THEME.chartMargins,
          axisStyles.axisTitle,
          axisStyles.axisPanelTitle,
          { ...horizontalAxisSpec, title },
          axis1Dims,
          smScales,
          cumTopSum,
          cumBottomSum,
          cumLeftSum,
          cumRightSum,
          10,
          0,
          true,
        );

        const expectedTopAxisPosition = {
          dimensions: {
            height: title ? 56 : 36,
            width: 100,
            left: 0,
            top: 20,
          },
          topIncrement: title ? 66 : 46,
          bottomIncrement: 0,
          leftIncrement: 0,
          rightIncrement: 0,
        };

        expect(topAxisPosition).toEqual(expectedTopAxisPosition);
      });

      test('should compute bottom axis position', () => {
        horizontalAxisSpec.position = Position.Bottom;
        const bottomAxisPosition = getAxisPosition(
          chartDim,
          LIGHT_THEME.chartMargins,
          axisStyles.axisTitle,
          axisStyles.axisPanelTitle,
          { ...horizontalAxisSpec, title },
          axis1Dims,
          smScales,
          cumTopSum,
          cumBottomSum,
          cumLeftSum,
          cumRightSum,
          10,
          0,
          true,
        );

        const expectedBottomAxisPosition = {
          dimensions: {
            height: title ? 56 : 36,
            width: 100,
            left: 0,
            top: 110,
          },
          topIncrement: 0,
          bottomIncrement: title ? 66 : 46,
          leftIncrement: 0,
          rightIncrement: 0,
        };
        expect(bottomAxisPosition).toEqual(expectedBottomAxisPosition);
      });
    });
  });
});

it.todo('Test alignment calculations');
it.todo('Test text offsets calculations');
it.todo('Test title padding calculations');
it.todo('Test label padding calculations');
it.todo('Test axis visibility');
