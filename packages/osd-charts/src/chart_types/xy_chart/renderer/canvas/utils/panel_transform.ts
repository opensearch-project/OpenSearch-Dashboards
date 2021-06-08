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

import { Rect } from '../../../../../geoms/types';
import { withContext } from '../../../../../renderers/canvas';
import { getRadians, Rotation } from '../../../../../utils/common';
import { Dimensions } from '../../../../../utils/dimensions';
import { computeChartTransform } from '../../../state/utils/utils';

/** @internal */
export function withPanelTransform(
  context: CanvasRenderingContext2D,
  panel: Dimensions,
  rotation: Rotation,
  renderingArea: Dimensions,
  fn: (ctx: CanvasRenderingContext2D) => void,
  clippings?: {
    area: Rect;
    shouldClip?: boolean;
  },
) {
  const transform = computeChartTransform(panel, rotation);
  const left = renderingArea.left + panel.left + transform.x;
  const top = renderingArea.top + panel.top + transform.y;
  withContext(context, (ctx) => {
    ctx.translate(left, top);
    ctx.rotate(getRadians(rotation));

    if (clippings?.shouldClip) {
      const { x, y, width, height } = clippings.area;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, width, height);
      ctx.clip();
    }
    fn(ctx);
    if (clippings?.shouldClip) {
      ctx.restore();
    }
  });
}
