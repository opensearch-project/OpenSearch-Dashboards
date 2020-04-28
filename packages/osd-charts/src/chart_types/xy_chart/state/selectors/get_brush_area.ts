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

import createCachedSelector from 're-reselect';
import { isVerticalRotation } from '../utils';
import { GlobalChartState } from '../../../../state/chart_state';
import { Dimensions } from '../../../../utils/dimensions';
import { getChartRotationSelector } from '../../../../state/selectors/get_chart_rotation';
import { computeChartDimensionsSelector } from './compute_chart_dimensions';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';
import { getSettingsSpecSelector } from '../../../../state/selectors/get_settings_specs';
import { BrushAxis } from '../../../../specs';
import { Rotation } from '../../../../utils/commons';
import { Point } from '../../../../utils/point';

const MIN_AREA_SIZE = 1;

const getMouseDownPosition = (state: GlobalChartState) => state.interactions.pointer.down;
const getCurrentPointerPosition = (state: GlobalChartState) => {
  return state.interactions.pointer.current.position;
};

/** @internal */
export const getBrushAreaSelector = createCachedSelector(
  [
    getMouseDownPosition,
    getCurrentPointerPosition,
    getChartRotationSelector,
    computeChartDimensionsSelector,
    getSettingsSpecSelector,
  ],
  (mouseDownPosition, end, chartRotation, { chartDimensions }, { brushAxis }): Dimensions | null => {
    if (!mouseDownPosition) {
      return null;
    }
    const start = {
      x: mouseDownPosition.position.x,
      y: mouseDownPosition.position.y,
    };
    switch (brushAxis) {
      case BrushAxis.Y:
        return getBrushForYAxis(chartDimensions, chartRotation, start, end);
      case BrushAxis.Both:
        return getBrushForBothAxis(chartDimensions, start, end);
      case BrushAxis.X:
      default:
        return getBrushForXAxis(chartDimensions, chartRotation, start, end);
    }
  },
)(getChartIdSelector);

/** @internal */
export function getBrushForXAxis(chartDimensions: Dimensions, chartRotation: Rotation, start: Point, end: Point) {
  const rotated = isVerticalRotation(chartRotation);
  return {
    left: rotated ? 0 : getLeftPoint(chartDimensions, start),
    top: rotated ? getTopPoint(chartDimensions, start) : 0,
    height: rotated ? getMinimalHeight(start, end) : chartDimensions.height,
    width: rotated ? chartDimensions.width : getMinimalWidth(start, end),
  };
}

/** @internal */
export function getBrushForYAxis(chartDimensions: Dimensions, chartRotation: Rotation, start: Point, end: Point) {
  const rotated = isVerticalRotation(chartRotation);
  return {
    left: rotated ? getLeftPoint(chartDimensions, start) : 0,
    top: rotated ? 0 : getTopPoint(chartDimensions, start),
    height: rotated ? chartDimensions.height : getMinimalHeight(start, end),
    width: rotated ? getMinimalWidth(start, end) : chartDimensions.width,
  };
}

/** @internal */
export function getBrushForBothAxis(chartDimensions: Dimensions, start: Point, end: Point) {
  return {
    left: getLeftPoint(chartDimensions, start),
    top: getTopPoint(chartDimensions, start),
    height: getMinimalHeight(start, end),
    width: getMinimalWidth(start, end),
  };
}

/** @internal */
export function getLeftPoint({ left }: Dimensions, { x }: Point) {
  return x - left;
}

/** @internal */
export function getTopPoint({ top }: Dimensions, { y }: Point) {
  return y - top;
}

function getMinimalHeight(start: Point, end: Point, min = MIN_AREA_SIZE) {
  const height = end.y - start.y;
  if (Math.abs(height) < min) {
    return min;
  }
  return height;
}

function getMinimalWidth(start: Point, end: Point, min = MIN_AREA_SIZE) {
  const width = end.x - start.x;
  if (Math.abs(width) < min) {
    return min;
  }
  return width;
}
