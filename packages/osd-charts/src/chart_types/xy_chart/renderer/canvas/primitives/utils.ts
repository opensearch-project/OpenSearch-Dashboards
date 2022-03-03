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
import { Fill, Stroke } from '../../../../../geoms/types';
import { MIN_STROKE_WIDTH } from './line';

/**
 * WARNING: This function modify directly, without saving, the context calling the fill() and/or stroke() if defined
 * @internal
 */
export function fillAndStroke(ctx: CanvasRenderingContext2D, fill?: Fill, stroke?: Stroke, path?: Path2D) {
  if (fill) {
    ctx.fillStyle = RGBtoString(fill.color);
    if (path) {
      ctx.fill(path);
    } else {
      ctx.fill();
    }
  }
  if (stroke && stroke.width > MIN_STROKE_WIDTH) {
    ctx.strokeStyle = RGBtoString(stroke.color);
    ctx.lineWidth = stroke.width;
    if (stroke.dash) {
      ctx.setLineDash(stroke.dash);
    }
    if (path) {
      ctx.stroke(path);
    } else {
      ctx.stroke();
    }
  }
}
