/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  translateRequest,
  translateResponse,
  translateMsearchRequest,
  translateMsearchResponse,
} from './search_adapter';
import { BackendInfo } from '../types';

const es6Backend: BackendInfo = {
  distribution: 'elasticsearch',
  version: '6.8.23',
  majorVersion: 6,
  minorVersion: 8,
  patchVersion: 23,
};

describe('search_adapter', () => {
  describe('translateRequest', () => {
    it('removes track_total_hits', () => {
      const params = { body: { track_total_hits: true, query: { match_all: {} } } };
      const result = translateRequest(params, es6Backend);
      expect(result.body.track_total_hits).toBeUndefined();
      expect(result.body.query).toEqual({ match_all: {} });
    });

    it('passes through when body is not a plain object', () => {
      const params = { body: 'raw string' };
      expect(translateRequest(params, es6Backend)).toBe(params);
    });

    it('passes through when body is undefined', () => {
      const params = { path: '/_search' };
      expect(translateRequest(params, es6Backend)).toBe(params);
    });

    it('converts calendar_interval to interval in date_histogram', () => {
      const params = {
        body: {
          aggs: {
            dates: { date_histogram: { field: '@timestamp', calendar_interval: '1d' } },
          },
        },
      };
      const result = translateRequest(params, es6Backend);
      expect(result.body.aggs.dates.date_histogram.interval).toBe('1d');
      expect(result.body.aggs.dates.date_histogram.calendar_interval).toBeUndefined();
    });

    it('converts fixed_interval to interval in date_histogram', () => {
      const params = {
        body: {
          aggs: {
            dates: { date_histogram: { field: '@timestamp', fixed_interval: '30s' } },
          },
        },
      };
      const result = translateRequest(params, es6Backend);
      expect(result.body.aggs.dates.date_histogram.interval).toBe('30s');
      expect(result.body.aggs.dates.date_histogram.fixed_interval).toBeUndefined();
    });

    it('converts auto_date_histogram to date_histogram with heuristic interval', () => {
      const params = {
        body: {
          aggs: {
            dates: { auto_date_histogram: { field: '@timestamp', buckets: 5 } },
          },
        },
      };
      const result = translateRequest(params, es6Backend);
      expect(result.body.aggs.dates.date_histogram).toBeDefined();
      expect(result.body.aggs.dates.date_histogram.field).toBe('@timestamp');
      expect(result.body.aggs.dates.date_histogram.interval).toBe('month');
      expect(result.body.aggs.dates.auto_date_histogram).toBeUndefined();
    });

    it('converts geotile_grid to geohash_grid', () => {
      const params = {
        body: {
          aggs: {
            grid: { geotile_grid: { field: 'location', precision: 8 } },
          },
        },
      };
      const result = translateRequest(params, es6Backend);
      expect(result.body.aggs.grid.geohash_grid).toBeDefined();
      expect(result.body.aggs.grid.geohash_grid.field).toBe('location');
      expect(result.body.aggs.grid.geotile_grid).toBeUndefined();
    });

    it('drops unsupported aggregations', () => {
      const params = {
        body: {
          aggs: {
            valid: { terms: { field: 'status' } },
            invalid: { rare_terms: { field: 'status' } },
          },
        },
      };
      const result = translateRequest(params, es6Backend);
      expect(result.body.aggs.valid.terms).toBeDefined();
      expect(result.body.aggs.invalid).toEqual({});
    });

    it('drops unsupported query types', () => {
      const params = {
        body: {
          query: {
            bool: {
              must: [{ match: { title: 'test' } }, { intervals: { title: {} } }],
            },
          },
        },
      };
      const result = translateRequest(params, es6Backend);
      expect(result.body.query.bool.must).toHaveLength(2);
      expect(result.body.query.bool.must[0]).toEqual({ match: { title: 'test' } });
      expect(result.body.query.bool.must[1].intervals).toBeUndefined();
    });

    it('recursively transforms nested bool queries', () => {
      const params = {
        body: {
          query: {
            bool: {
              must: [
                {
                  bool: {
                    should: [{ match: { a: '1' } }],
                  },
                },
              ],
            },
          },
        },
      };
      const result = translateRequest(params, es6Backend);
      expect(result.body.query.bool.must[0].bool.should).toEqual([{ match: { a: '1' } }]);
    });

    it('transforms query_string default_field=* to all_fields', () => {
      const params = {
        body: {
          query: { query_string: { query: 'test', default_field: '*' } },
        },
      };
      const result = translateRequest(params, es6Backend);
      expect(result.body.query.query_string.all_fields).toBe(true);
      expect(result.body.query.query_string.default_field).toBeUndefined();
    });

    it('processes aggregations under both aggs and aggregations keys', () => {
      const params = {
        body: {
          aggregations: {
            dates: { date_histogram: { field: '@timestamp', calendar_interval: '1h' } },
          },
        },
      };
      const result = translateRequest(params, es6Backend);
      expect(result.body.aggregations.dates.date_histogram.interval).toBe('1h');
    });

    it('recursively transforms sub-aggregations', () => {
      const params = {
        body: {
          aggs: {
            outer: {
              terms: { field: 'status' },
              aggs: {
                inner: { date_histogram: { field: '@timestamp', fixed_interval: '5m' } },
              },
            },
          },
        },
      };
      const result = translateRequest(params, es6Backend);
      expect(result.body.aggs.outer.aggs.inner.date_histogram.interval).toBe('5m');
    });
  });

  describe('translateResponse', () => {
    it('normalizes numeric hits.total to object format', () => {
      const response = { body: { hits: { total: 42, hits: [] } } };
      translateResponse(response, es6Backend);
      expect(response.body.hits.total).toEqual({ value: 42, relation: 'eq' });
    });

    it('passes through object-format hits.total', () => {
      const response = { body: { hits: { total: { value: 10, relation: 'gte' }, hits: [] } } };
      translateResponse(response, es6Backend);
      expect(response.body.hits.total).toEqual({ value: 10, relation: 'gte' });
    });

    it('strips _type from hits', () => {
      const response = {
        body: {
          hits: {
            total: 1,
            hits: [{ _index: 'test', _type: '_doc', _id: '1', _source: {} }],
          },
        },
      };
      translateResponse(response, es6Backend);
      expect(response.body.hits.hits[0]._type).toBeUndefined();
      expect(response.body.hits.hits[0]._id).toBe('1');
    });

    it('synthesizes _seq_no from _version when missing', () => {
      const response = {
        body: {
          hits: {
            total: 1,
            hits: [{ _index: 'test', _id: '1', _version: 3, _source: {} }],
          },
        },
      };
      translateResponse(response, es6Backend);
      expect(response.body.hits.hits[0]._seq_no).toBe(3);
      expect(response.body.hits.hits[0]._primary_term).toBe(1);
    });

    it('returns response unchanged when no hits', () => {
      const response = { body: { acknowledged: true } };
      const result = translateResponse(response, es6Backend);
      expect(result).toBe(response);
    });
  });

  describe('translateMsearchRequest', () => {
    it('transforms search bodies at odd indices', () => {
      const params = {
        body: [
          { index: 'test' },
          { query: { match_all: {} }, track_total_hits: true },
          { index: 'other' },
          { query: { match_all: {} }, track_total_hits: 10 },
        ],
      };
      const result = translateMsearchRequest(params, es6Backend);
      expect(result.body[0]).toEqual({ index: 'test' });
      expect(result.body[1].track_total_hits).toBeUndefined();
      expect(result.body[2]).toEqual({ index: 'other' });
      expect(result.body[3].track_total_hits).toBeUndefined();
    });

    it('returns params unchanged when body is not an array', () => {
      const params = { body: { query: {} } };
      expect(translateMsearchRequest(params, es6Backend)).toBe(params);
    });
  });

  describe('translateMsearchResponse', () => {
    it('normalizes each sub-response', () => {
      const response = {
        body: {
          responses: [
            { hits: { total: 5, hits: [{ _type: '_doc', _id: '1' }] } },
            { hits: { total: 0, hits: [] } },
          ],
        },
      };
      translateMsearchResponse(response, es6Backend);
      expect(response.body.responses[0].hits.total).toEqual({ value: 5, relation: 'eq' });
      expect(response.body.responses[0].hits.hits[0]._type).toBeUndefined();
    });
  });
});
