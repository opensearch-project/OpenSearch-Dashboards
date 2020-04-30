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

import { HierarchyOfArrays } from '../utils/group_by_rollup';
import { Relation } from '../types/types';
import { ValueAccessor } from '../../../../utils/commons';
import { IndexedAccessorFn } from '../../../../utils/accessor';
import {
  aggregateComparator,
  aggregators,
  childOrders,
  groupByRollup,
  mapEntryValue,
  mapsToArrays,
} from '../utils/group_by_rollup';

export function getHierarchyOfArrays(
  rawFacts: Relation,
  valueAccessor: ValueAccessor,
  groupByRollupAccessors: IndexedAccessorFn[],
): HierarchyOfArrays {
  const aggregator = aggregators.sum;

  const facts = rawFacts.filter((n) => {
    const value = valueAccessor(n);
    return Number.isFinite(value) && value > 0;
  });

  // don't render anything if the total, the width or height is not positive
  if (facts.reduce((p: number, n) => aggregator.reducer(p, valueAccessor(n)), aggregator.identity()) <= 0) {
    return [];
  }

  // We can precompute things invariant of how the rectangle is divvied up.
  // By introducing `scale`, we no longer need to deal with the dichotomy of
  // size as data value vs size as number of pixels in the rectangle

  return mapsToArrays(
    groupByRollup(groupByRollupAccessors, valueAccessor, aggregator, facts),
    aggregateComparator(mapEntryValue, childOrders.descending),
  );
}
