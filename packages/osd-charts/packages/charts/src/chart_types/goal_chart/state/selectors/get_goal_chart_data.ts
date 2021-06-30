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
import { geometries } from './geometries';

/** @internal */
export type GoalChartData = {
  maximum: number;
  minimum: number;
  target: number;
  value: number;
};

/** @internal */
export type GoalChartLabels = {
  minorLabel: string;
  majorLabel: string;
};

/** @internal */
export const getGoalChartDataSelector = createCustomCachedSelector(
  [geometries],
  (geoms): GoalChartData => {
    const goalChartData: GoalChartData = {
      maximum: geoms.bulletViewModel.highestValue,
      minimum: geoms.bulletViewModel.lowestValue,
      target: geoms.bulletViewModel.target,
      value: geoms.bulletViewModel.actual,
    };
    return goalChartData;
  },
);

/** @internal */
export const getGoalChartLabelsSelector = createCustomCachedSelector([geometries], (geoms) => {
  return { majorLabel: geoms.bulletViewModel.labelMajor, minorLabel: geoms.bulletViewModel.labelMinor };
});
