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

import { ChartTypes } from '../../..';
import { GroupBySpec, SmallMultiplesSpec } from '../../../../specs';
import { SpecTypes } from '../../../../specs/constants';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';
import { getSpecs } from '../../../../state/selectors/get_settings_specs';
import { getSpecsFromStore } from '../../../../state/utils';
import { AnnotationSpec, AxisSpec, BasicSeriesSpec } from '../../utils/specs';

/** @internal */
export interface SmallMultiplesGroupBy {
  vertical?: GroupBySpec;
  horizontal?: GroupBySpec;
}

/** @internal */
export const getAxisSpecsSelector = createCachedSelector([getSpecs], (specs): AxisSpec[] =>
  getSpecsFromStore<AxisSpec>(specs, ChartTypes.XYAxis, SpecTypes.Axis),
)(getChartIdSelector);

/** @internal */
export const getSeriesSpecsSelector = createCachedSelector([getSpecs], (specs) => {
  return getSpecsFromStore<BasicSeriesSpec>(specs, ChartTypes.XYAxis, SpecTypes.Series);
})(getChartIdSelector);

/** @internal */
export const getAnnotationSpecsSelector = createCachedSelector([getSpecs], (specs) =>
  getSpecsFromStore<AnnotationSpec>(specs, ChartTypes.XYAxis, SpecTypes.Annotation),
)(getChartIdSelector);

/** @internal */
export const getSmallMultiplesIndexOrderSelector = createCachedSelector([getSpecs], (specs):
  | SmallMultiplesGroupBy
  | undefined => {
  const [smallMultiples] = getSpecsFromStore<SmallMultiplesSpec>(specs, ChartTypes.Global, SpecTypes.SmallMultiples);
  const groupBySpecs = getSpecsFromStore<GroupBySpec>(specs, ChartTypes.Global, SpecTypes.IndexOrder);
  return {
    horizontal: groupBySpecs.find((s) => s.id === smallMultiples?.splitHorizontally),
    vertical: groupBySpecs.find((s) => s.id === smallMultiples?.splitVertically),
  };
})(getChartIdSelector);
