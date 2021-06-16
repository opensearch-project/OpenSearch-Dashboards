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
import { ShapeViewModel } from '../../layout/types/viewmodel_types';
import { STATISTICS_KEY } from '../../layout/utils/group_by_rollup';
import { PartitionSpec } from '../../specs';
import { partitionMultiGeometries } from './geometries';
import { getPartitionSpecs } from './get_partition_specs';

/** @internal */
export interface PartitionSectionData {
  panelTitle?: string;
  label: string;
  parentName: string | undefined;
  depth: number;
  percentage: string;
  value: number;
  valueText: string;
}

/** @internal */
export interface PartitionData {
  hasMultipleLayers: boolean;
  isSmallMultiple: boolean;
  data: PartitionSectionData[];
}

/**
 * @internal
 */
const getScreenReaderDataForPartitions = (
  [{ valueFormatter }]: PartitionSpec[],
  shapeViewModels: ShapeViewModel[],
): PartitionSectionData[] => {
  return shapeViewModels.flatMap(({ quadViewModel, layers, panelTitle }) =>
    quadViewModel.map(({ depth, value, dataName, parent, path }) => {
      const label = layers[depth - 1]?.nodeLabel?.(dataName) ?? dataName;
      const parentValue = path.length > 1 ? path[path.length - 2].value : undefined;
      const parentName =
        depth > 1 && parentValue ? layers[depth - 2]?.nodeLabel?.(parentValue) ?? path[path.length - 1].value : 'none';

      return {
        panelTitle,
        depth,
        label,
        parentName,
        percentage: `${Math.round((value / parent[STATISTICS_KEY].globalAggregate) * 100)}%`,
        value,
        valueText: valueFormatter ? valueFormatter(value) : `${value}`,
      };
    }),
  );
};

/** @internal */
export const getScreenReaderDataSelector = createCustomCachedSelector(
  [getPartitionSpecs, partitionMultiGeometries],
  (specs, shapeViewModel): PartitionData => {
    if (specs.length === 0) {
      return {
        hasMultipleLayers: false,
        isSmallMultiple: false,
        data: [],
      };
    }
    return {
      hasMultipleLayers: specs[0].layers.length > 1,
      isSmallMultiple: shapeViewModel.length > 1,
      data: getScreenReaderDataForPartitions(specs, shapeViewModel),
    };
  },
);
