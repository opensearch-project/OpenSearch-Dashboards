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

import { RGBtoString } from '../../../../../common/color_library_wrappers';
import { Rect, Fill, Stroke } from '../../../../../geoms/types';
import { withContext } from '../../../../../renderers/canvas';
import { getRadians } from '../../../../../utils/common';

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

  if (fill) {
    const borderOffset = !disableBoardOffset && stroke && stroke.width > 0.001 ? stroke.width : 0;
    const x = rect.x + borderOffset;
    const y = rect.y + borderOffset;
    const width = rect.width - borderOffset * 2;
    const height = rect.height - borderOffset * 2;

    drawRect(ctx, { x, y, width, height });
    ctx.fillStyle = RGBtoString(fill.color);
    ctx.fill();

    if (fill.texture) {
      const { texture } = fill;
      withContext(ctx, (ctx) => {
        drawRect(ctx, { x, y, width, height });
        ctx.clip();

        const rotation = getRadians(texture.rotation ?? 0);
        const { offset } = texture;

        if (offset && offset.global) ctx.translate(offset?.x ?? 0, offset?.y ?? 0);
        if (rotation) ctx.rotate(rotation);
        if (offset && !offset.global) ctx.translate(offset?.x ?? 0, offset?.y ?? 0);

        ctx.fillStyle = texture.pattern;

        // Use oversized rect to fill rotation/offset beyond path
        const rotationRectFillSize = ctx.canvas.clientWidth * ctx.canvas.clientHeight;
        ctx.translate(-rotationRectFillSize / 2, -rotationRectFillSize / 2);
        ctx.fillRect(0, 0, rotationRectFillSize, rotationRectFillSize);
      });
    }
  }

  if (stroke && stroke.width > 0.001) {
    const borderOffset = !disableBoardOffset && stroke && stroke.width > 0.001 ? stroke.width / 2 : 0;
    const x = rect.x + borderOffset;
    const y = rect.y + borderOffset;
    const width = rect.width - borderOffset * 2;
    const height = rect.height - borderOffset * 2;

    ctx.strokeStyle = RGBtoString(stroke.color);
    ctx.lineWidth = stroke.width;
    drawRect(ctx, { x, y, width, height });
    if (stroke.dash) {
      ctx.setLineDash(stroke.dash);
    } else {
      // Setting linecap with dash causes solid line
      ctx.lineCap = 'square';
    }

    ctx.stroke();
  }
}

/** @internal */
function drawRect(ctx: CanvasRenderingContext2D, rect: Rect) {
  const { x, y, width, height } = rect;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + width, y);
  ctx.lineTo(x + width, y + height);
  ctx.lineTo(x, y + height);
  ctx.lineTo(x, y);
}
