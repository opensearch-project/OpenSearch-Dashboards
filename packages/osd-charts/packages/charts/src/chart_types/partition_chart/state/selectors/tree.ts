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
import { getPredicateFn } from '../../../../common/predicate';
import {
  DEFAULT_SM_PANEL_PADDING,
  GroupByAccessor,
  GroupBySpec,
  SmallMultiplesSpec,
  SmallMultiplesStyle,
  SpecType,
} from '../../../../specs';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';
import { getSpecs } from '../../../../state/selectors/get_settings_specs';
import { getSmallMultiplesSpecs } from '../../../../state/selectors/get_small_multiples_spec';
import { getSpecsFromStore } from '../../../../state/utils';
import { Datum } from '../../../../utils/common';
import { configMetadata } from '../../layout/config';
import { HierarchyOfArrays, NULL_SMALL_MULTIPLES_KEY } from '../../layout/utils/group_by_rollup';
import { partitionTree } from '../../layout/viewmodel/hierarchy_of_arrays';
import { PartitionSpec } from '../../specs';
import { getPartitionSpecs } from './get_partition_specs';

const getGroupBySpecs = createCachedSelector([getSpecs], (specs) =>
  getSpecsFromStore<GroupBySpec>(specs, ChartType.Global, SpecType.IndexOrder),
)(getChartIdSelector);

/** @internal */
export type StyledTree = {
  smAccessorValue: ReturnType<GroupByAccessor>;
  name: string;
  style: SmallMultiplesStyle;
  tree: HierarchyOfArrays;
};

function getTreesForSpec(
  spec: PartitionSpec,
  smSpecs: SmallMultiplesSpec[],
  groupBySpecs: GroupBySpec[],
): StyledTree[] {
  const { data, valueAccessor, layers, config, smallMultiples: smId } = spec;
  const smSpec = smSpecs.find((s) => s.id === smId);
  const smStyle: SmallMultiplesStyle = {
    horizontalPanelPadding: smSpec
      ? smSpec.style?.horizontalPanelPadding ?? DEFAULT_SM_PANEL_PADDING
      : { outer: 0, inner: 0 },
    verticalPanelPadding: smSpec
      ? smSpec.style?.verticalPanelPadding ?? DEFAULT_SM_PANEL_PADDING
      : { outer: 0, inner: 0 },
  };
  const groupBySpec = groupBySpecs.find(
    (s) => s.id === smSpec?.splitHorizontally || s.id === smSpec?.splitVertically || s.id === smSpec?.splitZigzag,
  );

  if (groupBySpec) {
    const { by, sort, format = (name) => String(name) } = groupBySpec;
    const accessorSpec = { id: spec.id, chartType: spec.chartType, specType: SpecType.Series };
    const groups = data.reduce((map: Map<ReturnType<GroupByAccessor>, Datum[]>, next) => {
      const groupingValue = by(accessorSpec, next);
      const preexistingGroup = map.get(groupingValue);
      const group = preexistingGroup ?? [];
      if (!preexistingGroup) map.set(groupingValue, group);
      group.push(next);
      return map;
    }, new Map<string, HierarchyOfArrays>());
    return Array.from(groups)
      .sort(getPredicateFn(sort))
      .map(([groupKey, subData], innerIndex) => ({
        name: format(groupKey),
        smAccessorValue: groupKey,
        style: smStyle,
        tree: partitionTree(
          subData,
          valueAccessor,
          layers,
          configMetadata.partitionLayout.dflt,
          config.partitionLayout,
          [{ index: innerIndex, value: String(groupKey) }],
        ),
      }));
  } else {
    return [
      {
        name: '',
        smAccessorValue: '',
        style: smStyle,
        tree: partitionTree(data, valueAccessor, layers, configMetadata.partitionLayout.dflt, config.partitionLayout, [
          {
            index: 0,
            value: NULL_SMALL_MULTIPLES_KEY,
          },
        ]),
      },
    ];
  }
}

/** @internal */
export const getTrees = createCachedSelector(
  [getPartitionSpecs, getSmallMultiplesSpecs, getGroupBySpecs],
  (partitionSpecs, smallMultiplesSpecs, groupBySpecs): StyledTree[] =>
    partitionSpecs.length > 0 ? getTreesForSpec(partitionSpecs[0], smallMultiplesSpecs, groupBySpecs) : [], // singleton!
)(getChartIdSelector);
