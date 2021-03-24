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

import createCachedSelector from 're-reselect';

import { getChartContainerDimensionsSelector } from '../../../../state/selectors/get_chart_container_dimensions';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';
import { getChartThemeSelector } from '../../../../state/selectors/get_chart_theme';
import { getLegendSizeSelector, LegendSizing } from '../../../../state/selectors/get_legend_size';
import { getSmallMultiplesSpec } from '../../../../state/selectors/get_small_multiples_spec';
import { HorizontalAlignment, LayoutDirection, VerticalAlignment } from '../../../../utils/common';
import { computeChartDimensions, ChartDimensions } from '../../utils/dimensions';
import { computeAxisTicksDimensionsSelector } from './compute_axis_ticks_dimensions';
import { getAxesStylesSelector } from './get_axis_styles';
import { getAxisSpecsSelector } from './get_specs';

/** @internal */
export const computeChartDimensionsSelector = createCachedSelector(
  [
    getChartContainerDimensionsSelector,
    getChartThemeSelector,
    computeAxisTicksDimensionsSelector,
    getAxisSpecsSelector,
    getAxesStylesSelector,
    getLegendSizeSelector,
    getSmallMultiplesSpec,
  ],
  (
    chartContainerDimensions,
    chartTheme,
    axesTicksDimensions,
    axesSpecs,
    axesStyles,
    legendSize,
    smSpec,
  ): ChartDimensions =>
    computeChartDimensions(
      chartContainerDimensions,
      chartTheme,
      axesTicksDimensions,
      axesStyles,
      axesSpecs,
      getLegendDimension(legendSize),
      smSpec && smSpec[0],
    ),
)(getChartIdSelector);

function getLegendDimension({
  position: { direction, vAlign, hAlign },
  width,
  height,
  margin,
}: LegendSizing): {
  top: number;
  left: number;
} {
  let left = 0;
  let top = 0;

  if (direction === LayoutDirection.Vertical && hAlign === HorizontalAlignment.Left) {
    left = width + margin * 2;
  } else if (direction === LayoutDirection.Horizontal && vAlign === VerticalAlignment.Top) {
    top = height + margin * 2;
  }

  return {
    left,
    top,
  };
}
