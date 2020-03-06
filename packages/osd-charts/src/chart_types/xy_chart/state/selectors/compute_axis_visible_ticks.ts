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
import { getSettingsSpecSelector } from '../../../../state/selectors/get_settings_specs';
import { getAxisSpecsSelector } from './get_specs';
import { getAxisTicksPositions, AxisTick, AxisLinePosition } from '../../utils/axis_utils';
import { computeChartDimensionsSelector } from './compute_chart_dimensions';
import { getChartThemeSelector } from '../../../../state/selectors/get_chart_theme';
import { computeAxisTicksDimensionsSelector } from './compute_axis_ticks_dimensions';
import { computeSeriesDomainsSelector } from './compute_series_domains';
import { countBarsInClusterSelector } from './count_bars_in_cluster';
import { isHistogramModeEnabledSelector } from './is_histogram_mode_enabled';
import { getBarPaddingsSelector } from './get_bar_paddings';
import { AxisId } from '../../../../utils/ids';
import { Dimensions } from '../../../../utils/dimensions';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';

export interface AxisVisibleTicks {
  axisPositions: Map<AxisId, Dimensions>;
  axisTicks: Map<AxisId, AxisTick[]>;
  axisVisibleTicks: Map<AxisId, AxisTick[]>;
  axisGridLinesPositions: Map<AxisId, AxisLinePosition[]>;
}
export const computeAxisVisibleTicksSelector = createCachedSelector(
  [
    computeChartDimensionsSelector,
    getChartThemeSelector,
    getSettingsSpecSelector,
    getAxisSpecsSelector,
    computeAxisTicksDimensionsSelector,
    computeSeriesDomainsSelector,
    countBarsInClusterSelector,
    isHistogramModeEnabledSelector,
    getBarPaddingsSelector,
  ],
  (
    chartDimensions,
    chartTheme,
    settingsSpec,
    axesSpecs,
    axesTicksDimensions,
    seriesDomainsAndData,
    totalBarsInCluster,
    isHistogramMode,
    barsPadding,
  ): AxisVisibleTicks => {
    const { xDomain, yDomain } = seriesDomainsAndData;
    return getAxisTicksPositions(
      chartDimensions,
      chartTheme,
      settingsSpec.rotation,
      axesSpecs,
      axesTicksDimensions,
      xDomain,
      yDomain,
      totalBarsInCluster,
      isHistogramMode,
      barsPadding,
    );
  },
)(getChartIdSelector);
