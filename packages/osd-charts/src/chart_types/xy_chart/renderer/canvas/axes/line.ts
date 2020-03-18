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

import { isVerticalAxis } from '../../../utils/axis_utils';
import { AxisProps } from '.';
import { Position } from '../../../../../utils/commons';

/** @internal */
export function renderLine(ctx: CanvasRenderingContext2D, props: AxisProps) {
  const {
    axisSpec: { position },
    axisPosition,
    axisConfig: { axisLineStyle },
  } = props;
  const lineProps: number[] = [];
  if (isVerticalAxis(position)) {
    lineProps[0] = position === Position.Left ? axisPosition.width : 0;
    lineProps[2] = position === Position.Left ? axisPosition.width : 0;
    lineProps[1] = 0;
    lineProps[3] = axisPosition.height;
  } else {
    lineProps[0] = 0;
    lineProps[2] = axisPosition.width;
    lineProps[1] = position === Position.Top ? axisPosition.height : 0;
    lineProps[3] = position === Position.Top ? axisPosition.height : 0;
  }
  ctx.beginPath();
  ctx.moveTo(lineProps[0], lineProps[1]);
  ctx.lineTo(lineProps[2], lineProps[3]);
  ctx.strokeStyle = axisLineStyle.stroke;
  ctx.lineWidth = axisLineStyle.strokeWidth;
  ctx.stroke();
}
