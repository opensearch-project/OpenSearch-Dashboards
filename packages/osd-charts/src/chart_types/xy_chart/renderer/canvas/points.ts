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

import { RgbObject } from '../../../../common/color_library_wrappers';
import { SeriesKey } from '../../../../common/series_id';
import { Circle, Stroke, Fill, Rect } from '../../../../geoms/types';
import { Rotation } from '../../../../utils/common';
import { Dimensions } from '../../../../utils/dimensions';
import { PointGeometry } from '../../../../utils/geometry';
import { PointStyle, GeometryStateStyle, PointShape } from '../../../../utils/themes/theme';
import { renderShape } from './primitives/shapes';
import { withPanelTransform } from './utils/panel_transform';

/**
 * Renders points from single series
 *
 * @internal
 */
export function renderPoints(ctx: CanvasRenderingContext2D, points: PointGeometry[], { opacity }: GeometryStateStyle) {
  points
    .map<[Circle, Fill, Stroke, PointShape]>(({ x, y, radius, transform, style }) => {
      const fill: Fill = {
        color: applyOpacity(style.fill.color, opacity),
      };

      const stroke: Stroke = {
        ...style.stroke,
        color: applyOpacity(style.stroke.color, opacity),
      };

      const coordinates: Circle = {
        x: x + transform.x,
        y: y + transform.y,
        radius,
      };

      return [coordinates, fill, stroke, style.shape];
    })
    .sort(([{ radius: a }], [{ radius: b }]) => b - a)
    .forEach(([coordinates, fill, stroke, shape]) => renderShape(ctx, shape, coordinates, fill, stroke));
}

/**
 * Renders points in group from multiple series on a single layer
 *
 * @internal
 */
export function renderPointGroup(
  ctx: CanvasRenderingContext2D,
  points: PointGeometry[],
  themeStyles: Record<SeriesKey, PointStyle>,
  geometryStateStyles: Record<SeriesKey, GeometryStateStyle>,
  rotation: Rotation,
  renderingArea: Dimensions,
  clippings: Rect,
  shouldClip: boolean,
) {
  points
    .map<[Circle, Fill, Stroke, Dimensions, PointShape]>(
      ({ x, y, radius, transform, style, seriesIdentifier: { key }, panel }) => {
        const { opacity } = geometryStateStyles[key];
        const fill: Fill = {
          color: applyOpacity(style.fill.color, opacity),
        };

        const stroke: Stroke = {
          ...style.stroke,
          color: applyOpacity(style.stroke.color, opacity),
        };

        const coordinates: Circle = {
          x: x + transform.x,
          y,
          radius,
        };

        return [coordinates, fill, stroke, panel, style.shape];
      },
    )
    .sort(([{ radius: a }], [{ radius: b }]) => b - a)
    .forEach(([coordinates, fill, stroke, panel, shape]) => {
      withPanelTransform(
        ctx,
        panel,
        rotation,
        renderingArea,
        (ctx) => {
          renderShape(ctx, shape, coordinates, fill, stroke);
        },
        { area: clippings, shouldClip },
      );
    });
}

function applyOpacity(color: RgbObject, opacity: number): RgbObject {
  return {
    ...color,
    opacity: color.opacity * opacity,
  };
}
