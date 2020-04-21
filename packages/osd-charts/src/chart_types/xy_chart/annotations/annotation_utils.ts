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
  AnnotationDomainType,
  AnnotationDomainTypes,
  AnnotationSpec,
  AnnotationType,
  AxisSpec,
  HistogramModeAlignments,
  isLineAnnotation,
  isRectAnnotation,
} from '../utils/specs';
import { Dimensions } from '../../../utils/dimensions';
import { AnnotationId, GroupId } from '../../../utils/ids';
import { Scale, ScaleType } from '../../../scales';
import { computeXScaleOffset, getAxesSpecForSpecId, isHorizontalRotation, getSpecsById } from '../state/utils';
import { Point } from '../../../utils/point';
import {
  computeLineAnnotationTooltipState,
  AnnotationLineProps,
  computeLineAnnotationDimensions,
} from './line_annotation_tooltip';
import {
  computeRectAnnotationTooltipState,
  AnnotationRectProps,
  computeRectAnnotationDimensions,
} from './rect_annotation_tooltip';
import { Rotation, Position, Color } from '../../../utils/commons';

export type AnnotationTooltipFormatter = (details?: string) => JSX.Element | null;

/** @internal */
export type AnnotationTooltipState = AnnotationTooltipVisibleState | AnnotationTooltipHiddenState;

/** @internal */
export interface AnnotationTooltipVisibleState {
  isVisible: true;
  annotationType: AnnotationType;
  header?: string;
  details?: string;
  anchor: { position?: Position; top: number; left: number };
  renderTooltip?: AnnotationTooltipFormatter;
}

/** @internal */
export interface AnnotationTooltipHiddenState {
  isVisible: false;
}
/**
 * The header and description strings for an Annotation
 */
export interface AnnotationDetails {
  headerText?: string;
  detailsText?: string;
}

/**
 * The marker for an Annotation. Usually a JSX element
 */
export interface AnnotationMarker {
  icon: JSX.Element;
  position: { top: number; left: number };
  dimension: { width: number; height: number };
  color: Color;
}

/** @internal */
export type AnnotationDimensions = AnnotationLineProps[] | AnnotationRectProps[];

/** @internal */
export type Bounds = { startX: number; endX: number; startY: number; endY: number };

/** @internal */
export function scaleAndValidateDatum(dataValue: any, scale: Scale, alignWithTick: boolean): number | null {
  const isContinuous = scale.type !== ScaleType.Ordinal;
  const scaledValue = scale.scale(dataValue);
  // d3.scale will return 0 for '', rendering the line incorrectly at 0
  if (scaledValue === null || (isContinuous && dataValue === '')) {
    return null;
  }

  if (isContinuous) {
    const [domainStart, domainEnd] = scale.domain;

    // if we're not aligning the ticks, we need to extend the domain by one more tick for histograms
    const domainEndOffset = alignWithTick ? 0 : scale.minInterval;

    if (domainStart > dataValue || domainEnd + domainEndOffset < dataValue) {
      return null;
    }
  }

  return scaledValue;
}

/** @internal */
export function getAnnotationAxis(
  axesSpecs: AxisSpec[],
  groupId: GroupId,
  domainType: AnnotationDomainType,
  chartRotation: Rotation,
): Position | null {
  const { xAxis, yAxis } = getAxesSpecForSpecId(axesSpecs, groupId);
  const isHorizontalRotated = isHorizontalRotation(chartRotation);
  const isXDomainAnnotation = isXDomain(domainType);
  const annotationAxis = isXDomainAnnotation ? xAxis : yAxis;
  const rotatedAnnotation = isHorizontalRotated ? annotationAxis : isXDomainAnnotation ? yAxis : xAxis;
  return rotatedAnnotation ? rotatedAnnotation.position : null;
}

/** @internal */
export function computeClusterOffset(totalBarsInCluster: number, barsShift: number, bandwidth: number): number {
  if (totalBarsInCluster > 1) {
    return barsShift - bandwidth / 2;
  }

  return 0;
}

/** @internal */
export function isXDomain(domainType: AnnotationDomainType): boolean {
  return domainType === AnnotationDomainTypes.XDomain;
}

/** @internal */
export function getRotatedCursor(
  /** the cursor position relative to the projection area */
  cursorPosition: Point,
  chartDimensions: Dimensions,
  chartRotation: Rotation,
): Point {
  const { x, y } = cursorPosition;
  const { height, width } = chartDimensions;
  switch (chartRotation) {
    case 0:
      return { x, y };
    case 90:
      return { x: y, y: width - x };
    case -90:
      return { x: height - y, y: x };
    case 180:
      return { x: width - x, y: height - y };
  }
}

/** @internal */
export function computeAnnotationDimensions(
  annotations: AnnotationSpec[],
  chartDimensions: Dimensions,
  chartRotation: Rotation,
  yScales: Map<GroupId, Scale>,
  xScale: Scale,
  axesSpecs: AxisSpec[],
  totalBarsInCluster: number,
  enableHistogramMode: boolean,
): Map<AnnotationId, AnnotationDimensions> {
  const annotationDimensions = new Map<AnnotationId, AnnotationDimensions>();

  const barsShift = (totalBarsInCluster * xScale.bandwidth) / 2;

  const band = xScale.bandwidth / (1 - xScale.barsPadding);
  const halfPadding = (band - xScale.bandwidth) / 2;
  const barsPadding = halfPadding * totalBarsInCluster;
  const clusterOffset = computeClusterOffset(totalBarsInCluster, barsShift, xScale.bandwidth);

  // Annotations should always align with the axis line in histogram mode
  const xScaleOffset = computeXScaleOffset(xScale, enableHistogramMode, HistogramModeAlignments.Start);
  annotations.forEach((annotationSpec) => {
    const { id } = annotationSpec;
    if (isLineAnnotation(annotationSpec)) {
      const { groupId, domainType } = annotationSpec;
      const annotationAxisPosition = getAnnotationAxis(axesSpecs, groupId, domainType, chartRotation);

      if (!annotationAxisPosition) {
        return;
      }
      const dimensions = computeLineAnnotationDimensions(
        annotationSpec,
        chartDimensions,
        chartRotation,
        yScales,
        xScale,
        annotationAxisPosition,
        xScaleOffset - clusterOffset,
        enableHistogramMode,
      );

      if (dimensions) {
        annotationDimensions.set(id, dimensions);
      }
    } else if (isRectAnnotation(annotationSpec)) {
      const dimensions = computeRectAnnotationDimensions(
        annotationSpec,
        yScales,
        xScale,
        enableHistogramMode,
        barsPadding,
      );

      if (dimensions) {
        annotationDimensions.set(id, dimensions);
      }
    }
  });

  return annotationDimensions;
}

/** @internal */
export function computeAnnotationTooltipState(
  cursorPosition: Point,
  annotationDimensions: Map<AnnotationId, AnnotationDimensions>,
  annotationSpecs: AnnotationSpec[],
  chartRotation: Rotation,
  axesSpecs: AxisSpec[],
  chartDimensions: Dimensions,
): AnnotationTooltipState | null {
  for (const [annotationId, annotationDimension] of annotationDimensions) {
    const spec = getSpecsById<AnnotationSpec>(annotationSpecs, annotationId);

    if (!spec || spec.hideTooltips) {
      continue;
    }

    const groupId = spec.groupId;

    if (isLineAnnotation(spec)) {
      if (spec.hideLines) {
        continue;
      }
      const lineAnnotationTooltipState = computeLineAnnotationTooltipState(
        cursorPosition,
        annotationDimension as AnnotationLineProps[],
        groupId,
        spec.domainType,
        axesSpecs,
      );

      if (lineAnnotationTooltipState.isVisible) {
        return lineAnnotationTooltipState;
      }
    } else if (isRectAnnotation(spec)) {
      const rectAnnotationTooltipState = computeRectAnnotationTooltipState(
        cursorPosition,
        annotationDimension as AnnotationRectProps[],
        chartRotation,
        chartDimensions,
        spec.renderTooltip,
      );

      if (rectAnnotationTooltipState.isVisible) {
        return rectAnnotationTooltipState;
      }
    }
  }

  return null;
}
