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

import { AnnotationDomainTypes, LineAnnotationSpec, LineAnnotationDatum } from '../../utils/specs';
import { Position, Rotation } from '../../../../utils/commons';
import { AnnotationMarker } from '../types';
import { isHorizontalRotation } from '../../state/utils';
import { Dimensions } from '../../../../utils/dimensions';
import { Scale } from '../../../../scales';
import { GroupId } from '../../../../utils/ids';
import { AnnotationLineProps, AnnotationLinePathPoints } from './types';
import { isContinuousScale, isBandScale } from '../../../../scales/types';
import { computeXScaleOffset } from '../../state/utils';

/** @internal */
export const DEFAULT_LINE_OVERFLOW = 0;

function computeYDomainLineAnnotationDimensions(
  dataValues: LineAnnotationDatum[],
  yScale: Scale,
  chartRotation: Rotation,
  axisPosition: Position | null,
  chartDimensions: Dimensions,
  lineColor: string,
  marker?: JSX.Element,
  markerDimension = { width: 0, height: 0 },
): AnnotationLineProps[] {
  const chartHeight = chartDimensions.height;
  const chartWidth = chartDimensions.width;
  const isHorizontalChartRotation = isHorizontalRotation(chartRotation);
  // let's use a default Bottom-X/Left-Y axis orientation if we are not showing an axis
  // but we are displaying a line annotation
  const anchorPosition =
    axisPosition === null ? (isHorizontalChartRotation ? Position.Left : Position.Bottom) : axisPosition;
  const lineProps: AnnotationLineProps[] = [];

  dataValues.forEach((datum: LineAnnotationDatum) => {
    const { dataValue } = datum;

    // avoid rendering invalid annotation value
    if (dataValue === null || dataValue === undefined || dataValue === '') {
      return;
    }

    const annotationValueYposition = yScale.scale(dataValue);
    // avoid rendering non scalable annotation values
    if (annotationValueYposition === null) {
      return;
    }

    const [domainStart, domainEnd] = yScale.domain;
    // avoid rendering annotation with values outside the scale domain
    if (dataValue < domainStart || dataValue > domainEnd) {
      return;
    }

    const anchor = {
      position: anchorPosition,
      top: 0,
      left: 0,
    };
    const markerPosition = { top: 0, left: 0 };
    const linePathPoints: AnnotationLinePathPoints = {
      start: { x1: 0, y1: 0 },
      end: { x2: 0, y2: 0 },
    };
    // the Y axis is vertical, X axis is horizontal  y|--x--|y
    if (isHorizontalChartRotation) {
      // y|__x__
      if (anchorPosition === Position.Left) {
        anchor.left = 0;
        markerPosition.left = -markerDimension.width;
        linePathPoints.start.x1 = 0;
        linePathPoints.end.x2 = chartWidth;
        // __x__|y
      } else {
        anchor.left = chartWidth;
        markerPosition.left = chartWidth;
        linePathPoints.start.x1 = chartWidth;
        linePathPoints.end.x2 = 0;
      }
      // __x__
      if (chartRotation === 0) {
        anchor.top = annotationValueYposition;
        markerPosition.top = annotationValueYposition - markerDimension.height / 2;
        // ¯¯x¯¯
      } else {
        anchor.top = chartHeight - annotationValueYposition;
        markerPosition.top = chartHeight - annotationValueYposition - markerDimension.height / 2;
      }
      linePathPoints.start.y1 = annotationValueYposition;
      linePathPoints.end.y2 = annotationValueYposition;
      // the Y axis is horizontal, X axis is vertical x|--y--|x
    } else {
      // ¯¯y¯¯
      if (anchorPosition === Position.Top) {
        anchor.top = 0;
        markerPosition.top = -markerDimension.height;
        linePathPoints.start.x1 = 0;
        linePathPoints.end.x2 = chartHeight;
        // __y__
      } else {
        anchor.top = chartHeight;
        markerPosition.top = chartHeight;
        linePathPoints.start.x1 = chartHeight;
        linePathPoints.end.x2 = 0;
      }
      // __y__|x
      if (chartRotation === -90) {
        anchor.left = annotationValueYposition;
        markerPosition.left = annotationValueYposition - markerDimension.width / 2;
        // x|__y__
      } else {
        anchor.left = chartWidth - annotationValueYposition;
        markerPosition.left = chartWidth - annotationValueYposition - markerDimension.width / 2;
      }
      linePathPoints.start.y1 = annotationValueYposition;
      linePathPoints.end.y2 = annotationValueYposition;
    }

    const annotationMarker: AnnotationMarker | undefined = marker
      ? {
          icon: marker,
          color: lineColor,
          dimension: markerDimension,
          position: markerPosition,
        }
      : undefined;
    const lineProp: AnnotationLineProps = {
      anchor,
      linePathPoints,
      marker: annotationMarker,
      details: {
        detailsText: datum.details,
        headerText: datum.header || dataValue.toString(),
      },
    };

    lineProps.push(lineProp);
  });

  return lineProps;
}

function computeXDomainLineAnnotationDimensions(
  dataValues: LineAnnotationDatum[],
  xScale: Scale,
  chartRotation: Rotation,
  axisPosition: Position | null,
  chartDimensions: Dimensions,
  lineColor: string,
  isHistogramMode: boolean,
  marker?: JSX.Element,
  markerDimension = { width: 0, height: 0 },
): AnnotationLineProps[] {
  const chartHeight = chartDimensions.height;
  const chartWidth = chartDimensions.width;
  const lineProps: AnnotationLineProps[] = [];
  const isHorizontalChartRotation = isHorizontalRotation(chartRotation);
  // let's use a default Bottom-X/Left-Y axis orientation if we are not showing an axis
  // but we are displaying a line annotation
  const anchorPosition =
    axisPosition === null ? (isHorizontalChartRotation ? Position.Bottom : Position.Left) : axisPosition;

  dataValues.forEach((datum: LineAnnotationDatum) => {
    const { dataValue } = datum;
    let annotationValueXposition = xScale.scale(dataValue);
    if (annotationValueXposition == null) {
      return;
    }
    if (isContinuousScale(xScale) && typeof dataValue === 'number') {
      const minDomain = xScale.domain[0];
      const maxDomain = isHistogramMode ? xScale.domain[1] + xScale.minInterval : xScale.domain[1];
      if (dataValue < minDomain || dataValue > maxDomain) {
        return;
      }
      if (isHistogramMode) {
        const offset = computeXScaleOffset(xScale, true);
        const pureScaledValue = xScale.pureScale(dataValue);
        if (pureScaledValue == null) {
          return;
        }
        annotationValueXposition = pureScaledValue - offset;
      } else {
        annotationValueXposition = annotationValueXposition + (xScale.bandwidth * xScale.totalBarsInCluster) / 2;
      }
    } else if (isBandScale(xScale)) {
      if (isHistogramMode) {
        const padding = (xScale.step - xScale.originalBandwidth) / 2;
        annotationValueXposition = annotationValueXposition - padding;
      } else {
        annotationValueXposition = annotationValueXposition + xScale.originalBandwidth / 2;
      }
    } else {
      return;
    }
    if (isNaN(annotationValueXposition) || annotationValueXposition == null) {
      return;
    }

    const markerPosition = { top: 0, left: 0 };
    const linePathPoints: AnnotationLinePathPoints = {
      start: { x1: 0, y1: 0 },
      end: { x2: 0, y2: 0 },
    };
    const anchor = {
      position: anchorPosition,
      top: 0,
      left: 0,
    };
    // the Y axis is vertical, X axis is horizontal  y|--x--|y
    if (isHorizontalChartRotation) {
      // __x__
      if (anchorPosition === Position.Bottom) {
        linePathPoints.start.y1 = chartHeight;
        linePathPoints.end.y2 = 0;
        anchor.top = chartHeight;
        markerPosition.top = chartHeight;
        // ¯¯x¯¯
      } else {
        linePathPoints.start.y1 = 0;
        linePathPoints.end.y2 = chartHeight;
        anchor.top = 0;
        markerPosition.top = 0 - markerDimension.height;
      }
      // __x__
      if (chartRotation === 0) {
        anchor.left = annotationValueXposition;
        markerPosition.left = annotationValueXposition - markerDimension.width / 2;
        // ¯¯x¯¯
      } else {
        anchor.left = chartWidth - annotationValueXposition;
        markerPosition.left = chartWidth - annotationValueXposition - markerDimension.width / 2;
      }
      linePathPoints.start.x1 = annotationValueXposition;
      linePathPoints.end.x2 = annotationValueXposition;
      // the Y axis is horizontal, X axis is vertical x|--y--|x
    } else {
      // x|--y--
      if (anchorPosition === Position.Left) {
        anchor.left = 0;
        markerPosition.left = -markerDimension.width;
        linePathPoints.start.x1 = annotationValueXposition;
        linePathPoints.end.x2 = annotationValueXposition;
        // --y--|x
      } else {
        anchor.left = chartWidth;
        markerPosition.left = chartWidth;
        linePathPoints.start.x1 = annotationValueXposition;
        linePathPoints.end.x2 = annotationValueXposition;
      }
      // __y__|x
      if (chartRotation === -90) {
        anchor.top = chartHeight - annotationValueXposition;
        markerPosition.top = chartHeight - annotationValueXposition - markerDimension.height / 2;
        linePathPoints.start.y1 = 0;
        linePathPoints.end.y2 = chartWidth;
        // x|__y__
      } else {
        anchor.top = annotationValueXposition;
        markerPosition.top = annotationValueXposition - markerDimension.height / 2;
        linePathPoints.start.y1 = 0;
        linePathPoints.end.y2 = chartWidth;
      }
    }

    const annotationMarker: AnnotationMarker | undefined = marker
      ? {
          icon: marker,
          color: lineColor,
          dimension: markerDimension,
          position: markerPosition,
        }
      : undefined;
    const lineProp: AnnotationLineProps = {
      anchor,
      linePathPoints,
      details: {
        detailsText: datum.details,
        headerText: datum.header || dataValue.toString(),
      },
      marker: annotationMarker,
    };
    lineProps.push(lineProp);
  });

  return lineProps;
}

/** @internal */
export function computeLineAnnotationDimensions(
  annotationSpec: LineAnnotationSpec,
  chartDimensions: Dimensions,
  chartRotation: Rotation,
  yScales: Map<GroupId, Scale>,
  xScale: Scale,
  axisPosition: Position | null,
  isHistogramMode: boolean,
): AnnotationLineProps[] | null {
  const { domainType, dataValues, marker, markerDimensions, hideLines } = annotationSpec;

  if (hideLines) {
    return null;
  }

  // this type is guaranteed as this has been merged with default
  const lineStyle = annotationSpec.style;
  const lineColor = lineStyle?.line?.stroke ?? 'red';

  if (domainType === AnnotationDomainTypes.XDomain) {
    return computeXDomainLineAnnotationDimensions(
      dataValues,
      xScale,
      chartRotation,
      axisPosition,
      chartDimensions,
      lineColor,
      isHistogramMode,
      marker,
      markerDimensions,
    );
  }

  const groupId = annotationSpec.groupId;
  const yScale = yScales.get(groupId);
  if (!yScale) {
    return null;
  }

  return computeYDomainLineAnnotationDimensions(
    dataValues,
    yScale,
    chartRotation,
    axisPosition,
    chartDimensions,
    lineColor,
    marker,
    markerDimensions,
  );
}
