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
import React from 'react';

import { ChartTypes } from '../../..';
import { MockAnnotationLineProps, MockAnnotationRectProps } from '../../../../mocks/annotations/annotations';
import { MockGlobalSpec } from '../../../../mocks/specs/specs';
import { SpecTypes } from '../../../../specs/constants';
import { Position, Rotation } from '../../../../utils/common';
import { Dimensions } from '../../../../utils/dimensions';
import { AnnotationId } from '../../../../utils/ids';
import { Point } from '../../../../utils/point';
import { DEFAULT_ANNOTATION_LINE_STYLE } from '../../../../utils/themes/theme';
import {
  AnnotationDomainTypes,
  AnnotationSpec,
  AnnotationTypes,
  AxisSpec,
  LineAnnotationSpec,
  RectAnnotationSpec,
} from '../../utils/specs';
import { computeAnnotationTooltipState } from '../tooltip';
import { AnnotationDimensions, AnnotationTooltipState } from '../types';
import { computeLineAnnotationTooltipState } from './tooltip';
import { AnnotationLineProps } from './types';

describe('Annotation tooltips', () => {
  const groupId = 'foo-group';
  const chartDimensions: Dimensions = {
    width: 10,
    height: 20,
    top: 5,
    left: 15,
  };
  const horizontalAxisSpec = MockGlobalSpec.axis({
    groupId,
    position: Position.Bottom,
  });
  const verticalAxisSpec = MockGlobalSpec.axis({
    groupId,
    position: Position.Left,
  });
  test('should compute the tooltip state for an annotation line', () => {
    const cursorPosition: Point = { x: 16, y: 7 };
    const annotationLines: AnnotationLineProps[] = [
      MockAnnotationLineProps.default({
        linePathPoints: {
          x1: 1,
          y1: 2,
          x2: 3,
          y2: 4,
        },
        marker: {
          icon: React.createElement('div'),
          color: 'red',
          dimension: { width: 10, height: 10 },
          position: { top: 0, left: 0 },
        },
      }),
      MockAnnotationLineProps.default({
        linePathPoints: {
          x1: 0,
          y1: 10,
          x2: 20,
          y2: 10,
        },
        marker: {
          icon: React.createElement('div'),
          color: 'red',
          dimension: { width: 20, height: 20 },
          position: { top: 0, left: 0 },
        },
      }),
    ];
    const localAxesSpecs: AxisSpec[] = [];
    // missing annotation axis (xDomain)
    const missingTooltipState = computeLineAnnotationTooltipState(
      cursorPosition,
      annotationLines,
      groupId,
      AnnotationDomainTypes.XDomain,
      localAxesSpecs,
      chartDimensions,
    );

    expect(missingTooltipState).toBeNull();

    // add axis for xDomain annotation
    localAxesSpecs.push(horizontalAxisSpec);

    const xDomainTooltipState = computeLineAnnotationTooltipState(
      cursorPosition,
      annotationLines,
      groupId,
      AnnotationDomainTypes.XDomain,
      localAxesSpecs,
      chartDimensions,
    );
    const expectedXDomainTooltipState = {
      isVisible: true,
      annotationType: AnnotationTypes.Line,
      anchor: {
        height: 10,
        left: 15,
        top: 5,
        width: 10,
      },
    };
    expect(xDomainTooltipState).toMatchObject(expectedXDomainTooltipState);

    // rotated xDomain
    const xDomainRotatedTooltipState = computeLineAnnotationTooltipState(
      { x: 24, y: 23 },
      annotationLines,
      groupId,
      AnnotationDomainTypes.XDomain,
      localAxesSpecs,
      chartDimensions,
    );
    const expectedXDomainRotatedTooltipState: AnnotationTooltipState = {
      isVisible: true,
      anchor: {
        left: 15,
        top: 5,
      },
      annotationType: AnnotationTypes.Line,
    };

    expect(xDomainRotatedTooltipState).toMatchObject(expectedXDomainRotatedTooltipState);

    // add axis for yDomain annotation
    localAxesSpecs.push(verticalAxisSpec);

    const yDomainTooltipState = computeLineAnnotationTooltipState(
      cursorPosition,
      annotationLines,
      groupId,
      AnnotationDomainTypes.YDomain,
      localAxesSpecs,
      chartDimensions,
    );
    const expectedYDomainTooltipState: AnnotationTooltipState = {
      isVisible: true,
      anchor: {
        left: 15,
        top: 5,
      },
      annotationType: AnnotationTypes.Line,
    };

    expect(yDomainTooltipState).toMatchObject(expectedYDomainTooltipState);

    const flippedYDomainTooltipState = computeLineAnnotationTooltipState(
      { x: 24, y: 23 },
      annotationLines,
      groupId,
      AnnotationDomainTypes.YDomain,
      localAxesSpecs,
      chartDimensions,
    );
    const expectedFlippedYDomainTooltipState: AnnotationTooltipState = {
      isVisible: true,
      anchor: {
        left: 15,
        top: 5,
      },
      annotationType: AnnotationTypes.Line,
    };

    expect(flippedYDomainTooltipState).toMatchObject(expectedFlippedYDomainTooltipState);

    const rotatedYDomainTooltipState = computeLineAnnotationTooltipState(
      { x: 25, y: 15 },
      annotationLines,
      groupId,
      AnnotationDomainTypes.YDomain,
      localAxesSpecs,
      chartDimensions,
    );
    const expectedRotatedYDomainTooltipState: AnnotationTooltipState = {
      isVisible: true,
      anchor: {
        left: 15,
        top: 5,
      },
      annotationType: AnnotationTypes.Line,
    };

    expect(rotatedYDomainTooltipState).toMatchObject(expectedRotatedYDomainTooltipState);
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

    const cursorPosition: Point = { x: 16, y: 7 };

    const annotationLines: AnnotationLineProps[] = [
      MockAnnotationLineProps.default({
        linePathPoints: {
          x1: 1,
          y1: 2,
          x2: 3,
          y2: 4,
        },
        marker: {
          icon: React.createElement('div'),
          color: 'red',
          dimension: { width: 10, height: 10 },
          position: { top: 0, left: 0 },
        },
      }),
    ];
    const chartRotation: Rotation = 0;
    const localAxesSpecs: AxisSpec[] = [];

    const annotationDimensions = new Map<AnnotationId, AnnotationDimensions>();
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
        height: 10,
        left: 15,
        top: 5,
        width: 10,
      },
    };

    expect(tooltipState).toMatchObject(expectedTooltipState);

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

    annotationDimensions.set(annotationRectangle.id, [
      MockAnnotationRectProps.default({ rect: { x: 2, y: 3, width: 3, height: 5 } }),
    ]);

    const rectTooltipState = computeAnnotationTooltipState(
      { x: 18, y: 9 },
      annotationDimensions,
      rectAnnotations,
      chartRotation,
      localAxesSpecs,
      chartDimensions,
    );

    expect(rectTooltipState).toMatchObject({
      isVisible: true,
      annotationType: AnnotationTypes.Rectangle,
      anchor: {
        left: 18,
        top: 9,
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
});
