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

import { LegendItemExtraValues, LegendItem } from '../../common/legend';

/** @internal */
export function getExtra(extraValues: Map<string, LegendItemExtraValues>, item: LegendItem, totalItems: number) {
  const { seriesIdentifiers, defaultExtra, childId, path } = item;
  // don't show extra if the legend item is associated with multiple series
  if (extraValues.size === 0 || seriesIdentifiers.length > 1) {
    return defaultExtra?.formatted ?? '';
  }
  const [{ key }] = seriesIdentifiers;
  const extraValueKey = path.map(({ index }) => index).join('__');
  const itemExtraValues = extraValues.has(extraValueKey) ? extraValues.get(extraValueKey) : extraValues.get(key);
  const actionExtra = (childId && itemExtraValues?.get(childId)) ?? null;
  if (extraValues.size !== totalItems) {
    if (actionExtra != null) {
      return actionExtra;
    }
    return '';
  }
  return actionExtra !== null ? actionExtra : defaultExtra?.formatted ?? '';
}
