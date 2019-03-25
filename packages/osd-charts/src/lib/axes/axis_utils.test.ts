import { XDomain } from '../series/domains/x_domain';
import { YDomain } from '../series/domains/y_domain';
import { AxisSpec, DomainRange, Position } from '../series/specs';
import { LIGHT_THEME } from '../themes/light_theme';
import { getAxisId, getGroupId, GroupId } from '../utils/ids';
import { ScaleType } from '../utils/scales/scales';
import {
  centerRotationOrigin,
  computeAxisGridLinePositions,
  computeAxisTicksDimensions,
  computeRotatedLabelDimensions,
  getAvailableTicks,
  getAxisPosition,
  getAxisTicksPositions,
  getHorizontalAxisGridLineProps,
  getHorizontalAxisTickLineProps,
  getMaxBboxDimensions,
  getMinMaxRange,
  getScaleForAxisSpec,
  getTickLabelProps,
  getVerticalAxisGridLineProps,
  getVerticalAxisTickLineProps,
  getVisibleTicks,
  isBounded,
  isHorizontal,
  isVertical,
  isYDomain,
  mergeDomainsByGroupId,
} from './axis_utils';
import { CanvasTextBBoxCalculator } from './canvas_text_bbox_calculator';
import { SvgTextBBoxCalculator } from './svg_text_bbox_calculator';

// const chartScalesConfig: ScalesConfig = {
//   ordinal: {
//     padding:  0,
//   },
// };
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
      (SVGElement.prototype.getBoundingClientRect = function() {
        const text = this.textContent || 0;
        return { ...mockedRect, width: Number(text) * 10, heigh: Number(text) * 10 };
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
    axisScaleType: ScaleType.Linear,
    axisScaleDomain: [0, 1],
    tickValues: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
    tickLabels: ['0', '0.1', '0.2', '0.3', '0.4', '0.5', '0.6', '0.7', '0.8', '0.9', '1'],
    maxLabelBboxWidth: 10,
    maxLabelBboxHeight: 10,
    maxLabelTextWidth: 10,
    maxLabelTextHeight: 10,
  };
  const verticalAxisSpec: AxisSpec = {
    id: getAxisId('axis_1'),
    groupId: getGroupId('group_1'),
    hide: false,
    showOverlappingTicks: false,
    showOverlappingLabels: false,
    position: Position.Left,
    tickSize: 10,
    tickPadding: 10,
    tickFormat: (value: any) => {
      return `${value}`;
    },
    showGridLines: true,
  };

  const horizontalAxisSpec: AxisSpec = {
    id: getAxisId('axis_2'),
    groupId: getGroupId('group_1'),
    hide: false,
    showOverlappingTicks: false,
    showOverlappingLabels: false,
    position: Position.Top,
    tickSize: 10,
    tickPadding: 10,
    tickFormat: (value: any) => {
      return `${value}`;
    },
  };

  const xDomain: XDomain = {
    type: 'xDomain',
    scaleType: ScaleType.Linear,
    domain: [0, 1],
    isBandScale: false,
    minInterval: 0,
  };

  const yDomain: YDomain = {
    scaleType: ScaleType.Linear,
    groupId: getGroupId('group_1'),
    type: 'yDomain',
    domain: [0, 1],
    isBandScale: false,
  };

  const { axes } = LIGHT_THEME;

  test('should compute axis dimensions', () => {
    const bboxCalculator = new SvgTextBBoxCalculator();
    const axisDimensions = computeAxisTicksDimensions(
      verticalAxisSpec,
      xDomain,
      [yDomain],
      1,
      bboxCalculator,
      0,
      axes,
    );
    expect(axisDimensions).toEqual(axis1Dims);

    const computeScalelessSpec = () => {
      computeAxisTicksDimensions(ungroupedAxisSpec, xDomain, [yDomain], 1, bboxCalculator, 0, axes);
    };

    const ungroupedAxisSpec = { ...verticalAxisSpec, groupId: getGroupId('foo') };
    expect(computeScalelessSpec).toThrowError('Cannot compute scale for axis spec axis_1');

    bboxCalculator.destroy();
  });

  test('should not compute axis dimensions when spec is configured to hide', () => {
    const bboxCalculator = new CanvasTextBBoxCalculator();
    verticalAxisSpec.hide = true;
    const axisDimensions = computeAxisTicksDimensions(
      verticalAxisSpec,
      xDomain,
      [yDomain],
      1,
      bboxCalculator,
      0,
      axes,
    );
    expect(axisDimensions).toBe(null);
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
    const yScale = getScaleForAxisSpec(verticalAxisSpec, xDomain, [yDomain], 0, 0, 100, 0);
    expect(yScale).toBeDefined();
    expect(yScale!.bandwidth).toBe(0);
    expect(yScale!.domain).toEqual([0, 1]);
    expect(yScale!.range).toEqual([100, 0]);
    expect(yScale!.ticks()).toEqual([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]);

    const ungroupedAxisSpec = { ...verticalAxisSpec, groupId: getGroupId('foo') };
    const nullYScale = getScaleForAxisSpec(ungroupedAxisSpec, xDomain, [yDomain], 0, 0, 100, 0);
    expect(nullYScale).toBe(null);

    const xScale = getScaleForAxisSpec(horizontalAxisSpec, xDomain, [yDomain], 0, 0, 100, 0);
    expect(xScale).toBeDefined();
  });

  test('should compute available ticks', () => {
    const scale = getScaleForAxisSpec(verticalAxisSpec, xDomain, [yDomain], 0, 0, 100, 0);
    const axisPositions = getAvailableTicks(verticalAxisSpec, scale!, 0);
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
      top: 0,
      left: 0,
    });
    expect(minMax).toEqual({ minRange: 0, maxRange: 100 });
  });
  test('should compute min max range for on 90 deg bottom', () => {
    const minMax = getMinMaxRange(Position.Bottom, 90, {
      width: 100,
      height: 50,
      top: 0,
      left: 0,
    });
    expect(minMax).toEqual({ minRange: 0, maxRange: 100 });
  });
  test('should compute min max range for on 180 deg bottom', () => {
    const minMax = getMinMaxRange(Position.Bottom, 180, {
      width: 100,
      height: 50,
      top: 0,
      left: 0,
    });
    expect(minMax).toEqual({ minRange: 100, maxRange: 0 });
  });
  test('should compute min max range for on -90 deg bottom', () => {
    const minMax = getMinMaxRange(Position.Bottom, -90, {
      width: 100,
      height: 50,
      top: 0,
      left: 0,
    });
    expect(minMax).toEqual({ minRange: 100, maxRange: 0 });
  });
  test('should compute min max range for on 90 deg Left', () => {
    const minMax = getMinMaxRange(Position.Left, 90, {
      width: 100,
      height: 50,
      top: 0,
      left: 0,
    });
    expect(minMax).toEqual({ minRange: 0, maxRange: 50 });
  });
  test('should compute min max range for on 180 deg Left', () => {
    const minMax = getMinMaxRange(Position.Left, 180, {
      width: 100,
      height: 50,
      top: 0,
      left: 0,
    });
    expect(minMax).toEqual({ minRange: 0, maxRange: 50 });
  });
  test('should compute min max range for on -90 deg Right', () => {
    const minMax = getMinMaxRange(Position.Right, -90, {
      width: 100,
      height: 50,
      top: 0,
      left: 0,
    });
    expect(minMax).toEqual({ minRange: 50, maxRange: 0 });
  });
  test('should get max bbox dimensions for a tick in comparison to previous values', () => {
    const bboxCalculator = new CanvasTextBBoxCalculator();
    const reducer = getMaxBboxDimensions(bboxCalculator, 16, 'Arial', 0);

    const accWithGreaterValues = {
      maxLabelBboxWidth: 100,
      maxLabelBboxHeight: 100,
      maxLabelTextWidth: 100,
      maxLabelTextHeight: 100,
    };
    expect(reducer(accWithGreaterValues, 'foo')).toEqual(accWithGreaterValues);
  });

  test('should compute coordinates and offsets to anchor rotation origin from the center', () => {
    const simpleCenteredProps = centerRotationOrigin(
      {
        maxLabelBboxWidth: 10,
        maxLabelBboxHeight: 20,
        maxLabelTextWidth: 10,
        maxLabelTextHeight: 20,
      },
      { x: 0, y: 0 },
    );

    expect(simpleCenteredProps).toEqual({
      offsetX: 5,
      offsetY: 10,
      x: 5,
      y: 10,
    });

    const rotatedCenteredProps = centerRotationOrigin(
      {
        maxLabelBboxWidth: 10,
        maxLabelBboxHeight: 20,
        maxLabelTextWidth: 20,
        maxLabelTextHeight: 10,
      },
      { x: 30, y: 40 },
    );

    expect(rotatedCenteredProps).toEqual({
      offsetX: 10,
      offsetY: 5,
      x: 35,
      y: 50,
    });
  });

  test('should compute positions and alignment of tick labels along a vertical axis', () => {
    let tickLabelRotation = 0;
    const tickSize = 10;
    const tickPadding = 5;
    const tickPosition = 0;
    let axisPosition = Position.Left;

    const unrotatedLabelProps = getTickLabelProps(
      tickLabelRotation,
      tickSize,
      tickPadding,
      tickPosition,
      axisPosition,
      axis1Dims,
    );

    expect(unrotatedLabelProps).toEqual({
      x: -10,
      y: -5,
      align: 'right',
      verticalAlign: 'middle',
    });

    tickLabelRotation = 90;
    const rotatedLabelProps = getTickLabelProps(
      tickLabelRotation,
      tickSize,
      tickPadding,
      tickPosition,
      axisPosition,
      axis1Dims,
    );

    expect(rotatedLabelProps).toEqual({
      x: -10,
      y: -5,
      align: 'center',
      verticalAlign: 'middle',
    });

    axisPosition = Position.Right;
    const rightRotatedLabelProps = getTickLabelProps(
      tickLabelRotation,
      tickSize,
      tickPadding,
      tickPosition,
      axisPosition,
      axis1Dims,
    );

    expect(rightRotatedLabelProps).toEqual({
      x: 15,
      y: -5,
      align: 'center',
      verticalAlign: 'middle',
    });

    tickLabelRotation = 0;
    const rightUnrotatedLabelProps = getTickLabelProps(
      tickLabelRotation,
      tickSize,
      tickPadding,
      tickPosition,
      axisPosition,
      axis1Dims,
    );

    expect(rightUnrotatedLabelProps).toEqual({
      x: 15,
      y: -5,
      align: 'left',
      verticalAlign: 'middle',
    });
  });

  test('should compute positions and alignment of tick labels along a horizontal axis', () => {
    let tickLabelRotation = 0;
    const tickSize = 10;
    const tickPadding = 5;
    const tickPosition = 0;
    let axisPosition = Position.Top;

    const unrotatedLabelProps = getTickLabelProps(
      tickLabelRotation,
      tickSize,
      tickPadding,
      tickPosition,
      axisPosition,
      axis1Dims,
    );

    expect(unrotatedLabelProps).toEqual({
      x: -5,
      y: 0,
      align: 'center',
      verticalAlign: 'bottom',
    });

    tickLabelRotation = 90;
    const rotatedLabelProps = getTickLabelProps(
      tickLabelRotation,
      tickSize,
      tickPadding,
      tickPosition,
      axisPosition,
      axis1Dims,
    );

    expect(rotatedLabelProps).toEqual({
      x: -5,
      y: 0,
      align: 'center',
      verticalAlign: 'middle',
    });

    axisPosition = Position.Bottom;
    const bottomRotatedLabelProps = getTickLabelProps(
      tickLabelRotation,
      tickSize,
      tickPadding,
      tickPosition,
      axisPosition,
      axis1Dims,
    );

    expect(bottomRotatedLabelProps).toEqual({
      x: -5,
      y: 15,
      align: 'center',
      verticalAlign: 'middle',
    });

    tickLabelRotation = 0;
    const bottomUnrotatedLabelProps = getTickLabelProps(
      tickLabelRotation,
      tickSize,
      tickPadding,
      tickPosition,
      axisPosition,
      axis1Dims,
    );

    expect(bottomUnrotatedLabelProps).toEqual({
      x: -5,
      y: 15,
      align: 'center',
      verticalAlign: 'top',
    });
  });

  test('should compute axis tick line positions', () => {
    const tickPadding = 5;
    const tickSize = 10;
    const tickPosition = 10;
    const maxLabelBboxHeight = 20;

    const leftAxisTickLinePositions = getVerticalAxisTickLineProps(
      Position.Left,
      tickPadding,
      tickSize,
      tickPosition,
    );

    expect(leftAxisTickLinePositions).toEqual([5, 10, 15, 10]);

    const rightAxisTickLinePositions = getVerticalAxisTickLineProps(
      Position.Right,
      tickPadding,
      tickSize,
      tickPosition,
    );

    expect(rightAxisTickLinePositions).toEqual([0, 10, 10, 10]);

    const topAxisTickLinePositions = getHorizontalAxisTickLineProps(
      Position.Top,
      tickPadding,
      tickSize,
      tickPosition,
      maxLabelBboxHeight,
    );

    expect(topAxisTickLinePositions).toEqual([10, 25, 10, 35]);

    const bottomAxisTickLinePositions = getHorizontalAxisTickLineProps(
      Position.Bottom,
      tickPadding,
      tickSize,
      tickPosition,
      maxLabelBboxHeight,
    );

    expect(bottomAxisTickLinePositions).toEqual([10, 0, 10, 10]);
  });

  test('should compute axis grid line positions', () => {
    const tickPosition = 10;
    const chartWidth = 100;
    const chartHeight = 200;

    const verticalAxisGridLinePositions = getVerticalAxisGridLineProps(tickPosition, chartWidth);

    expect(verticalAxisGridLinePositions).toEqual([0, 10, 100, 10]);

    const horizontalAxisGridLinePositions = getHorizontalAxisGridLineProps(
      tickPosition,
      chartHeight,
    );

    expect(horizontalAxisGridLinePositions).toEqual([10, 0, 10, 200]);
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
      axisTitleHeight,
      verticalAxisSpec,
      axis1Dims,
      cumTopSum,
      cumBottomSum,
      cumLeftSum,
      cumRightSum,
    );

    const expectedLeftAxisPosition = {
      dimensions: {
        height: 100,
        width: 10,
        left: 40,
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
      axisTitleHeight,
      verticalAxisSpec,
      axis1Dims,
      cumTopSum,
      cumBottomSum,
      cumLeftSum,
      cumRightSum,
    );

    const expectedRightAxisPosition = {
      dimensions: {
        height: 100,
        width: 10,
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
      axisTitleHeight,
      horizontalAxisSpec,
      axis1Dims,
      cumTopSum,
      cumBottomSum,
      cumLeftSum,
      cumRightSum,
    );

    const expectedTopAxisPosition = {
      dimensions: {
        height: 10,
        width: 100,
        left: 0,
        top: 30,
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
      axisTitleHeight,
      horizontalAxisSpec,
      axis1Dims,
      cumTopSum,
      cumBottomSum,
      cumLeftSum,
      cumRightSum,
    );

    const expectedBottomAxisPosition = {
      dimensions: {
        height: 10,
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
    const chartRotation = 0;
    const showLegend = true;
    const leftLegendPosition = Position.Left;

    const axisSpecs = new Map();
    axisSpecs.set(verticalAxisSpec.id, verticalAxisSpec);

    const axisDims = new Map();
    axisDims.set(getAxisId('not_a_mapped_one'), axis1Dims);

    const axisTicksPosition = getAxisTicksPositions(
      chartDim,
      LIGHT_THEME,
      chartRotation,
      showLegend,
      axisSpecs,
      axisDims,
      xDomain,
      [yDomain],
      1,
      leftLegendPosition,
    );
    expect(axisTicksPosition.axisPositions.size).toBe(0);
    expect(axisTicksPosition.axisTicks.size).toBe(0);
    expect(axisTicksPosition.axisGridLinesPositions.size).toBe(0);
    expect(axisTicksPosition.axisVisibleTicks.size).toBe(0);
  });

  test('should compute axis ticks positions', () => {
    const chartRotation = 0;
    const showLegend = true;
    const leftLegendPosition = Position.Left;
    const topLegendPosition = Position.Top;

    const axisSpecs = new Map();
    axisSpecs.set(verticalAxisSpec.id, verticalAxisSpec);

    const axisDims = new Map();
    axisDims.set(verticalAxisSpec.id, axis1Dims);

    const axisTicksPosition = getAxisTicksPositions(
      chartDim,
      LIGHT_THEME,
      chartRotation,
      showLegend,
      axisSpecs,
      axisDims,
      xDomain,
      [yDomain],
      1,
      leftLegendPosition,
    );

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

    expect(axisTicksPosition.axisGridLinesPositions.get(verticalAxisSpec.id)).toEqual(
      expectedVerticalAxisGridLines,
    );

    const axisTicksPositionWithTopLegend = getAxisTicksPositions(
      chartDim,
      LIGHT_THEME,
      chartRotation,
      showLegend,
      axisSpecs,
      axisDims,
      xDomain,
      [yDomain],
      1,
      topLegendPosition,
    );

    const expectedPositionWithTopLegend = {
      height: 100,
      width: 10,
      left: 100,
      top: 0,
    };
    const verticalAxisWithTopLegendPosition = axisTicksPositionWithTopLegend.axisPositions.get(
      verticalAxisSpec.id,
    );
    expect(verticalAxisWithTopLegendPosition).toEqual(expectedPositionWithTopLegend);

    const ungroupedAxisSpec = { ...verticalAxisSpec, groupId: getGroupId('foo') };
    const invalidSpecs = new Map();
    invalidSpecs.set(verticalAxisSpec.id, ungroupedAxisSpec);
    const computeScalelessSpec = () => {
      getAxisTicksPositions(
        chartDim,
        LIGHT_THEME,
        chartRotation,
        showLegend,
        invalidSpecs,
        axisDims,
        xDomain,
        [yDomain],
        1,
        leftLegendPosition,
      );
    };

    expect(computeScalelessSpec).toThrowError('Cannot compute scale for axis spec axis_1');
  });

  test('should compute positions for grid lines', () => {
    const verticalAxisGridLines = computeAxisGridLinePositions(true, 25, chartDim);
    expect(verticalAxisGridLines).toEqual([0, 25, 100, 25]);

    const horizontalAxisGridLines = computeAxisGridLinePositions(false, 25, chartDim);
    expect(horizontalAxisGridLines).toEqual([25, 0, 25, 100]);
  });

  test('should determine orientation of axis position', () => {
    expect(isVertical(Position.Left)).toBe(true);
    expect(isVertical(Position.Right)).toBe(true);
    expect(isVertical(Position.Top)).toBe(false);
    expect(isVertical(Position.Bottom)).toBe(false);

    expect(isHorizontal(Position.Left)).toBe(false);
    expect(isHorizontal(Position.Right)).toBe(false);
    expect(isHorizontal(Position.Top)).toBe(true);
    expect(isHorizontal(Position.Bottom)).toBe(true);
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
    const groupId = getGroupId('group_1');
    const domainRange1 = {
      min: 2,
      max: 9,
    };

    verticalAxisSpec.domain = domainRange1;

    const axesSpecs = new Map();
    axesSpecs.set(verticalAxisSpec.id, verticalAxisSpec);

    // Base case
    const expectedSimpleMap = new Map<GroupId, DomainRange>();
    expectedSimpleMap.set(groupId, { min: 2, max: 9 });

    const simpleDomainsByGroupId = mergeDomainsByGroupId(axesSpecs, 0);
    expect(simpleDomainsByGroupId).toEqual(expectedSimpleMap);

    // Multiple definitions for the same group
    const domainRange2 = {
      min: 0,
      max: 7,
    };

    const altVerticalAxisSpec = { ...verticalAxisSpec, id: getAxisId('axis2') };

    altVerticalAxisSpec.domain = domainRange2;
    axesSpecs.set(altVerticalAxisSpec.id, altVerticalAxisSpec);

    const expectedMergedMap = new Map<GroupId, DomainRange>();
    expectedMergedMap.set(groupId, { min: 0, max: 9 });

    const mergedDomainsByGroupId = mergeDomainsByGroupId(axesSpecs, 0);
    expect(mergedDomainsByGroupId).toEqual(expectedMergedMap);

    // xDomain limit (bad config)
    horizontalAxisSpec.domain = {
      min: 5,
      max: 15,
    };
    axesSpecs.set(horizontalAxisSpec.id, horizontalAxisSpec);

    const attemptToMerge = () => {
      mergeDomainsByGroupId(axesSpecs, 0);
    };

    expect(attemptToMerge).toThrowError(
      '[Axis axis_2]: custom domain for xDomain should be defined in Settings',
    );
  });

  test('should merge axis domains by group id: partial upper bounded prevDomain with complete domain', () => {
    const groupId = getGroupId('group_1');
    const domainRange1 = {
      max: 9,
    };

    const domainRange2 = {
      min: 0,
      max: 7,
    };

    verticalAxisSpec.domain = domainRange1;

    const axesSpecs = new Map();
    axesSpecs.set(verticalAxisSpec.id, verticalAxisSpec);

    const axis2 = { ...verticalAxisSpec, id: getAxisId('axis2') };

    axis2.domain = domainRange2;
    axesSpecs.set(axis2.id, axis2);

    const expectedMergedMap = new Map<GroupId, DomainRange>();
    expectedMergedMap.set(groupId, { min: 0, max: 9 });

    const mergedDomainsByGroupId = mergeDomainsByGroupId(axesSpecs, 0);
    expect(mergedDomainsByGroupId).toEqual(expectedMergedMap);
  });

  test('should merge axis domains by group id: partial lower bounded prevDomain with complete domain', () => {
    const groupId = getGroupId('group_1');
    const domainRange1 = {
      min: -1,
    };

    const domainRange2 = {
      min: 0,
      max: 7,
    };

    verticalAxisSpec.domain = domainRange1;

    const axesSpecs = new Map();
    axesSpecs.set(verticalAxisSpec.id, verticalAxisSpec);

    const axis2 = { ...verticalAxisSpec, id: getAxisId('axis2') };

    axis2.domain = domainRange2;
    axesSpecs.set(axis2.id, axis2);

    const expectedMergedMap = new Map<GroupId, DomainRange>();
    expectedMergedMap.set(groupId, { min: -1, max: 7 });

    const mergedDomainsByGroupId = mergeDomainsByGroupId(axesSpecs, 0);
    expect(mergedDomainsByGroupId).toEqual(expectedMergedMap);
  });

  test('should merge axis domains by group id: partial upper bounded prevDomain with lower bounded domain', () => {
    const groupId = getGroupId('group_1');
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

    const axesSpecs = new Map();
    axesSpecs.set(verticalAxisSpec.id, verticalAxisSpec);

    const axis2 = { ...verticalAxisSpec, id: getAxisId('axis2') };

    axis2.domain = domainRange2;
    axesSpecs.set(axis2.id, axis2);

    const axis3 = { ...verticalAxisSpec, id: getAxisId('axis3') };

    axis3.domain = domainRange3;
    axesSpecs.set(axis3.id, axis3);

    const expectedMergedMap = new Map<GroupId, DomainRange>();
    expectedMergedMap.set(groupId, { min: -1, max: 9 });

    const mergedDomainsByGroupId = mergeDomainsByGroupId(axesSpecs, 0);
    expect(mergedDomainsByGroupId).toEqual(expectedMergedMap);
  });

  test('should merge axis domains by group id: partial lower bounded prevDomain with upper bounded domain', () => {
    const groupId = getGroupId('group_1');
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

    const axesSpecs = new Map();
    axesSpecs.set(verticalAxisSpec.id, verticalAxisSpec);

    const axis2 = { ...verticalAxisSpec, id: getAxisId('axis2') };

    axis2.domain = domainRange2;
    axesSpecs.set(axis2.id, axis2);

    const axis3 = { ...verticalAxisSpec, id: getAxisId('axis3') };

    axis3.domain = domainRange3;
    axesSpecs.set(axis3.id, axis3);

    const expectedMergedMap = new Map<GroupId, DomainRange>();
    expectedMergedMap.set(groupId, { min: 2, max: 9 });

    const mergedDomainsByGroupId = mergeDomainsByGroupId(axesSpecs, 0);
    expect(mergedDomainsByGroupId).toEqual(expectedMergedMap);
  });

  test('should throw on invalid domain', () => {
    const domainRange1 = {
      min: 9,
      max: 2,
    };

    verticalAxisSpec.domain = domainRange1;

    const axesSpecs = new Map();
    axesSpecs.set(verticalAxisSpec.id, verticalAxisSpec);

    const attemptToMerge = () => {
      mergeDomainsByGroupId(axesSpecs, 0);
    };
    const expectedError = '[Axis axis_1]: custom domain is invalid, min is greater than max';

    expect(attemptToMerge).toThrowError(expectedError);
  });

  test('should determine that a domain has at least one bound', () => {
    const lowerBounded = {
      min: 0,
    };

    const upperBounded = {
      max: 0,
    };

    expect(isBounded(lowerBounded)).toBe(true);
    expect(isBounded(upperBounded)).toBe(true);
  });
});
