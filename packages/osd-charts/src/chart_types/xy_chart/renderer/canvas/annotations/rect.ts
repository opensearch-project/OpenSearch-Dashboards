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

import { renderRect } from '../primitives/rect';
import { Rect, Fill, Stroke } from '../../../../../geoms/types';
import { AnnotationRectProps } from '../../../annotations/rect/types';
import { RectAnnotationStyle } from '../../../../../utils/themes/theme';
import { stringToRGB } from '../../../../partition_chart/layout/utils/d3_utils';
import { withContext } from '../../../../../renderers/canvas';

/** @internal */
export function renderRectAnnotations(
  ctx: CanvasRenderingContext2D,
  annotations: AnnotationRectProps[],
  rectStyle: RectAnnotationStyle,
) {
  const rects = annotations.map<Rect>((annotation) => {
    return annotation.rect;
  });
  const fillColor = stringToRGB(rectStyle.fill);
  fillColor.opacity = fillColor.opacity * rectStyle.opacity;
  const fill: Fill = {
    color: fillColor,
  };
  const strokeColor = stringToRGB(rectStyle.stroke);
  strokeColor.opacity = strokeColor.opacity * rectStyle.opacity;
  const stroke: Stroke = {
    color: strokeColor,
    width: rectStyle.strokeWidth,
  };

  const rectsLength = rects.length;

  for (let i = 0; i < rectsLength; i++) {
    const rect = rects[i];
    withContext(ctx, (ctx) => {
      renderRect(ctx, rect, fill, stroke);
    });
  }
}
