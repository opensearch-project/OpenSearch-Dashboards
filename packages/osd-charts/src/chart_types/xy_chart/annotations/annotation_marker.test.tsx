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

import React from 'react';
import { AnnotationDomainTypes, AnnotationSpec, AnnotationTypes } from '../utils/specs';
import { Position, Rotation } from '../../../utils/commons';
import { DEFAULT_ANNOTATION_LINE_STYLE } from '../../../utils/themes/theme';
import { Dimensions } from '../../../utils/dimensions';
import { GroupId } from '../../../utils/ids';
import { Scale, ScaleType, ScaleContinuous } from '../../../scales';
import { computeLineAnnotationDimensions, AnnotationLineProps } from './line_annotation_tooltip';
import { ChartTypes } from '../..';
import { SpecTypes } from '../../../specs/settings';

describe('annotation marker', () => {
  const groupId = 'foo-group';

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

    const id = 'foo-line';
    const lineAnnotation: AnnotationSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Annotation,
      annotationType: AnnotationTypes.Line,
      id,
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

    const lineAnnotation: AnnotationSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Annotation,
      annotationType: AnnotationTypes.Line,
      id: 'foo-line',
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

    const lineAnnotation: AnnotationSpec = {
      chartType: ChartTypes.XYAxis,
      specType: SpecTypes.Annotation,
      annotationType: AnnotationTypes.Line,
      id: 'foo-line',
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
});
