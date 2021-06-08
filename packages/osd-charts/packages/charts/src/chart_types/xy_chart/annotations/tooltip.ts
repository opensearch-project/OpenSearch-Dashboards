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

import { TooltipPortalSettings } from '../../../components/portal';
import { Rotation } from '../../../utils/common';
import { Dimensions } from '../../../utils/dimensions';
import { AnnotationId } from '../../../utils/ids';
import { Point } from '../../../utils/point';
import { AnnotationSpec, AxisSpec, isRectAnnotation } from '../utils/specs';
import { getRectAnnotationTooltipState } from './rect/tooltip';
import { AnnotationRectProps } from './rect/types';
import { AnnotationDimensions, AnnotationTooltipState } from './types';

/** @internal */
export function computeRectAnnotationTooltipState(
  cursorPosition: Point,
  annotationDimensions: Map<AnnotationId, AnnotationDimensions>,
  annotationSpecs: AnnotationSpec[],
  chartRotation: Rotation,
  axesSpecs: AxisSpec[],
  chartDimensions: Dimensions,
): AnnotationTooltipState | null {
  // allow picking up the last spec added as the top most or use it's zIndex value
  const sortedAnnotationSpecs = annotationSpecs
    .filter(isRectAnnotation)
    .reverse()
    .sort(({ zIndex: a = Number.MIN_SAFE_INTEGER }, { zIndex: b = Number.MIN_SAFE_INTEGER }) => b - a);

  for (let i = 0; i < sortedAnnotationSpecs.length; i++) {
    const spec = sortedAnnotationSpecs[i];
    const annotationDimension = annotationDimensions.get(spec.id);
    if (spec.hideTooltips || !annotationDimension) {
      continue;
    }
    const { customTooltip, customTooltipDetails } = spec;

    const tooltipSettings = getTooltipSettings(spec);

    const rectAnnotationTooltipState = getRectAnnotationTooltipState(
      cursorPosition,
      annotationDimension as AnnotationRectProps[],
      chartRotation,
      chartDimensions,
    );

    if (rectAnnotationTooltipState) {
      return {
        ...rectAnnotationTooltipState,
        tooltipSettings,
        customTooltip,
        customTooltipDetails: customTooltipDetails ?? spec.renderTooltip,
      };
    }
  }

  return null;
}

function getTooltipSettings({
  placement,
  fallbackPlacements,
  boundary,
  offset,
}: AnnotationSpec): TooltipPortalSettings<'chart'> {
  return {
    placement,
    fallbackPlacements,
    boundary,
    offset,
  };
}
