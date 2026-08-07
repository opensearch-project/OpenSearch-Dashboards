/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  translateRequest,
  translateIndexCreateRequest,
  translateResponse,
  downgradeFieldTypes,
  UNSUPPORTED_ES6_TYPES,
} from './mapping_adapter';
import { BackendInfo } from '../types';

const es6Backend: BackendInfo = {
  distribution: 'elasticsearch',
  version: '6.8.23',
  majorVersion: 6,
  minorVersion: 8,
  patchVersion: 23,
};

describe('mapping_adapter', () => {
  describe('downgradeFieldTypes', () => {
    it('downgrades flattened to object with enabled:false', () => {
      const { properties, downgrades } = downgradeFieldTypes({
        labels: { type: 'flattened' },
      });
      expect(properties.labels).toEqual({ type: 'object', enabled: false });
      expect(downgrades).toHaveLength(1);
    });

    it('downgrades search_as_you_type to text', () => {
      const { properties } = downgradeFieldTypes({
        suggest: { type: 'search_as_you_type', max_shingle_size: 3 },
      });
      expect(properties.suggest.type).toBe('text');
      expect(properties.suggest.max_shingle_size).toBeUndefined();
    });

    it('downgrades constant_keyword to keyword with null_value', () => {
      const { properties } = downgradeFieldTypes({
        env: { type: 'constant_keyword', value: 'production' },
      });
      expect(properties.env).toEqual({ type: 'keyword', null_value: 'production' });
    });

    it('downgrades histogram to object with enabled:false', () => {
      const { properties } = downgradeFieldTypes({
        latency: { type: 'histogram' },
      });
      expect(properties.latency).toEqual({ type: 'object', enabled: false });
    });

    it('downgrades wildcard to keyword', () => {
      const { properties } = downgradeFieldTypes({
        path: { type: 'wildcard' },
      });
      expect(properties.path.type).toBe('keyword');
    });

    it('downgrades version to keyword', () => {
      const { properties } = downgradeFieldTypes({
        semver: { type: 'version' },
      });
      expect(properties.semver).toEqual({ type: 'keyword' });
    });

    it('downgrades match_only_text to text', () => {
      const { properties } = downgradeFieldTypes({
        logs: { type: 'match_only_text' },
      });
      expect(properties.logs).toEqual({ type: 'text' });
    });

    it('downgrades unsigned_long to long', () => {
      const { properties } = downgradeFieldTypes({
        big_id: { type: 'unsigned_long' },
      });
      expect(properties.big_id).toEqual({ type: 'long' });
    });

    it('leaves supported types unchanged', () => {
      const { properties, downgrades } = downgradeFieldTypes({
        name: { type: 'keyword' },
        count: { type: 'long' },
      });
      expect(properties.name).toEqual({ type: 'keyword' });
      expect(properties.count).toEqual({ type: 'long' });
      expect(downgrades).toHaveLength(0);
    });

    it('recursively downgrades nested properties', () => {
      const { properties, downgrades } = downgradeFieldTypes({
        parent: {
          type: 'object',
          properties: {
            child: { type: 'flattened' },
          },
        },
      });
      expect(properties.parent.properties!.child).toEqual({ type: 'object', enabled: false });
      expect(downgrades).toHaveLength(1);
      expect(downgrades[0]).toContain('parent.child');
    });

    it('downgrades multi-fields', () => {
      const { properties, downgrades } = downgradeFieldTypes({
        title: {
          type: 'text',
          fields: {
            search: { type: 'search_as_you_type', max_shingle_size: 3 },
            raw: { type: 'keyword' },
          },
        },
      });
      expect(properties.title.fields!.search.type).toBe('text');
      expect(properties.title.fields!.raw.type).toBe('keyword');
      expect(downgrades).toHaveLength(1);
    });
  });

  describe('UNSUPPORTED_ES6_TYPES', () => {
    it('contains all expected types', () => {
      expect(UNSUPPORTED_ES6_TYPES).toContain('flattened');
      expect(UNSUPPORTED_ES6_TYPES).toContain('search_as_you_type');
      expect(UNSUPPORTED_ES6_TYPES).toContain('constant_keyword');
      expect(UNSUPPORTED_ES6_TYPES).toContain('histogram');
      expect(UNSUPPORTED_ES6_TYPES).toContain('wildcard');
      expect(UNSUPPORTED_ES6_TYPES).toContain('version');
      expect(UNSUPPORTED_ES6_TYPES).toContain('match_only_text');
      expect(UNSUPPORTED_ES6_TYPES).toContain('unsigned_long');
    });
  });

  describe('translateRequest', () => {
    it('adds include_type_name=true to querystring', () => {
      const params = { path: '/my-index/_mapping', querystring: {}, body: undefined };
      const result = translateRequest(params, es6Backend);
      expect(result.querystring.include_type_name).toBe(true);
    });

    it('rewrites /{index}/_mapping to /{index}/_doc/_mapping', () => {
      const params = { path: '/my-index/_mapping', querystring: {}, body: undefined };
      const result = translateRequest(params, es6Backend);
      expect(result.path).toBe('/my-index/_doc/_mapping');
    });

    it('does not double-insert _doc in path', () => {
      const params = { path: '/my-index/_doc/_mapping', querystring: {}, body: undefined };
      const result = translateRequest(params, es6Backend);
      expect(result.path).toBe('/my-index/_doc/_mapping');
    });

    it('downgrades field types in PUT mapping body', () => {
      const params = {
        path: '/my-index/_mapping',
        querystring: {},
        body: { properties: { data: { type: 'flattened' } } },
      };
      const result = translateRequest(params, es6Backend);
      expect(result.body.properties.data).toEqual({ type: 'object', enabled: false });
    });

    it('passes through non-plain-object body', () => {
      const buf = Buffer.from('{}');
      const params = { path: '/idx/_mapping', querystring: {}, body: buf };
      const result = translateRequest(params, es6Backend);
      expect(result.body).toBe(buf);
    });
  });

  describe('translateIndexCreateRequest', () => {
    it('wraps typeless mappings in _doc for ES 6.x', () => {
      const params = {
        path: '/new-index',
        querystring: {},
        body: {
          mappings: { properties: { title: { type: 'text' } } },
          settings: { number_of_shards: 1 },
        },
      };
      const result = translateIndexCreateRequest(params, es6Backend);
      expect(result.body.mappings._doc).toBeDefined();
      expect(result.body.mappings._doc.properties.title).toEqual({ type: 'text' });
      expect(result.querystring.include_type_name).toBe(true);
    });

    it('downgrades field types before wrapping', () => {
      const params = {
        path: '/new-index',
        querystring: {},
        body: {
          mappings: { properties: { data: { type: 'flattened' } } },
        },
      };
      const result = translateIndexCreateRequest(params, es6Backend);
      expect(result.body.mappings._doc.properties.data).toEqual({
        type: 'object',
        enabled: false,
      });
    });

    it('passes through when body is not plain object', () => {
      const params = { path: '/new-index', querystring: {}, body: 'raw' };
      const result = translateIndexCreateRequest(params, es6Backend);
      expect(result.body).toBe('raw');
      expect(result.querystring.include_type_name).toBe(true);
    });

    it('passes through when no mappings in body', () => {
      const params = {
        path: '/new-index',
        querystring: {},
        body: { settings: { number_of_shards: 1 } },
      };
      const result = translateIndexCreateRequest(params, es6Backend);
      expect(result.body.mappings).toBeUndefined();
    });
  });

  describe('translateResponse', () => {
    it('unwraps typed mappings from response', () => {
      const response = {
        body: {
          'my-index': {
            mappings: {
              _doc: { properties: { title: { type: 'text' } } },
            },
          },
        },
      };
      translateResponse(response, es6Backend);
      expect(response.body['my-index'].mappings.properties).toEqual({ title: { type: 'text' } });
    });

    it('leaves typeless mappings unchanged', () => {
      const response = {
        body: {
          'my-index': {
            mappings: { properties: { title: { type: 'text' } } },
          },
        },
      };
      translateResponse(response, es6Backend);
      expect(response.body['my-index'].mappings.properties).toEqual({ title: { type: 'text' } });
    });

    it('handles null/undefined mappings', () => {
      const response = { body: { 'my-index': { mappings: null } } };
      expect(() => translateResponse(response, es6Backend)).not.toThrow();
    });
  });
});
