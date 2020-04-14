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

import { getGeometryStateStyle } from '../../rendering/rendering';
import { LineGeometry } from '../../../../utils/geometry';
import { SharedGeometryStateStyle } from '../../../../utils/themes/theme';
import { LegendItem } from '../../../../commons/legend';
import { withContext } from '../../../../renderers/canvas';
import { renderPoints } from './points';
import { renderLinePaths } from './primitives/path';
import { Rect } from '../../../../geoms/types';
import { buildLineStyles } from './styles/line';

interface LineGeometriesDataProps {
  animated?: boolean;
  lines: LineGeometry[];
  sharedStyle: SharedGeometryStateStyle;
  highlightedLegendItem: LegendItem | null;
  clippings: Rect;
}

/** @internal */
export function renderLines(ctx: CanvasRenderingContext2D, props: LineGeometriesDataProps) {
  withContext(ctx, (ctx) => {
    const { lines, sharedStyle, highlightedLegendItem, clippings } = props;

    lines.forEach((line) => {
      const { seriesLineStyle, seriesPointStyle } = line;

      if (seriesLineStyle.visible) {
        withContext(ctx, (ctx) => {
          renderLine(ctx, line, highlightedLegendItem, sharedStyle, clippings);
        });
      }

      if (seriesPointStyle.visible) {
        withContext(ctx, (ctx) => {
          const geometryStyle = getGeometryStateStyle(line.seriesIdentifier, highlightedLegendItem, sharedStyle);
          renderPoints(ctx, line.points, line.seriesPointStyle, geometryStyle);
        });
      }
    });
  });
}

function renderLine(
  ctx: CanvasRenderingContext2D,
  line: LineGeometry,
  highlightedLegendItem: LegendItem | null,
  sharedStyle: SharedGeometryStateStyle,
  clippings: Rect,
) {
  const { color, transform, seriesIdentifier, seriesLineStyle, clippedRanges } = line;
  const geometryStyle = getGeometryStateStyle(seriesIdentifier, highlightedLegendItem, sharedStyle);
  const stroke = buildLineStyles(color, seriesLineStyle, geometryStyle);
  renderLinePaths(ctx, transform.x, [line.line], stroke, clippedRanges, clippings);
}
