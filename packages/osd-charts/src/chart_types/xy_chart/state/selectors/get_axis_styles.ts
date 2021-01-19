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

import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';
import { getChartThemeSelector } from '../../../../state/selectors/get_chart_theme';
import { mergePartial, RecursivePartial } from '../../../../utils/common';
import { AxisId } from '../../../../utils/ids';
import { AxisStyle } from '../../../../utils/themes/theme';
import { isVerticalAxis } from '../../utils/axis_type_utils';
import { getAxisSpecsSelector } from './get_specs';

/**
 * Get merged axis styles. **Only** include axes with styles overrides.
 *
 * @internal
 */
export const getAxesStylesSelector = createCachedSelector(
  [getAxisSpecsSelector, getChartThemeSelector],
  (axesSpecs, { axes: sharedAxesStyle }): Map<AxisId, AxisStyle | null> => {
    const axesStyles = new Map<AxisId, AxisStyle | null>();
    axesSpecs.forEach(({ id, style, gridLine, position }) => {
      const isVertical = isVerticalAxis(position);
      const axisStyleMerge: RecursivePartial<AxisStyle> = {
        ...style,
      };
      if (gridLine) {
        axisStyleMerge.gridLine = { [isVertical ? 'vertical' : 'horizontal']: gridLine };
      }
      const newStyle = style
        ? mergePartial(sharedAxesStyle, axisStyleMerge, {
            mergeOptionalPartialValues: true,
          })
        : null;
      axesStyles.set(id, newStyle);
    });
    return axesStyles;
  },
)(getChartIdSelector);
