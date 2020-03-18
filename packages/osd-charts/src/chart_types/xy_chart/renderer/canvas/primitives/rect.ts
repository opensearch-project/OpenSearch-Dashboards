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

import { Rect, Fill, Stroke } from '../../../../../geoms/types';
import { RGBtoString } from '../../../../partition_chart/layout/utils/d3_utils';

/** @internal */
export function renderRect(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  fill?: Fill,
  stroke?: Stroke,
  disableBoardOffset: boolean = false,
) {
  if (!fill && !stroke) {
    return;
  }

  // fill

  if (fill) {
    const borderOffset = !disableBoardOffset && stroke && stroke.width > 0.001 ? stroke.width : 0;
    // console.log(stroke, borderOffset);
    const x = rect.x + borderOffset;
    const y = rect.y + borderOffset;
    const width = rect.width - borderOffset * 2;
    const height = rect.height - borderOffset * 2;
    drawRect(ctx, { x, y, width, height });
    ctx.fillStyle = RGBtoString(fill.color);
    ctx.fill();
  }

  if (stroke && stroke.width > 0.001) {
    const borderOffset = !disableBoardOffset && stroke && stroke.width > 0.001 ? stroke.width / 2 : 0;
    // console.log(stroke, borderOffset);
    const x = rect.x + borderOffset;
    const y = rect.y + borderOffset;
    const width = rect.width - borderOffset * 2;
    const height = rect.height - borderOffset * 2;

    ctx.strokeStyle = RGBtoString(stroke.color);
    ctx.lineWidth = stroke.width;
    drawRect(ctx, { x, y, width, height });
    if (stroke.dash) {
      ctx.setLineDash(stroke.dash);
    }

    ctx.stroke();
  }
}

function drawRect(ctx: CanvasRenderingContext2D, rect: Rect) {
  const { x, y, width, height } = rect;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + width, y);
  ctx.lineTo(x + width, y + height);
  ctx.lineTo(x, y + height);
  ctx.lineTo(x, y);
}

/** @internal */
export function renderMultiRect(ctx: CanvasRenderingContext2D, rects: Rect[], fill?: Fill, stroke?: Stroke) {
  if (!fill && !stroke && rects.length > 0) {
    return;
  }

  const rectsLength = rects.length;
  ctx.beginPath();
  for (let i = 0; i < rectsLength; i++) {
    const { width, height, x, y } = rects[i];
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y);
    ctx.lineTo(x + width, y + height!);
    ctx.lineTo(x, y + height);
    ctx.lineTo(x, y);
  }

  if (fill) {
    ctx.fillStyle = RGBtoString(fill.color);
    ctx.fill();
  }
  if (stroke && stroke.width > 0.001) {
    // Canvas2d stroke ignores an exact zero line width
    ctx.strokeStyle = RGBtoString(stroke.color);
    ctx.lineWidth = stroke.width;
    ctx.stroke();
  }
}
