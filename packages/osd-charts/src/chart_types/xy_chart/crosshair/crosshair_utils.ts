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

import { TooltipAnchorPosition } from '../../../components/tooltip/types';
import { Line, Rect } from '../../../geoms/types';
import { Scale } from '../../../scales';
import { isContinuousScale } from '../../../scales/types';
import { TooltipProps } from '../../../specs/settings';
import { Position, Rotation } from '../../../utils/common';
import { Dimensions } from '../../../utils/dimensions';
import { Point } from '../../../utils/point';
import { isHorizontalRotation, isVerticalRotation } from '../state/utils/common';
import { ChartDimensions } from '../utils/dimensions';

/** @internal */
export const DEFAULT_SNAP_POSITION_BAND = 1;

/** @internal */
export function getSnapPosition(
  value: string | number,
  scale: Scale,
  totalBarsInCluster = 1,
): { band: number; position: number } | undefined {
  const position = scale.scale(value);
  if (position === null) {
    return;
  }

  if (scale.bandwidth > 0) {
    const band = scale.bandwidth / (1 - scale.barsPadding);

    const halfPadding = (band - scale.bandwidth) / 2;
    return {
      position: position - halfPadding * totalBarsInCluster,
      band: band * totalBarsInCluster,
    };
  }
  return {
    position,
    band: DEFAULT_SNAP_POSITION_BAND,
  };
}

/** @internal */
export function getCursorLinePosition(
  chartRotation: Rotation,
  chartDimensions: Dimensions,
  projectedPointerPosition: { x: number; y: number },
): Line | undefined {
  const { x, y } = projectedPointerPosition;
  if (x < 0 || y < 0) {
    return void 0;
  }
  const { left, top, width, height } = chartDimensions;
  const isHorizontalRotated = isHorizontalRotation(chartRotation);
  if (isHorizontalRotated) {
    const crosshairTop = y + top;
    return {
      x1: left,
      x2: left + width,
      y1: crosshairTop,
      y2: crosshairTop,
    };
  }
  const crosshairLeft = x + left;

  return {
    x1: crosshairLeft,
    x2: crosshairLeft,
    y1: top,
    y2: top + height,
  };
}

/** @internal */
export function getCursorBandPosition(
  chartRotation: Rotation,
  panel: Dimensions,
  cursorPosition: Point,
  invertedValue: {
    value: any;
    withinBandwidth: boolean;
  },
  snapEnabled: boolean,
  xScale: Scale,
  totalBarsInCluster?: number,
): Line | Rect | undefined {
  const { top, left, width, height } = panel;
  const { x, y } = cursorPosition;
  const isHorizontalRotated = isHorizontalRotation(chartRotation);
  const chartWidth = isHorizontalRotated ? width : height;
  const chartHeight = isHorizontalRotated ? height : width;

  const isLineOrAreaOnly = !totalBarsInCluster;

  if (x > chartWidth || y > chartHeight || x < 0 || y < 0 || !invertedValue.withinBandwidth) {
    return undefined;
  }

  const snappedPosition = getSnapPosition(invertedValue.value, xScale, isLineOrAreaOnly ? 1 : totalBarsInCluster);
  if (!snappedPosition) {
    return undefined;
  }

  const { position, band } = snappedPosition;
  const bandOffset = xScale.bandwidth > 0 ? band : 0;

  if (isHorizontalRotated) {
    const adjustedLeft = snapEnabled ? position : cursorPosition.x;
    let leftPosition = chartRotation === 0 ? left + adjustedLeft : left + width - adjustedLeft - bandOffset;
    let adjustedWidth = band;
    if (band > 1 && leftPosition + band > left + width) {
      adjustedWidth = left + width - leftPosition;
    } else if (band > 1 && leftPosition < left) {
      adjustedWidth = band - (left - leftPosition);
      leftPosition = left;
    }
    if (isLineOrAreaOnly && isContinuousScale(xScale)) {
      return {
        x1: leftPosition,
        x2: leftPosition,
        y1: top,
        y2: top + height,
      };
    }
    return {
      x: leftPosition,
      y: top,
      width: adjustedWidth,
      height,
    };
  }
  const adjustedTop = snapEnabled ? position : cursorPosition.x;
  let topPosition = chartRotation === 90 ? top + adjustedTop : height + top - adjustedTop - bandOffset;
  let adjustedHeight = band;
  if (band > 1 && topPosition + band > top + height) {
    adjustedHeight = band - (topPosition + band - (top + height));
  } else if (band > 1 && topPosition < top) {
    adjustedHeight = band - (top - topPosition);
    topPosition = top;
  }
  if (isLineOrAreaOnly && isContinuousScale(xScale)) {
    return {
      x1: left,
      x2: left + width,
      y1: topPosition,
      y2: topPosition,
    };
  }
  return {
    y: topPosition,
    x: left,
    width,
    height: adjustedHeight,
  };
}

/** @internal */
export function getTooltipAnchorPosition(
  { offset }: ChartDimensions,
  chartRotation: Rotation,
  cursorBandPosition: Line | Rect,
  cursorPosition: { x: number; y: number },
  panel: Dimensions,
  stickTo?: TooltipProps['stickTo'],
): TooltipAnchorPosition {
  const isRotated = isVerticalRotation(chartRotation);
  const hPosition = getHorizontalTooltipPosition(
    cursorPosition.x,
    cursorBandPosition,
    panel,
    offset.left,
    isRotated,
    stickTo,
  );
  const vPosition = getVerticalTooltipPosition(
    cursorPosition.y,
    cursorBandPosition,
    panel,
    offset.top,
    isRotated,
    stickTo,
  );
  return {
    isRotated,
    ...vPosition,
    ...hPosition,
  };
}

function getHorizontalTooltipPosition(
  cursorXPosition: number,
  cursorBandPosition: Line | Rect,
  panel: Dimensions,
  globalOffset: number,
  isRotated: boolean,
  stickTo?: TooltipProps['stickTo'],
): { x0?: number; x1: number } {
  if (!isRotated) {
    const left = 'x1' in cursorBandPosition ? cursorBandPosition.x1 : cursorBandPosition.x;
    const width = 'width' in cursorBandPosition ? cursorBandPosition.width : 0;
    return {
      x0: left + globalOffset,
      x1: left + width + globalOffset,
    };
  }
  const x = stickTo === Position.Left ? 0 : stickTo === Position.Right ? panel.width : cursorXPosition;
  return {
    // NOTE: x0 set to zero blocks tooltip placement on left when rotated 90 deg
    // Delete this comment before merging and verifying this doesn't break anything.
    x1: panel.left + x + globalOffset,
  };
}

function getVerticalTooltipPosition(
  cursorYPosition: number,
  cursorBandPosition: Line | Rect,
  panel: Dimensions,
  globalOffset: number,
  isRotated: boolean,
  stickTo?: TooltipProps['stickTo'],
): {
  y0: number;
  y1: number;
} {
  const y = stickTo === Position.Top ? 0 : stickTo === Position.Bottom ? panel.height : cursorYPosition;
  if (!isRotated) {
    const yPos = y + panel.top + globalOffset;
    return {
      y0: yPos,
      y1: yPos,
    };
  }
  const top = 'y1' in cursorBandPosition ? cursorBandPosition.y1 : cursorBandPosition.y;
  const height = 'height' in cursorBandPosition ? cursorBandPosition.height : 0;
  return {
    y0: top + globalOffset,
    y1: height + top + globalOffset,
  };
}
