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
import { HierarchyOfArrays, PrimitiveValue } from '../../layout/utils/group_by_rollup';

/** @internal */
export const getFlatHierarchy = createCachedSelector(
  [getTree],
  (tree): Array<[PrimitiveValue, number, PrimitiveValue]> => {
    return flatHierarchy(tree);
  },
)(getChartIdSelector);

function flatHierarchy(tree: HierarchyOfArrays, orderedList: Array<[PrimitiveValue, number, PrimitiveValue]> = []) {
  for (let i = 0; i < tree.length; i++) {
    const branch = tree[i];
    const [key, arrayNode] = branch;
    const { children, depth, value } = arrayNode;

    if (key !== null) {
      orderedList.push([key, depth, value]);
    }
    if (children.length > 0) {
      flatHierarchy(children, orderedList);
    }
  }
  return orderedList;
}
