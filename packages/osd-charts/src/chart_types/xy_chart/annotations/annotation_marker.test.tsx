import * as React from 'react';

import { AnnotationDomainTypes, AnnotationSpec, Position, Rotation } from '../utils/specs';
import { DEFAULT_ANNOTATION_LINE_STYLE } from '../../../utils/themes/theme';
import { Dimensions } from '../../../utils/dimensions';
import { getAnnotationId, getGroupId, GroupId } from '../../../utils/ids';
import { ScaleContinuous } from '../../../utils/scales/scale_continuous';
import { Scale, ScaleType } from '../../../utils/scales/scales';
import {
  computeLineAnnotationDimensions,
  isWithinLineMarkerBounds,
  AnnotationMarker,
  AnnotationLineProps,
} from './annotation_utils';

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
    const expectedDimensions: AnnotationLineProps[] = [
      {
        anchor: {
          position: Position.Left,
          top: 20,
          left: 0,
        },
        linePathPoints: {
          start: {
            x1: 0,
            y1: 20,
          },
          end: {
            x2: 10,
            y2: 20,
          },
        },
        details: { detailsText: 'foo', headerText: '2' },

        marker: {
          icon: <div />,
          color: '#777',
          dimension: { width: 0, height: 0 },
          position: { left: -0, top: 20 },
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
    const expectedDimensions: AnnotationLineProps[] = [
      {
        anchor: {
          position: Position.Left,
          top: 0,
          left: 0,
        },
        linePathPoints: {
          start: {
            x1: 0,
            y1: 20,
          },
          end: {
            x2: 10,
            y2: 20,
          },
        },
        details: { detailsText: 'foo', headerText: '2' },
        marker: {
          icon: <div />,
          color: '#777',
          dimension: { width: 0, height: 0 },
          position: { left: -0, top: 0 },
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
      Position.Bottom,
      0,
      false,
    );
    const expectedDimensions: AnnotationLineProps[] = [
      {
        anchor: {
          position: Position.Bottom,
          top: 20,
          left: 20,
        },
        details: { detailsText: 'foo', headerText: '2' },
        linePathPoints: {
          start: {
            x1: 20,
            y1: 20,
          },
          end: {
            x2: 20,
            y2: 0,
          },
        },
        marker: {
          icon: <div />,
          color: '#777',
          dimension: { width: 0, height: 0 },
          position: { top: 20, left: 20 },
        },
      },
    ];
    expect(dimensions).toEqual(expectedDimensions);
  });

  test('should compute if a point is within an annotation line marker bounds', () => {
    const marker: AnnotationMarker = {
      icon: <div />,
      color: 'custom-color',
      position: { top: 0, left: 0 },
      dimension: { width: 10, height: 10 },
    };
    expect(isWithinLineMarkerBounds({ x: -1, y: 0 }, marker)).toBe(false);

    expect(isWithinLineMarkerBounds({ x: 0, y: -1 }, marker)).toBe(false);

    expect(isWithinLineMarkerBounds({ x: 0, y: 0 }, marker)).toBe(true);

    expect(isWithinLineMarkerBounds({ x: 10, y: 10 }, marker)).toBe(true);

    expect(isWithinLineMarkerBounds({ x: 11, y: 10 }, marker)).toBe(false);

    expect(isWithinLineMarkerBounds({ x: 11, y: 10 }, { ...marker, position: { top: 0, left: 1 } })).toBe(true);

    expect(isWithinLineMarkerBounds({ x: 15, y: 15 }, { ...marker, position: { top: 10, left: 10 } })).toBe(true);
  });
});
