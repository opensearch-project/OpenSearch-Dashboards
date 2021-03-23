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

import { measureText } from '../../../../common/text_utils';
import { SmallMultiplesStyle } from '../../../../specs';
import { Color, identity, mergePartial, RecursivePartial } from '../../../../utils/common';
import { Dimensions } from '../../../../utils/dimensions';
import { Layer, PartitionSpec } from '../../specs';
import { config as defaultConfig, VALUE_GETTERS } from '../config';
import { Config } from '../types/config_types';
import {
  nullShapeViewModel,
  RawTextGetter,
  ShapeTreeNode,
  ShapeViewModel,
  ValueGetter,
} from '../types/viewmodel_types';
import { DEPTH_KEY, HierarchyOfArrays } from '../utils/group_by_rollup';
import { PanelPlacement, shapeViewModel } from './viewmodel';

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
export function getShapeViewModel(
  partitionSpec: PartitionSpec,
  parentDimensions: Dimensions,
  tree: HierarchyOfArrays,
  containerBackgroundColor: Color,
  smallMultiplesStyle: SmallMultiplesStyle,
  panelPlacement: PanelPlacement,
): ShapeViewModel {
  const { width, height } = parentDimensions;
  const { layers, topGroove, config: specConfig } = partitionSpec;
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
    topGroove,
    containerBackgroundColor,
    smallMultiplesStyle,
    panelPlacement,
  );
}
