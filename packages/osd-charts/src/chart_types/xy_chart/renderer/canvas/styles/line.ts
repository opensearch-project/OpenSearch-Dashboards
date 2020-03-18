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

import { GeometryStateStyle, LineStyle } from '../../../../../utils/themes/theme';
import { stringToRGB } from '../../../../partition_chart/layout/utils/d3_utils';
import { Stroke } from '../../../../../geoms/types';

/**
 * Return the rendering props for a line. The color of the line will be overwritten
 * by the stroke color of the themeLineStyle parameter if present
 * @param baseColor the assigned color of the line for this series
 * @param themeLineStyle the theme style for the line series
 * @param geometryStateStyle the highlight geometry style
 * @internal
 */
export function buildLineStyles(
  baseColor: string,
  themeLineStyle: LineStyle,
  geometryStateStyle: GeometryStateStyle,
): Stroke {
  const strokeColor = stringToRGB(themeLineStyle.stroke || baseColor);
  strokeColor.opacity = strokeColor.opacity * themeLineStyle.opacity * geometryStateStyle.opacity;
  return {
    color: strokeColor,
    width: themeLineStyle.strokeWidth,
    dash: themeLineStyle.dash,
  };
}
