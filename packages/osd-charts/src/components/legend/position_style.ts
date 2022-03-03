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

import { CSSProperties } from 'react';

import { LegendSpec, LegendPositionConfig } from '../../specs/settings';
import { BBox } from '../../utils/bbox/bbox_calculator';
import { LayoutDirection, Position } from '../../utils/common';
import { Dimensions } from '../../utils/dimensions';

const INSIDE_PADDING = 10;

/** @internal */
export function legendPositionStyle(
  { legendPosition }: LegendSpec,
  legendSize: BBox,
  chart: Dimensions,
  container: Dimensions,
): CSSProperties {
  const { vAlign, hAlign, direction, floating } = getLegendPositionConfig(legendPosition);
  // non-float legend doesn't need a special handling
  if (!floating) {
    return {};
  }

  const { Left, Right, Top, Bottom } = Position;

  if (direction === LayoutDirection.Vertical) {
    return {
      position: 'absolute',
      zIndex: 1,
      right: hAlign === Right ? container.width - chart.width - chart.left + INSIDE_PADDING : undefined,
      left: hAlign === Left ? chart.left + INSIDE_PADDING : undefined,
      top: vAlign === Top ? chart.top : undefined,
      bottom: vAlign === Bottom ? container.height - chart.top - chart.height : undefined,
      height: !floating && legendSize.height >= chart.height ? chart.height : undefined,
    };
  }

  return {
    position: 'absolute',
    zIndex: 1,
    right: INSIDE_PADDING,
    left: chart.left + INSIDE_PADDING,
    top: vAlign === Top ? chart.top : undefined,
    bottom: vAlign === Bottom ? container.height - chart.top - chart.height : undefined,
    height: !floating && legendSize.height >= chart.height ? chart.height : undefined,
  };
}

/** @internal */
export const LEGEND_TO_FULL_CONFIG: Record<Position, LegendPositionConfig> = {
  [Position.Left]: {
    vAlign: Position.Top,
    hAlign: Position.Left,
    direction: LayoutDirection.Vertical,
    floating: false,
    floatingColumns: 1,
  },
  [Position.Top]: {
    vAlign: Position.Top,
    hAlign: Position.Left,
    direction: LayoutDirection.Horizontal,
    floating: false,
    floatingColumns: 1,
  },
  [Position.Bottom]: {
    vAlign: Position.Bottom,
    hAlign: Position.Left,
    direction: LayoutDirection.Horizontal,
    floating: false,
    floatingColumns: 1,
  },
  [Position.Right]: {
    vAlign: Position.Top,
    hAlign: Position.Right,
    direction: LayoutDirection.Vertical,
    floating: false,
    floatingColumns: 1,
  },
};

/**
 * @internal
 */
export function getLegendPositionConfig(position: LegendSpec['legendPosition']): LegendPositionConfig {
  return typeof position === 'object' ? position : LEGEND_TO_FULL_CONFIG[position];
}
