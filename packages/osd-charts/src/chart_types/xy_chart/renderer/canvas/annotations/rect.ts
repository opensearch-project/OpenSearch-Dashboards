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

import { stringToRGB } from '../../../../../common/color_library_wrappers';
import { Fill, Stroke } from '../../../../../geoms/types';
import { Rotation } from '../../../../../utils/common';
import { Dimensions } from '../../../../../utils/dimensions';
import { RectAnnotationStyle } from '../../../../../utils/themes/theme';
import { AnnotationRectProps } from '../../../annotations/rect/types';
import { renderRect } from '../primitives/rect';
import { withPanelTransform } from '../utils/panel_transform';

/** @internal */
export function renderRectAnnotations(
  ctx: CanvasRenderingContext2D,
  annotations: AnnotationRectProps[],
  rectStyle: RectAnnotationStyle,
  rotation: Rotation,
  renderingArea: Dimensions,
) {
  const fillColor = stringToRGB(rectStyle.fill);
  fillColor.opacity *= rectStyle.opacity;
  const fill: Fill = {
    color: fillColor,
  };
  const strokeColor = stringToRGB(rectStyle.stroke);
  strokeColor.opacity *= rectStyle.opacity;
  const stroke: Stroke = {
    color: strokeColor,
    width: rectStyle.strokeWidth,
  };

  const rectsLength = annotations.length;

  for (let i = 0; i < rectsLength; i++) {
    const { rect, panel } = annotations[i];
    withPanelTransform(ctx, panel, rotation, renderingArea, (ctx) => {
      renderRect(ctx, rect, fill, stroke);
    });
  }
}
