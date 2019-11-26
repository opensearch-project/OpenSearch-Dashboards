import React from 'react';
import {
  AnnotationDomainTypes,
  AnnotationSpec,
  AxisSpec,
  LineAnnotationSpec,
  Position,
  RectAnnotationSpec,
  Rotation,
  SpecTypes,
  AnnotationTypes,
} from '../utils/specs';
import { DEFAULT_ANNOTATION_LINE_STYLE } from '../../../utils/themes/theme';
import { Dimensions } from '../../../utils/dimensions';
import { getAxisId, getGroupId, GroupId, AnnotationId } from '../../../utils/ids';
import { ScaleBand } from '../../../utils/scales/scale_band';
import { ScaleContinuous } from '../../../utils/scales/scale_continuous';
import { Scale, ScaleType } from '../../../utils/scales/scales';
import {
  computeAnnotationDimensions,
  computeAnnotationTooltipState,
  computeClusterOffset,
  getAnnotationAxis,
  getRotatedCursor,
  scaleAndValidateDatum,
  AnnotationDimensions,
  AnnotationTooltipState,
  Bounds,
} from './annotation_utils';
import {
  AnnotationLineProps,
  computeLineAnnotationDimensions,
  computeLineAnnotationTooltipState,
  isVerticalAnnotationLine,
  getAnnotationLineTooltipXOffset,
  getAnnotationLineTooltipYOffset,
} from './line_annotation_tooltip';
import {
  computeRectAnnotationDimensions,
  isWithinRectBounds,
  computeRectAnnotationTooltipState,
} from './rect_annotation_tooltip';
import { Point } from '../../../utils/point';
import { ChartTypes } from '../..';

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
    { bandwidth: 10, minInterval: 1 },
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

  const axesSpecs: AxisSpec[] = [];
  const verticalAxisSpec: AxisSpec = {
    chartType: ChartTypes.XYAxis,
    specType: SpecTypes.Axis,
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
    chartType: ChartTypes.XYAxis,
    specType: SpecTypes.Axis,
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

  axesSpecs.push(verticalAxisSpec);

  test('should compute annotation dimensions', () => {
    const chartRotation: Rotation = 0;
    const yScales: Map<GroupId, Scale> = new Map();
    yScales.set(groupId, continuousScale);

    const xScale: Scale = ordinalScale;

    const annotations: AnnotationSpec[] = [];
    const annotationId = 'foo';
    const lineAnnotation: LineAnnotationSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Annotation,
      annotationType: AnnotationTypes.Line,
      id: annotationId,
      domainType: AnnotationDomainTypes.YDomain,
      dataValues: [{ dataValue: 2, details: 'foo' }],
      groupId,
      style: DEFAULT_ANNOTATION_LINE_STYLE,
    };

    const rectAnnotationId = 'rect';
    const rectAnnotation: AnnotationSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Annotation,
      id: rectAnnotationId,
      groupId,
      annotationType: AnnotationTypes.Rectangle,
      dataValues: [{ coordinates: { x0: 'a', x1: 'b', y0: 3, y1: 5 } }],
    };

    annotations.push(lineAnnotation);
    annotations.push(rectAnnotation);

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
    const expectedDimensions = new Map<AnnotationId, AnnotationDimensions>();
    expectedDimensions.set(annotationId, [
      {
        anchor: {
          top: 20,
          left: 0,
          position: Position.Left,
        },
        linePathPoints: {
          start: { x1: 0, y1: 20 },
          end: { x2: 10, y2: 20 },
        },
        details: { detailsText: 'foo', headerText: '2' },
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

    const annotations: AnnotationSpec[] = [];
    const id = 'foo';
    const lineAnnotation: LineAnnotationSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Annotation,
      annotationType: AnnotationTypes.Line,
      id,
      domainType: AnnotationDomainTypes.YDomain,
      dataValues: [{ dataValue: 2, details: 'foo' }],
      groupId,
      style: DEFAULT_ANNOTATION_LINE_STYLE,
    };

    annotations.push(lineAnnotation);

    const dimensions = computeAnnotationDimensions(
      annotations,
      chartDimensions,
      chartRotation,
      yScales,
      xScale,
      [], // empty axesSpecs
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

    const id = 'foo-line';
    const lineAnnotation: LineAnnotationSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Annotation,
      annotationType: AnnotationTypes.Line,
      id,
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
    const expectedDimensions: AnnotationLineProps[] = [
      {
        anchor: {
          top: 20,
          left: 0,
          position: Position.Left,
        },
        linePathPoints: {
          start: { x1: 0, y1: 20 },
          end: { x2: 10, y2: 20 },
        },
        details: { detailsText: 'foo', headerText: '2' },
      },
    ];
    expect(dimensions).toEqual(expectedDimensions);
  });

  test('should compute line annotation dimensions for yDomain on a yScale (chartRotation 0, right axis)', () => {
    const chartRotation: Rotation = 0;
    const yScales: Map<GroupId, Scale> = new Map();
    yScales.set(groupId, continuousScale);

    const xScale: Scale = ordinalScale;

    const annotationId = 'foo-line';
    const lineAnnotation: LineAnnotationSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Annotation,
      annotationType: AnnotationTypes.Line,
      id: annotationId,
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
    const expectedDimensions: AnnotationLineProps[] = [
      {
        anchor: {
          top: 20,
          left: 10,
          position: Position.Right,
        },
        linePathPoints: {
          start: { x1: 10, y1: 20 },
          end: { x2: 0, y2: 20 },
        },
        details: { detailsText: 'foo', headerText: '2' },
      },
    ];
    expect(dimensions).toEqual(expectedDimensions);
  });

  test('should compute line annotation dimensions for yDomain on a yScale (chartRotation 90)', () => {
    const chartRotation: Rotation = 90;
    const yScales: Map<GroupId, Scale> = new Map();
    yScales.set(groupId, continuousScale);

    const xScale: Scale = ordinalScale;

    const annotationId = 'foo-line';
    const lineAnnotation: LineAnnotationSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Annotation,
      annotationType: AnnotationTypes.Line,
      id: annotationId,
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
    const expectedDimensions: AnnotationLineProps[] = [
      {
        anchor: {
          top: 20,
          left: -10,
          position: Position.Left,
        },
        linePathPoints: {
          start: { x1: 20, y1: 20 },
          end: { x2: 0, y2: 20 },
        },
        details: { detailsText: 'foo', headerText: '2' },
        marker: undefined,
      },
    ];
    expect(dimensions).toEqual(expectedDimensions);
  });

  test('should not compute line annotation dimensions for yDomain if no corresponding yScale', () => {
    const chartRotation: Rotation = 0;
    const yScales: Map<GroupId, Scale> = new Map();
    const xScale: Scale = ordinalScale;

    const annotationId = 'foo-line';
    const lineAnnotation: LineAnnotationSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Annotation,
      annotationType: AnnotationTypes.Line,
      id: annotationId,
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

    const annotationId = 'foo-line';
    const lineAnnotation: LineAnnotationSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Annotation,
      annotationType: AnnotationTypes.Line,
      id: annotationId,
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
    const expectedDimensions: AnnotationLineProps[] = [
      {
        anchor: {
          top: 0,
          left: 12.5,
          position: Position.Left,
        },
        linePathPoints: {
          start: { x1: 12.5, y1: 0 },
          end: { x2: 12.5, y2: 20 },
        },
        details: { detailsText: 'foo', headerText: 'a' },
      },
    ];
    expect(dimensions).toEqual(expectedDimensions);
  });

  test('should compute line annotation dimensions for xDomain (chartRotation 0, continuous scale, top axis)', () => {
    const chartRotation: Rotation = 0;
    const yScales: Map<GroupId, Scale> = new Map();
    const xScale: Scale = continuousScale;

    const annotationId = 'foo-line';
    const lineAnnotation: LineAnnotationSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Annotation,
      annotationType: AnnotationTypes.Line,
      id: annotationId,
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
    const expectedDimensions: AnnotationLineProps[] = [
      {
        anchor: {
          top: 0,
          left: 25,
          position: Position.Top,
        },
        linePathPoints: {
          start: { x1: 25, y1: 0 },
          end: { x2: 25, y2: 20 },
        },
        details: { detailsText: 'foo', headerText: '2' },
        marker: undefined,
      },
    ];
    expect(dimensions).toEqual(expectedDimensions);
  });

  test('should compute line annotation dimensions for xDomain (chartRotation 0, continuous scale, bottom axis)', () => {
    const chartRotation: Rotation = 0;
    const yScales: Map<GroupId, Scale> = new Map();
    const xScale: Scale = continuousScale;

    const annotationId = 'foo-line';
    const lineAnnotation: LineAnnotationSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Annotation,
      annotationType: AnnotationTypes.Line,
      id: annotationId,
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
    const expectedDimensions: AnnotationLineProps[] = [
      {
        anchor: {
          top: 20,
          left: 25,
          position: Position.Bottom,
        },
        linePathPoints: {
          start: { x1: 25, y1: 20 },
          end: { x2: 25, y2: 0 },
        },
        details: { detailsText: 'foo', headerText: '2' },
        marker: undefined,
      },
    ];
    expect(dimensions).toEqual(expectedDimensions);
  });

  test('should compute line annotation dimensions for xDomain in histogramMode with extended upper bound', () => {
    const chartRotation: Rotation = 0;
    const yScales: Map<GroupId, Scale> = new Map();
    const xScale: Scale = continuousScale;

    const annotationId = 'foo-line';
    const lineAnnotation: LineAnnotationSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Annotation,
      annotationType: AnnotationTypes.Line,
      id: annotationId,
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
    const expectedDimensions: AnnotationLineProps[] = [
      {
        anchor: {
          top: 20,
          left: 110,
          position: Position.Bottom,
        },
        linePathPoints: {
          start: { x1: 110, y1: 20 },
          end: { x2: 110, y2: 0 },
        },
        details: { detailsText: 'foo', headerText: '10.5' },
        marker: undefined,
      },
    ];
    expect(dimensions).toEqual(expectedDimensions);
  });

  test('should compute line annotation dimensions for xDomain on a xScale (chartRotation 90, ordinal scale)', () => {
    const chartRotation: Rotation = 90;
    const yScales: Map<GroupId, Scale> = new Map();

    const xScale: Scale = ordinalScale;

    const annotationId = 'foo-line';
    const lineAnnotation: LineAnnotationSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Annotation,
      annotationType: AnnotationTypes.Line,
      id: annotationId,
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
    const expectedDimensions: AnnotationLineProps[] = [
      {
        anchor: {
          top: 12.5,
          left: 0,
          position: Position.Left,
        },
        linePathPoints: {
          start: { x1: 12.5, y1: 0 },
          end: { x2: 12.5, y2: 10 },
        },
        details: { detailsText: 'foo', headerText: 'a' },
        marker: undefined,
      },
    ];
    expect(dimensions).toEqual(expectedDimensions);
  });

  test('should compute line annotation dimensions for xDomain on a xScale (chartRotation 90, continuous scale)', () => {
    const chartRotation: Rotation = 90;
    const yScales: Map<GroupId, Scale> = new Map();

    const xScale: Scale = continuousScale;

    const annotationId = 'foo-line';
    const lineAnnotation: LineAnnotationSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Annotation,
      annotationType: AnnotationTypes.Line,
      id: annotationId,
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
    const expectedDimensions: AnnotationLineProps[] = [
      {
        anchor: {
          top: 25,
          left: 0,
          position: Position.Left,
        },
        linePathPoints: {
          start: { x1: 25, y1: 0 },
          end: { x2: 25, y2: 10 },
        },
        details: { detailsText: 'foo', headerText: '2' },
        marker: undefined,
      },
    ];
    expect(dimensions).toEqual(expectedDimensions);
  });

  test('should compute line annotation dimensions for xDomain on a xScale (chartRotation -90, continuous scale)', () => {
    const chartRotation: Rotation = -90;
    const yScales: Map<GroupId, Scale> = new Map();

    const xScale: Scale = continuousScale;

    const annotationId = 'foo-line';
    const lineAnnotation: LineAnnotationSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Annotation,
      annotationType: AnnotationTypes.Line,
      id: annotationId,
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
    const expectedDimensions: AnnotationLineProps[] = [
      {
        anchor: {
          top: -5,
          left: 0,
          position: Position.Left,
        },
        linePathPoints: {
          start: { x1: 25, y1: 0 },
          end: { x2: 25, y2: 10 },
        },
        details: { detailsText: 'foo', headerText: '2' },
        marker: undefined,
      },
    ];
    expect(dimensions).toEqual(expectedDimensions);
  });

  test('should compute line annotation dimensions for xDomain (chartRotation 180, continuous scale, top axis)', () => {
    const chartRotation: Rotation = 180;
    const yScales: Map<GroupId, Scale> = new Map();

    const xScale: Scale = continuousScale;

    const annotationId = 'foo-line';
    const lineAnnotation: LineAnnotationSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Annotation,
      annotationType: AnnotationTypes.Line,
      id: annotationId,
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
    const expectedDimensions: AnnotationLineProps[] = [
      {
        anchor: {
          top: 0,
          left: -15,
          position: Position.Top,
        },
        linePathPoints: {
          start: { x1: 25, y1: 0 },
          end: { x2: 25, y2: 20 },
        },
        details: { detailsText: 'foo', headerText: '2' },
        marker: undefined,
      },
    ];
    expect(dimensions).toEqual(expectedDimensions);
  });

  test('should compute line annotation dimensions for xDomain (chartRotation 180, continuous scale, bottom axis)', () => {
    const chartRotation: Rotation = 180;
    const yScales: Map<GroupId, Scale> = new Map();
    const xScale: Scale = continuousScale;

    const annotationId = 'foo-line';
    const lineAnnotation: LineAnnotationSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Annotation,
      annotationType: AnnotationTypes.Line,
      id: annotationId,
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
    const expectedDimensions: AnnotationLineProps[] = [
      {
        anchor: {
          top: 20,
          left: -15,
          position: Position.Bottom,
        },
        details: { detailsText: 'foo', headerText: '2' },
        linePathPoints: {
          start: { x1: 25, y1: 20 },
          end: { x2: 25, y2: 0 },
        },
        marker: undefined,
      },
    ];
    expect(dimensions).toEqual(expectedDimensions);
  });

  test('should not compute annotation line values for values outside of domain or AnnotationSpec.hideLines', () => {
    const chartRotation: Rotation = 0;
    const yScales: Map<GroupId, Scale> = new Map();
    yScales.set(groupId, continuousScale);

    const xScale: Scale = ordinalScale;

    const annotationId = 'foo-line';
    const invalidXLineAnnotation: AnnotationSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Annotation,
      annotationType: AnnotationTypes.Line,
      id: annotationId,
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
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Annotation,
      annotationType: AnnotationTypes.Line,
      id: annotationId,
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
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Annotation,
      annotationType: AnnotationTypes.Line,
      id: annotationId,
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
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Annotation,
      annotationType: AnnotationTypes.Line,
      id: annotationId,
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
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Annotation,
      annotationType: AnnotationTypes.Line,
      id: annotationId,
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
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Annotation,
      annotationType: AnnotationTypes.Line,
      id: annotationId,
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
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Annotation,
      annotationType: AnnotationTypes.Line,
      id: annotationId,
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

  test('should compute the tooltip state for an annotation line', () => {
    const cursorPosition: Point = { x: 1, y: 2 };
    const annotationLines: AnnotationLineProps[] = [
      {
        anchor: {
          position: Position.Left,
          left: 0,
          top: 0,
        },
        linePathPoints: {
          start: { x1: 1, y1: 2 },
          end: { x2: 3, y2: 4 },
        },
        details: {},
        marker: {
          icon: React.createElement('div'),
          color: 'red',
          dimension: { width: 10, height: 10 },
          position: { top: 0, left: 0 },
        },
      },
      {
        anchor: {
          position: Position.Left,
          left: 0,
          top: 0,
        },
        linePathPoints: {
          start: { x1: 0, y1: 10 },
          end: { x2: 20, y2: 10 },
        },
        details: {},
        marker: {
          icon: React.createElement('div'),
          color: 'red',
          dimension: { width: 20, height: 20 },
          position: { top: 0, left: 0 },
        },
      },
    ];

    const localAxesSpecs: AxisSpec[] = [];

    // missing annotation axis (xDomain)
    const missingTooltipState = computeLineAnnotationTooltipState(
      cursorPosition,
      annotationLines,
      groupId,
      AnnotationDomainTypes.XDomain,
      localAxesSpecs,
    );

    expect(missingTooltipState).toEqual({ isVisible: false });

    // add axis for xDomain annotation
    localAxesSpecs.push(horizontalAxisSpec);

    const xDomainTooltipState = computeLineAnnotationTooltipState(
      cursorPosition,
      annotationLines,
      groupId,
      AnnotationDomainTypes.XDomain,
      localAxesSpecs,
    );
    const expectedXDomainTooltipState = {
      isVisible: true,
      annotationType: AnnotationTypes.Line,
      anchor: {
        position: Position.Left,
        top: 0,
        left: 0,
      },
    };

    expect(xDomainTooltipState).toEqual(expectedXDomainTooltipState);

    // rotated xDomain
    const xDomainRotatedTooltipState = computeLineAnnotationTooltipState(
      { x: 9, y: 18 },
      annotationLines,
      groupId,
      AnnotationDomainTypes.XDomain,
      localAxesSpecs,
    );
    const expectedXDomainRotatedTooltipState: AnnotationTooltipState = {
      isVisible: true,
      anchor: {
        position: Position.Left,
        top: 0,
        left: 0,
      },
      annotationType: AnnotationTypes.Line,
    };

    expect(xDomainRotatedTooltipState).toEqual(expectedXDomainRotatedTooltipState);

    // add axis for yDomain annotation
    localAxesSpecs.push(verticalAxisSpec);

    const yDomainTooltipState = computeLineAnnotationTooltipState(
      cursorPosition,
      annotationLines,
      groupId,
      AnnotationDomainTypes.YDomain,
      localAxesSpecs,
    );
    const expectedYDomainTooltipState: AnnotationTooltipState = {
      isVisible: true,
      anchor: {
        position: Position.Left,
        top: 0,
        left: 0,
      },
      annotationType: AnnotationTypes.Line,
    };

    expect(yDomainTooltipState).toEqual(expectedYDomainTooltipState);

    const flippedYDomainTooltipState = computeLineAnnotationTooltipState(
      { x: 9, y: 18 },
      annotationLines,
      groupId,
      AnnotationDomainTypes.YDomain,
      localAxesSpecs,
    );
    const expectedFlippedYDomainTooltipState: AnnotationTooltipState = {
      isVisible: true,
      anchor: {
        position: Position.Left,
        top: 0,
        left: 0,
      },
      annotationType: AnnotationTypes.Line,
    };

    expect(flippedYDomainTooltipState).toEqual(expectedFlippedYDomainTooltipState);

    const rotatedYDomainTooltipState = computeLineAnnotationTooltipState(
      { x: 10, y: 10 },
      annotationLines,
      groupId,
      AnnotationDomainTypes.YDomain,
      localAxesSpecs,
    );
    const expectedRotatedYDomainTooltipState: AnnotationTooltipState = {
      isVisible: true,
      anchor: {
        position: Position.Left,
        top: 0,
        left: 0,
      },
      annotationType: AnnotationTypes.Line,
    };

    expect(rotatedYDomainTooltipState).toEqual(expectedRotatedYDomainTooltipState);
  });

  test('should compute the tooltip state for an annotation', () => {
    const annotations: AnnotationSpec[] = [];
    const annotationId = 'foo';
    const lineAnnotation: LineAnnotationSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Annotation,
      annotationType: AnnotationTypes.Line,
      id: annotationId,
      domainType: AnnotationDomainTypes.YDomain,
      dataValues: [{ dataValue: 2, details: 'foo' }],
      groupId,
      style: DEFAULT_ANNOTATION_LINE_STYLE,
    };

    const cursorPosition: Point = { x: 1, y: 2 };

    const annotationLines: AnnotationLineProps[] = [
      {
        anchor: {
          position: Position.Left,
          top: 0,
          left: 0,
        },
        linePathPoints: { start: { x1: 1, y1: 2 }, end: { x2: 3, y2: 4 } },
        details: {},
        marker: {
          icon: React.createElement('div'),
          color: 'red',
          dimension: { width: 10, height: 10 },
          position: { top: 0, left: 0 },
        },
      },
    ];
    const chartRotation: Rotation = 0;
    const localAxesSpecs: AxisSpec[] = [];

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
    annotations.push(lineAnnotation);
    localAxesSpecs.push(verticalAxisSpec);

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
      annotationType: AnnotationTypes.Line,
      anchor: {
        top: 0,
        left: 0,
        position: Position.Left,
      },
    };

    expect(tooltipState).toEqual(expectedTooltipState);

    // rect annotation tooltip
    const annotationRectangle: RectAnnotationSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Annotation,
      id: 'rect',
      groupId,
      annotationType: AnnotationTypes.Rectangle,
      dataValues: [{ coordinates: { x0: 1, x1: 2, y0: 3, y1: 5 } }],
    };

    const rectAnnotations: RectAnnotationSpec[] = [];
    rectAnnotations.push(annotationRectangle);

    const rectAnnotationDimensions = [{ rect: { x: 2, y: 3, width: 3, height: 5 } }];
    annotationDimensions.set(annotationRectangle.id, rectAnnotationDimensions);

    const rectTooltipState = computeAnnotationTooltipState(
      { x: 3, y: 4 },
      annotationDimensions,
      rectAnnotations,
      chartRotation,
      localAxesSpecs,
      chartDimensions,
    );

    expect(rectTooltipState).toEqual({
      isVisible: true,
      annotationType: AnnotationTypes.Rectangle,
      anchor: {
        top: 4,
        left: 3,
      },
    });
    annotationRectangle.hideTooltips = true;

    const rectHideTooltipState = computeAnnotationTooltipState(
      { x: 3, y: 4 },
      annotationDimensions,
      rectAnnotations,
      chartRotation,
      localAxesSpecs,
      chartDimensions,
    );

    expect(rectHideTooltipState).toBe(null);
  });

  test('should get associated axis for an annotation', () => {
    const localAxesSpecs: AxisSpec[] = [];

    const noAxis = getAnnotationAxis(localAxesSpecs, groupId, AnnotationDomainTypes.XDomain, 0);
    expect(noAxis).toBe(null);

    localAxesSpecs.push(horizontalAxisSpec);
    localAxesSpecs.push(verticalAxisSpec);

    const xAnnotationAxisPosition = getAnnotationAxis(localAxesSpecs, groupId, AnnotationDomainTypes.XDomain, 0);
    expect(xAnnotationAxisPosition).toEqual(Position.Bottom);

    const yAnnotationAxisPosition = getAnnotationAxis(localAxesSpecs, groupId, AnnotationDomainTypes.YDomain, 0);
    expect(yAnnotationAxisPosition).toEqual(Position.Left);
  });
  test('should not compute rectangle annotation dimensions when no yScale', () => {
    const yScales: Map<GroupId, Scale> = new Map();
    yScales.set(groupId, continuousScale);

    const xScale: Scale = continuousScale;

    const annotationRectangle: RectAnnotationSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Annotation,
      id: 'rect',
      groupId: getGroupId('foo'),
      annotationType: AnnotationTypes.Rectangle,
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
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Annotation,
      id: 'rect',
      groupId,
      annotationType: AnnotationTypes.Rectangle,
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
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Annotation,
      id: 'rect',
      groupId,
      annotationType: AnnotationTypes.Rectangle,
      dataValues: [
        { coordinates: { x0: 1, x1: null, y0: null, y1: null } },
        { coordinates: { x0: null, x1: 1, y0: null, y1: null } },
        { coordinates: { x0: null, x1: null, y0: 1, y1: null } },
        { coordinates: { x0: null, x1: null, y0: null, y1: 1 } },
      ],
    };

    const dimensions = computeRectAnnotationDimensions(annotationRectangle, yScales, xScale, true, 0);

    const [dims1, dims2, dims3, dims4] = dimensions;
    expect(dims1.rect.x).toBe(10);
    expect(dims1.rect.y).toBe(0);
    expect(dims1.rect.width).toBeCloseTo(100);
    expect(dims1.rect.height).toBe(100);

    expect(dims2.rect.x).toBe(0);
    expect(dims2.rect.y).toBe(0);
    expect(dims2.rect.width).toBe(10);
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
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Annotation,
      id: 'rect',
      groupId,
      annotationType: AnnotationTypes.Rectangle,
      dataValues: [
        { coordinates: { x0: 1, x1: null, y0: null, y1: null } },
        { coordinates: { x0: null, x1: 1, y0: null, y1: null } },
        { coordinates: { x0: null, x1: null, y0: 1, y1: null } },
        { coordinates: { x0: null, x1: null, y0: null, y1: 1 } },
      ],
    };

    const dimensions = computeRectAnnotationDimensions(annotationRectangle, yScales, xScale, false, 0);

    const expectedDimensions = [
      { rect: { x: 10, y: 0, width: 90, height: 100 } },
      { rect: { x: 0, y: 0, width: 10, height: 100 } },
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
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Annotation,
      id: 'rect',
      groupId,
      annotationType: AnnotationTypes.Rectangle,
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
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Annotation,
      id: 'rect',
      groupId,
      annotationType: AnnotationTypes.Rectangle,
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
    expect(scaleAndValidateDatum(1.25, continuousScale, true)).toBe(12.5);
  });
  test('should determine if a point is within a rectangle annotation', () => {
    const cursorPosition = { x: 3, y: 4 };

    const outOfXBounds: Bounds = { startX: 4, endX: 5, startY: 3, endY: 5 };
    const outOfYBounds: Bounds = { startX: 2, endX: 4, startY: 5, endY: 6 };
    const withinBounds: Bounds = { startX: 2, endX: 4, startY: 3, endY: 5 };
    const withinBoundsReverseXScale: Bounds = { startX: 4, endX: 2, startY: 3, endY: 5 };
    const withinBoundsReverseYScale: Bounds = { startX: 2, endX: 4, startY: 5, endY: 3 };

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
  test('should compute tooltip state for rect annotation', () => {
    const cursorPosition = { x: 3, y: 4 };
    const annotationRects = [{ rect: { x: 2, y: 3, width: 3, height: 5 } }];

    const visibleTooltip = computeRectAnnotationTooltipState(cursorPosition, annotationRects, 0, chartDimensions);
    const expectedVisibleTooltipState: AnnotationTooltipState = {
      isVisible: true,
      annotationType: AnnotationTypes.Rectangle,
      anchor: {
        top: 4,
        left: 3,
      },
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
    const cursorPosition = { x: 1, y: 2 };

    expect(getRotatedCursor(cursorPosition, chartDimensions, 0)).toEqual(cursorPosition);
    expect(getRotatedCursor(cursorPosition, chartDimensions, 90)).toEqual({ x: 2, y: 9 });
    expect(getRotatedCursor(cursorPosition, chartDimensions, -90)).toEqual({ x: 18, y: 1 });
    expect(getRotatedCursor(cursorPosition, chartDimensions, 180)).toEqual({ x: 9, y: 18 });
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
