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
import { Stroke, Line } from '../../../../../geoms/types';
import { withContext } from '../../../../../renderers/canvas';

/**
 * Canvas2d stroke ignores an exact zero line width
 * @internal
 */
export const MIN_STROKE_WIDTH = 0.001;

/** @internal */
export function renderLine(ctx: CanvasRenderingContext2D, line: Line, stroke: Stroke) {
  renderMultiLine(ctx, [line], stroke);
}

/** @internal */
export function renderMultiLine(ctx: CanvasRenderingContext2D, lines: Line[] | string[], stroke: Stroke) {
  if (stroke.width < MIN_STROKE_WIDTH) {
    return;
  }
  withContext(ctx, (ctx) => {
    const lineLength = lines.length;
    if (lineLength === 0) {
      return;
    }
    ctx.strokeStyle = RGBtoString(stroke.color);
    ctx.lineJoin = 'round';
    ctx.lineWidth = stroke.width;
    if (stroke.dash) {
      ctx.setLineDash(stroke.dash);
    }

    ctx.beginPath();

    if (isStringArray(lines)) {
      for (let i = 0; i < lineLength; i++) {
        const path = lines[i];
        ctx.stroke(new Path2D(path));
      }
      return;
    }
    for (let i = 0; i < lineLength; i++) {
      const { x1, y1, x2, y2 } = lines[i];
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    }
    ctx.stroke();
  });
}

function isStringArray(lines: Line[] | string[]): lines is string[] {
  return typeof lines[0] === 'string';
}
