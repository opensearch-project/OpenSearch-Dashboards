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

import { withContext } from '../../../../../renderers/canvas';
import { Fill, Stroke, Rect } from '../../../../../geoms/types';
import { renderRect } from '../primitives/rect';
import { Point } from '../../../../../utils/point';

const DEFAULT_DEBUG_FILL: Fill = {
  color: {
    r: 238,
    g: 130,
    b: 238,
    opacity: 0.2,
  },
};
const DEFAULT_DEBUG_STROKE: Stroke = {
  color: {
    r: 0,
    g: 0,
    b: 0,
    opacity: 0.2,
  },
  width: 1,
};

export function renderDebugRect(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  fill = DEFAULT_DEBUG_FILL, // violet
  stroke = DEFAULT_DEBUG_STROKE,
  rotation: number = 0,
) {
  withContext(ctx, (ctx) => {
    ctx.translate(rect.x, rect.y);
    ctx.rotate((rotation * Math.PI) / 180);
    renderRect(
      ctx,
      {
        ...rect,
        x: 0,
        y: 0,
      },
      fill,
      stroke,
      true,
    );
  });
}
export function renderDebugRectCenterRotated(
  ctx: CanvasRenderingContext2D,
  center: Point,
  rect: Rect,
  fill = DEFAULT_DEBUG_FILL, // violet
  stroke = DEFAULT_DEBUG_STROKE,
  rotation: number = 0,
) {
  const { x, y } = center;

  withContext(ctx, (ctx) => {
    ctx.translate(x, y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-x, -y);
    renderRect(
      ctx,
      {
        ...rect,
        x: x - rect.width / 2,
        y: y - rect.height / 2,
      },
      fill,
      stroke,
    );
  });
}
