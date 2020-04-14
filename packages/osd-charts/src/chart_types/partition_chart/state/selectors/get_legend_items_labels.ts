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
import { getTree } from './tree';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';
import { getPieSpecOrNull } from './pie_spec';
import { HierarchyOfArrays, CHILDREN_KEY } from '../../layout/utils/group_by_rollup';
import { Layer } from '../../specs';
import { LegendItemLabel } from '../../../../state/selectors/get_legend_items_labels';
import { getSettingsSpecSelector } from '../../../../state/selectors/get_settings_specs';

/** @internal */
export const getLegendItemsLabels = createCachedSelector(
  [getPieSpecOrNull, getSettingsSpecSelector, getTree],
  (pieSpec, { legendMaxDepth }, tree): LegendItemLabel[] => {
    if (!pieSpec || (typeof legendMaxDepth === 'number' && legendMaxDepth <= 0)) {
      return [];
    }
    return flatSlicesNames(pieSpec.layers, 0, tree);
  },
)(getChartIdSelector);

function flatSlicesNames(
  layers: Layer[],
  depth: number,
  tree: HierarchyOfArrays,
  keys: Map<string, number> = new Map(),
): LegendItemLabel[] {
  if (tree.length === 0) {
    return [];
  }
  for (let i = 0; i < tree.length; i++) {
    const branch = tree[i];
    const arrayNode = branch[1];
    const key = branch[0];

    // format the key with the layer formatter
    const layer = layers[depth - 1];
    const formatter = layer?.nodeLabel;
    let formattedValue = '';
    if (key != null) {
      formattedValue = formatter ? formatter(key) : `${key}`;
    }

    // save only the max depth, so we can compute the the max extension of the legend
    keys.set(formattedValue, Math.max(depth, keys.get(formattedValue) ?? 0));

    const children = arrayNode[CHILDREN_KEY];
    flatSlicesNames(layers, depth + 1, children, keys);
  }
  return [...keys.keys()].map((k) => {
    return {
      label: k,
      depth: keys.get(k) ?? 0,
    };
  });
}
