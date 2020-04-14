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
import { ChartTypes } from '../../..';
import { PartitionSpec } from '../../specs/index';
import { SpecTypes } from '../../../../specs/settings';
import { getHierarchyOfArrays } from '../../layout/viewmodel/hierarchy_of_arrays';
import { HierarchyOfArrays } from '../../layout/utils/group_by_rollup';

const getSpecs = (state: GlobalChartState) => state.specs;

/** @internal */
export const getTree = createCachedSelector(
  [getSpecs],
  (specs): HierarchyOfArrays => {
    const pieSpecs = getSpecsFromStore<PartitionSpec>(specs, ChartTypes.Partition, SpecTypes.Series);
    if (pieSpecs.length !== 1) {
      return [];
    }
    const { data, valueAccessor, layers } = pieSpecs[0];
    return getHierarchyOfArrays(data, valueAccessor, [() => null, ...layers.map(({ groupByRollup }) => groupByRollup)]);
  },
)((state) => state.chartId);
