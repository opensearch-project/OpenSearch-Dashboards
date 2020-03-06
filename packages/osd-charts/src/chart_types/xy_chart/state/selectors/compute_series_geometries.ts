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
import { getChartThemeSelector } from '../../../../state/selectors/get_chart_theme';
import { getSeriesSpecsSelector, getAxisSpecsSelector } from './get_specs';
import { getSettingsSpecSelector } from '../../../../state/selectors/get_settings_specs';
import { computeSeriesGeometries, ComputedGeometries } from '../utils';
import { getSeriesColorsSelector } from './get_series_color_map';
import { computeChartDimensionsSelector } from './compute_chart_dimensions';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';

export const computeSeriesGeometriesSelector = createCachedSelector(
  [
    getSettingsSpecSelector,
    getSeriesSpecsSelector,
    computeSeriesDomainsSelector,
    getSeriesColorsSelector,
    getChartThemeSelector,
    computeChartDimensionsSelector,
    getAxisSpecsSelector,
    isHistogramModeEnabledSelector,
  ],
  (
    settingsSpec,
    seriesSpecs,
    seriesDomainsAndData,
    seriesColors,
    chartTheme,
    chartDimensions,
    axesSpecs,
    isHistogramMode,
  ): ComputedGeometries => {
    const { xDomain, yDomain, formattedDataSeries } = seriesDomainsAndData;
    return computeSeriesGeometries(
      seriesSpecs,
      xDomain,
      yDomain,
      formattedDataSeries,
      seriesColors,
      chartTheme,
      chartDimensions.chartDimensions,
      settingsSpec.rotation,
      axesSpecs,
      isHistogramMode,
    );
  },
)(getChartIdSelector);
