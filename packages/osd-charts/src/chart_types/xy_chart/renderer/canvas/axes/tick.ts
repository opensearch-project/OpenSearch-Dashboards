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

import { AxisTick, isVerticalAxis } from '../../../utils/axis_utils';
import { AxisProps } from '.';
import { Position } from '../../../../../utils/commons';
import { TickStyle } from '../../../../../utils/themes/theme';
import { renderLine, MIN_STROKE_WIDTH } from '../primitives/line';
import { stringToRGB } from '../../../../partition_chart/layout/utils/d3_utils';

export function renderTick(ctx: CanvasRenderingContext2D, tick: AxisTick, props: AxisProps) {
  const {
    axisSpec: { tickSize, position },
    axisPosition,
    axisConfig: { tickLineStyle },
  } = props;
  if (!tickLineStyle.visible || tickLineStyle.strokeWidth < MIN_STROKE_WIDTH) {
    return;
  }
  if (isVerticalAxis(position)) {
    renderVerticalTick(ctx, position, axisPosition.width, tickSize, tick.position, tickLineStyle);
  } else {
    renderHorizontalTick(ctx, position, axisPosition.height, tickSize, tick.position, tickLineStyle);
  }
}

function renderVerticalTick(
  ctx: CanvasRenderingContext2D,
  position: Position,
  axisWidth: number,
  tickSize: number,
  tickPosition: number,
  tickStyle: TickStyle,
) {
  const isLeftAxis = position === Position.Left;
  const x1 = isLeftAxis ? axisWidth : 0;
  const x2 = isLeftAxis ? axisWidth - tickSize : tickSize;
  renderLine(
    ctx,
    { x1, y1: tickPosition, x2, y2: tickPosition },
    {
      color: stringToRGB(tickStyle.stroke),
      width: tickStyle.strokeWidth,
    },
  );
}

function renderHorizontalTick(
  ctx: CanvasRenderingContext2D,
  position: Position,
  axisHeight: number,
  tickSize: number,
  tickPosition: number,
  tickStyle: TickStyle,
) {
  const isTopAxis = position === Position.Top;
  const y1 = isTopAxis ? axisHeight - tickSize : 0;
  const y2 = isTopAxis ? axisHeight : tickSize;

  renderLine(
    ctx,
    { x1: tickPosition, y1, x2: tickPosition, y2 },
    {
      color: stringToRGB(tickStyle.stroke),
      width: tickStyle.strokeWidth,
    },
  );
}
