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
import { Stroke } from '../../../../../geoms/types';
import { Rotation } from '../../../../../utils/common';
import { Dimensions } from '../../../../../utils/dimensions';
import { LineAnnotationStyle } from '../../../../../utils/themes/theme';
import { AnnotationLineProps } from '../../../annotations/line/types';
import { renderMultiLine } from '../primitives/line';
import { withPanelTransform } from '../utils/panel_transform';

/** @internal */
export function renderLineAnnotations(
  ctx: CanvasRenderingContext2D,
  annotations: AnnotationLineProps[],
  lineStyle: LineAnnotationStyle,
  rotation: Rotation,
  renderingArea: Dimensions,
) {
  const strokeColor = stringToRGB(lineStyle.line.stroke);
  strokeColor.opacity *= lineStyle.line.opacity;
  const stroke: Stroke = {
    color: strokeColor,
    width: lineStyle.line.strokeWidth,
    dash: lineStyle.line.dash,
  };

  annotations.forEach(({ linePathPoints, panel }) => {
    withPanelTransform(ctx, panel, rotation, renderingArea, (ctx) => {
      renderMultiLine(ctx, [linePathPoints], stroke);
    });
  });
}
