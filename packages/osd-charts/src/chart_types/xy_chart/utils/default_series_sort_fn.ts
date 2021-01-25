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

import { DataSeries } from './series';

/**
 * Return the default sorting used for XY series.
 * Ordered by group insert order, then first stacked, after non stacked.
 * @internal
 */
export function defaultXYSeriesSort(a: DataSeries, b: DataSeries) {
  if (a.groupId !== b.groupId) {
    return a.insertIndex - b.insertIndex;
  }

  if (a.isStacked && !b.isStacked) {
    return -1; // a first then b
  }
  if (!a.isStacked && b.isStacked) {
    return 1; // b first then a
  }
  return a.insertIndex - b.insertIndex;
}

/**
 * Return the default sorting used for XY series.
 * Ordered by group insert order, then first stacked, after non stacked.
 * Stacked are sorted from from top to bottom to respect the rendering order
 * @internal
 */
export function defaultXYLegendSeriesSort(a: DataSeries, b: DataSeries) {
  if (a.groupId !== b.groupId) {
    return a.insertIndex - b.insertIndex;
  }

  if (a.isStacked && !b.isStacked) {
    return -1; // a first then b
  }
  if (!a.isStacked && b.isStacked) {
    return 1; // b first then a
  }
  if (a.isStacked && b.isStacked) {
    return b.insertIndex - a.insertIndex;
  }
  return a.insertIndex - b.insertIndex;
}
