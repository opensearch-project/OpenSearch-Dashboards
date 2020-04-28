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
import {
  AnnotationDomainTypes,
  AnnotationSpec,
  AxisSpec,
  LineAnnotationSpec,
  RectAnnotationSpec,
  AnnotationTypes,
} from '../utils/specs';
import { Position, Rotation } from '../../../utils/commons';
import { DEFAULT_ANNOTATION_LINE_STYLE } from '../../../utils/themes/theme';
import { Dimensions } from '../../../utils/dimensions';
import { GroupId, AnnotationId } from '../../../utils/ids';
import { Scale, ScaleType, ScaleBand, ScaleContinuous } from '../../../scales';
import { computeAnnotationDimensions, getAnnotationAxis, getRotatedCursor } from './utils';
import { AnnotationDimensions, AnnotationTooltipState, Bounds } from './types';
import { computeLineAnnotationDimensions } from './line/dimensions';
import { AnnotationLineProps } from './line/types';
import { computeRectAnnotationDimensions, isWithinRectBounds } from './rect/dimensions';
import { computeRectAnnotationTooltipState } from './rect/tooltip';
import { Point } from '../../../utils/point';
import { ChartTypes } from '../..';
import { SpecTypes } from '../../../specs/settings';
import { computeLineAnnotationTooltipState } from './line/tooltip';
import { computeAnnotationTooltipState } from './tooltip';
import { MockStore } from '../../../mocks/store';
import { MockGlobalSpec, MockSeriesSpec, MockAnnotationSpec } from '../../../mocks/specs';
import { computeAnnotationDimensionsSelector } from '../state/selectors/compute_annotations';

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

  const groupId = 'foo-group';

  const axesSpecs: AxisSpec[] = [];
  const verticalAxisSpec: AxisSpec = {
    chartType: ChartTypes.XYAxis,
    specType: SpecTypes.Axis,
    id: 'vertical_axis',
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
    id: 'horizontal_axis',
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

  test('should compute rect annotation in x ordinal scale', () => {
    const store = MockStore.default();
    const settings = MockGlobalSpec.settingsNoMargins();
    const spec = MockSeriesSpec.bar({
      xScaleType: ScaleType.Ordinal,
      groupId,
      data: [
        { x: 'a', y: 1 },
        { x: 'b', y: 0 },
        { x: 'c', y: 10 },
        { x: 'd', y: 5 },
      ],
    });

    const lineAnnotation = MockAnnotationSpec.line({
      id: 'foo',
      groupId,
      domainType: AnnotationDomainTypes.YDomain,
      dataValues: [{ dataValue: 2, details: 'foo' }],
    });

    const rectAnnotation = MockAnnotationSpec.rect({
      id: 'rect',
      groupId,
      dataValues: [{ coordinates: { x0: 'a', x1: 'b', y0: 3, y1: 5 } }],
    });

    MockStore.addSpecs([settings, spec, lineAnnotation, rectAnnotation], store);
    const dimensions = computeAnnotationDimensionsSelector(store.getState());

    const expectedDimensions = new Map<AnnotationId, AnnotationDimensions>();
    expectedDimensions.set('foo', [
      {
        anchor: {
          top: 80,
          left: 0,
          position: Position.Left,
        },
        linePathPoints: {
          start: { x1: 0, y1: 80 },
          end: { x2: 100, y2: 80 },
        },
        marker: undefined,
        details: { detailsText: 'foo', headerText: '2' },
      },
    ]);
    expectedDimensions.set('rect', [{ details: undefined, rect: { x: 0, y: 50, width: 50, height: 20 } }]);

    expect(dimensions).toEqual(expectedDimensions);
  });

  test('should compute annotation dimensions also with missing axis', () => {
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
      false,
    );
    expect(dimensions.size).toEqual(1);
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

  test('should not compute annotation line values for invalid data values or AnnotationSpec.hideLines', () => {
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
      false,
    );
    expect(emptyOutOfBoundsXDimensions).toHaveLength(0);

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

    const emptyOutOfBoundsYDimensions = computeLineAnnotationDimensions(
      invalidYLineAnnotation,
      chartDimensions,
      chartRotation,
      yScales,
      xScale,
      Position.Right,
      false,
    );

    expect(emptyOutOfBoundsYDimensions).toHaveLength(0);

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

    const outOfBoundsYAnn = computeLineAnnotationDimensions(
      outOfBoundsYLineAnnotation,
      chartDimensions,
      chartRotation,
      yScales,
      xScale,
      Position.Right,
      false,
    );

    expect(outOfBoundsYAnn).toHaveLength(0);

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
      false,
    );

    expect(hiddenAnnotationDimensions).toEqual(null);
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
      groupId: 'foo',
      annotationType: AnnotationTypes.Rectangle,
      dataValues: [{ coordinates: { x0: 1, x1: 2, y0: 3, y1: 5 } }],
    };

    const noYScale = computeRectAnnotationDimensions(annotationRectangle, yScales, xScale);

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

    const skippedInvalid = computeRectAnnotationDimensions(annotationRectangle, yScales, xScale);

    expect(skippedInvalid).toHaveLength(1);
  });
  test('should compute rectangle dimensions shifted for histogram mode', () => {
    const yScales: Map<GroupId, Scale> = new Map();
    yScales.set(
      groupId,
      new ScaleContinuous(
        {
          type: ScaleType.Linear,
          domain: continuousData,
          range: [minRange, maxRange],
        },
        { bandwidth: 0, minInterval: 1 },
      ),
    );

    const xScale: Scale = new ScaleContinuous(
      { type: ScaleType.Linear, domain: continuousData, range: [minRange, maxRange] },
      { bandwidth: 72, minInterval: 1 },
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

    const dimensions = computeRectAnnotationDimensions(annotationRectangle, yScales, xScale);

    const [dims1, dims2, dims3, dims4] = dimensions;
    expect(dims1.rect.x).toBe(10);
    expect(dims1.rect.y).toBe(100);
    expect(dims1.rect.height).toBe(100);
    expect(dims1.rect.width).toBeCloseTo(100);

    expect(dims2.rect.x).toBe(0);
    expect(dims2.rect.y).toBe(100);
    expect(dims2.rect.width).toBe(20);
    expect(dims2.rect.height).toBe(100);

    expect(dims3.rect.x).toBe(0);
    expect(dims3.rect.y).toBe(100);
    expect(dims3.rect.width).toBeCloseTo(110);
    expect(dims3.rect.height).toBe(90);

    expect(dims4.rect.x).toBe(0);
    expect(dims4.rect.y).toBe(10);
    expect(dims4.rect.width).toBeCloseTo(110);
    expect(dims4.rect.height).toBe(10);
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

  test('should get rotated cursor position', () => {
    const cursorPosition = { x: 1, y: 2 };

    expect(getRotatedCursor(cursorPosition, chartDimensions, 0)).toEqual(cursorPosition);
    expect(getRotatedCursor(cursorPosition, chartDimensions, 90)).toEqual({ x: 2, y: 9 });
    expect(getRotatedCursor(cursorPosition, chartDimensions, -90)).toEqual({ x: 18, y: 1 });
    expect(getRotatedCursor(cursorPosition, chartDimensions, 180)).toEqual({ x: 9, y: 18 });
  });
});
