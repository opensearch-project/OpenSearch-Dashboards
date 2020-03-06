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

import { Coordinate } from '../../chart_types/partition_chart/layout/types/geometry_types';
import { ClippedRanges } from '../../utils/geometry';
import { Rect } from '../../geoms/types';
import { Point } from '../../utils/point';

/**
 * withContext abstracts out the otherwise error-prone save/restore pairing; it can be nested and/or put into sequence
 * The idea is that you just set what's needed for the enclosed snippet, which may temporarily override values in the
 * outer withContext. Example: we use a +y = top convention, so when doing text rendering, y has to be flipped (ctx.scale)
 * otherwise the text will render upside down.
 * @param ctx
 * @param fun
 */
export function withContext(ctx: CanvasRenderingContext2D, fun: (ctx: CanvasRenderingContext2D) => void) {
  ctx.save();
  fun(ctx);
  ctx.restore();
}

export function clearCanvas(
  ctx: CanvasRenderingContext2D,
  width: Coordinate,
  height: Coordinate /*, backgroundColor: string*/,
) {
  withContext(ctx, (ctx) => {
    // two steps, as the backgroundColor may have a non-one opacity
    // todo we should avoid `fillRect` by setting the <canvas> element background via CSS
    ctx.clearRect(-width, -height, 2 * width, 2 * height); // remove past contents
    // ctx.fillStyle = backgroundColor;
    // ctx.fillRect(-width, -height, 2 * width, 2 * height); // new background
  });
}

// order of rendering is important; determined by the order of layers in the array
export function renderLayers(ctx: CanvasRenderingContext2D, layers: Array<(ctx: CanvasRenderingContext2D) => void>) {
  layers.forEach((renderLayer) => renderLayer(ctx));
}

export function withClip(
  ctx: CanvasRenderingContext2D,
  clip: { x: number; y: number; width: number; height: number },
  fun: (ctx: CanvasRenderingContext2D) => void,
) {
  withContext(ctx, (ctx) => {
    const { x, y, width, height } = clip;
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.clip();
    withContext(ctx, (ctx) => {
      fun(ctx);
    });
  });
}

/**
 * Create clip from a set of clipped ranges
 *
 * @param clippedRanges ranges to be clipped from rendering
 * @param clippings the general clipping
 * @param negate show, rather than exclude, only selected ranges
 */
export function withClipRanges(
  ctx: CanvasRenderingContext2D,
  clippedRanges: ClippedRanges,
  clippings: Rect,
  negate = false,
  fun: (ctx: CanvasRenderingContext2D) => void,
) {
  withContext(ctx, (ctx) => {
    const length = clippedRanges.length;
    const { width, height } = clippings;
    ctx.beginPath();
    if (negate) {
      clippedRanges.forEach(([x0, x1]) => {
        ctx.rect(x0, 0, x1 - x0, height);
      });
    } else {
      if (length > 0) {
        ctx.rect(0, 0, clippedRanges[0][0], height);
        const lastX = clippedRanges[length - 1][1];
        ctx.rect(lastX, 0, width - lastX, height);
      }

      if (length > 1) {
        for (let i = 1; i < length; i++) {
          const [, x0] = clippedRanges[i - 1];
          const [x1] = clippedRanges[i];
          ctx.rect(x0, 0, x1 - x0, height);
        }
      }
    }
    ctx.clip();
    fun(ctx);
  });
}

export function withRotatedOrigin(
  ctx: CanvasRenderingContext2D,
  origin: Point,
  rotation: number = 0,
  fn: (ctx: CanvasRenderingContext2D) => void,
) {
  withContext(ctx, (ctx) => {
    const { x, y } = origin;
    ctx.translate(x, y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-x, -y);
    fn(ctx);
  });
}
