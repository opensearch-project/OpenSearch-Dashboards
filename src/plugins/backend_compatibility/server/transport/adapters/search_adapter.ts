/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BackendInfo } from '../types';
import { isPlainObject, normalizeTotalHits, synthesizeSeqNo } from './normalization_utils';

const UNSUPPORTED_ES6_AGGREGATIONS = [
  'rare_terms',
  'variable_width_histogram',
  'multi_terms',
  'rate',
  't_test',
  'moving_percentiles',
  'normalize',
  'boxplot',
  'string_stats',
];

const UNSUPPORTED_ES6_QUERIES = ['intervals', 'distance_feature', 'pinned'];

export function translateRequest(params: any, backend: BackendInfo): any {
  if (!isPlainObject(params.body)) {
    return params;
  }

  const body = { ...params.body };

  if ('track_total_hits' in body) {
    delete body.track_total_hits;
  }

  if (body.aggs) body.aggs = transformAggregations(body.aggs);
  if (body.aggregations) body.aggregations = transformAggregations(body.aggregations);
  if (body.query) body.query = transformQuery(body.query);

  return { ...params, body };
}

export function translateMsearchRequest(params: any, backend: BackendInfo): any {
  if (!params.body || !Array.isArray(params.body)) return params;

  const transformed = params.body.map((item: any, index: number) => {
    if (index % 2 === 1 && item && typeof item === 'object') {
      return translateRequest({ ...params, body: item }, backend).body;
    }
    return item;
  });
  return { ...params, body: transformed };
}

export function translateResponse(response: any, backend: BackendInfo): any {
  const body = response?.body || response;
  if (!body?.hits) return response;

  body.hits.total = normalizeTotalHits(body.hits.total);

  if (Array.isArray(body.hits.hits)) {
    body.hits.hits = body.hits.hits.map((hit: any) => {
      if (!hit) return hit;
      const { _type, ...rest } = hit;
      synthesizeSeqNo(rest);
      return rest;
    });
  }

  return response;
}

export function translateMsearchResponse(response: any, backend: BackendInfo): any {
  const body = response?.body || response;
  if (!body?.responses) return response;

  body.responses = body.responses.map((res: any) => {
    const wrapped = { body: res };
    translateResponse(wrapped, backend);
    return wrapped.body;
  });

  return response;
}

function transformAggregations(aggs: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [name, agg] of Object.entries(aggs)) {
    if (!agg || typeof agg !== 'object') {
      result[name] = agg;
      continue;
    }
    result[name] = transformAggregation(agg);
  }
  return result;
}

const AGG_TRANSFORMS: Record<string, (value: any) => { key: string; value: any }> = {
  date_histogram: (v) => ({ key: 'date_histogram', value: transformDateHistogram(v) }),
  auto_date_histogram: (v) => ({ key: 'date_histogram', value: transformAutoDateHistogram(v) }),
  geotile_grid: (v) => ({ key: 'geohash_grid', value: transformGeotileToGeohash(v) }),
};

function transformAggregation(agg: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(agg)) {
    if (UNSUPPORTED_ES6_AGGREGATIONS.includes(key)) continue;

    const isObj = value && typeof value === 'object';

    if (isObj && AGG_TRANSFORMS[key]) {
      const { key: outKey, value: outValue } = AGG_TRANSFORMS[key](value);
      result[outKey] = outValue;
    } else if (isObj && (key === 'aggs' || key === 'aggregations')) {
      result[key] = transformAggregations(value);
    } else if (isObj && ('aggs' in value || 'aggregations' in value)) {
      result[key] = transformAggregation(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function transformDateHistogram(dh: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(dh)) {
    if (key === 'calendar_interval' || key === 'fixed_interval') {
      result.interval = value;
    } else {
      result[key] = value;
    }
  }
  return result;
}

const BUCKET_INTERVALS: Array<[number, string]> = [
  [10, 'month'],
  [30, 'week'],
  [100, 'day'],
];

function transformAutoDateHistogram(adh: Record<string, any>): Record<string, any> {
  const buckets = adh.buckets as number | undefined;
  const interval = buckets
    ? BUCKET_INTERVALS.find(([max]) => buckets <= max)?.[1] ?? 'hour'
    : 'day';

  const result: Record<string, any> = { field: adh.field, interval };
  if (adh.time_zone) result.time_zone = adh.time_zone;
  if (adh.format) result.format = adh.format;
  if (adh.min_doc_count !== undefined) result.min_doc_count = adh.min_doc_count;
  return result;
}

function transformGeotileToGeohash(gt: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = { field: gt.field };
  if (typeof gt.precision === 'number') {
    // Geotile zoom levels (0–29) map to geohash precision (1–12) at different rates.
    // Geotile uses web mercator zoom; geohash uses character-based precision.
    // Approximate spatial equivalence: zoom 4 ≈ geohash 2, zoom 10 ≈ geohash 5, zoom 20 ≈ geohash 9.
    const p = gt.precision;
    if (p <= 4) result.precision = Math.max(1, Math.ceil(p / 2));
    else if (p <= 10) result.precision = Math.min(5, 3 + Math.floor((p - 5) / 2));
    else if (p <= 20) result.precision = Math.min(9, 6 + Math.floor((p - 11) / 3));
    else result.precision = Math.min(12, 10 + Math.floor((p - 21) / 3));
  }
  if (gt.size !== undefined) result.size = gt.size;
  if (gt.shard_size !== undefined) result.shard_size = gt.shard_size;
  if (gt.bounds !== undefined) result.bounds = gt.bounds;
  return result;
}

const recurseOn = (field: string) => (v: any) => ({ ...v, [field]: transformQuery(v[field]) });

const QUERY_TRANSFORMS: Record<string, (value: any) => any> = {
  bool: (v) => transformBoolQuery(v),
  nested: recurseOn('query'),
  has_child: recurseOn('query'),
  has_parent: recurseOn('query'),
  constant_score: recurseOn('filter'),
  dis_max: (v) => ({ ...v, queries: (v.queries || []).map(transformQuery) }),
  boosting: (v) => ({
    positive: transformQuery(v.positive),
    negative: transformQuery(v.negative),
    negative_boost: v.negative_boost,
  }),
  function_score: (v) => ({
    ...v,
    ...(v.query && { query: transformQuery(v.query) }),
    ...(v.functions && {
      functions: v.functions.map((fn: any) =>
        fn.filter ? { ...fn, filter: transformQuery(fn.filter) } : fn
      ),
    }),
  }),
  query_string: (v) => {
    const qs = { ...v };
    if (qs.default_field === '*' && !qs.all_fields) {
      qs.all_fields = true;
      delete qs.default_field;
    }
    return qs;
  },
};

function transformQuery(query: any): any {
  if (!query || typeof query !== 'object') return query;
  const result: any = {};
  for (const [key, value] of Object.entries(query)) {
    if (UNSUPPORTED_ES6_QUERIES.includes(key)) continue;

    if (QUERY_TRANSFORMS[key] && value && typeof value === 'object') {
      result[key] = QUERY_TRANSFORMS[key](value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

const BOOL_CLAUSES = ['must', 'filter', 'should', 'must_not'] as const;

function transformBoolQuery(bool: any): any {
  const result: any = {};
  const mapQ = (q: any) => (Array.isArray(q) ? q.map(transformQuery) : transformQuery(q));

  for (const clause of BOOL_CLAUSES) {
    if (bool[clause]) result[clause] = mapQ(bool[clause]);
  }
  if (bool.minimum_should_match !== undefined)
    result.minimum_should_match = bool.minimum_should_match;
  if (bool.boost !== undefined) result.boost = bool.boost;
  return result;
}
