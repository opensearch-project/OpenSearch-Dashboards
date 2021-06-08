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

import { SmallMultiplesSpec } from '../../../specs';
import { Position } from '../../../utils/common';
import { getSimplePadding } from '../../../utils/dimensions';
import { AxisId } from '../../../utils/ids';
import { AxisStyle, Theme } from '../../../utils/themes/theme';
import { getSpecsById } from '../state/utils/spec';
import { isVerticalAxis } from '../utils/axis_type_utils';
import { AxisTicksDimensions, getTitleDimension, shouldShowTicks } from '../utils/axis_utils';
import { AxisSpec } from '../utils/specs';

/**
 * Compute the axes required size around the chart
 * @param chartTheme the theme style of the chart
 * @param axisDimensions the axis dimensions
 * @param axesStyles a map with all the custom axis styles
 * @param axisSpecs the axis specs
 * @internal
 */
export function computeAxesSizes(
  { axes: sharedAxesStyles, chartMargins }: Theme,
  axisDimensions: Map<AxisId, AxisTicksDimensions>,
  axesStyles: Map<AxisId, AxisStyle | null>,
  axisSpecs: AxisSpec[],
  smSpec?: SmallMultiplesSpec,
): { left: number; right: number; top: number; bottom: number; margin: { left: number } } {
  const axisMainSize = {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  };
  const axisLabelOverflow = {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  };

  axisDimensions.forEach(({ maxLabelBboxWidth = 0, maxLabelBboxHeight = 0, isHidden }, id) => {
    const axisSpec = getSpecsById<AxisSpec>(axisSpecs, id);
    if (!axisSpec || isHidden) {
      return;
    }
    const { tickLine, axisTitle, axisPanelTitle, tickLabel } = axesStyles.get(id) ?? sharedAxesStyles;
    const showTicks = shouldShowTicks(tickLine, axisSpec.hide);
    const { position, title } = axisSpec;
    const labelPadding = getSimplePadding(tickLabel.padding);
    const labelPaddingSum = tickLabel.visible ? labelPadding.inner + labelPadding.outer : 0;

    const tickDimension = showTicks ? tickLine.size + tickLine.padding : 0;
    const titleDimension = title ? getTitleDimension(axisTitle) : 0;
    const hasPanelTitle = Boolean(isVerticalAxis(position) ? smSpec?.splitVertically : smSpec?.splitHorizontally);
    const panelTitleDimension = hasPanelTitle ? getTitleDimension(axisPanelTitle) : 0;
    const axisDimension = labelPaddingSum + tickDimension + titleDimension + panelTitleDimension;
    const maxAxisHeight = tickLabel.visible ? maxLabelBboxHeight + axisDimension : axisDimension;
    const maxAxisWidth = tickLabel.visible ? maxLabelBboxWidth + axisDimension : axisDimension;

    switch (position) {
      case Position.Top:
        axisMainSize.top += maxAxisHeight + chartMargins.top;
        // find the max half label size to accommodate the left/right labels
        // TODO use first and last labels
        axisLabelOverflow.left = Math.max(axisLabelOverflow.left, maxLabelBboxWidth / 2);
        axisLabelOverflow.right = Math.max(axisLabelOverflow.right, maxLabelBboxWidth / 2);
        break;
      case Position.Bottom:
        axisMainSize.bottom += maxAxisHeight + chartMargins.bottom;
        // find the max half label size to accommodate the left/right labels
        // TODO use first and last labels
        axisLabelOverflow.left = Math.max(axisLabelOverflow.left, maxLabelBboxWidth / 2);
        axisLabelOverflow.right = Math.max(axisLabelOverflow.right, maxLabelBboxWidth / 2);
        break;
      case Position.Right:
        axisMainSize.right += maxAxisWidth + chartMargins.right;
        // TODO use first and last labels
        axisLabelOverflow.top = Math.max(axisLabelOverflow.top, maxLabelBboxHeight / 2);
        axisLabelOverflow.bottom = Math.max(axisLabelOverflow.bottom, maxLabelBboxHeight / 2);
        break;
      case Position.Left:
      default:
        axisMainSize.left += maxAxisWidth + chartMargins.left;
        // TODO use first and last labels
        axisLabelOverflow.top = Math.max(axisLabelOverflow.top, maxLabelBboxHeight / 2);
        axisLabelOverflow.bottom = Math.max(axisLabelOverflow.bottom, maxLabelBboxHeight / 2);
    }
  });
  const left = Math.max(axisLabelOverflow.left + chartMargins.left, axisMainSize.left);
  return {
    margin: {
      left: left - axisMainSize.left,
    },
    left,
    right: Math.max(axisLabelOverflow.right + chartMargins.right, axisMainSize.right),
    top: Math.max(axisLabelOverflow.top + chartMargins.top, axisMainSize.top),
    bottom: Math.max(axisLabelOverflow.bottom + chartMargins.bottom, axisMainSize.bottom),
  };
}
