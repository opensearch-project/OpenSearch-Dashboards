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
import { ComputedGeometries } from '../utils/types';
import { computeSeriesGeometries } from '../utils/utils';
import { computeSeriesDomainsSelector } from './compute_series_domains';
import { computeSmallMultipleScalesSelector } from './compute_small_multiple_scales';
import { getSeriesColorsSelector } from './get_series_color_map';
import { getSeriesSpecsSelector, getAxisSpecsSelector } from './get_specs';
import { isHistogramModeEnabledSelector } from './is_histogram_mode_enabled';

/** @internal */
export const computeSeriesGeometriesSelector = createCachedSelector(
  [
    getSettingsSpecSelector,
    getSeriesSpecsSelector,
    computeSeriesDomainsSelector,
    getSeriesColorsSelector,
    getChartThemeSelector,
    getAxisSpecsSelector,
    computeSmallMultipleScalesSelector,
    isHistogramModeEnabledSelector,
  ],
  (
    settingsSpec,
    seriesSpecs,
    seriesDomainsAndData,
    seriesColors,
    chartTheme,
    axesSpecs,
    smallMultiplesScales,
    isHistogramMode,
  ): ComputedGeometries => {
    return computeSeriesGeometries(
      seriesSpecs,
      seriesDomainsAndData,
      seriesColors,
      chartTheme,
      settingsSpec.rotation,
      axesSpecs,
      smallMultiplesScales,
      isHistogramMode,
    );
  },
)(getChartIdSelector);
