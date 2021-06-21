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
import { Line, Stroke } from '../../../../../geoms/types';
import { withContext } from '../../../../../renderers/canvas';

/**
 * Canvas2d stroke ignores an exact zero line width
 * Any value that's equal to or larger than MIN_STROKE_WIDTH
 * @internal
 */
export const MIN_STROKE_WIDTH = 0.001;

/** @internal */
export function renderMultiLine(ctx: CanvasRenderingContext2D, lines: Line[] | string[], stroke: Stroke) {
  if (stroke.width < MIN_STROKE_WIDTH || lines.length === 0) {
    return;
  }
  withContext(ctx, (ctx) => {
    ctx.strokeStyle = RGBtoString(stroke.color);
    ctx.lineJoin = 'round';
    ctx.lineWidth = stroke.width;
    if (stroke.dash) {
      ctx.setLineDash(stroke.dash);
    }

    ctx.beginPath();

    for (const line of lines) {
      if (typeof line === 'string') {
        ctx.stroke(new Path2D(line));
      } else {
        const { x1, y1, x2, y2 } = line;
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
      }
    }
    ctx.stroke();
  });
}
