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

import { Origin, Part } from '../../../../common/text_utils';
import { ArrayEntry, childrenAccessor, HierarchyOfArrays } from './group_by_rollup';

/** @internal */
export function sunburst(
  outerNodes: HierarchyOfArrays,
  areaAccessor: (e: ArrayEntry) => number,
  { x0: outerX0, y0: outerY0 }: Origin,
  clockwiseSectors: boolean,
  specialFirstInnermostSector: boolean,
  heightStep: number = 1,
): Array<Part> {
  const result: Array<Part> = [];
  const laySubtree = (nodes: HierarchyOfArrays, { x0, y0 }: Origin, depth: number) => {
    let currentOffsetX = x0;
    const nodeCount = nodes.length;
    for (let i = 0; i < nodeCount; i++) {
      const index = clockwiseSectors ? i : nodeCount - i - 1;
      const node = nodes[depth === 1 && specialFirstInnermostSector ? (index + 1) % nodeCount : index];
      const area = areaAccessor(node);
      result.push({ node, x0: currentOffsetX, y0, x1: currentOffsetX + area, y1: y0 + heightStep });
      const children = childrenAccessor(node);
      if (children.length > 0) {
        laySubtree(children, { x0: currentOffsetX, y0: y0 + heightStep }, depth + 1);
      }
      currentOffsetX += area;
    }
  };
  laySubtree(outerNodes, { x0: outerX0, y0: outerY0 }, 0);
  return result;
}
