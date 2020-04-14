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
import { LegendItem } from '../../../../commons/legend';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';
import { getPieSpecOrNull } from './pie_spec';
import { partitionGeometries } from './geometries';
import { getSettingsSpecSelector } from '../../../../state/selectors/get_settings_specs';
import { PrimitiveValue } from '../../layout/utils/group_by_rollup';
import { QuadViewModel } from '../../layout/types/viewmodel_types';
import { getFlatHierarchy } from './get_flat_hierarchy';
import { Position } from '../../../../utils/commons';

/** @internal */
export const computeLegendSelector = createCachedSelector(
  [getPieSpecOrNull, getSettingsSpecSelector, partitionGeometries, getFlatHierarchy],
  (pieSpec, settings, geoms, sortedItems): LegendItem[] => {
    if (!pieSpec) {
      return [];
    }
    const { id, layers: labelFormatters } = pieSpec;

    const uniqueNames = geoms.quadViewModel.reduce<Record<string, number>>((acc, { dataName, fillColor }) => {
      const key = [dataName, fillColor].join('---');
      if (!acc[key]) {
        acc[key] = 0;
      }
      acc[key] += 1;
      return acc;
    }, {});

    const { flatLegend, legendMaxDepth, legendPosition } = settings;
    const forceFlatLegend = flatLegend || legendPosition === Position.Bottom || legendPosition === Position.Top;

    const excluded: Set<string> = new Set();
    let items = geoms.quadViewModel.filter(({ depth, dataName, fillColor }) => {
      if (legendMaxDepth != null) {
        return depth <= legendMaxDepth;
      }
      if (forceFlatLegend) {
        const key = [dataName, fillColor].join('---');
        if (uniqueNames[key] > 1 && excluded.has(key)) {
          return false;
        }
        excluded.add(key);
      }
      return true;
    });

    if (forceFlatLegend) {
      items = items.sort(({ depth: a }, { depth: b }) => a - b);
    }

    return items
      .sort((a, b) => {
        const aIndex = findIndex(sortedItems, a);
        const bIndex = findIndex(sortedItems, b);
        return aIndex - bIndex;
      })
      .map<LegendItem>(({ dataName, fillColor, depth }) => {
        const labelFormatter = labelFormatters[depth - 1];
        const formatter = labelFormatter?.nodeLabel;

        return {
          color: fillColor,
          label: formatter ? formatter(dataName) : dataName,
          dataName,
          childId: dataName,
          depth: forceFlatLegend ? 0 : depth - 1,
          seriesIdentifier: {
            key: dataName,
            specId: id,
          },
        };
      });
  },
)(getChartIdSelector);

function findIndex(items: Array<[PrimitiveValue, number, PrimitiveValue]>, child: QuadViewModel) {
  return items.findIndex(([dataName, depth, value]) => {
    return dataName === child.dataName && depth === child.depth && value === child.value;
  });
}
