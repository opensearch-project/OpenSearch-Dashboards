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
import { isHistogramModeEnabledSelector } from './is_histogram_mode_enabled';
import { computeSeriesDomainsSelector } from './compute_series_domains';
import { CanvasTextBBoxCalculator } from '../../../../utils/bbox/canvas_text_bbox_calculator';
import { computeAxisTicksDimensions, AxisTicksDimensions, isDuplicateAxis } from '../../utils/axis_utils';
import { countBarsInClusterSelector } from './count_bars_in_cluster';
import { getChartThemeSelector } from '../../../../state/selectors/get_chart_theme';
import { AxisId } from '../../../../utils/ids';
import { getAxisSpecsSelector } from './get_specs';
import { getSettingsSpecSelector } from '../../../../state/selectors/get_settings_specs';
import { getBarPaddingsSelector } from './get_bar_paddings';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';

/** @internal */
export const computeAxisTicksDimensionsSelector = createCachedSelector(
  [
    getBarPaddingsSelector,
    isHistogramModeEnabledSelector,
    getAxisSpecsSelector,
    getChartThemeSelector,
    getSettingsSpecSelector,
    computeSeriesDomainsSelector,
    countBarsInClusterSelector,
  ],
  (
    barsPadding,
    isHistogramMode,
    axesSpecs,
    chartTheme,
    settingsSpec,
    seriesDomainsAndData,
    totalBarsInCluster,
  ): Map<AxisId, AxisTicksDimensions> => {
    const { xDomain, yDomain } = seriesDomainsAndData;

    const bboxCalculator = new CanvasTextBBoxCalculator();
    const axesTicksDimensions: Map<AxisId, AxisTicksDimensions> = new Map();
    axesSpecs.forEach((axisSpec) => {
      const { id } = axisSpec;
      const dimensions = computeAxisTicksDimensions(
        axisSpec,
        xDomain,
        yDomain,
        totalBarsInCluster,
        bboxCalculator,
        settingsSpec.rotation,
        chartTheme.axes,
        barsPadding,
        isHistogramMode,
      );
      if (
        dimensions &&
        (!settingsSpec.hideDuplicateAxes || !isDuplicateAxis(axisSpec, dimensions, axesTicksDimensions, axesSpecs))
      ) {
        axesTicksDimensions.set(id, dimensions);
      }
    });
    bboxCalculator.destroy();
    return axesTicksDimensions;
  },
)(getChartIdSelector);
