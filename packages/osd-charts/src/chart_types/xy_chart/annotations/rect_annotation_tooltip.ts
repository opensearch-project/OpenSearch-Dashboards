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

import { AnnotationTypes, RectAnnotationDatum, RectAnnotationSpec } from '../utils/specs';
import { Rotation } from '../../../utils/commons';
import { Dimensions } from '../../../utils/dimensions';
import { GroupId } from '../../../utils/ids';
import { Scale } from '../../../scales';
import { Point } from '../../../utils/point';
import {
  AnnotationTooltipFormatter,
  AnnotationTooltipState,
  getRotatedCursor,
  scaleAndValidateDatum,
  Bounds,
} from './annotation_utils';

export interface AnnotationRectProps {
  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  details?: string;
}

export function computeRectAnnotationTooltipState(
  /** the cursor position relative to the projection area */
  cursorPosition: Point,
  annotationRects: AnnotationRectProps[],
  chartRotation: Rotation,
  chartDimensions: Dimensions,
  renderTooltip?: AnnotationTooltipFormatter,
): AnnotationTooltipState {
  const rotatedCursorPosition = getRotatedCursor(cursorPosition, chartDimensions, chartRotation);

  const totalAnnotationRect = annotationRects.length;
  for (let i = 0; i < totalAnnotationRect; i++) {
    const rectProps = annotationRects[i];
    const { rect, details } = rectProps;
    const startX = rect.x;
    const endX = startX + rect.width;

    const startY = rect.y;
    const endY = startY + rect.height;

    const bounds: Bounds = { startX, endX, startY, endY };

    const isWithinBounds = isWithinRectBounds(rotatedCursorPosition, bounds);
    if (isWithinBounds) {
      return {
        isVisible: true,
        annotationType: AnnotationTypes.Rectangle,
        anchor: {
          left: rotatedCursorPosition.x,
          top: rotatedCursorPosition.y,
        },
        ...(details && { details }),
        ...(renderTooltip && { renderTooltip }),
      };
    }
  }
  return {
    isVisible: false,
  };
}

export function isWithinRectBounds({ x, y }: Point, { startX, endX, startY, endY }: Bounds): boolean {
  const withinXBounds = x >= startX && x <= endX;
  const withinYBounds = y >= startY && y <= endY;

  return withinXBounds && withinYBounds;
}

export function computeRectAnnotationDimensions(
  annotationSpec: RectAnnotationSpec,
  yScales: Map<GroupId, Scale>,
  xScale: Scale,
  enableHistogramMode: boolean,
  barsPadding: number,
): AnnotationRectProps[] | null {
  const { dataValues } = annotationSpec;

  const groupId = annotationSpec.groupId;
  const yScale = yScales.get(groupId);
  if (!yScale) {
    return null;
  }

  const xDomain = xScale.domain;
  const yDomain = yScale.domain;
  const lastX = xDomain[xDomain.length - 1];
  const xMinInterval = xScale.minInterval;
  const rectsProps: AnnotationRectProps[] = [];

  dataValues.forEach((dataValue: RectAnnotationDatum) => {
    let { x0, x1, y0, y1 } = dataValue.coordinates;

    // if everything is null, return; otherwise we coerce the other coordinates
    if (x0 == null && x1 == null && y0 == null && y1 == null) {
      return;
    }

    if (x1 == null) {
      // if x1 is defined, we want the rect to draw to the end of the scale
      // if we're in histogram mode, extend domain end by min interval
      x1 = enableHistogramMode && !xScale.isSingleValue() ? lastX + xMinInterval : lastX;
    }

    if (x0 == null) {
      // if x0 is defined, we want the rect to draw to the start of the scale
      x0 = xDomain[0];
    }

    if (y0 == null) {
      // if y0 is defined, we want the rect to draw to the end of the scale
      y0 = yDomain[yDomain.length - 1];
    }

    if (y1 == null) {
      // if y1 is defined, we want the rect to draw to the start of the scale
      y1 = yDomain[0];
    }

    const alignWithTick = xScale.bandwidth > 0 && !enableHistogramMode;

    let x0Scaled = scaleAndValidateDatum(x0, xScale, alignWithTick);
    let x1Scaled = scaleAndValidateDatum(x1, xScale, alignWithTick);
    const y0Scaled = scaleAndValidateDatum(y0, yScale, false);
    const y1Scaled = scaleAndValidateDatum(y1, yScale, false);

    // TODO: surface this as a warning
    if (x0Scaled === null || x1Scaled === null || y0Scaled === null || y1Scaled === null) {
      return;
    }

    let xOffset = 0;
    if (xScale.bandwidth > 0) {
      const xBand = xScale.bandwidth / (1 - xScale.barsPadding);
      xOffset = enableHistogramMode ? (xBand - xScale.bandwidth) / 2 : barsPadding;
    }

    x0Scaled = x0Scaled - xOffset;
    x1Scaled = x1Scaled - xOffset;

    const minX = Math.min(x0Scaled, x1Scaled);
    const minY = Math.min(y0Scaled, y1Scaled);

    const deltaX = Math.abs(x0Scaled - x1Scaled);
    const deltaY = Math.abs(y0Scaled - y1Scaled);

    const xOrigin = minX;
    const yOrigin = minY;

    const width = deltaX;
    const height = deltaY;

    const rectDimensions = {
      x: xOrigin,
      y: yOrigin,
      width,
      height,
    };

    rectsProps.push({
      rect: rectDimensions,
      details: dataValue.details,
    });
  });

  return rectsProps;
}
