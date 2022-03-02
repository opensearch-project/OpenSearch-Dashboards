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

import { LayerValue } from '../../../../specs';
import { Point } from '../../../../utils/point';
import { ContinuousDomainFocus } from '../../renderer/canvas/partition';
import { MODEL_KEY } from '../config';
import { QuadViewModel, ShapeViewModel } from '../types/viewmodel_types';
import { AGGREGATE_KEY, DEPTH_KEY, getNodeName, PARENT_KEY, PATH_KEY, SORT_INDEX_KEY } from '../utils/group_by_rollup';

/** @internal */
export const pickedShapes = (
  models: ShapeViewModel[],
  { x, y }: Point,
  foci: ContinuousDomainFocus[],
): QuadViewModel[] =>
  models.flatMap(({ diskCenter, pickQuads }) => pickQuads(x - diskCenter.x, y - diskCenter.y, foci[0]));

/** @internal */
export function pickShapesLayerValues(shapes: QuadViewModel[]): LayerValue[][] {
  const maxDepth = shapes.reduce((acc, curr) => Math.max(acc, curr.depth), 0);
  return shapes
    .filter(({ depth }) => depth === maxDepth) // eg. lowest layer in a treemap, where layers overlap in screen space; doesn't apply to sunburst/flame
    .map<Array<LayerValue>>((viewModel) => {
      const values: Array<LayerValue> = [
        {
          smAccessorValue: viewModel.smAccessorValue,
          groupByRollup: viewModel.dataName,
          value: viewModel[AGGREGATE_KEY],
          depth: viewModel[DEPTH_KEY],
          sortIndex: viewModel[SORT_INDEX_KEY],
          path: viewModel[PATH_KEY],
        },
      ];
      let node = viewModel[MODEL_KEY];
      while (node[DEPTH_KEY] > 0) {
        const value = node[AGGREGATE_KEY];
        const dataName = getNodeName(node);
        values.push({
          smAccessorValue: viewModel.smAccessorValue,
          groupByRollup: dataName,
          value,
          depth: node[DEPTH_KEY],
          sortIndex: node[SORT_INDEX_KEY],
          path: node[PATH_KEY],
        });

        node = node[PARENT_KEY];
      }
      return values.reverse();
    });
}
