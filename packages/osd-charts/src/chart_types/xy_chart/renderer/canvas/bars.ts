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

import { withContext, withClip } from '../../../../renderers/canvas';
import { BarGeometry } from '../../../../utils/geometry';
import { buildBarStyles } from './styles/bar';
import { SharedGeometryStateStyle } from '../../../../utils/themes/theme';
import { getGeometryStateStyle } from '../../rendering/rendering';
import { LegendItem } from '../../legend/legend';
import { renderRect } from './primitives/rect';
import { Rect } from '../../../../geoms/types';

/** @internal */
export function renderBars(
  ctx: CanvasRenderingContext2D,
  barGeometries: BarGeometry[],
  sharedStyle: SharedGeometryStateStyle,
  clippings: Rect,
  highlightedLegendItem?: LegendItem,
) {
  withContext(ctx, (ctx) => {
    withClip(ctx, clippings, (ctx: CanvasRenderingContext2D) => {
      // ctx.scale(1, -1); // D3 and Canvas2d use a left-handed coordinate system (+y = down) but the ViewModel uses +y = up, so we must locally invert Y
      barGeometries.forEach((barGeometry) => {
        const { x, y, width, height, color, seriesStyle } = barGeometry;
        const geometryStateStyle = getGeometryStateStyle(
          barGeometry.seriesIdentifier,
          highlightedLegendItem || null,
          sharedStyle,
        );
        const { fill, stroke } = buildBarStyles(color, seriesStyle.rect, seriesStyle.rectBorder, geometryStateStyle);
        const rect = { x, y, width, height };
        renderRect(ctx, rect, fill, stroke);
      });
    });
  });
}
