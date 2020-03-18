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

import { AnnotationDimensions } from '../../../annotations/annotation_utils';
import { AnnotationSpec, isLineAnnotation, isRectAnnotation } from '../../../utils/specs';
import { getSpecsById } from '../../../state/utils';
import { AnnotationId } from '../../../../../utils/ids';
import { mergeWithDefaultAnnotationLine, mergeWithDefaultAnnotationRect } from '../../../../../utils/themes/theme';
import { renderLineAnnotations } from './lines';
import { AnnotationLineProps } from '../../../annotations/line_annotation_tooltip';
import { renderRectAnnotations } from './rect';
import { AnnotationRectProps } from '../../../annotations/rect_annotation_tooltip';

interface AnnotationProps {
  annotationDimensions: Map<AnnotationId, AnnotationDimensions>;
  annotationSpecs: AnnotationSpec[];
}

/** @internal */
export function renderAnnotations(
  ctx: CanvasRenderingContext2D,
  props: AnnotationProps,
  renderOnBackground: boolean = true,
) {
  const { annotationDimensions, annotationSpecs } = props;

  annotationDimensions.forEach((annotation, id) => {
    const spec = getSpecsById<AnnotationSpec>(annotationSpecs, id);
    if (!spec) {
      return null;
    }
    const isBackground = !spec.zIndex || (spec.zIndex && spec.zIndex <= 0);
    if ((isBackground && renderOnBackground) || (!isBackground && !renderOnBackground)) {
      if (isLineAnnotation(spec)) {
        const lineStyle = mergeWithDefaultAnnotationLine(spec.style);
        renderLineAnnotations(ctx, annotation as AnnotationLineProps[], lineStyle);
      } else if (isRectAnnotation(spec)) {
        const rectStyle = mergeWithDefaultAnnotationRect(spec.style);
        renderRectAnnotations(ctx, annotation as AnnotationRectProps[], rectStyle);
      }
    }
  });
}
