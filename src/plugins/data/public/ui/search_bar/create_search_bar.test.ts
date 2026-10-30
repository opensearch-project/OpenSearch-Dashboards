/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use it except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES
 * OR CONDITIONS OF ANY KIND, either express or implied.  See the
 * License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Tests for the defaultOnQuerySubmit handler and isEqualQuery helper.
 *
 * Regression test for https://github.com/opensearch-project/OpenSearch-Dashboards/issues/12522
 *
 * The bug: _.isEqual(payload.query, currentQuery) returns false when
 * payload.query has `dataset: undefined` as an own enumerable property
 * while currentQuery lacks the `dataset` key entirely. This causes the
 * refresh button to become non-functional because the `else` branch is
 * never reached.
 *
 * The fix: use an explicit field comparison (isEqualQuery) that only
 * checks `query` and `language` fields, ignoring structural differences
 * in optional properties.
 */

import { isEqualQuery } from './create_search_bar';

describe('Query comparison (fix for #12522)', () => {
  it('should return true for identical queries', () => {
    const q1 = { query: 'foo', language: 'kql' };
    const q2 = { query: 'foo', language: 'kql' };
    expect(isEqualQuery(q1, q2)).toBe(true);
  });

  it('should return true when one query has dataset: undefined and the other lacks the key entirely', () => {
    // This is the exact bug scenario from #12522
    const payloadQuery = { query: 'foo', language: 'kql', dataset: undefined };
    const currentQuery = { query: 'foo', language: 'kql' };
    // isEqualQuery only checks query + language, so this should be equal
    expect(isEqualQuery(payloadQuery, currentQuery)).toBe(true);
    // Verify that _.isEqual would disagree (document the bug)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const isEqual = require('lodash').isEqual;
    expect(isEqual(payloadQuery, currentQuery)).toBe(false);
  });

  it('should return true for queries with different optional fields but same core fields', () => {
    const q1 = { query: 'bar', language: 'ppl', profile: true };
    const q2 = { query: 'bar', language: 'ppl' };
    expect(isEqualQuery(q1, q2)).toBe(true);
  });

  it('should return false when query strings differ', () => {
    const q1 = { query: 'foo', language: 'kql' };
    const q2 = { query: 'bar', language: 'kql' };
    expect(isEqualQuery(q1, q2)).toBe(false);
  });

  it('should return false when languages differ', () => {
    const q1 = { query: 'foo', language: 'kql' };
    const q2 = { query: 'foo', language: 'ppl' };
    expect(isEqualQuery(q1, q2)).toBe(false);
  });

  it('should return true when both are undefined', () => {
    expect(isEqualQuery(undefined, undefined)).toBe(true);
  });

  it('should return false when only one is undefined', () => {
    const q = { query: 'foo', language: 'kql' };
    expect(isEqualQuery(undefined, q)).toBe(false);
    expect(isEqualQuery(q, undefined)).toBe(false);
  });

  it('should return true when both are the same reference', () => {
    const q = { query: 'foo', language: 'kql' };
    expect(isEqualQuery(q, q)).toBe(true);
  });
});
