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

import { LegendStyle as ThemeLegendStyle } from '../../utils/themes/theme';
import { Margins } from '../../utils/dimensions';
import { Position } from '../../utils/commons';
import { BBox } from '../../utils/bbox/bbox_calculator';

/** @internal */
export interface LegendStyle {
  maxHeight?: string;
  maxWidth?: string;
  width?: string;
  height?: string;
}

/** @internal */
export interface LegendListStyle {
  paddingTop?: number | string;
  paddingBottom?: number | string;
  paddingLeft?: number | string;
  paddingRight?: number | string;
  gridTemplateColumns?: string;
}
/**
 * Get the legend list style
 * @param position
 * @param chartMarrings, legend from the Theme
 * @internal
 */
export function getLegendListStyle(
  position: Position,
  chartMargins: Margins,
  legendStyle: ThemeLegendStyle,
): LegendListStyle {
  const { top: paddingTop, bottom: paddingBottom, left: paddingLeft, right: paddingRight } = chartMargins;

  if (position === Position.Bottom || position === Position.Top) {
    return {
      paddingLeft,
      paddingRight,
      gridTemplateColumns: `repeat(auto-fill, minmax(${legendStyle.verticalWidth}px, 1fr))`,
    };
  }

  return {
    paddingTop,
    paddingBottom,
  };
}
/**
 * Get the legend global style
 * @param position the position of the legend
 * @param size the computed size of the legend
 * @internal
 */
export function getLegendStyle(position: Position, size: BBox): LegendStyle {
  if (position === Position.Left || position === Position.Right) {
    const width = `${size.width}px`;
    return {
      width,
      maxWidth: width,
    };
  }
  const height = `${size.height}px`;
  return {
    height,
    maxHeight: height,
  };
}
