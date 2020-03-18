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

import { GeometryStateStyle, RectStyle, RectBorderStyle } from '../../../../../utils/themes/theme';
import { stringToRGB } from '../../../../partition_chart/layout/utils/d3_utils';
import { Stroke, Fill } from '../../../../../geoms/types';

/**
 * Return the rendering styles (stroke and fill) for a bar.
 * The full color of the bar will be overwritten by the fill color
 * of the themeRectStyle parameter if present.
 * The stroke color of the bar will be overwritten by the stroke color
 * of the themeRectBorderStyle parameter if present.
 * @param baseColor the assigned color of the bar for this series
 * @param themeRectStyle the theme style of the rectangle for the bar series
 * @param themeRectBorderStyle the theme style of the rectangle borders for the bar series
 * @param geometryStateStyle the highlight geometry style
 * @internal
 */
export function buildBarStyles(
  baseColor: string,
  themeRectStyle: RectStyle,
  themeRectBorderStyle: RectBorderStyle,
  geometryStateStyle: GeometryStateStyle,
): { fill: Fill; stroke: Stroke } {
  const fillColor = stringToRGB(themeRectStyle.fill || baseColor);
  const fillOpacity = themeRectStyle.opacity * geometryStateStyle.opacity;
  fillColor.opacity = fillOpacity;
  const fill: Fill = {
    color: fillColor,
  };
  const strokeColor = stringToRGB(themeRectBorderStyle.stroke || baseColor);
  const defaultStrokeOpacity =
    themeRectBorderStyle.strokeOpacity === undefined ? themeRectStyle.opacity : themeRectBorderStyle.strokeOpacity;
  const borderStrokeOpacity = defaultStrokeOpacity * geometryStateStyle.opacity;
  strokeColor.opacity = strokeColor.opacity * borderStrokeOpacity;
  const stroke: Stroke = {
    color: strokeColor,
    width: themeRectBorderStyle.visible ? themeRectBorderStyle.strokeWidth : 0,
  };
  return { fill, stroke };
}
