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

import { stringToRGB } from '../../../common/color_library_wrappers';
import { Line, Stroke } from '../../../geoms/types';
import { mergePartial, RecursivePartial } from '../../../utils/common';
import { Size } from '../../../utils/dimensions';
import { AxisId } from '../../../utils/ids';
import { Point } from '../../../utils/point';
import { AxisStyle } from '../../../utils/themes/theme';
import { MIN_STROKE_WIDTH } from '../renderer/canvas/primitives/line';
import { SmallMultipleScales } from '../state/selectors/compute_small_multiple_scales';
import { isVerticalAxis } from './axis_type_utils';
import { AxisGeometry, AxisTick } from './axis_utils';
import { getPanelSize } from './panel';
import { getPerPanelMap } from './panel_utils';
import { AxisSpec } from './specs';

/** @internal */
export interface GridLineGroup {
  lines: Array<Line>;
  stroke: Stroke;
  axisId: AxisId;
}

/** @internal */
export type LinesGrid = {
  panelAnchor: Point;
  lineGroups: Array<GridLineGroup>;
};

/** @internal */
export function getGridLines(
  axesSpecs: Array<AxisSpec>,
  axesGeoms: Array<AxisGeometry>,
  themeAxisStyle: AxisStyle,
  scales: SmallMultipleScales,
): Array<LinesGrid> {
  const panelSize = getPanelSize(scales);
  return getPerPanelMap(scales, () => {
    // get grids per panel (depends on all the axis that exist)
    const lines = axesGeoms.reduce<Array<GridLineGroup>>((linesAcc, { axis, visibleTicks }) => {
      const axisSpec = axesSpecs.find(({ id }) => id === axis.id);
      if (!axisSpec) {
        return linesAcc;
      }
      const linesForSpec = getGridLinesForSpec(axisSpec, visibleTicks, themeAxisStyle, panelSize);
      if (!linesForSpec) {
        return linesAcc;
      }
      return [...linesAcc, linesForSpec];
    }, []);
    return { lineGroups: lines };
  });
}

/**
 * Get grid lines for a specific axis
 * @internal
 * @param axisSpec
 * @param visibleTicks
 * @param themeAxisStyle
 * @param panelSize
 */
export function getGridLinesForSpec(
  axisSpec: AxisSpec,
  visibleTicks: AxisTick[],
  themeAxisStyle: AxisStyle,
  panelSize: Size,
): GridLineGroup | null {
  // vertical ==> horizontal grid lines
  const isVertical = isVerticalAxis(axisSpec.position);

  // merge the axis configured style with the theme style
  const axisStyle = mergePartial(themeAxisStyle, axisSpec.style as RecursivePartial<AxisStyle>, {
    mergeOptionalPartialValues: true,
  });
  const gridLineThemeStyle = isVertical ? axisStyle.gridLine.vertical : axisStyle.gridLine.horizontal;

  // axis can have a configured grid line style
  const gridLineStyles = axisSpec.gridLine ? mergePartial(gridLineThemeStyle, axisSpec.gridLine) : gridLineThemeStyle;

  const showGridLines = axisSpec.showGridLines ?? gridLineStyles.visible;
  if (!showGridLines) {
    return null;
  }

  // compute all the lines points for the specific grid
  const lines = visibleTicks.map<Line>((tick: AxisTick) => {
    return isVertical
      ? getGridLineForVerticalAxisAt(tick.position, panelSize)
      : getGridLineForHorizontalAxisAt(tick.position, panelSize);
  });

  // define the stroke for the specific set of grid lines
  if (!gridLineStyles.stroke || !gridLineStyles.strokeWidth || gridLineStyles.strokeWidth < MIN_STROKE_WIDTH) {
    return null;
  }
  const strokeColor = stringToRGB(gridLineStyles.stroke);
  strokeColor.opacity =
    gridLineStyles.opacity !== undefined ? strokeColor.opacity * gridLineStyles.opacity : strokeColor.opacity;
  const stroke: Stroke = {
    color: strokeColor,
    width: gridLineStyles.strokeWidth,
    dash: gridLineStyles.dash,
  };

  return {
    lines,
    stroke,
    axisId: axisSpec.id,
  };
}

/**
 * Get a horizontal grid line at `tickPosition`
 * used for vertical axis specs
 * @param tickPosition the position of the tick
 * @param panelSize the size of the target panel
 * @internal
 */
export function getGridLineForVerticalAxisAt(tickPosition: number, panelSize: Size): Line {
  return { x1: 0, y1: tickPosition, x2: panelSize.width, y2: tickPosition };
}

/**
 * Get a vertical grid line at `tickPosition`
 * used for horizontal axis specs
 * @param tickPosition the position of the tick
 * @param panelSize the size of the target panel
 * @internal
 */
export function getGridLineForHorizontalAxisAt(tickPosition: number, panelSize: Size): Line {
  return { x1: tickPosition, y1: 0, x2: tickPosition, y2: panelSize.height };
}
