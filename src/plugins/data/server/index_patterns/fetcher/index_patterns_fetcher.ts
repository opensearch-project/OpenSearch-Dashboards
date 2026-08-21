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
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { LegacyAPICaller } from 'opensearch-dashboards/server';

import { getFieldCapabilities, resolveTimePattern, createNoMatchingIndicesError } from './lib';

export interface FieldDescriptor {
  aggregatable: boolean;
  name: string;
  readFromDocValues: boolean;
  searchable: boolean;
  type: string;
  esTypes: string[];
  subType?: FieldSubType;
}

interface FieldSubType {
  multi?: { parent: string };
  nested?: { path: string };
}

interface FieldCapsCacheEntry {
  ts: number;
  fields: FieldDescriptor[];
}

interface FieldCapsInFlightEntry {
  ts: number;
  promise: Promise<FieldDescriptor[]>;
}

// Short-lived, module-level cache + in-flight deduplication for _field_caps responses.
// The goal is to flatten the thundering herd when many concurrent requests hit the same
// wildcard pattern (e.g. multiple users opening Discover on the same index pattern after
// a deploy). The TTL is intentionally tiny because _field_caps responses describe the
// cluster schema and OpenSearch permissions are evaluated per request — a wider window
// risks serving one user's view of the mapping to another.
const FIELD_CAPS_TTL_MS = 5000;
const FIELD_CAPS_CACHE_MAX_ENTRIES = 200;
// Promises that have not resolved within this window are assumed to be stuck (network
// timeout, dead-locked cluster, dropped connection). Evicting them on subsequent writes
// keeps the in-flight map from growing unboundedly when a flood of distinct patterns
// hits a slow backend.
const FIELD_CAPS_INFLIGHT_TIMEOUT_MS = 30000;
const fieldCapsCache = new Map<string, FieldCapsCacheEntry>();
const fieldCapsInFlight = new Map<string, FieldCapsInFlightEntry>();

const sweepStale = (now: number) => {
  if (fieldCapsCache.size >= FIELD_CAPS_CACHE_MAX_ENTRIES) {
    const cacheCutoff = now - FIELD_CAPS_TTL_MS;
    for (const [key, entry] of fieldCapsCache) {
      if (entry.ts < cacheCutoff) fieldCapsCache.delete(key);
    }
  }
  const inflightCutoff = now - FIELD_CAPS_INFLIGHT_TIMEOUT_MS;
  for (const [key, entry] of fieldCapsInFlight) {
    if (entry.ts < inflightCutoff) fieldCapsInFlight.delete(key);
  }
};

const buildFieldCapsCacheKey = (
  pattern: string | string[],
  metaFields: string[] | undefined,
  fieldCapsOptions: { allowNoIndices: boolean } | undefined
): string =>
  JSON.stringify({
    p: Array.isArray(pattern) ? [...pattern].sort() : pattern,
    m: metaFields ? [...metaFields].sort() : null,
    o: fieldCapsOptions ?? null,
  });

// Test-only helpers. Exposed via the same module so tests can guarantee an empty
// starting state and observe internal sizes. Not exported through the plugin's public
// surface.
export const __resetFieldCapsCacheForTests = () => {
  fieldCapsCache.clear();
  fieldCapsInFlight.clear();
};
export const __getFieldCapsInFlightSizeForTests = () => fieldCapsInFlight.size;

export class IndexPatternsFetcher {
  private _callDataCluster: LegacyAPICaller;

  constructor(callDataCluster: LegacyAPICaller) {
    this._callDataCluster = callDataCluster;
  }

  /**
   *  Get a list of field objects for an index pattern that may contain wildcards
   *
   *  @param {Object} [options]
   *  @property {String} options.pattern The index pattern
   *  @property {Number} options.metaFields The list of underscore prefixed fields that should
   *                                        be left in the field list (all others are removed).
   *  @return {Promise<Array<Fields>>}
   */
  async getFieldsForWildcard(options: {
    pattern: string | string[];
    metaFields?: string[];
    fieldCapsOptions?: { allowNoIndices: boolean };
  }): Promise<FieldDescriptor[]> {
    const { pattern, metaFields, fieldCapsOptions } = options;
    const cacheKey = buildFieldCapsCacheKey(pattern, metaFields, fieldCapsOptions);
    const now = Date.now();

    const cached = fieldCapsCache.get(cacheKey);
    if (cached && now - cached.ts < FIELD_CAPS_TTL_MS) {
      return cached.fields;
    }

    const inFlight = fieldCapsInFlight.get(cacheKey);
    if (inFlight) return inFlight.promise;

    const promise = getFieldCapabilities(
      this._callDataCluster,
      pattern,
      metaFields,
      fieldCapsOptions
    )
      .then((fields) => {
        const completedAt = Date.now();
        sweepStale(completedAt);
        fieldCapsCache.set(cacheKey, { ts: completedAt, fields });
        return fields;
      })
      .finally(() => {
        fieldCapsInFlight.delete(cacheKey);
      });

    sweepStale(now);
    fieldCapsInFlight.set(cacheKey, { ts: now, promise });
    return promise;
  }

  /**
   *  Get a list of field objects for a time pattern
   *
   *  @param {Object} [options={}]
   *  @property {String} options.pattern The moment compatible time pattern
   *  @property {Number} options.lookBack The number of indices we will pull mappings for
   *  @property {Number} options.metaFields The list of underscore prefixed fields that should
   *                                        be left in the field list (all others are removed).
   *  @return {Promise<Array<Fields>>}
   */
  async getFieldsForTimePattern(options: {
    pattern: string;
    metaFields: string[];
    lookBack: number;
    interval: string;
  }) {
    const { pattern, lookBack, metaFields } = options;
    const { matches } = await resolveTimePattern(this._callDataCluster, pattern);
    const indices = matches.slice(0, lookBack);
    if (indices.length === 0) {
      throw createNoMatchingIndicesError(pattern);
    }
    return await getFieldCapabilities(this._callDataCluster, indices, metaFields);
  }
}
