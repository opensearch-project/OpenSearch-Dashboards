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

import { Line, Stroke } from '../../../../geoms/types';
import { withContext } from '../../../../renderers/canvas';
import { mergePartial } from '../../../../utils/commons';
import { Dimensions } from '../../../../utils/dimensions';
import { AxisId } from '../../../../utils/ids';
import { AxisStyle } from '../../../../utils/themes/theme';
import { stringToRGB } from '../../../partition_chart/layout/utils/color_library_wrappers';
import { getSpecsById } from '../../state/utils/spec';
import { isVerticalGrid } from '../../utils/axis_type_utils';
import { AxisLinePosition } from '../../utils/axis_utils';
import { AxisSpec } from '../../utils/specs';
import { renderMultiLine, MIN_STROKE_WIDTH } from './primitives/line';

interface GridProps {
  sharedAxesStyle: AxisStyle;
  axesGridLinesPositions: Map<AxisId, AxisLinePosition[]>;
  axesSpecs: AxisSpec[];
  chartDimensions: Dimensions;
  axesStyles: Map<string, AxisStyle | null>;
}

/** @internal */
export function renderGrids(ctx: CanvasRenderingContext2D, props: GridProps) {
  const { axesGridLinesPositions, axesSpecs, chartDimensions, sharedAxesStyle, axesStyles } = props;
  withContext(ctx, (ctx) => {
    ctx.translate(chartDimensions.left, chartDimensions.top);
    axesGridLinesPositions.forEach((axisGridLinesPositions, axisId) => {
      const axisSpec = getSpecsById<AxisSpec>(axesSpecs, axisId);
      if (axisSpec && axisGridLinesPositions.length > 0) {
        const axisStyle = axesStyles.get(axisSpec.id) ?? sharedAxesStyle;
        const themeConfig = isVerticalGrid(axisSpec.position)
          ? axisStyle.gridLine.vertical
          : axisStyle.gridLine.horizontal;

        const axisSpecConfig = axisSpec.gridLine;
        const gridLine = axisSpecConfig ? mergePartial(themeConfig, axisSpecConfig) : themeConfig;
        if (!gridLine.stroke || !gridLine.strokeWidth || gridLine.strokeWidth < MIN_STROKE_WIDTH) {
          return;
        }
        const strokeColor = stringToRGB(gridLine.stroke);
        strokeColor.opacity =
          gridLine.opacity !== undefined ? strokeColor.opacity * gridLine.opacity : strokeColor.opacity;
        const stroke: Stroke = {
          color: strokeColor,
          width: gridLine.strokeWidth,
          dash: gridLine.dash,
        };
        const lines = axisGridLinesPositions.map<Line>(([x1, y1, x2, y2]) => ({ x1, y1, x2, y2 }));
        renderMultiLine(ctx, lines, stroke);
      }
    });
  });
}
