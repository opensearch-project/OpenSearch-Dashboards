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

import { Dimensions } from '../../../../utils/dimensions';
import { GroupId } from '../../../../utils/ids';
import { Point } from '../../../../utils/point';
import { getAxesSpecForSpecId } from '../../state/utils/spec';
import { AnnotationDomainType, AnnotationTypes, AxisSpec } from '../../utils/specs';
import { isWithinRectBounds } from '../rect/dimensions';
import { AnnotationTooltipState, AnnotationMarker, Bounds } from '../types';
import { isXDomain, getTransformedCursor, invertTranformedCursor } from '../utils';
import { AnnotationLineProps } from './types';

/** @internal */
export function computeLineAnnotationTooltipState(
  cursorPosition: Point,
  annotationLines: AnnotationLineProps[],
  groupId: GroupId,
  domainType: AnnotationDomainType,
  axesSpecs: AxisSpec[],
  chartDimensions: Dimensions,
): AnnotationTooltipState | null {
  const { xAxis, yAxis } = getAxesSpecForSpecId(axesSpecs, groupId);
  const isXDomainAnnotation = isXDomain(domainType);
  const annotationAxis = isXDomainAnnotation ? xAxis : yAxis;

  if (!annotationAxis) {
    return null;
  }
  // get cursor point relative to the rendering area (within the chartDimension margins)
  const projectedPointer = getTransformedCursor(cursorPosition, chartDimensions, null, true);
  const totalAnnotationLines = annotationLines.length;
  for (let i = 0; i < totalAnnotationLines; i++) {
    const line = annotationLines[i];

    if (isWithinLineMarkerBounds(projectedPointer, line.panel, line.marker)) {
      const position = invertTranformedCursor(
        {
          x: line.marker.position.left,
          y: line.marker.position.top,
        },
        chartDimensions,
        null,
        true,
      );
      return {
        annotationType: AnnotationTypes.Line,
        isVisible: true,
        anchor: {
          top: position.y + line.panel.top,
          left: position.x + line.panel.left,
          ...line.marker.dimension,
        },
        ...(line.details && { header: line.details.headerText }),
        ...(line.details && { details: line.details.detailsText }),
      };
    }
  }

  return null;
}

/**
 * Checks if the cursorPosition is within the line annotation marker
 * @param cursorPosition the cursor position relative to the projected area
 * @param panel
 * @param marker the line annotation marker
 */
function isWithinLineMarkerBounds(
  cursorPosition: Point,
  panel: Dimensions,
  marker?: AnnotationMarker,
): marker is AnnotationMarker {
  if (!marker) {
    return false;
  }
  const {
    position: { top, left },
    dimension: { width, height },
  } = marker;
  const markerRect: Bounds = {
    startX: left + panel.left,
    startY: top + panel.top,
    endX: left + panel.left + width,
    endY: top + panel.top + height,
  };
  return isWithinRectBounds(cursorPosition, markerRect);
}
