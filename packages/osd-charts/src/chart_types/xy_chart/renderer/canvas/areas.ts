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
import { AreaGeometry, PerPanel } from '../../../../utils/geometry';
import { SharedGeometryStateStyle } from '../../../../utils/themes/theme';
import { getGeometryStateStyle } from '../../rendering/utils';
import { renderPoints } from './points';
import { renderLinePaths, renderAreaPath } from './primitives/path';
import { buildAreaStyles } from './styles/area';
import { buildLineStyles } from './styles/line';
import { withPanelTransform } from './utils/panel_transform';

interface AreaGeometriesProps {
  areas: Array<PerPanel<AreaGeometry>>;
  sharedStyle: SharedGeometryStateStyle;
  rotation: Rotation;
  renderingArea: Dimensions;
  highlightedLegendItem?: LegendItem;
  clippings: Rect;
}

/** @internal */
export function renderAreas(ctx: CanvasRenderingContext2D, props: AreaGeometriesProps) {
  const { sharedStyle, highlightedLegendItem, areas, rotation, clippings, renderingArea } = props;

  withContext(ctx, (ctx) => {
    areas.forEach(({ panel, value: area }) => {
      const { seriesAreaLineStyle, seriesAreaStyle } = area;
      if (seriesAreaStyle.visible) {
        withPanelTransform(
          ctx,
          panel,
          rotation,
          renderingArea,
          (ctx) => {
            renderArea(ctx, area, sharedStyle, clippings, highlightedLegendItem);
          },
          { area: clippings, shouldClip: true },
        );
      }
      if (seriesAreaLineStyle.visible) {
        withPanelTransform(
          ctx,
          panel,
          rotation,
          renderingArea,
          (ctx) => {
            renderAreaLines(ctx, area, sharedStyle, clippings, highlightedLegendItem);
          },
          { area: clippings, shouldClip: true },
        );
      }
    });

    areas.forEach(({ panel, value: area }) => {
      const { seriesPointStyle, seriesIdentifier, points } = area;
      const visiblePoints = seriesPointStyle.visible ? points : points.filter(({ orphan }) => orphan);
      if (visiblePoints.length === 0) {
        return;
      }
      const geometryStateStyle = getGeometryStateStyle(seriesIdentifier, sharedStyle, highlightedLegendItem);
      withPanelTransform(
        ctx,
        panel,
        rotation,
        renderingArea,
        (ctx) => {
          renderPoints(ctx, visiblePoints, geometryStateStyle);
        },
        { area: clippings, shouldClip: points[0]?.value.mark !== null },
      );
    });
  });
}

function renderArea(
  ctx: CanvasRenderingContext2D,
  glyph: AreaGeometry,
  sharedStyle: SharedGeometryStateStyle,
  clippings: Rect,
  highlightedLegendItem?: LegendItem,
) {
  const { area, color, transform, seriesIdentifier, seriesAreaStyle, clippedRanges, hideClippedRanges } = glyph;
  const geometryStateStyle = getGeometryStateStyle(seriesIdentifier, sharedStyle, highlightedLegendItem);
  const fill = buildAreaStyles(color, seriesAreaStyle, geometryStateStyle);
  renderAreaPath(ctx, transform, area, fill, clippedRanges, clippings, hideClippedRanges);
}

function renderAreaLines(
  ctx: CanvasRenderingContext2D,
  glyph: AreaGeometry,
  sharedStyle: SharedGeometryStateStyle,
  clippings: Rect,
  highlightedLegendItem?: LegendItem,
) {
  const { lines, color, seriesIdentifier, transform, seriesAreaLineStyle, clippedRanges, hideClippedRanges } = glyph;
  const geometryStateStyle = getGeometryStateStyle(seriesIdentifier, sharedStyle, highlightedLegendItem);
  const stroke = buildLineStyles(color, seriesAreaLineStyle, geometryStateStyle);

  renderLinePaths(ctx, transform, lines, stroke, clippedRanges, clippings, hideClippedRanges);
}
