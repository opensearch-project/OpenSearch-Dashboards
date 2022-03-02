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

import { BrushAxis } from '../../../../specs/constants';
import { GlobalChartState } from '../../../../state/chart_state';
import { createCustomCachedSelector } from '../../../../state/create_selector';
import { getChartRotationSelector } from '../../../../state/selectors/get_chart_rotation';
import { getSettingsSpecSelector } from '../../../../state/selectors/get_settings_specs';
import { clamp, Rotation } from '../../../../utils/common';
import { Dimensions } from '../../../../utils/dimensions';
import { Point } from '../../../../utils/point';
import { isVerticalRotation } from '../utils/common';
import { computeChartDimensionsSelector } from './compute_chart_dimensions';
import { computeSmallMultipleScalesSelector, SmallMultipleScales } from './compute_small_multiple_scales';

const MIN_AREA_SIZE = 1;

const getMouseDownPosition = (state: GlobalChartState) => state.interactions.pointer.down?.position;
const getCurrentPointerPosition = (state: GlobalChartState) => state.interactions.pointer.current.position;

/** @internal */
export const getBrushAreaSelector = createCustomCachedSelector(
  [
    getMouseDownPosition,
    getCurrentPointerPosition,
    getChartRotationSelector,
    computeChartDimensionsSelector,
    getSettingsSpecSelector,
    computeSmallMultipleScalesSelector,
  ],
  (start, end, chartRotation, { chartDimensions }, { brushAxis }, smallMultipleScales): Dimensions | null => {
    if (!start) {
      return null;
    }
    const plotStartPointPx = getPlotAreaRestrictedPoint(start, chartDimensions);
    const plotEndPointPx = getPlotAreaRestrictedPoint(end, chartDimensions);
    const panelPoints = getPointsConstraintToSinglePanel(plotStartPointPx, plotEndPointPx, smallMultipleScales);

    switch (brushAxis) {
      case BrushAxis.Y:
        return getBrushForYAxis(chartRotation, panelPoints);
      case BrushAxis.Both:
        return getBrushForBothAxis(panelPoints);
      case BrushAxis.X:
      default:
        return getBrushForXAxis(chartRotation, panelPoints);
    }
  },
);

/** @internal */
export type PanelPoints = {
  start: Point;
  end: Point;
  hPanelStart: number;
  hPanelWidth: number;
  vPanelStart: number;
  vPanelHeight: number;
};

/** @internal */
export function getPointsConstraintToSinglePanel(
  startPlotPoint: Point,
  endPlotPoint: Point,
  { horizontal, vertical }: SmallMultipleScales,
): PanelPoints {
  const hPanel = horizontal.invert(startPlotPoint.x);
  const vPanel = vertical.invert(startPlotPoint.y);

  const hPanelStart = horizontal.scale(hPanel) ?? 0;
  const hPanelEnd = hPanelStart + horizontal.bandwidth;

  const vPanelStart = vertical.scale(vPanel) ?? 0;
  const vPanelEnd = vPanelStart + vertical.bandwidth;

  const start = {
    x: clamp(startPlotPoint.x, hPanelStart, hPanelEnd),
    y: clamp(startPlotPoint.y, vPanelStart, vPanelEnd),
  };
  const end = {
    x: clamp(endPlotPoint.x, hPanelStart, hPanelEnd),
    y: clamp(endPlotPoint.y, vPanelStart, vPanelEnd),
  };

  return {
    start,
    end,
    hPanelStart,
    hPanelWidth: horizontal.bandwidth,
    vPanelStart,
    vPanelHeight: vertical.bandwidth,
  };
}

/** @internal */
export function getPlotAreaRestrictedPoint({ x, y }: Point, { left, top }: Dimensions) {
  return {
    x: x - left,
    y: y - top,
  };
}

/** @internal */
export function getBrushForXAxis(
  chartRotation: Rotation,
  { hPanelStart, vPanelStart, hPanelWidth, vPanelHeight, start, end }: PanelPoints,
) {
  const rotated = isVerticalRotation(chartRotation);

  return {
    left: rotated ? hPanelStart : start.x,
    top: rotated ? start.y : vPanelStart,
    height: rotated ? getMinSize(start.y, end.y) : vPanelHeight,
    width: rotated ? hPanelWidth : getMinSize(start.x, end.x),
  };
}

/** @internal */
export function getBrushForYAxis(
  chartRotation: Rotation,
  { hPanelStart, vPanelStart, hPanelWidth, vPanelHeight, start, end }: PanelPoints,
) {
  const rotated = isVerticalRotation(chartRotation);

  return {
    left: rotated ? start.x : hPanelStart,
    top: rotated ? vPanelStart : start.y,
    height: rotated ? vPanelHeight : getMinSize(start.y, end.y),
    width: rotated ? getMinSize(start.x, end.x) : hPanelWidth,
  };
}

/** @internal */
export function getBrushForBothAxis({ start, end }: PanelPoints) {
  return {
    left: start.x,
    top: start.y,
    height: getMinSize(start.y, end.y),
    width: getMinSize(start.x, end.x),
  };
}

function getMinSize(a: number, b: number, minSize = MIN_AREA_SIZE) {
  const size = b - a;
  if (Math.abs(size) < minSize) {
    return minSize;
  }
  return size;
}
