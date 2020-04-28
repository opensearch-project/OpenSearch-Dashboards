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

import { AnnotationId } from '../../../utils/ids';
import { AnnotationSpec, AxisSpec, isLineAnnotation, isRectAnnotation } from '../utils/specs';
import { Rotation, Position } from '../../../utils/commons';
import { AnnotationDimensions, AnnotationTooltipState } from './types';
import { Dimensions } from '../../../utils/dimensions';
import { computeLineAnnotationTooltipState } from './line/tooltip';
import { computeRectAnnotationTooltipState } from './rect/tooltip';
import { AnnotationRectProps } from './rect/types';
import { Point } from '../../../utils/point';
import { AnnotationLineProps } from './line/types';

/** @internal */
export function computeAnnotationTooltipState(
  cursorPosition: Point,
  annotationDimensions: Map<AnnotationId, AnnotationDimensions>,
  annotationSpecs: AnnotationSpec[],
  chartRotation: Rotation,
  axesSpecs: AxisSpec[],
  chartDimensions: Dimensions,
): AnnotationTooltipState | null {
  // allow picking up the last spec added as the top most or use it's zIndex value
  const sortedSpecs = annotationSpecs
    .slice()
    .reverse()
    .sort(({ zIndex: a = Number.MIN_SAFE_INTEGER }, { zIndex: b = Number.MIN_SAFE_INTEGER }) => b - a);
  for (const spec of sortedSpecs) {
    const annotationDimension = annotationDimensions.get(spec.id);
    if (spec.hideTooltips || !annotationDimension) {
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

/** @internal */
export function getFinalAnnotationTooltipPosition(
  /** the dimensions of the chart parent container */
  container: Dimensions,
  chartDimensions: Dimensions,
  /** the dimensions of the tooltip container */
  tooltip: Dimensions,
  /** the tooltip computed position not adjusted within chart bounds */
  tooltipAnchor: { top: number; left: number },
  /** the width of the tooltip portal container */
  portalWidth: number,
  padding = 10,
): {
  left: string | null;
  top: string | null;
  anchor: typeof Position.Left | typeof Position.Right;
} {
  let left = 0;
  let anchor: Position = Position.Left;

  const annotationXOffset = window.pageXOffset + container.left + chartDimensions.left + tooltipAnchor.left;
  if (chartDimensions.left + tooltipAnchor.left + portalWidth + padding >= container.width) {
    left = annotationXOffset - portalWidth - padding;
    anchor = Position.Right;
  } else {
    left = annotationXOffset + padding;
  }
  let top = window.pageYOffset + container.top + chartDimensions.top + tooltipAnchor.top;
  if (chartDimensions.top + tooltipAnchor.top + tooltip.height + padding >= container.height) {
    top -= tooltip.height + padding;
  } else {
    top += padding;
  }

  return {
    left: `${Math.round(left)}px`,
    top: `${Math.round(top)}px`,
    anchor,
  };
}
