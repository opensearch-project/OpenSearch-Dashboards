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

import { getHierarchyOfArrays } from './hierarchy_of_arrays';

const rawFacts = [
  { sitc1: '7', exportVal: 0 },
  { sitc1: '3', exportVal: 3 },
  { sitc1: 'G', exportVal: 1 },
  { sitc1: '5', exportVal: -8 },
];

const valueAccessor = (d: any) => d.exportVal;

const groupByRollupAccessors = [() => null, (d: any) => d.sitc1];

describe('Test', () => {
  test('getHierarchyOfArrays should omit zero and negative values', () => {
    const outerResult = getHierarchyOfArrays(rawFacts, valueAccessor, groupByRollupAccessors);
    expect(outerResult.length).toBe(1);

    const results = outerResult[0];
    expect(results.length).toBe(2);
    expect(results[0]).toBeNull();

    const result = results[1];
    const expectedLength = rawFacts.filter((d: any) => valueAccessor(d) > 0).length;
    expect(expectedLength).toBe(2);
    expect(result.children.length).toBe(expectedLength);
  });
});
