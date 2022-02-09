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

type Group<T> = Record<string, T[]>;
type GroupByKeyFn<T> = (data: T) => string;
type GroupKeysOrKeyFn<T> = Array<keyof T> | GroupByKeyFn<T>;

/** @internal */
export function groupBy<T>(data: T[], keysOrKeyFn: GroupKeysOrKeyFn<T>, asArray: false): Group<T>;
/** @internal */
export function groupBy<T>(data: T[], keysOrKeyFn: GroupKeysOrKeyFn<T>, asArray: true): T[][];
/** @internal */
export function groupBy<T>(data: T[], keysOrKeyFn: GroupKeysOrKeyFn<T>, asArray: boolean): T[][] | Group<T> {
  const keyFn = Array.isArray(keysOrKeyFn) ? getUniqueKey(keysOrKeyFn) : keysOrKeyFn;
  const grouped = data.reduce<Group<T>>((acc, curr) => {
    const key = keyFn(curr);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(curr);
    return acc;
  }, {});
  return asArray ? Object.values(grouped) : grouped;
}

/** @internal */
export function getUniqueKey<T>(keys: Array<keyof T>, concat = '|') {
  return (data: T): string => {
    return keys
      .map((key) => {
        return data[key];
      })
      .join(concat);
  };
}
