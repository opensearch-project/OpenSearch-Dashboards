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
import { Dimensions } from '../../../utils/dimensions';
import { AxisId } from '../../../utils/ids';
import { Theme, AxisStyle } from '../../../utils/themes/theme';
import { computeAxesSizes } from '../axes/axes_sizes';
import { AxisTicksDimensions } from './axis_utils';
import { AxisSpec } from './specs';

/**
 * @internal
 */
export interface ChartDimensions {
  /**
   * Dimensions relative to canvas element
   */
  chartDimensions: Dimensions;
  /**
   * Dimensions relative to echChart element
   */
  offset: {
    top: number;
    left: number;
  };
  /**
   * Margin to account for ending text overflow
   */
  leftMargin: number;
}

/**
 * Compute the chart dimensions. It's computed removing from the parent dimensions
 * the axis spaces, the legend and any other specified style margin and padding.
 * @internal
 */
export function computeChartDimensions(
  parentDimensions: Dimensions,
  theme: Theme,
  axisDimensions: Map<AxisId, AxisTicksDimensions>,
  axesStyles: Map<AxisId, AxisStyle | null>,
  axisSpecs: AxisSpec[],
  legendSizing: {
    top: number;
    left: number;
  },
  smSpec?: SmallMultiplesSpec,
): ChartDimensions {
  if (parentDimensions.width <= 0 || parentDimensions.height <= 0) {
    return {
      chartDimensions: {
        width: 0,
        height: 0,
        left: 0,
        top: 0,
      },
      leftMargin: 0,
      offset: {
        left: 0,
        top: 0,
      },
    };
  }

  const axisSizes = computeAxesSizes(theme, axisDimensions, axesStyles, axisSpecs, smSpec);
  const chartWidth = parentDimensions.width - axisSizes.left - axisSizes.right;
  const chartHeight = parentDimensions.height - axisSizes.top - axisSizes.bottom;
  const { chartPaddings } = theme;
  const top = axisSizes.top + chartPaddings.top;
  const left = axisSizes.left + chartPaddings.left;

  return {
    leftMargin: axisSizes.margin.left,
    chartDimensions: {
      top,
      left,
      width: chartWidth - chartPaddings.left - chartPaddings.right,
      height: chartHeight - chartPaddings.top - chartPaddings.bottom,
    },
    offset: {
      top: legendSizing.top,
      left: legendSizing.left,
    },
  };
}
