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

import { GlobalChartState } from '../../../../state/chart_state';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';
import { getLegendConfigSelector } from '../../../../state/selectors/get_legend_config_selector';
import { getLegendSizeSelector } from '../../../../state/selectors/get_legend_size';
import { LayoutDirection } from '../../../../utils/common';
import { Dimensions } from '../../../../utils/dimensions';
import { getHeatmapConfigSelector } from './get_heatmap_config';

const getParentDimension = (state: GlobalChartState) => state.parentDimensions;

/**
 * Gets charts grid area excluding legend and X,Y axis labels and paddings.
 * @internal
 */
export const getHeatmapContainerSizeSelector = createCachedSelector(
  [getParentDimension, getLegendSizeSelector, getHeatmapConfigSelector, getLegendConfigSelector],
  (parentDimensions, legendSize, { maxLegendHeight }, { showLegend, legendPosition }): Dimensions => {
    if (!showLegend || legendPosition.floating) {
      return parentDimensions;
    }
    if (legendPosition.direction === LayoutDirection.Vertical) {
      return {
        left: 0,
        top: 0,
        width: parentDimensions.width - legendSize.width - legendSize.margin * 2,
        height: parentDimensions.height,
      };
    }

    const legendHeight = maxLegendHeight ?? legendSize.height + legendSize.margin * 2;

    return {
      left: 0,
      top: 0,
      width: parentDimensions.width,
      height: parentDimensions.height - legendHeight,
    };
  },
)(getChartIdSelector);
