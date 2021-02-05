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
import { GlobalChartState } from '../../../../state/chart_state';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';
import { getSpecsFromStore } from '../../../../state/utils';
import { AxisSpec, BasicSeriesSpec, AnnotationSpec } from '../../utils/specs';

const getSpecs = (state: GlobalChartState) => state.specs;

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
  const smallMultiples = getSpecsFromStore<SmallMultiplesSpec>(specs, ChartTypes.Global, SpecTypes.SmallMultiples);
  if (smallMultiples.length !== 1) {
    return undefined;
  }
  const indexOrders = getSpecsFromStore<GroupBySpec>(specs, ChartTypes.Global, SpecTypes.IndexOrder);
  const [smallMultiplesConfig] = smallMultiples;

  let vertical: GroupBySpec | undefined;
  let horizontal: GroupBySpec | undefined;

  if (smallMultiplesConfig.splitVertically) {
    vertical = indexOrders.find((d) => d.id === smallMultiplesConfig.splitVertically);
  }
  if (smallMultiplesConfig.splitHorizontally) {
    horizontal = indexOrders.find((d) => d.id === smallMultiplesConfig.splitHorizontally);
  }

  return {
    vertical,
    horizontal,
  };
})(getChartIdSelector);
