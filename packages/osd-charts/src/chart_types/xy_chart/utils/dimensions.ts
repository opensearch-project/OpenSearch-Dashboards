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

import { Position } from '../../../utils/commons';
import { Dimensions, getSimplePadding } from '../../../utils/dimensions';
import { AxisId } from '../../../utils/ids';
import { Theme, AxisStyle } from '../../../utils/themes/theme';
import { getSpecsById } from '../state/utils/spec';
import { AxisTicksDimensions, shouldShowTicks } from './axis_utils';
import { AxisSpec } from './specs';

/**
 * Compute the chart dimensions. It's computed removing from the parent dimensions
 * the axis spaces, the legend and any other specified style margin and padding.
 * @param parentDimensions the parent dimension
 * @param chartTheme the theme style of the chart
 * @param axisDimensions the axis dimensions
 * @param axisSpecs the axis specs
 * @internal
 */
export function computeChartDimensions(
  parentDimensions: Dimensions,
  { chartMargins, chartPaddings, axes: sharedAxesStyles }: Theme,
  axisDimensions: Map<AxisId, AxisTicksDimensions>,
  axesStyles: Map<AxisId, AxisStyle | null>,
  axisSpecs: AxisSpec[],
): {
  chartDimensions: Dimensions;
  leftMargin: number;
} {
  if (parentDimensions.width <= 0 || parentDimensions.height <= 0) {
    return {
      chartDimensions: {
        width: 0,
        height: 0,
        left: 0,
        top: 0,
      },
      leftMargin: 0,
    };
  }

  let vLeftAxisSpecWidth = 0;
  let vRightAxisSpecWidth = 0;
  let hTopAxisSpecHeight = 0;
  let hBottomAxisSpecHeight = 0;
  let horizontalEdgeLabelOverflow = 0;
  let verticalEdgeLabelOverflow = 0;
  axisDimensions.forEach(({ maxLabelBboxWidth = 0, maxLabelBboxHeight = 0 }, id) => {
    const axisSpec = getSpecsById<AxisSpec>(axisSpecs, id);
    if (!axisSpec || axisSpec.hide) {
      return;
    }
    const { tickLine, axisTitle, tickLabel } = axesStyles.get(id) ?? sharedAxesStyles;
    const showTicks = shouldShowTicks(tickLine, axisSpec.hide);
    const { position, title } = axisSpec;
    const titlePadding = getSimplePadding(axisTitle.padding);
    const labelPadding = getSimplePadding(tickLabel.padding);
    const labelPaddingSum = tickLabel.visible ? labelPadding.inner + labelPadding.outer : 0;

    const tickDimension = showTicks ? tickLine.size + tickLine.padding : 0;
    const titleHeight =
      title !== undefined && axisTitle.visible ? axisTitle.fontSize + titlePadding.outer + titlePadding.inner : 0;
    const axisDimension = labelPaddingSum + tickDimension + titleHeight;
    const maxAxisHeight = tickLabel.visible ? maxLabelBboxHeight + axisDimension : axisDimension;
    const maxAxisWidth = tickLabel.visible ? maxLabelBboxWidth + axisDimension : axisDimension;
    switch (position) {
      case Position.Top:
        hTopAxisSpecHeight += maxAxisHeight + chartMargins.top;
        // find the max half label size to accomodate the left/right labels
        horizontalEdgeLabelOverflow = Math.max(horizontalEdgeLabelOverflow, maxLabelBboxWidth / 2);
        break;
      case Position.Bottom:
        hBottomAxisSpecHeight += maxAxisHeight + chartMargins.bottom;
        // find the max half label size to accomodate the left/right labels
        horizontalEdgeLabelOverflow = Math.max(horizontalEdgeLabelOverflow, maxLabelBboxWidth / 2);
        break;
      case Position.Right:
        vRightAxisSpecWidth += maxAxisWidth + chartMargins.right;
        verticalEdgeLabelOverflow = Math.max(verticalEdgeLabelOverflow, maxLabelBboxHeight / 2);
        break;
      case Position.Left:
      default:
        vLeftAxisSpecWidth += maxAxisWidth + chartMargins.left;
        verticalEdgeLabelOverflow = Math.max(verticalEdgeLabelOverflow, maxLabelBboxHeight / 2);
    }
  });
  const chartLeftAxisMaxWidth = Math.max(vLeftAxisSpecWidth, horizontalEdgeLabelOverflow + chartMargins.left);
  const chartRightAxisMaxWidth = Math.max(vRightAxisSpecWidth, horizontalEdgeLabelOverflow + chartMargins.right);
  const chartTopAxisMaxHeight = Math.max(hTopAxisSpecHeight, verticalEdgeLabelOverflow + chartMargins.top);
  const chartBottomAxisMaxHeight = Math.max(hBottomAxisSpecHeight, verticalEdgeLabelOverflow + chartMargins.bottom);

  const chartWidth = parentDimensions.width - chartLeftAxisMaxWidth - chartRightAxisMaxWidth;
  const chartHeight = parentDimensions.height - chartTopAxisMaxHeight - chartBottomAxisMaxHeight;

  const top = chartTopAxisMaxHeight + chartPaddings.top;
  const left = chartLeftAxisMaxWidth + chartPaddings.left;

  return {
    leftMargin: chartLeftAxisMaxWidth - vLeftAxisSpecWidth,
    chartDimensions: {
      top,
      left,
      width: chartWidth - chartPaddings.left - chartPaddings.right,
      height: chartHeight - chartPaddings.top - chartPaddings.bottom,
    },
  };
}
