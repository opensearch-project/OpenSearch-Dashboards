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

import { LegendItem } from '../../../../common/legend';
import { Rect } from '../../../../geoms/types';
import { withContext } from '../../../../renderers/canvas';
import { Rotation } from '../../../../utils/common';
import { Dimensions } from '../../../../utils/dimensions';
import { BarGeometry, PerPanel } from '../../../../utils/geometry';
import { SharedGeometryStateStyle } from '../../../../utils/themes/theme';
import { getGeometryStateStyle } from '../../rendering/utils';
import { renderRect } from './primitives/rect';
import { buildBarStyles } from './styles/bar';
import { withPanelTransform } from './utils/panel_transform';

/** @internal */
export function renderBars(
  ctx: CanvasRenderingContext2D,
  imgCanvas: HTMLCanvasElement,
  barGeometries: Array<PerPanel<BarGeometry[]>>,
  sharedStyle: SharedGeometryStateStyle,
  clippings: Rect,
  renderingArea: Dimensions,
  highlightedLegendItem?: LegendItem,
  rotation?: Rotation,
) {
  withContext(ctx, (ctx) => {
    const barRenderer = renderPerPanelBars(
      ctx,
      imgCanvas,
      clippings,
      sharedStyle,
      renderingArea,
      highlightedLegendItem,
      rotation,
    );
    barGeometries.forEach(barRenderer);
  });
}

function renderPerPanelBars(
  ctx: CanvasRenderingContext2D,
  imgCanvas: HTMLCanvasElement,
  clippings: Rect,
  sharedStyle: SharedGeometryStateStyle,
  renderingArea: Dimensions,
  highlightedLegendItem?: LegendItem,
  rotation: Rotation = 0,
) {
  return ({ panel, value: bars }: PerPanel<BarGeometry[]>) => {
    if (bars.length === 0) {
      return;
    }
    withPanelTransform(
      ctx,
      panel,
      rotation,
      renderingArea,
      (ctx) => {
        bars.forEach((barGeometry) => {
          const { x, y, width, height, color, seriesStyle, seriesIdentifier } = barGeometry;
          const geometryStateStyle = getGeometryStateStyle(seriesIdentifier, sharedStyle, highlightedLegendItem);
          const { fill, stroke } = buildBarStyles(
            ctx,
            imgCanvas,
            color,
            seriesStyle.rect,
            seriesStyle.rectBorder,
            geometryStateStyle,
          );
          const rect = { x, y, width, height };
          withContext(ctx, (ctx) => {
            renderRect(ctx, rect, fill, stroke);
          });
        });
      },
      { area: clippings, shouldClip: true },
    );
  };
}
