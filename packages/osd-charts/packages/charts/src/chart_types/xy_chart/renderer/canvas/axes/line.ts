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

import { AxisProps } from '.';
import { Position } from '../../../../../utils/common';
import { isVerticalAxis } from '../../../utils/axis_type_utils';

/** @internal */
export function renderLine(
  ctx: CanvasRenderingContext2D,
  { axisSpec: { position }, size, axisStyle: { axisLine } }: AxisProps,
) {
  if (!axisLine.visible) {
    return;
  }

  const lineProps: number[] = [];
  if (isVerticalAxis(position)) {
    lineProps[0] = position === Position.Left ? size.width : 0;
    lineProps[2] = position === Position.Left ? size.width : 0;
    lineProps[1] = 0;
    lineProps[3] = size.height;
  } else {
    lineProps[0] = 0;
    lineProps[2] = size.width;
    lineProps[1] = position === Position.Top ? size.height : 0;
    lineProps[3] = position === Position.Top ? size.height : 0;
  }
  ctx.beginPath();
  ctx.moveTo(lineProps[0], lineProps[1]);
  ctx.lineTo(lineProps[2], lineProps[3]);
  ctx.strokeStyle = axisLine.stroke;
  ctx.lineWidth = axisLine.strokeWidth;
  ctx.stroke();
}
