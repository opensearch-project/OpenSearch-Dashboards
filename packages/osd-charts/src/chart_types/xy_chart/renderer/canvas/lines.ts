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
import { LineGeometry, PerPanel } from '../../../../utils/geometry';
import { SharedGeometryStateStyle } from '../../../../utils/themes/theme';
import { getGeometryStateStyle } from '../../rendering/utils';
import { renderPoints } from './points';
import { renderLinePaths } from './primitives/path';
import { buildLineStyles } from './styles/line';
import { withPanelTransform } from './utils/panel_transform';

interface LineGeometriesDataProps {
  animated?: boolean;
  lines: Array<PerPanel<LineGeometry>>;
  renderingArea: Dimensions;
  rotation: Rotation;
  sharedStyle: SharedGeometryStateStyle;
  highlightedLegendItem?: LegendItem;
  clippings: Rect;
}

/** @internal */
export function renderLines(ctx: CanvasRenderingContext2D, props: LineGeometriesDataProps) {
  withContext(ctx, (ctx) => {
    const { lines, sharedStyle, highlightedLegendItem, clippings, renderingArea, rotation } = props;

    lines.forEach(({ panel, value: line }) => {
      const { seriesLineStyle, seriesPointStyle, points } = line;

      if (seriesLineStyle.visible) {
        withPanelTransform(ctx, panel, rotation, renderingArea, (ctx) => {
          renderLine(ctx, line, sharedStyle, clippings, highlightedLegendItem);
        });
      }

      const visiblePoints = seriesPointStyle.visible ? points : points.filter(({ orphan }) => orphan);
      if (visiblePoints.length === 0) {
        return;
      }
      const geometryStyle = getGeometryStateStyle(line.seriesIdentifier, sharedStyle, highlightedLegendItem);
      withPanelTransform(
        ctx,
        panel,
        rotation,
        renderingArea,
        (ctx) => {
          renderPoints(ctx, visiblePoints, geometryStyle);
        },
        // TODO: add padding over clipping
        { area: clippings, shouldClip: line.points[0]?.value.mark !== null },
      );
    });
  });
}

function renderLine(
  ctx: CanvasRenderingContext2D,
  line: LineGeometry,
  sharedStyle: SharedGeometryStateStyle,
  clippings: Rect,
  highlightedLegendItem?: LegendItem,
) {
  const { color, transform, seriesIdentifier, seriesLineStyle, clippedRanges, hideClippedRanges } = line;
  const geometryStyle = getGeometryStateStyle(seriesIdentifier, sharedStyle, highlightedLegendItem);
  const stroke = buildLineStyles(color, seriesLineStyle, geometryStyle);
  renderLinePaths(ctx, transform, [line.line], stroke, clippedRanges, clippings, hideClippedRanges);
}
