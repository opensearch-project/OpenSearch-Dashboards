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

import { ChartType } from '../../..';
import { GroupBySpec, SmallMultiplesSpec } from '../../../../specs';
import { SpecType } from '../../../../specs/constants';
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
  getSpecsFromStore<AxisSpec>(specs, ChartType.XYAxis, SpecType.Axis),
)(getChartIdSelector);

/** @internal */
export const getSeriesSpecsSelector = createCachedSelector([getSpecs], (specs) => {
  return getSpecsFromStore<BasicSeriesSpec>(specs, ChartType.XYAxis, SpecType.Series);
})(getChartIdSelector);

/** @internal */
export const getAnnotationSpecsSelector = createCachedSelector([getSpecs], (specs) =>
  getSpecsFromStore<AnnotationSpec>(specs, ChartType.XYAxis, SpecType.Annotation),
)(getChartIdSelector);

/** @internal */
export const getSmallMultiplesIndexOrderSelector = createCachedSelector([getSpecs], (specs):
  | SmallMultiplesGroupBy
  | undefined => {
  const [smallMultiples] = getSpecsFromStore<SmallMultiplesSpec>(specs, ChartType.Global, SpecType.SmallMultiples);
  const groupBySpecs = getSpecsFromStore<GroupBySpec>(specs, ChartType.Global, SpecType.IndexOrder);
  return {
    horizontal: groupBySpecs.find((s) => s.id === smallMultiples?.splitHorizontally),
    vertical: groupBySpecs.find((s) => s.id === smallMultiples?.splitVertically),
  };
})(getChartIdSelector);
