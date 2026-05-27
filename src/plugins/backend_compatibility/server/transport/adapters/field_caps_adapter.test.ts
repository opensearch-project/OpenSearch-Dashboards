/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { translateRequest, translateResponse } from './field_caps_adapter';
import { BackendInfo } from '../types';

const es6Backend: BackendInfo = {
  distribution: 'elasticsearch',
  version: '6.8.23',
  majorVersion: 6,
  minorVersion: 8,
  patchVersion: 23,
};

describe('field_caps_adapter', () => {
  describe('translateRequest', () => {
    it('removes include_unmapped from querystring', () => {
      const params = {
        path: '/test/_field_caps',
        querystring: { include_unmapped: true, fields: '*' },
        body: undefined,
      };
      const result = translateRequest(params, es6Backend);
      expect(result.querystring.include_unmapped).toBeUndefined();
      expect(result.querystring.fields).toBe('*');
    });

    it('removes index_filter and runtime_mappings from body', () => {
      const params = {
        path: '/test/_field_caps',
        querystring: {},
        body: {
          index_filter: { range: { '@timestamp': { gte: 'now-1d' } } },
          runtime_mappings: { day_of_week: { type: 'keyword' } },
          fields: ['*'],
        },
      };
      const result = translateRequest(params, es6Backend);
      expect(result.body.index_filter).toBeUndefined();
      expect(result.body.runtime_mappings).toBeUndefined();
      expect(result.body.fields).toEqual(['*']);
    });

    it('sets body to undefined when only unsupported fields remain', () => {
      const params = {
        path: '/test/_field_caps',
        querystring: {},
        body: {
          index_filter: { match_all: {} },
          runtime_mappings: {},
        },
      };
      const result = translateRequest(params, es6Backend);
      expect(result.body).toBeUndefined();
    });

    it('passes through non-plain-object body', () => {
      const params = {
        path: '/test/_field_caps',
        querystring: {},
        body: 'raw string',
      };
      const result = translateRequest(params, es6Backend);
      expect(result.body).toBe('raw string');
    });
  });

  describe('translateResponse', () => {
    it('adds metadata_field: false to all field capabilities', () => {
      const response = {
        body: {
          fields: {
            title: { text: { type: 'text', searchable: true, aggregatable: false } },
            status: { keyword: { type: 'keyword', searchable: true, aggregatable: true } },
          },
        },
      };
      translateResponse(response, es6Backend);
      expect(response.body.fields.title.text.metadata_field).toBe(false);
      expect(response.body.fields.status.keyword.metadata_field).toBe(false);
    });

    it('returns response unchanged when no fields', () => {
      const response = { body: { indices: ['test'] } };
      const result = translateResponse(response, es6Backend);
      expect(result).toBe(response);
    });
  });
});
