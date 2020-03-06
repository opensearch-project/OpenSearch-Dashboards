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
import { GlobalChartState } from '../../../../state/chart_state';
import { getSpecsFromStore } from '../../../../state/utils';
import { AxisSpec, BasicSeriesSpec, AnnotationSpec } from '../../utils/specs';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';
import { ChartTypes } from '../../..';
import { SpecTypes } from '../../../../specs/settings';

const getSpecs = (state: GlobalChartState) => state.specs;

export const getAxisSpecsSelector = createCachedSelector([getSpecs], (specs): AxisSpec[] => {
  return getSpecsFromStore<AxisSpec>(specs, ChartTypes.XYAxis, SpecTypes.Axis);
})(getChartIdSelector);

export const getSeriesSpecsSelector = createCachedSelector([getSpecs], (specs) => {
  const seriesSpec = getSpecsFromStore<BasicSeriesSpec>(specs, ChartTypes.XYAxis, SpecTypes.Series);
  return seriesSpec;
})(getChartIdSelector);

export const getAnnotationSpecsSelector = createCachedSelector([getSpecs], (specs) => {
  return getSpecsFromStore<AnnotationSpec>(specs, ChartTypes.XYAxis, SpecTypes.Annotation);
})(getChartIdSelector);
