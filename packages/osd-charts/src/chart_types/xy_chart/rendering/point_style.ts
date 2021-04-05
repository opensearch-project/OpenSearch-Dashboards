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

import { OpacityFn, stringToRGB } from '../../../common/color_library_wrappers';
import { getColorFromVariant, mergePartial } from '../../../utils/common';
import { PointGeometryStyle } from '../../../utils/geometry';
import { PointShape, PointStyle } from '../../../utils/themes/theme';

/** @internal */
export function buildPointGeometryStyles(
  color: string,
  themePointStyle: PointStyle,
  overrides?: Partial<PointStyle>,
): PointGeometryStyle {
  const pointStyle = mergePartial(themePointStyle, overrides, { mergeOptionalPartialValues: true });

  const opacityFn: OpacityFn = (opacity) => opacity * pointStyle.opacity;

  return {
    fill: {
      color: stringToRGB(getColorFromVariant(color, pointStyle.fill), opacityFn),
    },
    stroke: {
      color: stringToRGB(getColorFromVariant(color, pointStyle.stroke), opacityFn),
      width: pointStyle.strokeWidth,
    },
    shape: pointStyle.shape ?? PointShape.Circle,
  };
}
