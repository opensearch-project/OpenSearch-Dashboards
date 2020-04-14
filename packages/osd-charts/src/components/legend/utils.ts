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
import { LegendItemExtraValues, LegendItem } from '../../commons/legend';

/** @internal */
export function getExtra(extraValues: Map<string, LegendItemExtraValues>, item: LegendItem, totalItems: number) {
  const {
    seriesIdentifier: { key },
    defaultExtra,
    childId,
  } = item;
  if (extraValues.size === 0) {
    return defaultExtra?.formatted ?? '';
  }
  const itemExtraValues = extraValues.get(key);
  const actionExtra = (childId && itemExtraValues?.get(childId)) ?? null;
  if (extraValues.size !== totalItems) {
    if (actionExtra != null) {
      return actionExtra;
    } else {
      return '';
    }
  } else {
    return actionExtra !== null ? actionExtra : defaultExtra?.formatted ?? '';
  }
}
