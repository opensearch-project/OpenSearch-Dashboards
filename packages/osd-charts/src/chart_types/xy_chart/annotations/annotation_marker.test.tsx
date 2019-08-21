import * as React from 'react';

import { AnnotationDomainType, AnnotationDomainTypes, AnnotationSpec, Position, Rotation } from '../utils/specs';
import { DEFAULT_ANNOTATION_LINE_STYLE } from '../../../utils/themes/theme';
import { Dimensions } from '../../../utils/dimensions';
import { getAnnotationId, getGroupId, GroupId } from '../../../utils/ids';
import { ScaleContinuous } from '../../../utils/scales/scale_continuous';
import { Scale, ScaleType } from '../../../utils/scales/scales';
import {
  AnnotationLinePosition,
  computeLineAnnotationDimensions,
  DEFAULT_LINE_OVERFLOW,
  isWithinLineBounds,
} from './annotation_utils';
import { Point } from '../store/chart_state';

describe('annotation marker', () => {
  const groupId = getGroupId('foo-group');

  const minRange = 0;
  const maxRange = 100;

  const continuousData = [0, 10];
  const continuousScale = new ScaleContinuous({
    type: ScaleType.Linear,
    domain: continuousData,
    range: [minRange, maxRange],
  });

  const chartDimensions: Dimensions = {
    width: 10,
    height: 20,
    top: 5,
    left: 15,
  };

  const yScales: Map<GroupId, Scale> = new Map();
  yScales.set(groupId, continuousScale);

  const xScale: Scale = continuousScale;

  test('should compute line annotation dimensions with marker if defined (y domain)', () => {
    const chartRotation: Rotation = 0;

    const annotationId = getAnnotationId('foo-line');
    const lineAnnotation: AnnotationSpec = {
      annotationType: 'line',
      annotationId,
      domainType: AnnotationDomainTypes.YDomain,
      dataValues: [{ dataValue: 2, details: 'foo' }],
      groupId,
      style: DEFAULT_ANNOTATION_LINE_STYLE,
      marker: <div />,
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
        marker: {
          icon: <div />,
          transform: 'translate(calc(0px - 0%),calc(20px - 50%))',
          color: '#000',
          dimensions: { width: 0, height: 0 },
        },
      },
    ];
    expect(dimensions).toEqual(expectedDimensions);
  });

  test('should compute line annotation dimensions with marker if defined (y domain: 180 deg rotation)', () => {
    const chartRotation: Rotation = 180;

    const annotationId = getAnnotationId('foo-line');
    const lineAnnotation: AnnotationSpec = {
      annotationType: 'line',
      annotationId,
      domainType: AnnotationDomainTypes.YDomain,
      dataValues: [{ dataValue: 2, details: 'foo' }],
      groupId,
      style: DEFAULT_ANNOTATION_LINE_STYLE,
      marker: <div />,
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
        marker: {
          icon: <div />,
          transform: 'translate(calc(0px - 0%),calc(0px - 50%))',
          color: '#000',
          dimensions: { width: 0, height: 0 },
        },
      },
    ];
    expect(dimensions).toEqual(expectedDimensions);
  });

  test('should compute line annotation dimensions with marker if defined (x domain)', () => {
    const chartRotation: Rotation = 0;

    const annotationId = getAnnotationId('foo-line');
    const lineAnnotation: AnnotationSpec = {
      annotationType: 'line',
      annotationId,
      domainType: AnnotationDomainTypes.XDomain,
      dataValues: [{ dataValue: 2, details: 'foo' }],
      groupId,
      style: DEFAULT_ANNOTATION_LINE_STYLE,
      marker: <div />,
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
        position: [20, -DEFAULT_LINE_OVERFLOW, 20, 20],
        details: { detailsText: 'foo', headerText: '2' },
        tooltipLinePosition: [20, 0, 20, 20],
        marker: {
          icon: <div />,
          transform: 'translate(calc(20px - 0%),calc(20px - 50%))',
          color: '#000',
          dimensions: { width: 0, height: 0 },
        },
      },
    ];
    expect(dimensions).toEqual(expectedDimensions);
  });

  test('should compute if a point is within an annotation line bounds (xDomain annotation)', () => {
    const linePosition1: AnnotationLinePosition = [10, 0, 10, 20];
    const cursorPosition1: Point = { x: 0, y: 0 };
    const cursorPosition2: Point = { x: 10, y: 0 };

    const offset = 0;
    const horizontalChartRotation: Rotation = 0;
    const verticalChartRotation: Rotation = 90;
    const domainType: AnnotationDomainType = AnnotationDomainTypes.XDomain;

    const marker = {
      icon: <div />,
      transform: '',
      color: 'custom-color',
      dimensions: { width: 10, height: 10 },
    };

    const bottomHorizontalRotationOutsideBounds = isWithinLineBounds(
      Position.Bottom,
      linePosition1,
      cursorPosition1,
      offset,
      horizontalChartRotation,
      chartDimensions,
      domainType,
      marker,
    );

    expect(bottomHorizontalRotationOutsideBounds).toBe(false);

    const bottomHorizontalRotationWithinBounds = isWithinLineBounds(
      Position.Bottom,
      linePosition1,
      cursorPosition2,
      offset,
      horizontalChartRotation,
      chartDimensions,
      domainType,
      marker,
    );

    expect(bottomHorizontalRotationWithinBounds).toBe(true);

    const topHorizontalRotationOutsideBounds = isWithinLineBounds(
      Position.Top,
      linePosition1,
      cursorPosition1,
      offset,
      horizontalChartRotation,
      chartDimensions,
      domainType,
      marker,
    );

    expect(topHorizontalRotationOutsideBounds).toBe(false);

    const verticalRotationOutsideBounds = isWithinLineBounds(
      Position.Bottom,
      linePosition1,
      cursorPosition1,
      offset,
      verticalChartRotation,
      chartDimensions,
      domainType,
      marker,
    );

    expect(verticalRotationOutsideBounds).toBe(false);

    const verticalRotationMarkerOutsideBounds = isWithinLineBounds(
      Position.Bottom,
      [0, 0, 0, 0],
      { x: 0, y: 10 },
      offset,
      verticalChartRotation,
      chartDimensions,
      domainType,
      marker,
    );

    expect(verticalRotationMarkerOutsideBounds).toBe(false);
  });

  test('should compute if a point is within an annotation line bounds (yDomain annotation)', () => {
    const linePosition1: AnnotationLinePosition = [10, 0, 10, 20];
    const cursorPosition1: Point = { x: 0, y: 0 };
    const cursorPosition2: Point = { x: 10, y: 0 };

    const offset = 0;
    const horizontalChartRotation: Rotation = 0;
    const verticalChartRotation: Rotation = 90;
    const domainType: AnnotationDomainType = AnnotationDomainTypes.YDomain;

    const marker = {
      icon: <div />,
      transform: '',
      color: 'custom-color',
      dimensions: { width: 10, height: 10 },
    };

    const rightHorizontalRotationWithinBounds = isWithinLineBounds(
      Position.Left,
      linePosition1,
      cursorPosition1,
      offset,
      horizontalChartRotation,
      chartDimensions,
      domainType,
      marker,
    );

    expect(rightHorizontalRotationWithinBounds).toBe(true);

    const leftHorizontalRotationWithinBounds = isWithinLineBounds(
      Position.Left,
      linePosition1,
      cursorPosition2,
      offset,
      horizontalChartRotation,
      chartDimensions,
      domainType,
      marker,
    );

    expect(leftHorizontalRotationWithinBounds).toBe(true);

    const rightHorizontalRotationOutsideBounds = isWithinLineBounds(
      Position.Right,
      linePosition1,
      cursorPosition1,
      offset,
      horizontalChartRotation,
      chartDimensions,
      domainType,
      marker,
    );

    expect(rightHorizontalRotationOutsideBounds).toBe(false);

    const verticalRotationOutsideBounds = isWithinLineBounds(
      Position.Left,
      linePosition1,
      cursorPosition1,
      offset,
      verticalChartRotation,
      chartDimensions,
      domainType,
      marker,
    );

    expect(verticalRotationOutsideBounds).toBe(false);

    const verticalRotationMarkerOutsideBounds = isWithinLineBounds(
      Position.Left,
      [0, 0, 0, 0],
      { x: 0, y: 10 },
      offset,
      verticalChartRotation,
      chartDimensions,
      domainType,
      marker,
    );

    expect(verticalRotationMarkerOutsideBounds).toBe(false);

    const verticalRotationMarkerWithinBounds = isWithinLineBounds(
      Position.Left,
      [10, 20, 10, 0],
      { x: -5, y: 20 },
      offset,
      verticalChartRotation,
      chartDimensions,
      domainType,
      marker,
    );

    expect(verticalRotationMarkerWithinBounds).toBe(true);
  });
});
