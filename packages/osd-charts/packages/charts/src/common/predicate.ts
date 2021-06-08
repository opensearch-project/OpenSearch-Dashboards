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

import { $Values } from 'utility-types';

/** @public */
export const Predicate = Object.freeze({
  NumAsc: 'numAsc' as const,
  NumDesc: 'numDesc' as const,
  AlphaAsc: 'alphaAsc' as const,
  AlphaDesc: 'alphaDesc' as const,
  DataIndex: 'dataIndex' as const,
});

/** @public */
export type Predicate = $Values<typeof Predicate>;

/** @internal */
export function getPredicateFn<T>(predicate: Predicate, accessor?: keyof T): (a: T, b: T) => number {
  switch (predicate) {
    case 'alphaAsc':
      return (a: T, b: T) => {
        const aValue = String(accessor ? a[accessor] : a);
        const bValue = String(accessor ? b[accessor] : b);
        return aValue.localeCompare(bValue);
      };
    case 'alphaDesc':
      return (a: T, b: T) => {
        const aValue = String(accessor ? a[accessor] : a);
        const bValue = String(accessor ? b[accessor] : b);
        return bValue.localeCompare(aValue);
      };
    case 'numDesc':
      return (a: T, b: T) => {
        const aValue = Number(accessor ? a[accessor] : a);
        const bValue = Number(accessor ? b[accessor] : b);
        return bValue - aValue;
      };
    default:
    case 'dataIndex':
    case 'numAsc':
      return (a: T, b: T) => {
        const aValue = Number(accessor ? a[accessor] : a);
        const bValue = Number(accessor ? b[accessor] : b);
        return aValue - bValue;
      };
  }
}
