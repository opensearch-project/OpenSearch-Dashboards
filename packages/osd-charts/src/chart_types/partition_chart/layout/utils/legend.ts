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

import { CategoryKey } from '../../../../common/category';
import { map } from '../../../../common/iterables';
import { LegendItem } from '../../../../common/legend';
import { identity, Position } from '../../../../utils/common';
import { isHierarchicalLegend } from '../../../../utils/legend';
import { Layer } from '../../specs';
import { QuadViewModel } from '../types/viewmodel_types';

function makeKey(...keyParts: CategoryKey[]): string {
  return keyParts.join('---');
}

function compareTreePaths({ path: a }: QuadViewModel, { path: b }: QuadViewModel): number {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    const diff = a[i].index - b[i].index;
    if (diff) {
      return diff;
    }
  }
  return a.length - b.length; // if one path is fully contained in the other, then parent (shorter) goes first
}

/** @internal */
export function getLegendItems(
  id: string,
  layers: Layer[],
  flatLegend: boolean | undefined,
  legendMaxDepth: number,
  legendPosition: Position,
  quadViewModel: QuadViewModel[],
): LegendItem[] {
  const uniqueNames = new Set(map(({ dataName, fillColor }) => makeKey(dataName, fillColor), quadViewModel));
  const useHierarchicalLegend = isHierarchicalLegend(flatLegend, legendPosition);

  const excluded: Set<string> = new Set();
  const items = quadViewModel.filter(({ depth, dataName, fillColor }) => {
    if (legendMaxDepth != null) {
      return depth <= legendMaxDepth;
    }
    if (!useHierarchicalLegend) {
      const key = makeKey(dataName, fillColor);
      if (uniqueNames.has(key) && excluded.has(key)) {
        return false;
      }
      excluded.add(key);
    }
    return true;
  });

  items.sort(compareTreePaths);

  return items.map<LegendItem>(({ dataName, fillColor, depth, path }) => {
    const formatter = layers[depth - 1]?.nodeLabel ?? identity;
    return {
      color: fillColor,
      label: formatter(dataName),
      childId: dataName,
      depth: useHierarchicalLegend ? depth - 1 : 0,
      path,
      seriesIdentifiers: [{ key: dataName, specId: id }],
      keys: [],
    };
  });
}
