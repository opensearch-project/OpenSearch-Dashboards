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

import { Rotation } from '../../../../../utils/common';
import { Dimensions } from '../../../../../utils/dimensions';
import { AnnotationId } from '../../../../../utils/ids';
import {
  mergeWithDefaultAnnotationLine,
  mergeWithDefaultAnnotationRect,
} from '../../../../../utils/themes/merge_utils';
import { AnnotationLineProps } from '../../../annotations/line/types';
import { AnnotationRectProps } from '../../../annotations/rect/types';
import { AnnotationDimensions } from '../../../annotations/types';
import { getSpecsById } from '../../../state/utils/spec';
import { AnnotationSpec, isLineAnnotation, isRectAnnotation } from '../../../utils/specs';
import { renderLineAnnotations } from './lines';
import { renderRectAnnotations } from './rect';

interface AnnotationProps {
  annotationDimensions: Map<AnnotationId, AnnotationDimensions>;
  annotationSpecs: AnnotationSpec[];
  rotation: Rotation;
  renderingArea: Dimensions;
}

/** @internal */
export function renderAnnotations(
  ctx: CanvasRenderingContext2D,
  { annotationDimensions, annotationSpecs, rotation, renderingArea }: AnnotationProps,
  renderOnBackground: boolean = true,
) {
  annotationDimensions.forEach((annotation, id) => {
    const spec = getSpecsById<AnnotationSpec>(annotationSpecs, id);
    if (!spec) {
      return null;
    }
    const isBackground = !spec.zIndex || (spec.zIndex && spec.zIndex <= 0);
    if ((isBackground && renderOnBackground) || (!isBackground && !renderOnBackground)) {
      if (isLineAnnotation(spec)) {
        const lineStyle = mergeWithDefaultAnnotationLine(spec.style);
        renderLineAnnotations(ctx, annotation as AnnotationLineProps[], lineStyle, rotation, renderingArea);
      } else if (isRectAnnotation(spec)) {
        const rectStyle = mergeWithDefaultAnnotationRect(spec.style);
        renderRectAnnotations(ctx, annotation as AnnotationRectProps[], rectStyle, rotation, renderingArea);
      }
    }
  });
}
