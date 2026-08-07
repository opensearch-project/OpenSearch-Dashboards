/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  translateBulkRequest,
  translateCreateRequest,
  translateDocRequest,
  translateMgetRequest,
  translateDeleteByQueryRequest,
  translateResponse,
} from './document_adapter';
import { BackendInfo } from '../types';

const es6Backend: BackendInfo = {
  distribution: 'elasticsearch',
  version: '6.8.23',
  majorVersion: 6,
  minorVersion: 8,
  patchVersion: 23,
};

describe('document_adapter', () => {
  describe('translateBulkRequest', () => {
    it('adds _type to bulk action metadata', () => {
      const params = {
        bulkBody: [{ index: { _index: 'test', _id: '1' } }, { field: 'value' }],
      };
      const result = translateBulkRequest(params, es6Backend);
      expect(result.bulkBody[0].index._type).toBe('_doc');
    });

    it('does not overwrite existing _type', () => {
      const params = {
        bulkBody: [{ index: { _index: 'test', _id: '1', _type: 'custom' } }, { field: 'value' }],
      };
      const result = translateBulkRequest(params, es6Backend);
      expect(result.bulkBody[0].index._type).toBe('custom');
    });

    it('strips if_seq_no and if_primary_term from action metadata', () => {
      const params = {
        bulkBody: [
          { index: { _index: 'test', _id: '1', if_seq_no: 5, if_primary_term: 1 } },
          { field: 'value' },
        ],
      };
      const result = translateBulkRequest(params, es6Backend);
      expect(result.bulkBody[0].index.if_seq_no).toBeUndefined();
      expect(result.bulkBody[0].index.if_primary_term).toBeUndefined();
    });

    it('strips if_seq_no from querystring', () => {
      const params = {
        bulkBody: [{ index: { _index: 'test', _id: '1' } }, { field: 'value' }],
        querystring: { if_seq_no: 1, if_primary_term: 1, refresh: 'true' },
      };
      const result = translateBulkRequest(params, es6Backend);
      expect(result.querystring.if_seq_no).toBeUndefined();
      expect(result.querystring.refresh).toBe('true');
    });

    it('clears body and uses bulkBody for the transformed data', () => {
      const params = {
        body: [{ index: { _index: 'test', _id: '1' } }, { field: 'value' }],
      };
      const result = translateBulkRequest(params, es6Backend);
      expect(result.body).toBeUndefined();
      expect(result.bulkBody).toBeDefined();
      expect(result.bulkBody[0].index._type).toBe('_doc');
    });

    it('returns params unchanged when no array source', () => {
      const params = { body: { something: 'else' } };
      expect(translateBulkRequest(params, es6Backend)).toBe(params);
    });

    it('handles all bulk action types', () => {
      const params = {
        bulkBody: [
          { create: { _index: 'test', _id: '2' } },
          { field: 'a' },
          { update: { _index: 'test', _id: '3' } },
          { doc: { field: 'b' } },
          { delete: { _index: 'test', _id: '4' } },
        ],
      };
      const result = translateBulkRequest(params, es6Backend);
      expect(result.bulkBody[0].create._type).toBe('_doc');
      expect(result.bulkBody[2].update._type).toBe('_doc');
      expect(result.bulkBody[4].delete._type).toBe('_doc');
    });
  });

  describe('translateCreateRequest', () => {
    it('rewrites /_create to /_doc with op_type=create', () => {
      const params = { path: '/test-index/_create/1', querystring: {} };
      const result = translateCreateRequest(params, es6Backend);
      expect(result.path).toBe('/test-index/_doc/1');
      expect(result.querystring.op_type).toBe('create');
    });

    it('strips seq_no from querystring', () => {
      const params = {
        path: '/test/_create/1',
        querystring: { if_seq_no: 3, if_primary_term: 1 },
      };
      const result = translateCreateRequest(params, es6Backend);
      expect(result.querystring.if_seq_no).toBeUndefined();
      expect(result.querystring.if_primary_term).toBeUndefined();
    });
  });

  describe('translateDocRequest', () => {
    it('strips seq_no from querystring', () => {
      const params = {
        path: '/test/_doc/1',
        querystring: { if_seq_no: 5, if_primary_term: 1, routing: 'abc' },
      };
      const result = translateDocRequest(params, es6Backend);
      expect(result.querystring.if_seq_no).toBeUndefined();
      expect(result.querystring.routing).toBe('abc');
    });

    it('rewrites _update path for ES 6.x', () => {
      const params = { path: '/my-index/_update/doc-id', querystring: {} };
      const result = translateDocRequest(params, es6Backend);
      expect(result.path).toBe('/my-index/_doc/doc-id/_update');
    });

    it('strips _source params on _update rewrite', () => {
      const params = {
        path: '/idx/_update/1',
        querystring: { _source_include: 'a', _source_excludes: 'b' },
      };
      const result = translateDocRequest(params, es6Backend);
      expect(result.querystring._source_include).toBeUndefined();
      expect(result.querystring._source_excludes).toBeUndefined();
    });

    it('does not rewrite non-update paths', () => {
      const params = { path: '/my-index/_doc/1', querystring: {} };
      const result = translateDocRequest(params, es6Backend);
      expect(result.path).toBe('/my-index/_doc/1');
    });
  });

  describe('translateMgetRequest', () => {
    it('adds _type to each doc', () => {
      const params = {
        body: {
          docs: [
            { _index: 'test', _id: '1' },
            { _index: 'test', _id: '2' },
          ],
        },
      };
      const result = translateMgetRequest(params, es6Backend);
      expect(result.body.docs[0]._type).toBe('_doc');
      expect(result.body.docs[1]._type).toBe('_doc');
    });

    it('does not overwrite existing _type', () => {
      const params = {
        body: { docs: [{ _index: 'test', _id: '1', _type: 'custom' }] },
      };
      const result = translateMgetRequest(params, es6Backend);
      expect(result.body.docs[0]._type).toBe('custom');
    });

    it('passes through non-plain-object body', () => {
      const params = { body: 'string body' };
      expect(translateMgetRequest(params, es6Backend)).toBe(params);
    });
  });

  describe('translateDeleteByQueryRequest', () => {
    it('strips seq_no from querystring', () => {
      const params = {
        path: '/test/_delete_by_query',
        querystring: { if_seq_no: 1, if_primary_term: 1, conflicts: 'proceed' },
      };
      const result = translateDeleteByQueryRequest(params, es6Backend);
      expect(result.querystring.if_seq_no).toBeUndefined();
      expect(result.querystring.conflicts).toBe('proceed');
    });
  });

  describe('translateResponse', () => {
    it('strips _type and synthesizes _seq_no for single doc response', () => {
      const response = { body: { _index: 'test', _type: '_doc', _id: '1', _version: 2 } };
      translateResponse(response, es6Backend);
      expect(response.body._type).toBeUndefined();
      expect(response.body._seq_no).toBe(2);
      expect(response.body._primary_term).toBe(1);
    });

    it('normalizes bulk response items', () => {
      const response = {
        body: {
          items: [
            { index: { _index: 'test', _type: '_doc', _id: '1', _version: 1 } },
            { create: { _index: 'test', _type: '_doc', _id: '2', _version: 1 } },
          ],
        },
      };
      translateResponse(response, es6Backend);
      expect(response.body.items[0].index._type).toBeUndefined();
      expect(response.body.items[0].index._seq_no).toBe(1);
      expect(response.body.items[1].create._type).toBeUndefined();
    });

    it('normalizes mget response docs', () => {
      const response = {
        body: {
          docs: [
            { _index: 'test', _type: '_doc', _id: '1', _version: 5 },
            { _index: 'test', _id: '2', error: { type: 'not_found' } },
          ],
        },
      };
      translateResponse(response, es6Backend);
      expect(response.body.docs[0]._type).toBeUndefined();
      expect(response.body.docs[0]._seq_no).toBe(5);
      // Error docs should not be normalized
      expect(response.body.docs[1].error).toBeDefined();
    });

    it('returns response unchanged when body is empty', () => {
      const response = { body: null };
      expect(translateResponse(response, es6Backend)).toBe(response);
    });
  });
});
