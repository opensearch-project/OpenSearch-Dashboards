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

import { PointGeometry } from '../../../../utils/geometry';
import { PointStyle, GeometryStateStyle } from '../../../../utils/themes/theme';
import { renderCircle } from './primitives/arc';
import { Circle } from '../../../../geoms/types';
import { buildPointStyles } from './styles/point';

export function renderPoints(
  ctx: CanvasRenderingContext2D,
  points: PointGeometry[],
  themeStyle: PointStyle,
  geometryStateStyle: GeometryStateStyle,
) {
  return points.map((point) => {
    const { x, y, color, transform, styleOverrides } = point;
    const { fill, stroke, radius } = buildPointStyles(color, themeStyle, geometryStateStyle, styleOverrides);

    const circle: Circle = {
      x: x + transform.x,
      y,
      radius,
    };

    renderCircle(ctx, circle, fill, stroke);
  });
}
