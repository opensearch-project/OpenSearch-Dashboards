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
import { BubbleGeometry, PointGeometry } from '../../../../utils/geometry';
import { SharedGeometryStateStyle, GeometryStateStyle, PointStyle } from '../../../../utils/themes/theme';
import { withContext, withClip } from '../../../../renderers/canvas';
import { renderPointGroup } from './points';
import { Rect } from '../../../../geoms/types';
import { LegendItem } from '../../../../commons/legend';
import { SeriesKey } from '../../../../commons/series_id';

interface BubbleGeometriesDataProps {
  animated?: boolean;
  bubbles: BubbleGeometry[];
  sharedStyle: SharedGeometryStateStyle;
  highlightedLegendItem: LegendItem | null;
  clippings: Rect;
}

/** @internal */
export function renderBubbles(ctx: CanvasRenderingContext2D, props: BubbleGeometriesDataProps) {
  withContext(ctx, (ctx) => {
    const { bubbles, sharedStyle, highlightedLegendItem, clippings } = props;
    const geometryStyles: Record<SeriesKey, GeometryStateStyle> = {};
    const pointStyles: Record<SeriesKey, PointStyle> = {};

    const allPoints = bubbles.reduce<PointGeometry[]>((acc, { seriesIdentifier, seriesPointStyle, points }) => {
      const geometryStyle = getGeometryStateStyle(seriesIdentifier, highlightedLegendItem, sharedStyle);
      geometryStyles[seriesIdentifier.key] = geometryStyle;
      pointStyles[seriesIdentifier.key] = seriesPointStyle;

      acc.push(...points);
      return acc;
    }, []);

    withClip(
      ctx,
      clippings,
      (ctx) => {
        renderPointGroup(ctx, allPoints, pointStyles, geometryStyles);
      },
      // TODO: add padding over clipping
      allPoints[0]?.value.mark !== null,
    );
  });
}
