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
import { SeriesKey } from '../../../../common/series_id';
import { Rect } from '../../../../geoms/types';
import { withContext } from '../../../../renderers/canvas';
import { Rotation } from '../../../../utils/common';
import { Dimensions } from '../../../../utils/dimensions';
import { BubbleGeometry, PerPanel, PointGeometry } from '../../../../utils/geometry';
import { SharedGeometryStateStyle, GeometryStateStyle, PointStyle } from '../../../../utils/themes/theme';
import { getGeometryStateStyle } from '../../rendering/utils';
import { renderPointGroup } from './points';

interface BubbleGeometriesDataProps {
  animated?: boolean;
  bubbles: Array<PerPanel<BubbleGeometry>>;
  sharedStyle: SharedGeometryStateStyle;
  highlightedLegendItem?: LegendItem;
  clippings: Rect;
  rotation: Rotation;
  renderingArea: Dimensions;
}

/** @internal */
export function renderBubbles(ctx: CanvasRenderingContext2D, props: BubbleGeometriesDataProps) {
  withContext(ctx, (ctx) => {
    const { bubbles, sharedStyle, highlightedLegendItem, clippings, rotation, renderingArea } = props;
    const geometryStyles: Record<SeriesKey, GeometryStateStyle> = {};
    const pointStyles: Record<SeriesKey, PointStyle> = {};

    const allPoints = bubbles.reduce<PointGeometry[]>(
      (acc, { value: { seriesIdentifier, seriesPointStyle, points } }) => {
        geometryStyles[seriesIdentifier.key] = getGeometryStateStyle(
          seriesIdentifier,
          sharedStyle,
          highlightedLegendItem,
        );
        pointStyles[seriesIdentifier.key] = seriesPointStyle;

        acc.push(...points);
        return acc;
      },
      [],
    );
    if (allPoints.length === 0) {
      return;
    }

    renderPointGroup(
      ctx,
      allPoints,
      pointStyles,
      geometryStyles,
      rotation,
      renderingArea,
      clippings,
      // TODO: add padding over clipping
      allPoints[0]?.value.mark !== null,
    );
  });
}
