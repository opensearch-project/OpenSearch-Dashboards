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
import { getSettingsSpecSelector } from '../../../../state/selectors/get_settings_specs';
import { getAxesGeometries, AxisGeometry, defaultTickFormatter } from '../../utils/axis_utils';
import { computeAxisTicksDimensionsSelector } from './compute_axis_ticks_dimensions';
import { computeChartDimensionsSelector } from './compute_chart_dimensions';
import { computeSeriesDomainsSelector } from './compute_series_domains';
import { computeSmallMultipleScalesSelector } from './compute_small_multiple_scales';
import { countBarsInClusterSelector } from './count_bars_in_cluster';
import { getAxesStylesSelector } from './get_axis_styles';
import { getBarPaddingsSelector } from './get_bar_paddings';
import { getAxisSpecsSelector, getSeriesSpecsSelector } from './get_specs';
import { isHistogramModeEnabledSelector } from './is_histogram_mode_enabled';

/** @internal */
export const computeAxesGeometriesSelector = createCachedSelector(
  [
    computeChartDimensionsSelector,
    getChartThemeSelector,
    getSettingsSpecSelector,
    getAxisSpecsSelector,
    computeAxisTicksDimensionsSelector,
    getAxesStylesSelector,
    computeSeriesDomainsSelector,
    countBarsInClusterSelector,
    isHistogramModeEnabledSelector,
    getBarPaddingsSelector,
    getSeriesSpecsSelector,
    computeSmallMultipleScalesSelector,
  ],
  (
    chartDimensions,
    chartTheme,
    settingsSpec,
    axesSpecs,
    axesTicksDimensions,
    axesStyles,
    seriesDomainsAndData,
    totalBarsInCluster,
    isHistogramMode,
    barsPadding,
    seriesSpecs,
    smScales,
  ): AxisGeometry[] => {
    const fallBackTickFormatter = seriesSpecs.find(({ tickFormat }) => tickFormat)?.tickFormat ?? defaultTickFormatter;
    const { xDomain, yDomains } = seriesDomainsAndData;

    return getAxesGeometries(
      chartDimensions,
      chartTheme,
      settingsSpec.rotation,
      axesSpecs,
      axesTicksDimensions,
      axesStyles,
      xDomain,
      yDomains,
      smScales,
      totalBarsInCluster,
      isHistogramMode,
      fallBackTickFormatter,
      barsPadding,
    );
  },
)(getChartIdSelector);
