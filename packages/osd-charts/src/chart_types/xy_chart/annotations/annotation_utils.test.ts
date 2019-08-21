import {
  AnnotationDomainType,
  AnnotationDomainTypes,
  AnnotationSpec,
  AxisSpec,
  LineAnnotationSpec,
  Position,
  RectAnnotationSpec,
  Rotation,
} from '../utils/specs';
import { DEFAULT_ANNOTATION_LINE_STYLE } from '../../../utils/themes/theme';
import { Dimensions } from '../../../utils/dimensions';
import { AnnotationId, AxisId, getAnnotationId, getAxisId, getGroupId, GroupId } from '../../../utils/ids';
import { ScaleBand } from '../../../utils/scales/scale_band';
import { ScaleContinuous } from '../../../utils/scales/scale_continuous';
import { Scale, ScaleType } from '../../../utils/scales/scales';
import {
  AnnotationLinePosition,
  AnnotationLineProps,
  computeAnnotationDimensions,
  computeAnnotationTooltipState,
  computeClusterOffset,
  computeLineAnnotationDimensions,
  computeLineAnnotationTooltipState,
  computeRectAnnotationDimensions,
  computeRectAnnotationTooltipState,
  computeRectTooltipLeft,
  computeRectTooltipOffset,
  computeRectTooltipTop,
  DEFAULT_LINE_OVERFLOW,
  getAnnotationAxis,
  getAnnotationLineTooltipPosition,
  getAnnotationLineTooltipTransform,
  getAnnotationLineTooltipXOffset,
  getAnnotationLineTooltipYOffset,
  getNearestTick,
  getRotatedCursor,
  isBottomRectTooltip,
  isRightRectTooltip,
  isVerticalAnnotationLine,
  isWithinLineBounds,
  isWithinRectBounds,
  scaleAndValidateDatum,
  toTransformString,
} from './annotation_utils';
import { Point } from '../store/chart_state';

describe('annotation utils', () => {
  const minRange = 0;
  const maxRange = 100;

  const continuousData = [0, 10];
  const continuousScale = new ScaleContinuous(
    {
      type: ScaleType.Linear,
      domain: continuousData,
      range: [minRange, maxRange],
    },
    { bandwidth: 0, minInterval: 1 },
  );

  const ordinalData = ['a', 'b', 'c', 'd', 'a', 'b', 'c'];
  const ordinalScale = new ScaleBand(ordinalData, [minRange, maxRange]);

  const chartDimensions: Dimensions = {
    width: 10,
    height: 20,
    top: 5,
    left: 15,
  };

  const groupId = getGroupId('foo-group');

  const axesSpecs: Map<AxisId, AxisSpec> = new Map();
  const verticalAxisSpec: AxisSpec = {
    id: getAxisId('vertical_axis'),
    groupId,
    hide: false,
    showOverlappingTicks: false,
    showOverlappingLabels: false,
    position: Position.Left,
    tickSize: 10,
    tickPadding: 10,
    tickFormat: (value: any) => value.toString(),
    showGridLines: true,
  };
  const horizontalAxisSpec: AxisSpec = {
    id: getAxisId('horizontal_axis'),
    groupId,
    hide: false,
    showOverlappingTicks: false,
    showOverlappingLabels: false,
    position: Position.Bottom,
    tickSize: 10,
    tickPadding: 10,
    tickFormat: (value: any) => value.toString(),
    showGridLines: true,
  };

  axesSpecs.set(verticalAxisSpec.id, verticalAxisSpec);

  test('should compute annotation dimensions', () => {
    const chartRotation: Rotation = 0;
    const yScales: Map<GroupId, Scale> = new Map();
    yScales.set(groupId, continuousScale);

    const xScale: Scale = ordinalScale;

    const annotations: Map<AnnotationId, AnnotationSpec> = new Map();
    const annotationId = getAnnotationId('foo');
    const lineAnnotation: LineAnnotationSpec = {
      annotationType: 'line',
      annotationId,
      domainType: AnnotationDomainTypes.YDomain,
      dataValues: [{ dataValue: 2, details: 'foo' }],
      groupId,
      style: DEFAULT_ANNOTATION_LINE_STYLE,
    };

    const rectAnnotationId = getAnnotationId('rect');
    const rectAnnotation: AnnotationSpec = {
      annotationId: rectAnnotationId,
      groupId,
      annotationType: 'rectangle',
      dataValues: [{ coordinates: { x0: 'a', x1: 'b', y0: 3, y1: 5 } }],
    };

    annotations.set(annotationId, lineAnnotation);
    annotations.set(rectAnnotationId, rectAnnotation);

    const dimensions = computeAnnotationDimensions(
      annotations,
      chartDimensions,
      chartRotation,
      yScales,
      xScale,
      axesSpecs,
      1,
      false,
    );
    const expectedDimensions = new Map();
    expectedDimensions.set(annotationId, [
      {
        position: [DEFAULT_LINE_OVERFLOW, 20, 10, 20],
        details: { detailsText: 'foo', headerText: '2' },
        tooltipLinePosition: [0, 20, 10, 20],
      },
    ]);
    expectedDimensions.set(rectAnnotationId, [{ rect: { x: 0, y: 30, width: 25, height: 20 } }]);

    expect(dimensions).toEqual(expectedDimensions);
  });

  test('should not compute annotation dimensions if a corresponding axis does not exist', () => {
    const chartRotation: Rotation = 0;
    const yScales: Map<GroupId, Scale> = new Map();
    yScales.set(groupId, continuousScale);

    const xScale: Scale = ordinalScale;

    const annotations: Map<AnnotationId, AnnotationSpec> = new Map();
    const annotationId = getAnnotationId('foo');
    const lineAnnotation: LineAnnotationSpec = {
      annotationType: 'line',
      annotationId,
      domainType: AnnotationDomainTypes.YDomain,
      dataValues: [{ dataValue: 2, details: 'foo' }],
      groupId,
      style: DEFAULT_ANNOTATION_LINE_STYLE,
    };

    annotations.set(annotationId, lineAnnotation);

    const dimensions = computeAnnotationDimensions(
      annotations,
      chartDimensions,
      chartRotation,
      yScales,
      xScale,
      new Map(), // empty axesSpecs
      1,
      false,
    );
    const expectedDimensions = new Map();
    expect(dimensions).toEqual(expectedDimensions);
  });

  test('should compute line annotation dimensions for yDomain on a yScale (chartRotation 0, left axis)', () => {
    const chartRotation: Rotation = 0;
    const yScales: Map<GroupId, Scale> = new Map();
    yScales.set(groupId, continuousScale);

    const xScale: Scale = ordinalScale;

    const annotationId = getAnnotationId('foo-line');
    const lineAnnotation: LineAnnotationSpec = {
      annotationType: 'line',
      annotationId,
      domainType: AnnotationDomainTypes.YDomain,
      dataValues: [{ dataValue: 2, details: 'foo' }],
      groupId,
      style: DEFAULT_ANNOTATION_LINE_STYLE,
    };

    const dimensions = computeLineAnnotationDimensions(
      lineAnnotation,
      chartDimensions,
      chartRotation,
      yScales,
      xScale,
      Position.Left,
      0,
      false,
    );
    const expectedDimensions = [
      {
        position: [DEFAULT_LINE_OVERFLOW, 20, 10, 20],
        details: { detailsText: 'foo', headerText: '2' },
        tooltipLinePosition: [0, 20, 10, 20],
      },
    ];
    expect(dimensions).toEqual(expectedDimensions);
  });

  test('should compute line annotation dimensions for yDomain on a yScale (chartRotation 0, right axis)', () => {
    const chartRotation: Rotation = 0;
    const yScales: Map<GroupId, Scale> = new Map();
    yScales.set(groupId, continuousScale);

    const xScale: Scale = ordinalScale;

    const annotationId = getAnnotationId('foo-line');
    const lineAnnotation: LineAnnotationSpec = {
      annotationType: 'line',
      annotationId,
      domainType: AnnotationDomainTypes.YDomain,
      dataValues: [{ dataValue: 2, details: 'foo' }],
      groupId,
      style: DEFAULT_ANNOTATION_LINE_STYLE,
    };

    const dimensions = computeLineAnnotationDimensions(
      lineAnnotation,
      chartDimensions,
      chartRotation,
      yScales,
      xScale,
      Position.Right,
      0,
      false,
    );
    const expectedDimensions = [
      {
        position: [0, 20, 10, 20],
        details: { detailsText: 'foo', headerText: '2' },
        tooltipLinePosition: [0, 20, 10, 20],
      },
    ];
    expect(dimensions).toEqual(expectedDimensions);
  });

  test('should compute line annotation dimensions for yDomain on a yScale (chartRotation 90)', () => {
    const chartRotation: Rotation = 90;
    const yScales: Map<GroupId, Scale> = new Map();
    yScales.set(groupId, continuousScale);

    const xScale: Scale = ordinalScale;

    const annotationId = getAnnotationId('foo-line');
    const lineAnnotation: LineAnnotationSpec = {
      annotationType: 'line',
      annotationId,
      domainType: AnnotationDomainTypes.YDomain,
      dataValues: [{ dataValue: 2, details: 'foo' }],
      groupId,
      style: DEFAULT_ANNOTATION_LINE_STYLE,
    };

    const dimensions = computeLineAnnotationDimensions(
      lineAnnotation,
      chartDimensions,
      chartRotation,
      yScales,
      xScale,
      Position.Left,
      0,
      false,
    );
    const expectedDimensions = [
      {
        position: [0, 20, 20 + DEFAULT_LINE_OVERFLOW, 20],
        details: { detailsText: 'foo', headerText: '2' },
        tooltipLinePosition: [20, 0, 20, 20],
      },
    ];
    expect(dimensions).toEqual(expectedDimensions);
  });

  test('should not compute line annotation dimensions for yDomain if no corresponding yScale', () => {
    const chartRotation: Rotation = 0;
    const yScales: Map<GroupId, Scale> = new Map();
    const xScale: Scale = ordinalScale;

    const annotationId = getAnnotationId('foo-line');
    const lineAnnotation: LineAnnotationSpec = {
      annotationType: 'line',
      annotationId,
      domainType: AnnotationDomainTypes.YDomain,
      dataValues: [],
      groupId,
      style: DEFAULT_ANNOTATION_LINE_STYLE,
    };

    const dimensions = computeLineAnnotationDimensions(
      lineAnnotation,
      chartDimensions,
      chartRotation,
      yScales,
      xScale,
      Position.Left,
      0,
      false,
    );
    expect(dimensions).toEqual(null);
  });

  test('should compute line annotation dimensions for xDomain (chartRotation 0, ordinal scale)', () => {
    const chartRotation: Rotation = 0;
    const yScales: Map<GroupId, Scale> = new Map();
    const xScale: Scale = ordinalScale;

    const annotationId = getAnnotationId('foo-line');
    const lineAnnotation: LineAnnotationSpec = {
      annotationType: 'line',
      annotationId,
      domainType: AnnotationDomainTypes.XDomain,
      dataValues: [{ dataValue: 'a', details: 'foo' }],
      groupId,
      style: DEFAULT_ANNOTATION_LINE_STYLE,
    };

    const dimensions = computeLineAnnotationDimensions(
      lineAnnotation,
      chartDimensions,
      chartRotation,
      yScales,
      xScale,
      Position.Left,
      0,
      false,
    );
    const expectedDimensions = [
      {
        position: [12.5, -DEFAULT_LINE_OVERFLOW, 12.5, 20],
        details: { detailsText: 'foo', headerText: 'a' },
        tooltipLinePosition: [12.5, 0, 12.5, 20],
      },
    ];
    expect(dimensions).toEqual(expectedDimensions);
  });

  test('should compute line annotation dimensions for xDomain (chartRotation 0, continuous scale, top axis)', () => {
    const chartRotation: Rotation = 0;
    const yScales: Map<GroupId, Scale> = new Map();
    const xScale: Scale = continuousScale;

    const annotationId = getAnnotationId('foo-line');
    const lineAnnotation: LineAnnotationSpec = {
      annotationType: 'line',
      annotationId,
      domainType: AnnotationDomainTypes.XDomain,
      dataValues: [{ dataValue: 2, details: 'foo' }],
      groupId,
      style: DEFAULT_ANNOTATION_LINE_STYLE,
    };

    const dimensions = computeLineAnnotationDimensions(
      lineAnnotation,
      chartDimensions,
      chartRotation,
      yScales,
      xScale,
      Position.Top,
      0,
      false,
    );
    const expectedDimensions = [
      {
        position: [20, -DEFAULT_LINE_OVERFLOW, 20, 20],
        details: { detailsText: 'foo', headerText: '2' },
        tooltipLinePosition: [20, 0, 20, 20],
      },
    ];
    expect(dimensions).toEqual(expectedDimensions);
  });

  test('should compute line annotation dimensions for xDomain (chartRotation 0, continuous scale, bottom axis)', () => {
    const chartRotation: Rotation = 0;
    const yScales: Map<GroupId, Scale> = new Map();
    const xScale: Scale = continuousScale;

    const annotationId = getAnnotationId('foo-line');
    const lineAnnotation: LineAnnotationSpec = {
      annotationType: 'line',
      annotationId,
      domainType: AnnotationDomainTypes.XDomain,
      dataValues: [{ dataValue: 2, details: 'foo' }],
      groupId,
      style: DEFAULT_ANNOTATION_LINE_STYLE,
    };

    const dimensions = computeLineAnnotationDimensions(
      lineAnnotation,
      chartDimensions,
      chartRotation,
      yScales,
      xScale,
      Position.Bottom,
      0,
      false,
    );
    const expectedDimensions = [
      {
        position: [20, 0, 20, 20],
        details: { detailsText: 'foo', headerText: '2' },
        tooltipLinePosition: [20, 0, 20, 20],
      },
    ];
    expect(dimensions).toEqual(expectedDimensions);
  });

  test('should compute line annotation dimensions for xDomain in histogramMode with extended upper bound', () => {
    const chartRotation: Rotation = 0;
    const yScales: Map<GroupId, Scale> = new Map();
    const xScale: Scale = continuousScale;

    const annotationId = getAnnotationId('foo-line');
    const lineAnnotation: LineAnnotationSpec = {
      annotationType: 'line',
      annotationId,
      domainType: AnnotationDomainTypes.XDomain,
      dataValues: [{ dataValue: 10.5, details: 'foo' }],
      groupId,
      style: DEFAULT_ANNOTATION_LINE_STYLE,
    };

    const dimensions = computeLineAnnotationDimensions(
      lineAnnotation,
      chartDimensions,
      chartRotation,
      yScales,
      xScale,
      Position.Bottom,
      0,
      true,
    );
    const expectedDimensions = [
      {
        position: [105, 0, 105, 20],
        details: { detailsText: 'foo', headerText: '10.5' },
        tooltipLinePosition: [105, 0, 105, 20],
      },
    ];
    expect(dimensions).toEqual(expectedDimensions);
  });

  test('should compute line annotation dimensions for xDomain on a xScale (chartRotation 90, ordinal scale)', () => {
    const chartRotation: Rotation = 90;
    const yScales: Map<GroupId, Scale> = new Map();

    const xScale: Scale = ordinalScale;

    const annotationId = getAnnotationId('foo-line');
    const lineAnnotation: LineAnnotationSpec = {
      annotationType: 'line',
      annotationId,
      domainType: AnnotationDomainTypes.XDomain,
      dataValues: [{ dataValue: 'a', details: 'foo' }],
      groupId,
      style: DEFAULT_ANNOTATION_LINE_STYLE,
    };

    const dimensions = computeLineAnnotationDimensions(
      lineAnnotation,
      chartDimensions,
      chartRotation,
      yScales,
      xScale,
      Position.Left,
      0,
      false,
    );
    const expectedDimensions = [
      {
        position: [12.5, -DEFAULT_LINE_OVERFLOW, 12.5, 10],
        details: { detailsText: 'foo', headerText: 'a' },
        tooltipLinePosition: [0, 12.5, 10, 12.5],
      },
    ];
    expect(dimensions).toEqual(expectedDimensions);
  });

  test('should compute line annotation dimensions for xDomain on a xScale (chartRotation 90, continuous scale)', () => {
    const chartRotation: Rotation = 90;
    const yScales: Map<GroupId, Scale> = new Map();

    const xScale: Scale = continuousScale;

    const annotationId = getAnnotationId('foo-line');
    const lineAnnotation: LineAnnotationSpec = {
      annotationType: 'line',
      annotationId,
      domainType: AnnotationDomainTypes.XDomain,
      dataValues: [{ dataValue: 2, details: 'foo' }],
      groupId,
      style: DEFAULT_ANNOTATION_LINE_STYLE,
    };

    const dimensions = computeLineAnnotationDimensions(
      lineAnnotation,
      chartDimensions,
      chartRotation,
      yScales,
      xScale,
      Position.Left,
      0,
      false,
    );
    const expectedDimensions = [
      {
        position: [20, -DEFAULT_LINE_OVERFLOW, 20, 10],
        details: { detailsText: 'foo', headerText: '2' },
        tooltipLinePosition: [0, 20, 10, 20],
      },
    ];
    expect(dimensions).toEqual(expectedDimensions);
  });

  test('should compute line annotation dimensions for xDomain on a xScale (chartRotation -90, continuous scale)', () => {
    const chartRotation: Rotation = -90;
    const yScales: Map<GroupId, Scale> = new Map();

    const xScale: Scale = continuousScale;

    const annotationId = getAnnotationId('foo-line');
    const lineAnnotation: LineAnnotationSpec = {
      annotationType: 'line',
      annotationId,
      domainType: AnnotationDomainTypes.XDomain,
      dataValues: [{ dataValue: 2, details: 'foo' }],
      groupId,
      style: DEFAULT_ANNOTATION_LINE_STYLE,
    };

    const dimensions = computeLineAnnotationDimensions(
      lineAnnotation,
      chartDimensions,
      chartRotation,
      yScales,
      xScale,
      Position.Left,
      0,
      false,
    );
    const expectedDimensions = [
      {
        position: [20, -DEFAULT_LINE_OVERFLOW, 20, 10],
        details: { detailsText: 'foo', headerText: '2' },
        tooltipLinePosition: [0, 0, 10, 0],
      },
    ];
    expect(dimensions).toEqual(expectedDimensions);
  });

  test('should compute line annotation dimensions for xDomain (chartRotation 180, continuous scale, top axis)', () => {
    const chartRotation: Rotation = 180;
    const yScales: Map<GroupId, Scale> = new Map();

    const xScale: Scale = continuousScale;

    const annotationId = getAnnotationId('foo-line');
    const lineAnnotation: LineAnnotationSpec = {
      annotationType: 'line',
      annotationId,
      domainType: AnnotationDomainTypes.XDomain,
      dataValues: [{ dataValue: 2, details: 'foo' }],
      groupId,
      style: DEFAULT_ANNOTATION_LINE_STYLE,
    };

    const dimensions = computeLineAnnotationDimensions(
      lineAnnotation,
      chartDimensions,
      chartRotation,
      yScales,
      xScale,
      Position.Top,
      0,
      false,
    );
    const expectedDimensions = [
      {
        position: [20, -DEFAULT_LINE_OVERFLOW, 20, 20],
        details: { detailsText: 'foo', headerText: '2' },
        tooltipLinePosition: [20, 0, 20, 20],
      },
    ];
    expect(dimensions).toEqual(expectedDimensions);
  });

  test('should compute line annotation dimensions for xDomain (chartRotation 180, continuous scale, bottom axis)', () => {
    const chartRotation: Rotation = 180;
    const yScales: Map<GroupId, Scale> = new Map();
    const xScale: Scale = continuousScale;

    const annotationId = getAnnotationId('foo-line');
    const lineAnnotation: LineAnnotationSpec = {
      annotationType: 'line',
      annotationId,
      domainType: AnnotationDomainTypes.XDomain,
      dataValues: [{ dataValue: 2, details: 'foo' }],
      groupId,
      style: DEFAULT_ANNOTATION_LINE_STYLE,
    };

    const dimensions = computeLineAnnotationDimensions(
      lineAnnotation,
      chartDimensions,
      chartRotation,
      yScales,
      xScale,
      Position.Bottom,
      0,
      false,
    );
    const expectedDimensions = [
      {
        position: [20, DEFAULT_LINE_OVERFLOW, 20, 20],
        details: { detailsText: 'foo', headerText: '2' },
        tooltipLinePosition: [20, DEFAULT_LINE_OVERFLOW, 20, 20],
      },
    ];
    expect(dimensions).toEqual(expectedDimensions);
  });

  test('should not compute annotation line values for values outside of domain or AnnotationSpec.hideLines', () => {
    const chartRotation: Rotation = 0;
    const yScales: Map<GroupId, Scale> = new Map();
    yScales.set(groupId, continuousScale);

    const xScale: Scale = ordinalScale;

    const annotationId = getAnnotationId('foo-line');
    const invalidXLineAnnotation: AnnotationSpec = {
      annotationType: 'line',
      annotationId,
      domainType: AnnotationDomainTypes.XDomain,
      dataValues: [{ dataValue: 'e', details: 'foo' }],
      groupId,
      style: DEFAULT_ANNOTATION_LINE_STYLE,
    };

    const emptyXDimensions = computeLineAnnotationDimensions(
      invalidXLineAnnotation,
      chartDimensions,
      chartRotation,
      yScales,
      xScale,
      Position.Right,
      0,
      false,
    );

    expect(emptyXDimensions).toEqual([]);

    const invalidStringXLineAnnotation: AnnotationSpec = {
      annotationType: 'line',
      annotationId,
      domainType: AnnotationDomainTypes.XDomain,
      dataValues: [{ dataValue: '', details: 'foo' }],
      groupId,
      style: DEFAULT_ANNOTATION_LINE_STYLE,
    };

    const invalidStringXDimensions = computeLineAnnotationDimensions(
      invalidStringXLineAnnotation,
      chartDimensions,
      chartRotation,
      yScales,
      continuousScale,
      Position.Right,
      0,
      false,
    );

    expect(invalidStringXDimensions).toEqual([]);

    const outOfBoundsXLineAnnotation: AnnotationSpec = {
      annotationType: 'line',
      annotationId,
      domainType: AnnotationDomainTypes.XDomain,
      dataValues: [{ dataValue: -999, details: 'foo' }],
      groupId,
      style: DEFAULT_ANNOTATION_LINE_STYLE,
    };

    const emptyOutOfBoundsXDimensions = computeLineAnnotationDimensions(
      outOfBoundsXLineAnnotation,
      chartDimensions,
      chartRotation,
      yScales,
      continuousScale,
      Position.Right,
      0,
      false,
    );

    expect(emptyOutOfBoundsXDimensions).toEqual([]);

    const invalidYLineAnnotation: AnnotationSpec = {
      annotationType: 'line',
      annotationId,
      domainType: AnnotationDomainTypes.YDomain,
      dataValues: [{ dataValue: 'e', details: 'foo' }],
      groupId,
      style: DEFAULT_ANNOTATION_LINE_STYLE,
    };

    const emptyYDimensions = computeLineAnnotationDimensions(
      invalidYLineAnnotation,
      chartDimensions,
      chartRotation,
      yScales,
      xScale,
      Position.Right,
      0,
      false,
    );

    expect(emptyYDimensions).toEqual([]);

    const outOfBoundsYLineAnnotation: AnnotationSpec = {
      annotationType: 'line',
      annotationId,
      domainType: AnnotationDomainTypes.YDomain,
      dataValues: [{ dataValue: -999, details: 'foo' }],
      groupId,
      style: DEFAULT_ANNOTATION_LINE_STYLE,
    };

    const emptyOutOfBoundsYDimensions = computeLineAnnotationDimensions(
      outOfBoundsYLineAnnotation,
      chartDimensions,
      chartRotation,
      yScales,
      xScale,
      Position.Right,
      0,
      false,
    );

    expect(emptyOutOfBoundsYDimensions).toEqual([]);

    const invalidStringYLineAnnotation: AnnotationSpec = {
      annotationType: 'line',
      annotationId,
      domainType: AnnotationDomainTypes.YDomain,
      dataValues: [{ dataValue: '', details: 'foo' }],
      groupId,
      style: DEFAULT_ANNOTATION_LINE_STYLE,
    };

    const invalidStringYDimensions = computeLineAnnotationDimensions(
      invalidStringYLineAnnotation,
      chartDimensions,
      chartRotation,
      yScales,
      continuousScale,
      Position.Right,
      0,
      false,
    );

    expect(invalidStringYDimensions).toEqual([]);

    const validHiddenAnnotation: AnnotationSpec = {
      annotationType: 'line',
      annotationId,
      domainType: AnnotationDomainTypes.XDomain,
      dataValues: [{ dataValue: 2, details: 'foo' }],
      groupId,
      style: DEFAULT_ANNOTATION_LINE_STYLE,
      hideLines: true,
    };

    const hiddenAnnotationDimensions = computeLineAnnotationDimensions(
      validHiddenAnnotation,
      chartDimensions,
      chartRotation,
      yScales,
      continuousScale,
      Position.Right,
      0,
      false,
    );

    expect(hiddenAnnotationDimensions).toEqual(null);
  });

  test('should compute if a point is within an annotation line bounds (xDomain annotation)', () => {
    const linePosition1: AnnotationLinePosition = [10, 0, 10, 20];
    const cursorPosition1: Point = { x: 0, y: 0 };
    const cursorPosition2: Point = { x: 10, y: 0 };

    const offset = 0;
    const horizontalChartRotation: Rotation = 0;
    const verticalChartRotation: Rotation = 90;
    const domainType: AnnotationDomainType = AnnotationDomainTypes.XDomain;

    const horizontalRotationOutsideBounds = isWithinLineBounds(
      Position.Bottom,
      linePosition1,
      cursorPosition1,
      offset,
      horizontalChartRotation,
      chartDimensions,
      domainType,
    );

    expect(horizontalRotationOutsideBounds).toBe(false);

    const horizontalRotationWithinBounds = isWithinLineBounds(
      Position.Bottom,
      linePosition1,
      cursorPosition2,
      offset,
      horizontalChartRotation,
      chartDimensions,
      domainType,
    );
    expect(horizontalRotationWithinBounds).toBe(true);

    const verticalRotationOutsideBounds = isWithinLineBounds(
      Position.Bottom,
      linePosition1,
      cursorPosition1,
      offset,
      verticalChartRotation,
      chartDimensions,
      domainType,
    );

    expect(verticalRotationOutsideBounds).toBe(false);

    const verticalRotationWithinBounds = isWithinLineBounds(
      Position.Bottom,
      linePosition1,
      { x: 0, y: 10 },
      offset,
      verticalChartRotation,
      chartDimensions,
      domainType,
    );

    expect(verticalRotationWithinBounds).toBe(true);
  });
  test('should compute if a point is within an annotation line bounds (yDomain annotation)', () => {
    const linePosition1: AnnotationLinePosition = [10, 0, 10, 20];
    const cursorPosition1: Point = { x: 0, y: 0 };
    const cursorPosition2: Point = { x: 10, y: 0 };

    const offset = 0;
    const horizontalChartRotation: Rotation = 0;
    const verticalChartRotation: Rotation = 90;
    const domainType: AnnotationDomainType = AnnotationDomainTypes.YDomain;

    const horizontalRotationOutsideBounds = isWithinLineBounds(
      Position.Left,
      linePosition1,
      cursorPosition1,
      offset,
      horizontalChartRotation,
      chartDimensions,
      domainType,
    );

    expect(horizontalRotationOutsideBounds).toBe(false);

    const horizontalRotationWithinBounds = isWithinLineBounds(
      Position.Left,
      linePosition1,
      cursorPosition2,
      offset,
      horizontalChartRotation,
      chartDimensions,
      domainType,
    );
    expect(horizontalRotationWithinBounds).toBe(true);

    const verticalRotationOutsideBounds = isWithinLineBounds(
      Position.Left,
      linePosition1,
      cursorPosition1,
      offset,
      verticalChartRotation,
      chartDimensions,
      domainType,
    );

    expect(verticalRotationOutsideBounds).toBe(false);

    const verticalRotationWithinBounds = isWithinLineBounds(
      Position.Left,
      [0, 10, 20, 10],
      { x: 0, y: 10 },
      offset,
      verticalChartRotation,
      chartDimensions,
      domainType,
    );

    expect(verticalRotationWithinBounds).toBe(true);
  });
  test('should determine if an annotation line is vertical dependent on domain type & chart rotation', () => {
    const isHorizontal = true;
    const isXDomain = true;
    const xDomainHorizontalRotation = isVerticalAnnotationLine(isXDomain, isHorizontal);
    expect(xDomainHorizontalRotation).toBe(true);

    const xDomainVerticalRotation = isVerticalAnnotationLine(isXDomain, !isHorizontal);
    expect(xDomainVerticalRotation).toBe(false);

    const yDomainHorizontalRotation = isVerticalAnnotationLine(!isXDomain, isHorizontal);
    expect(yDomainHorizontalRotation).toBe(false);

    const yDomainVerticalRotation = isVerticalAnnotationLine(isXDomain, !isHorizontal);
    expect(yDomainVerticalRotation).toBe(false);
  });
  test('should get the x offset for an annotation line tooltip', () => {
    const bottomHorizontalRotationOffset = getAnnotationLineTooltipXOffset(0, Position.Bottom);
    expect(bottomHorizontalRotationOffset).toBe(50);

    const topHorizontalRotationOffset = getAnnotationLineTooltipXOffset(0, Position.Top);
    expect(topHorizontalRotationOffset).toBe(50);

    const bottomVerticalRotationOffset = getAnnotationLineTooltipXOffset(90, Position.Bottom);
    expect(bottomVerticalRotationOffset).toBe(0);

    const topVerticalRotationOffset = getAnnotationLineTooltipXOffset(90, Position.Top);
    expect(topVerticalRotationOffset).toBe(0);

    const leftHorizontalRotationOffset = getAnnotationLineTooltipXOffset(0, Position.Left);
    expect(leftHorizontalRotationOffset).toBe(0);

    const rightHorizontalRotationOffset = getAnnotationLineTooltipXOffset(0, Position.Right);
    expect(rightHorizontalRotationOffset).toBe(100);

    const leftVerticalRotationOffset = getAnnotationLineTooltipXOffset(90, Position.Left);
    expect(leftVerticalRotationOffset).toBe(50);

    const rightVerticalRotationOffset = getAnnotationLineTooltipXOffset(90, Position.Right);
    expect(rightVerticalRotationOffset).toBe(50);
  });
  test('should get the y offset for an annotation line tooltip', () => {
    const bottomHorizontalRotationOffset = getAnnotationLineTooltipYOffset(0, Position.Bottom);
    expect(bottomHorizontalRotationOffset).toBe(100);

    const topHorizontalRotationOffset = getAnnotationLineTooltipYOffset(0, Position.Top);
    expect(topHorizontalRotationOffset).toBe(0);

    const bottomVerticalRotationOffset = getAnnotationLineTooltipYOffset(90, Position.Bottom);
    expect(bottomVerticalRotationOffset).toBe(50);

    const topVerticalRotationOffset = getAnnotationLineTooltipYOffset(90, Position.Top);
    expect(topVerticalRotationOffset).toBe(50);

    const leftHorizontalRotationOffset = getAnnotationLineTooltipYOffset(0, Position.Left);
    expect(leftHorizontalRotationOffset).toBe(50);

    const rightHorizontalRotationOffset = getAnnotationLineTooltipYOffset(0, Position.Right);
    expect(rightHorizontalRotationOffset).toBe(50);

    const leftVerticalRotationOffset = getAnnotationLineTooltipYOffset(90, Position.Left);
    expect(leftVerticalRotationOffset).toBe(100);

    const rightVerticalRotationOffset = getAnnotationLineTooltipYOffset(90, Position.Right);
    expect(rightVerticalRotationOffset).toBe(100);
  });
  test('should get annotation line tooltip position', () => {
    const chartRotation: Rotation = 0;
    const linePosition: AnnotationLinePosition = [1, 2, 3, 4];

    const bottomLineTooltipPosition = getAnnotationLineTooltipPosition(chartRotation, linePosition, Position.Bottom);
    expect(bottomLineTooltipPosition).toEqual({
      xPosition: 1,
      yPosition: 4,
      xOffset: 50,
      yOffset: 100,
    });

    const topLineTooltipPosition = getAnnotationLineTooltipPosition(chartRotation, linePosition, Position.Top);
    expect(topLineTooltipPosition).toEqual({ xPosition: 1, yPosition: 2, xOffset: 50, yOffset: 0 });

    const leftLineTooltipPosition = getAnnotationLineTooltipPosition(chartRotation, linePosition, Position.Left);
    expect(leftLineTooltipPosition).toEqual({
      xPosition: 1,
      yPosition: 4,
      xOffset: 0,
      yOffset: 50,
    });

    const rightLineTooltipPosition = getAnnotationLineTooltipPosition(chartRotation, linePosition, Position.Right);
    expect(rightLineTooltipPosition).toEqual({
      xPosition: 3,
      yPosition: 4,
      xOffset: 100,
      yOffset: 50,
    });
  });
  test('should form the string for the position transform given a TransformPoint', () => {
    const transformString = toTransformString({
      xPosition: 1,
      yPosition: 4,
      xOffset: 50,
      yOffset: 100,
    });
    expect(transformString).toBe('translate(calc(1px - 50%),calc(4px - 100%))');
  });
  test('should get the transform for an annotation line tooltip', () => {
    const chartRotation: Rotation = 0;
    const linePosition: AnnotationLinePosition = [1, 2, 3, 4];

    const lineTooltipTransform = getAnnotationLineTooltipTransform(chartRotation, linePosition, Position.Bottom);
    expect(lineTooltipTransform).toBe('translate(calc(1px - 50%),calc(4px - 100%))');
  });
  test('should compute the tooltip state for an annotation line', () => {
    const cursorPosition: Point = { x: 1, y: 2 };
    const annotationLines: AnnotationLineProps[] = [
      {
        position: [1, 2, 3, 4],
        details: {},
        tooltipLinePosition: [1, 2, 3, 4],
      },
      {
        position: [0, 10, 20, 10],
        details: {},
        tooltipLinePosition: [0, 10, 20, 10],
      },
    ];
    const lineStyle = DEFAULT_ANNOTATION_LINE_STYLE;
    const chartRotation: Rotation = 0;
    const localAxesSpecs = new Map();

    // missing annotation axis (xDomain)
    const missingTooltipState = computeLineAnnotationTooltipState(
      cursorPosition,
      annotationLines,
      groupId,
      AnnotationDomainTypes.XDomain,
      lineStyle,
      chartRotation,
      chartDimensions,
      localAxesSpecs,
    );

    const expectedMissingTooltipState = {
      isVisible: false,
      transform: '',
      annotationType: 'line',
    };

    expect(missingTooltipState).toEqual(expectedMissingTooltipState);

    // add axis for xDomain annotation
    localAxesSpecs.set(horizontalAxisSpec.id, horizontalAxisSpec);

    const xDomainTooltipState = computeLineAnnotationTooltipState(
      cursorPosition,
      annotationLines,
      groupId,
      AnnotationDomainTypes.XDomain,
      lineStyle,
      chartRotation,
      chartDimensions,
      localAxesSpecs,
    );
    const expectedXDomainTooltipState = {
      isVisible: true,
      transform: 'translate(calc(1px - 50%),calc(4px - 100%))',
      annotationType: 'line',
    };

    expect(xDomainTooltipState).toEqual(expectedXDomainTooltipState);

    // rotated xDomain
    const xDomainRotatedTooltipState = computeLineAnnotationTooltipState(
      { x: 9, y: 18 },
      annotationLines,
      groupId,
      AnnotationDomainTypes.XDomain,
      lineStyle,
      180,
      chartDimensions,
      localAxesSpecs,
    );
    const expectedXDomainRotatedTooltipState = {
      isVisible: true,
      transform: 'translate(calc(9px - 50%),calc(4px - 100%))',
      annotationType: 'line',
    };

    expect(xDomainRotatedTooltipState).toEqual(expectedXDomainRotatedTooltipState);

    // add axis for yDomain annotation
    localAxesSpecs.set(verticalAxisSpec.id, verticalAxisSpec);

    const yDomainTooltipState = computeLineAnnotationTooltipState(
      cursorPosition,
      annotationLines,
      groupId,
      AnnotationDomainTypes.YDomain,
      lineStyle,
      chartRotation,
      chartDimensions,
      localAxesSpecs,
    );
    const expectedYDomainTooltipState = {
      isVisible: true,
      transform: 'translate(calc(1px - 0%),calc(4px - 50%))',
      annotationType: 'line',
    };

    expect(yDomainTooltipState).toEqual(expectedYDomainTooltipState);

    const flippedYDomainTooltipState = computeLineAnnotationTooltipState(
      { x: 9, y: 18 },
      annotationLines,
      groupId,
      AnnotationDomainTypes.YDomain,
      lineStyle,
      180,
      chartDimensions,
      localAxesSpecs,
    );
    const expectedFlippedYDomainTooltipState = {
      isVisible: true,
      transform: 'translate(calc(1px - 0%),calc(16px - 50%))',
      annotationType: 'line',
    };

    expect(flippedYDomainTooltipState).toEqual(expectedFlippedYDomainTooltipState);

    const rotatedYDomainTooltipState = computeLineAnnotationTooltipState(
      { x: 0, y: 10 },
      annotationLines,
      groupId,
      AnnotationDomainTypes.YDomain,
      lineStyle,
      90,
      chartDimensions,
      localAxesSpecs,
    );
    const expectedRotatedYDomainTooltipState = {
      isVisible: true,
      transform: 'translate(calc(10px - 50%),calc(10px - 100%))',
      annotationType: 'line',
    };

    expect(rotatedYDomainTooltipState).toEqual(expectedRotatedYDomainTooltipState);
  });

  test('should compute the tooltip state for an annotation', () => {
    const annotations: Map<AnnotationId, AnnotationSpec> = new Map();
    const annotationId = getAnnotationId('foo');
    const lineAnnotation: LineAnnotationSpec = {
      annotationType: 'line',
      annotationId,
      domainType: AnnotationDomainTypes.YDomain,
      dataValues: [{ dataValue: 2, details: 'foo' }],
      groupId,
      style: DEFAULT_ANNOTATION_LINE_STYLE,
    };

    const cursorPosition: Point = { x: 1, y: 2 };

    const annotationLines: AnnotationLineProps[] = [
      {
        position: [1, 2, 3, 4],
        details: {},
        tooltipLinePosition: [1, 2, 3, 4],
      },
    ];
    const chartRotation: Rotation = 0;
    const localAxesSpecs: Map<AxisId, AxisSpec> = new Map();

    const annotationDimensions = new Map();
    annotationDimensions.set(annotationId, annotationLines);

    // missing annotations
    const missingSpecTooltipState = computeAnnotationTooltipState(
      cursorPosition,
      annotationDimensions,
      annotations,
      chartRotation,
      localAxesSpecs,
      chartDimensions,
    );

    expect(missingSpecTooltipState).toBe(null);

    // add valid annotation axis
    annotations.set(annotationId, lineAnnotation);
    localAxesSpecs.set(verticalAxisSpec.id, verticalAxisSpec);

    // hide tooltipState
    lineAnnotation.hideTooltips = true;

    const hideTooltipState = computeAnnotationTooltipState(
      cursorPosition,
      annotationDimensions,
      annotations,
      chartRotation,
      localAxesSpecs,
      chartDimensions,
    );

    expect(hideTooltipState).toBe(null);

    // show tooltipState, hide lines
    lineAnnotation.hideTooltips = false;
    lineAnnotation.hideLines = true;

    const hideLinesTooltipState = computeAnnotationTooltipState(
      cursorPosition,
      annotationDimensions,
      annotations,
      chartRotation,
      localAxesSpecs,
      chartDimensions,
    );

    expect(hideLinesTooltipState).toBe(null);

    // show tooltipState & lines
    lineAnnotation.hideTooltips = false;
    lineAnnotation.hideLines = false;

    const tooltipState = computeAnnotationTooltipState(
      cursorPosition,
      annotationDimensions,
      annotations,
      chartRotation,
      localAxesSpecs,
      chartDimensions,
    );

    const expectedTooltipState = {
      isVisible: true,
      transform: 'translate(calc(1px - 0%),calc(4px - 50%))',
      annotationType: 'line',
    };

    expect(tooltipState).toEqual(expectedTooltipState);

    // rect annotation tooltip
    const annotationRectangle: RectAnnotationSpec = {
      annotationId: getAnnotationId('rect'),
      groupId,
      annotationType: 'rectangle',
      dataValues: [{ coordinates: { x0: 1, x1: 2, y0: 3, y1: 5 } }],
    };

    const rectAnnotations = new Map();
    rectAnnotations.set(annotationRectangle.annotationId, annotationRectangle);

    const rectAnnotationDimensions = [{ rect: { x: 2, y: 3, width: 3, height: 5 } }];
    annotationDimensions.set(annotationRectangle.annotationId, rectAnnotationDimensions);

    const rectTooltipState = computeAnnotationTooltipState(
      { x: 3, y: 4 },
      annotationDimensions,
      rectAnnotations,
      chartRotation,
      localAxesSpecs,
      chartDimensions,
    );

    const expectedRectTooltipState = {
      isVisible: true,
      transform: 'translate(0, 0)',
      annotationType: 'rectangle',
      top: 4,
      left: 5,
    };

    expect(rectTooltipState).toEqual(expectedRectTooltipState);
  });

  test('should get associated axis for an annotation', () => {
    const localAxesSpecs = new Map();

    const noAxis = getAnnotationAxis(localAxesSpecs, groupId, AnnotationDomainTypes.XDomain);
    expect(noAxis).toBe(null);

    localAxesSpecs.set(horizontalAxisSpec.id, horizontalAxisSpec);
    localAxesSpecs.set(verticalAxisSpec.id, verticalAxisSpec);

    const xAnnotationAxisPosition = getAnnotationAxis(localAxesSpecs, groupId, AnnotationDomainTypes.XDomain);
    expect(xAnnotationAxisPosition).toEqual(Position.Bottom);

    const yAnnotationAxisPosition = getAnnotationAxis(localAxesSpecs, groupId, AnnotationDomainTypes.YDomain);
    expect(yAnnotationAxisPosition).toEqual(Position.Left);
  });
  test('should not compute rectangle annotation dimensions when no yScale', () => {
    const yScales: Map<GroupId, Scale> = new Map();
    yScales.set(groupId, continuousScale);

    const xScale: Scale = continuousScale;

    const annotationRectangle: RectAnnotationSpec = {
      annotationId: getAnnotationId('rect'),
      groupId: getGroupId('foo'),
      annotationType: 'rectangle',
      dataValues: [{ coordinates: { x0: 1, x1: 2, y0: 3, y1: 5 } }],
    };

    const noYScale = computeRectAnnotationDimensions(annotationRectangle, yScales, xScale, false, 0);

    expect(noYScale).toBe(null);
  });
  test('should skip computing rectangle annotation dimensions when annotation data invalid', () => {
    const yScales: Map<GroupId, Scale> = new Map();
    yScales.set(groupId, continuousScale);

    const xScale: Scale = continuousScale;

    const annotationRectangle: RectAnnotationSpec = {
      annotationId: getAnnotationId('rect'),
      groupId,
      annotationType: 'rectangle',
      dataValues: [
        { coordinates: { x0: 1, x1: 2, y0: -10, y1: 5 } },
        { coordinates: { x0: null, x1: null, y0: null, y1: null } },
      ],
    };

    const skippedInvalid = computeRectAnnotationDimensions(annotationRectangle, yScales, xScale, false, 0);

    expect(skippedInvalid).toEqual([]);
  });
  test('should compute rectangle dimensions shifted for histogram mode', () => {
    const yScales: Map<GroupId, Scale> = new Map();
    yScales.set(groupId, continuousScale);

    const xScale: Scale = new ScaleContinuous(
      { type: ScaleType.Linear, domain: continuousData, range: [minRange, maxRange] },
      { bandwidth: 1, minInterval: 1 },
    );

    const annotationRectangle: RectAnnotationSpec = {
      annotationId: getAnnotationId('rect'),
      groupId,
      annotationType: 'rectangle',
      dataValues: [
        { coordinates: { x0: 1, x1: null, y0: null, y1: null } },
        { coordinates: { x0: null, x1: 1, y0: null, y1: null } },
        { coordinates: { x0: null, x1: null, y0: 1, y1: null } },
        { coordinates: { x0: null, x1: null, y0: null, y1: 1 } },
      ],
    };

    const dimensions = computeRectAnnotationDimensions(annotationRectangle, yScales, xScale, true, 0);

    const [dims1, dims2, dims3, dims4] = dimensions;
    expect(dims1.rect.x).toBe(0);
    expect(dims1.rect.y).toBe(0);
    expect(dims1.rect.width).toBe(10);
    expect(dims1.rect.height).toBe(100);

    expect(dims2.rect.x).toBe(10);
    expect(dims2.rect.y).toBe(0);
    expect(dims2.rect.width).toBeCloseTo(100);
    expect(dims2.rect.height).toBe(100);

    expect(dims3.rect.x).toBe(0);
    expect(dims3.rect.y).toBe(0);
    expect(dims3.rect.width).toBeCloseTo(110);
    expect(dims3.rect.height).toBe(10);

    expect(dims4.rect.x).toBe(0);
    expect(dims4.rect.y).toBe(10);
    expect(dims4.rect.width).toBeCloseTo(110);
    expect(dims4.rect.height).toBe(90);
  });
  test('should compute rectangle dimensions when only a single coordinate defined', () => {
    const yScales: Map<GroupId, Scale> = new Map();
    yScales.set(groupId, continuousScale);

    const xScale: Scale = continuousScale;

    const annotationRectangle: RectAnnotationSpec = {
      annotationId: getAnnotationId('rect'),
      groupId,
      annotationType: 'rectangle',
      dataValues: [
        { coordinates: { x0: 1, x1: null, y0: null, y1: null } },
        { coordinates: { x0: null, x1: 1, y0: null, y1: null } },
        { coordinates: { x0: null, x1: null, y0: 1, y1: null } },
        { coordinates: { x0: null, x1: null, y0: null, y1: 1 } },
      ],
    };

    const dimensions = computeRectAnnotationDimensions(annotationRectangle, yScales, xScale, false, 0);

    const expectedDimensions = [
      { rect: { x: 0, y: 0, width: 10, height: 100 } },
      { rect: { x: 10, y: 0, width: 90, height: 100 } },
      { rect: { x: 0, y: 0, width: 100, height: 10 } },
      { rect: { x: 0, y: 10, width: 100, height: 90 } },
    ];

    expect(dimensions).toEqual(expectedDimensions);
  });
  test('should compute rectangle annotation dimensions continuous (0 deg rotation)', () => {
    const yScales: Map<GroupId, Scale> = new Map();
    yScales.set(groupId, continuousScale);

    const xScale: Scale = continuousScale;

    const annotationRectangle: RectAnnotationSpec = {
      annotationId: getAnnotationId('rect'),
      groupId,
      annotationType: 'rectangle',
      dataValues: [{ coordinates: { x0: 1, x1: 2, y0: 3, y1: 5 } }],
    };

    const unrotated = computeRectAnnotationDimensions(annotationRectangle, yScales, xScale, false, 0);

    expect(unrotated).toEqual([{ rect: { x: 10, y: 30, width: 10, height: 20 } }]);
  });
  test('should compute rectangle annotation dimensions ordinal (0 deg rotation)', () => {
    const yScales: Map<GroupId, Scale> = new Map();
    yScales.set(groupId, continuousScale);

    const xScale: Scale = ordinalScale;

    const annotationRectangle: RectAnnotationSpec = {
      annotationId: getAnnotationId('rect'),
      groupId,
      annotationType: 'rectangle',
      dataValues: [{ coordinates: { x0: 'a', x1: 'b', y0: 0, y1: 2 } }],
    };

    const unrotated = computeRectAnnotationDimensions(annotationRectangle, yScales, xScale, false, 0);

    expect(unrotated).toEqual([{ rect: { x: 0, y: 0, width: 25, height: 20 } }]);
  });
  test('should validate scaled dataValues', () => {
    // not aligned with tick
    expect(scaleAndValidateDatum('', ordinalScale, false)).toBe(null);
    expect(scaleAndValidateDatum('a', continuousScale, false)).toBe(null);
    expect(scaleAndValidateDatum(-10, continuousScale, false)).toBe(null);
    expect(scaleAndValidateDatum(20, continuousScale, false)).toBe(null);

    // allow values within domainEnd + minInterval when not alignWithTick
    expect(scaleAndValidateDatum(10.25, continuousScale, false)).toBeCloseTo(102.5);
    expect(scaleAndValidateDatum(10.25, continuousScale, true)).toBe(null);

    expect(scaleAndValidateDatum('a', ordinalScale, false)).toBe(0);
    expect(scaleAndValidateDatum(0, continuousScale, false)).toBe(0);

    // aligned with tick
    expect(scaleAndValidateDatum(1.25, continuousScale, true)).toBe(10);
  });
  test('should determine if a point is within a rectangle annotation', () => {
    const cursorPosition = { x: 3, y: 4 };

    const outOfXBounds = { startX: 4, endX: 5, startY: 3, endY: 5 };
    const outOfYBounds = { startX: 2, endX: 4, startY: 5, endY: 6 };
    const withinBounds = { startX: 2, endX: 4, startY: 3, endY: 5 };
    const withinBoundsReverseXScale = { startX: 4, endX: 2, startY: 3, endY: 5 };
    const withinBoundsReverseYScale = { startX: 2, endX: 4, startY: 5, endY: 3 };

    // chart rotation 0
    expect(isWithinRectBounds(cursorPosition, outOfXBounds)).toBe(false);
    expect(isWithinRectBounds(cursorPosition, outOfYBounds)).toBe(false);
    expect(isWithinRectBounds(cursorPosition, withinBounds)).toBe(true);
    expect(isWithinRectBounds(cursorPosition, withinBoundsReverseXScale)).toBe(false);
    expect(isWithinRectBounds(cursorPosition, withinBoundsReverseYScale)).toBe(false);

    // chart rotation 180
    expect(isWithinRectBounds(cursorPosition, outOfXBounds)).toBe(false);
    expect(isWithinRectBounds(cursorPosition, outOfYBounds)).toBe(false);
    expect(isWithinRectBounds(cursorPosition, withinBounds)).toBe(true);
    expect(isWithinRectBounds(cursorPosition, withinBoundsReverseXScale)).toBe(false);
    expect(isWithinRectBounds(cursorPosition, withinBoundsReverseYScale)).toBe(false);

    // chart rotation 90
    expect(isWithinRectBounds(cursorPosition, outOfXBounds)).toBe(false);
    expect(isWithinRectBounds(cursorPosition, outOfYBounds)).toBe(false);
    expect(isWithinRectBounds(cursorPosition, withinBounds)).toBe(true);
    expect(isWithinRectBounds(cursorPosition, withinBoundsReverseXScale)).toBe(false);
    expect(isWithinRectBounds(cursorPosition, withinBoundsReverseYScale)).toBe(false);

    // chart rotation -90
    expect(isWithinRectBounds(cursorPosition, outOfXBounds)).toBe(false);
    expect(isWithinRectBounds(cursorPosition, outOfYBounds)).toBe(false);
    expect(isWithinRectBounds(cursorPosition, withinBounds)).toBe(true);
    expect(isWithinRectBounds(cursorPosition, withinBoundsReverseXScale)).toBe(false);
    expect(isWithinRectBounds(cursorPosition, withinBoundsReverseYScale)).toBe(false);
  });
  test('should determine if an annotation has a rightward tooltip based on cursor position', () => {
    const cursor1 = { x: 8, y: 0 };
    const cursor2 = { x: 0, y: 8 };

    // chart rotation 0
    expect(isRightRectTooltip(0, cursor1, 10)).toBe(false);
    expect(isRightRectTooltip(0, cursor2, 10)).toBe(true);

    // chart rotation 180
    expect(isRightRectTooltip(180, cursor1, 10)).toBe(false);
    expect(isRightRectTooltip(180, cursor2, 10)).toBe(true);

    // chart rotation 90
    expect(isRightRectTooltip(90, cursor1, 10)).toBe(true);
    expect(isRightRectTooltip(90, cursor2, 10)).toBe(false);

    // chart rotation -90
    expect(isRightRectTooltip(-90, cursor1, 10)).toBe(false);
    expect(isRightRectTooltip(-90, cursor2, 10)).toBe(true);
  });
  test('should determine if an annotation has a bottomward tooltip based on cursor position', () => {
    const cursor1 = { x: 8, y: 0 };
    const cursor2 = { x: 0, y: 8 };

    // chart rotation 0
    expect(isBottomRectTooltip(0, cursor1, 10)).toBe(true);
    expect(isBottomRectTooltip(0, cursor2, 10)).toBe(false);

    // chart rotation 180
    expect(isBottomRectTooltip(180, cursor1, 10)).toBe(false);
    expect(isBottomRectTooltip(180, cursor2, 10)).toBe(true);

    // chart rotation 90
    expect(isBottomRectTooltip(90, cursor1, 10)).toBe(false);
    expect(isBottomRectTooltip(90, cursor2, 10)).toBe(true);

    // chart rotation -90
    expect(isBottomRectTooltip(-90, cursor1, 10)).toBe(false);
    expect(isBottomRectTooltip(-90, cursor2, 10)).toBe(true);
  });
  test('should compute rect annotation tooltip left', () => {
    const isRightTooltip = true;
    const xPosition = { startX: 2, endX: 4 };
    const cursorX = 3;
    const chartWidth = 10;

    expect(computeRectTooltipLeft(0, isRightTooltip, xPosition, cursorX, chartWidth)).toBe(4);
    expect(computeRectTooltipLeft(180, !isRightTooltip, xPosition, cursorX, chartWidth)).toBe(8);
    expect(computeRectTooltipLeft(90, isRightTooltip, xPosition, cursorX, chartWidth)).toBe(3);
  });
  test('should compute rect annotation tooltip top', () => {
    const isBottomTooltip = true;
    const xPosition = { startX: 2, endX: 4 };
    const cursorY = 3;
    const chartHeight = 10;

    expect(computeRectTooltipTop(0, isBottomTooltip, xPosition, cursorY, chartHeight)).toBe(3);
    expect(computeRectTooltipTop(90, isBottomTooltip, xPosition, cursorY, chartHeight)).toBe(4);
    expect(computeRectTooltipTop(-90, !isBottomTooltip, xPosition, cursorY, chartHeight)).toBe(8);
  });
  test('should compute rect annotation tooltip offset', () => {
    const isRightTooltip = true;
    const isBottomTooltip = true;

    // chart rotation 0
    expect(computeRectTooltipOffset(isRightTooltip, isBottomTooltip, 0)).toEqual({ offsetLeft: '0', offsetTop: '0' });
    expect(computeRectTooltipOffset(!isRightTooltip, isBottomTooltip, 0)).toEqual({
      offsetLeft: '-100%',
      offsetTop: '0',
    });
    expect(computeRectTooltipOffset(isRightTooltip, !isBottomTooltip, 0)).toEqual({
      offsetLeft: '0',
      offsetTop: '-100%',
    });
    expect(computeRectTooltipOffset(!isRightTooltip, !isBottomTooltip, 0)).toEqual({
      offsetLeft: '-100%',
      offsetTop: '-100%',
    });

    // chart rotation 180
    expect(computeRectTooltipOffset(isRightTooltip, isBottomTooltip, 180)).toEqual({
      offsetLeft: '-100%',
      offsetTop: '0',
    });
    expect(computeRectTooltipOffset(!isRightTooltip, isBottomTooltip, 180)).toEqual({
      offsetLeft: '0',
      offsetTop: '0',
    });
    expect(computeRectTooltipOffset(isRightTooltip, !isBottomTooltip, 180)).toEqual({
      offsetLeft: '-100%',
      offsetTop: '-100%',
    });
    expect(computeRectTooltipOffset(!isRightTooltip, !isBottomTooltip, 180)).toEqual({
      offsetLeft: '0',
      offsetTop: '-100%',
    });

    // chart rotation 90
    expect(computeRectTooltipOffset(isRightTooltip, isBottomTooltip, 90)).toEqual({ offsetLeft: '0', offsetTop: '0' });
    expect(computeRectTooltipOffset(!isRightTooltip, isBottomTooltip, 90)).toEqual({
      offsetLeft: '-100%',
      offsetTop: '0',
    });
    expect(computeRectTooltipOffset(isRightTooltip, !isBottomTooltip, 90)).toEqual({
      offsetLeft: '0',
      offsetTop: '-100%',
    });
    expect(computeRectTooltipOffset(!isRightTooltip, !isBottomTooltip, 90)).toEqual({
      offsetLeft: '-100%',
      offsetTop: '-100%',
    });

    // chart rotation -90
    expect(computeRectTooltipOffset(isRightTooltip, isBottomTooltip, -90)).toEqual({
      offsetLeft: '0',
      offsetTop: '-100%',
    });
    expect(computeRectTooltipOffset(!isRightTooltip, isBottomTooltip, -90)).toEqual({
      offsetLeft: '-100%',
      offsetTop: '-100%',
    });
    expect(computeRectTooltipOffset(isRightTooltip, !isBottomTooltip, -90)).toEqual({
      offsetLeft: '0',
      offsetTop: '0',
    });
    expect(computeRectTooltipOffset(!isRightTooltip, !isBottomTooltip, -90)).toEqual({
      offsetLeft: '-100%',
      offsetTop: '0',
    });
  });
  test('should compute tooltip state for rect annotation', () => {
    const cursorPosition = { x: 3, y: 4 };
    const annotationRects = [{ rect: { x: 2, y: 3, width: 3, height: 5 } }];

    const visibleTooltip = computeRectAnnotationTooltipState(cursorPosition, annotationRects, 0, chartDimensions);
    const expectedVisibleTooltipState = {
      isVisible: true,
      transform: 'translate(0, 0)',
      annotationType: 'rectangle',
      top: 4,
      left: 5,
    };

    expect(visibleTooltip).toEqual(expectedVisibleTooltipState);
  });
  test('should determine if line is vertical annotation', () => {
    expect(isVerticalAnnotationLine(true, true)).toBe(true);
    expect(isVerticalAnnotationLine(true, false)).toBe(false);
    expect(isVerticalAnnotationLine(false, true)).toBe(false);
    expect(isVerticalAnnotationLine(false, false)).toBe(true);
  });

  test('should get rotated cursor position', () => {
    const rawCursorPosition = { x: 1, y: 2 };

    expect(getRotatedCursor(rawCursorPosition, chartDimensions, 0)).toEqual(rawCursorPosition);
    expect(getRotatedCursor(rawCursorPosition, chartDimensions, 90)).toEqual({ x: 2, y: 1 });
    expect(getRotatedCursor(rawCursorPosition, chartDimensions, -90)).toEqual({ x: 18, y: 9 });
    expect(getRotatedCursor(rawCursorPosition, chartDimensions, 180)).toEqual({ x: 9, y: 18 });
  });
  test('should get nearest tick', () => {
    const ticks = [0, 1, 2];
    expect(getNearestTick(0.25, [], 1)).toBeUndefined();
    expect(getNearestTick(0.25, [100], 1)).toBeUndefined();
    expect(getNearestTick(0.25, ticks, 1)).toBe(0);
    expect(getNearestTick(0.75, ticks, 1)).toBe(1);
    expect(getNearestTick(0.5, ticks, 1)).toBe(1);
    expect(getNearestTick(1.75, ticks, 1)).toBe(2);
  });
  test('should compute cluster offset', () => {
    const singleBarCluster = 1;
    const multiBarCluster = 2;

    const barsShift = 4;
    const bandwidth = 2;

    expect(computeClusterOffset(singleBarCluster, barsShift, bandwidth)).toBe(0);
    expect(computeClusterOffset(multiBarCluster, barsShift, bandwidth)).toBe(3);
  });
});
