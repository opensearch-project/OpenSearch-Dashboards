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
import { getAxisSpecsSelector, getAnnotationSpecsSelector } from './get_specs';
import { computeChartDimensionsSelector } from './compute_chart_dimensions';
import { isHistogramModeEnabledSelector } from './is_histogram_mode_enabled';
import { computeAnnotationDimensions } from '../../annotations/utils';
import { AnnotationDimensions } from '../../annotations/types';
import { computeSeriesGeometriesSelector } from './compute_series_geometries';
import { AnnotationId } from '../../../../utils/ids';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';

/** @internal */
export const computeAnnotationDimensionsSelector = createCachedSelector(
  [
    getAnnotationSpecsSelector,
    computeChartDimensionsSelector,
    getSettingsSpecSelector,
    computeSeriesGeometriesSelector,
    getAxisSpecsSelector,
    isHistogramModeEnabledSelector,
    getAxisSpecsSelector,
  ],
  (
    annotationSpecs,
    chartDimensions,
    settingsSpec,
    { scales: { yScales, xScale } },
    axesSpecs,
    isHistogramMode,
  ): Map<AnnotationId, AnnotationDimensions> => {
    return computeAnnotationDimensions(
      annotationSpecs,
      chartDimensions.chartDimensions,
      settingsSpec.rotation,
      yScales,
      xScale,
      axesSpecs,
      isHistogramMode,
    );
  },
)(getChartIdSelector);
