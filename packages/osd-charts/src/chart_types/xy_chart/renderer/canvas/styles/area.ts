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

import { OpacityFn, stringToRGB } from '../../../../../common/color_library_wrappers';
import { Fill } from '../../../../../geoms/types';
import { Color, ColorVariant, getColorFromVariant } from '../../../../../utils/common';
import { GeometryStateStyle, AreaStyle } from '../../../../../utils/themes/theme';
import { getTextureStyles } from '../../../utils/texture';

/**
 * Return the rendering props for an area. The color of the area will be overwritten
 * by the fill color of the themeAreaStyle parameter if present
 * @param baseColor the assigned color of the area for this series
 * @param themeAreaStyle the theme style for the area series
 * @param geometryStateStyle the highlight geometry style
 * @internal
 */
export function buildAreaStyles(
  ctx: CanvasRenderingContext2D,
  imgCanvas: HTMLCanvasElement,
  baseColor: Color | ColorVariant,
  themeAreaStyle: AreaStyle,
  geometryStateStyle: GeometryStateStyle,
): Fill {
  const fillOpacity: OpacityFn = (opacity, seriesOpacity = themeAreaStyle.opacity) =>
    opacity * seriesOpacity * geometryStateStyle.opacity;
  const texture = getTextureStyles(ctx, imgCanvas, baseColor, fillOpacity, themeAreaStyle.texture);
  const color = stringToRGB(getColorFromVariant(baseColor, themeAreaStyle.fill), fillOpacity);

  return {
    color,
    texture,
  };
}
