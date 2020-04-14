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

import { Dimensions } from '../../../../utils/dimensions';
import { shapeViewModel } from '../../layout/viewmodel/viewmodel';
import { measureText } from '../../layout/utils/measure';
import {
  ShapeTreeNode,
  ShapeViewModel,
  RawTextGetter,
  nullShapeViewModel,
  ValueGetter,
} from '../../layout/types/viewmodel_types';
import { DEPTH_KEY, HierarchyOfArrays } from '../../layout/utils/group_by_rollup';
import { PartitionSpec, Layer } from '../../specs/index';
import { identity, mergePartial, RecursivePartial } from '../../../../utils/commons';
import { config as defaultConfig, VALUE_GETTERS } from '../../layout/config/config';
import { Config } from '../../layout/types/config_types';

function rawTextGetter(layers: Layer[]): RawTextGetter {
  return (node: ShapeTreeNode) => {
    const accessorFn = layers[node[DEPTH_KEY] - 1].nodeLabel || identity;
    return `${accessorFn(node.dataName)}`;
  };
}

/** @internal */
export function valueGetterFunction(valueGetter: ValueGetter) {
  return typeof valueGetter === 'function' ? valueGetter : VALUE_GETTERS[valueGetter];
}

/** @internal */
export function render(
  partitionSpec: PartitionSpec,
  parentDimensions: Dimensions,
  tree: HierarchyOfArrays,
): ShapeViewModel {
  const { width, height } = parentDimensions;
  const { layers, config: specConfig } = partitionSpec;
  const textMeasurer = document.createElement('canvas');
  const textMeasurerCtx = textMeasurer.getContext('2d');
  const partialConfig: RecursivePartial<Config> = { ...specConfig, width, height };
  const config: Config = mergePartial(defaultConfig, partialConfig);
  if (!textMeasurerCtx) {
    return nullShapeViewModel(config, { x: width / 2, y: height / 2 });
  }
  const valueGetter = valueGetterFunction(partitionSpec.valueGetter);
  return shapeViewModel(
    measureText(textMeasurerCtx),
    config,
    layers,
    rawTextGetter(layers),
    partitionSpec.valueFormatter,
    partitionSpec.percentFormatter,
    valueGetter,
    tree,
  );
}
