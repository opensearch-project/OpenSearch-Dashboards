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

import { CategoryKey } from '../../../../common/category';
import { GlobalChartState } from '../../../../state/chart_state';
import { configMetadata } from '../../layout/config';
import { HierarchyOfArrays } from '../../layout/utils/group_by_rollup';
import { partitionTree } from '../../layout/viewmodel/hierarchy_of_arrays';
import { PartitionSpec } from '../../specs';
import { getPartitionSpecs } from './get_partition_specs';

function getTreeForSpec(spec: PartitionSpec, drilldownSelection: CategoryKey[]) {
  const { data, valueAccessor, layers, config } = spec;
  return partitionTree(
    data,
    valueAccessor,
    layers,
    configMetadata.partitionLayout.dflt,
    config.partitionLayout,
    Boolean(config.drilldown),
    drilldownSelection,
  );
}

const getDrilldownSelection = (state: GlobalChartState) => state.interactions.drilldown || [];

/** @internal */
export const getTree = createCachedSelector(
  [getPartitionSpecs, getDrilldownSelection],
  (partitionSpecs, drilldownSelection): HierarchyOfArrays => {
    return partitionSpecs.length > 0 ? getTreeForSpec(partitionSpecs[0], drilldownSelection) : []; // singleton!
  },
)((state) => state.chartId);
