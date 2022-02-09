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

import { createCustomCachedSelector } from '../../../../state/create_selector';
import { getChartThemeSelector } from '../../../../state/selectors/get_chart_theme';
import { getSettingsSpecSelector } from '../../../../state/selectors/get_settings_specs';
import { AnnotationId, AxisId } from '../../../../utils/ids';
import { AnnotationDimensions } from '../../annotations/types';
import { computeAnnotationDimensions } from '../../annotations/utils';
import { computeSeriesGeometriesSelector } from './compute_series_geometries';
import { computeSmallMultipleScalesSelector } from './compute_small_multiple_scales';
import { getAxesStylesSelector } from './get_axis_styles';
import { getAxisSpecsSelector, getAnnotationSpecsSelector } from './get_specs';
import { isHistogramModeEnabledSelector } from './is_histogram_mode_enabled';

/** @internal */
export const computeAnnotationDimensionsSelector = createCustomCachedSelector(
  [
    getAnnotationSpecsSelector,
    getSettingsSpecSelector,
    computeSeriesGeometriesSelector,
    getAxisSpecsSelector,
    isHistogramModeEnabledSelector,
    computeSmallMultipleScalesSelector,
    getAxesStylesSelector,
    getChartThemeSelector,
  ],
  (
    annotationSpecs,
    settingsSpec,
    { scales: { yScales, xScale } },
    axesSpecs,
    isHistogramMode,
    smallMultipleScales,
    axisStyles,
    { axes },
  ): Map<AnnotationId, AnnotationDimensions> => {
    const getAxisStyle = (id: AxisId = '') => axisStyles.get(id) ?? axes;
    return computeAnnotationDimensions(
      annotationSpecs,
      settingsSpec.rotation,
      yScales,
      xScale,
      axesSpecs,
      isHistogramMode,
      smallMultipleScales,
      getAxisStyle,
    );
  },
);
