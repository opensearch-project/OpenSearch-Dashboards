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

import { Circle, Fill, Stroke } from '../../../../../geoms/types';
import { withContext } from '../../../../../renderers/canvas';
import { PointShape } from '../../../../../utils/themes/theme';
import { ShapeRendererFn } from '../../shapes_paths';
import { fillAndStroke } from './utils';

/** @internal */
export function renderShape(
  ctx: CanvasRenderingContext2D,
  shape: PointShape,
  coordinates: Circle,
  fill?: Fill,
  stroke?: Stroke,
) {
  if (!stroke || !fill) {
    return;
  }
  withContext(ctx, (ctx) => {
    const [pathFn, rotation] = ShapeRendererFn[shape];
    const { x, y, radius } = coordinates;
    ctx.translate(x, y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.beginPath();

    const path = new Path2D(pathFn(radius));
    fillAndStroke(ctx, fill, stroke, path);
  });
}
