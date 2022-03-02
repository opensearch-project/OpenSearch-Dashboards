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
import { LegendPositionConfig } from '../../../../specs/settings';
import { isHierarchicalLegend } from '../../../../utils/legend';
import { Layer } from '../../specs';
import { QuadViewModel } from '../types/viewmodel_types';

function makeKey(...keyParts: CategoryKey[]): string {
  return keyParts.join('---');
}

function compareTreePaths(
  { index: oiA, innerIndex: iiA, path: a }: QuadViewModel,
  { index: oiB, innerIndex: iiB, path: b }: QuadViewModel,
): number {
  if (oiA !== oiB) return oiA - oiB;
  if (iiA !== iiB) return iiA - iiB;
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
  legendPosition: LegendPositionConfig,
  quadViewModel: QuadViewModel[],
): LegendItem[] {
  const uniqueNames = new Set(map(({ dataName, fillColor }) => makeKey(dataName, fillColor), quadViewModel));
  const useHierarchicalLegend = isHierarchicalLegend(flatLegend, legendPosition);

  const formattedLabel = ({ dataName, depth }: QuadViewModel) => {
    const formatter = layers[depth - 1]?.nodeLabel;
    return formatter ? formatter(dataName) : dataName;
  };

  function compareNames(aItem: QuadViewModel, bItem: QuadViewModel): number {
    const a = formattedLabel(aItem);
    const b = formattedLabel(bItem);
    return a < b ? -1 : a > b ? 1 : 0;
  }

  const excluded: Set<string> = new Set();
  const items = quadViewModel.filter(({ depth, dataName, fillColor }) => {
    if (legendMaxDepth !== null && depth > legendMaxDepth) {
      return false;
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

  items.sort(flatLegend ? compareNames : compareTreePaths);

  return items.map<LegendItem>((item) => {
    const { dataName, fillColor, depth, path } = item;
    return {
      color: fillColor,
      label: formattedLabel(item),
      childId: dataName,
      depth: useHierarchicalLegend ? depth - 1 : 0,
      path,
      seriesIdentifiers: [{ key: dataName, specId: id }],
      keys: [],
    };
  });
}
