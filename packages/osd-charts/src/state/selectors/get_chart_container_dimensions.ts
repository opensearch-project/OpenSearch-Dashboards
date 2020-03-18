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
import { getSettingsSpecSelector } from './get_settings_specs';
import { getLegendSizeSelector } from './get_legend_size';
import { GlobalChartState } from '../chart_state';
import { Dimensions } from '../../utils/dimensions';
import { isVerticalAxis } from '../../chart_types/xy_chart/utils/axis_utils';
import { getChartIdSelector } from './get_chart_id';

const getParentDimension = (state: GlobalChartState) => state.parentDimensions;

/** @internal */
export const getChartContainerDimensionsSelector = createCachedSelector(
  [getSettingsSpecSelector, getLegendSizeSelector, getParentDimension],
  (settings, legendSize, parentDimensions): Dimensions => {
    if (!settings.showLegend) {
      return parentDimensions;
    }
    if (isVerticalAxis(settings.legendPosition)) {
      return {
        left: 0,
        top: 0,
        width: parentDimensions.width - legendSize.width,
        height: parentDimensions.height,
      };
    } else {
      return {
        left: 0,
        top: 0,
        width: parentDimensions.width,
        height: parentDimensions.height - legendSize.height,
      };
    }
  },
)(getChartIdSelector);
