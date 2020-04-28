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

import { AnnotationTypes } from '../../utils/specs';
import { Rotation } from '../../../../utils/commons';
import { Dimensions } from '../../../../utils/dimensions';
import { Point } from '../../../../utils/point';
import { getRotatedCursor } from '../utils';
import { AnnotationTooltipFormatter, AnnotationTooltipState, Bounds } from '../types';
import { AnnotationRectProps } from './types';
import { isWithinRectBounds } from './dimensions';

/** @internal */
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
