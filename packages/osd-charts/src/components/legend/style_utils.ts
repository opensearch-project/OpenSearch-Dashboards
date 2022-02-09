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

import { LegendPositionConfig } from '../../specs/settings';
import { BBox } from '../../utils/bbox/bbox_calculator';
import { clamp, LayoutDirection } from '../../utils/common';
import { Margins } from '../../utils/dimensions';
import { LegendStyle as ThemeLegendStyle } from '../../utils/themes/theme';

/** @internal */
export type LegendStyle =
  | {
      width?: string;
      maxWidth?: string;
      marginLeft?: number;
      marginRight?: number;
    }
  | {
      height?: string;
      maxHeight?: string;
      marginTop?: number;
      marginBottom?: number;
    };

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
 * @internal
 */
export function getLegendListStyle(
  { direction, floating, floatingColumns }: LegendPositionConfig,
  chartMargins: Margins,
  legendStyle: ThemeLegendStyle,
  totalItems: number,
): LegendListStyle {
  const { top: paddingTop, bottom: paddingBottom, left: paddingLeft, right: paddingRight } = chartMargins;

  if (direction === LayoutDirection.Horizontal) {
    return {
      paddingLeft,
      paddingRight,
      gridTemplateColumns: `repeat(auto-fill, minmax(${legendStyle.verticalWidth}px, 1fr))`,
    };
  }

  return {
    paddingTop,
    paddingBottom,
    ...(floating && {
      gridTemplateColumns: `repeat(${clamp(floatingColumns ?? 1, 1, totalItems)}, auto)`,
    }),
  };
}
/**
 * Get the legend global style
 * @internal
 */
export function getLegendStyle({ direction, floating }: LegendPositionConfig, size: BBox, margin: number): LegendStyle {
  if (direction === LayoutDirection.Vertical) {
    const width = `${size.width}px`;
    return {
      width: floating ? undefined : width,
      maxWidth: floating ? undefined : width,
      marginLeft: margin,
      marginRight: margin,
    };
  }
  const height = `${size.height}px`;
  return {
    height,
    maxHeight: height,
    marginTop: margin,
    marginBottom: margin,
  };
}
