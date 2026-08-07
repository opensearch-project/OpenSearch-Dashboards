/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { translateRequest, translateResponse } from './scroll_adapter';
import { BackendInfo } from '../types';

const es6Backend: BackendInfo = {
  distribution: 'elasticsearch',
  version: '6.8.23',
  majorVersion: 6,
  minorVersion: 8,
  patchVersion: 23,
};

describe('scroll_adapter', () => {
  describe('translateRequest', () => {
    it('passes through params unchanged', () => {
      const params = { path: '/_search/scroll', body: { scroll_id: 'abc' } };
      expect(translateRequest(params, es6Backend)).toBe(params);
    });
  });

  describe('translateResponse', () => {
    it('normalizes numeric hits.total to object format', () => {
      const response = {
        body: {
          hits: { total: 100, hits: [] },
        },
      };
      translateResponse(response, es6Backend);
      expect(response.body.hits.total).toEqual({ value: 100, relation: 'eq' });
    });

    it('strips _type from hits', () => {
      const response = {
        body: {
          hits: {
            total: { value: 1, relation: 'eq' },
            hits: [{ _index: 'test', _type: '_doc', _id: '1', _source: {} }],
          },
        },
      };
      translateResponse(response, es6Backend);
      expect(response.body.hits.hits[0]._type).toBeUndefined();
      expect(response.body.hits.hits[0]._id).toBe('1');
    });

    it('synthesizes _seq_no from _version', () => {
      const response = {
        body: {
          hits: {
            total: 1,
            hits: [{ _index: 'test', _id: '1', _version: 4, _source: {} }],
          },
        },
      };
      translateResponse(response, es6Backend);
      expect(response.body.hits.hits[0]._seq_no).toBe(4);
      expect(response.body.hits.hits[0]._primary_term).toBe(1);
    });

    it('returns response unchanged when no hits', () => {
      const response = { body: { _scroll_id: 'abc' } };
      expect(translateResponse(response, es6Backend)).toBe(response);
    });
  });
});
