/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { isSearchQuery, throwFacetError } from './utils';
import { Query } from 'src/plugins/data/common';

describe('handleFacetError', () => {
  const error = new Error('mock-error');
  (error as any).body = {
    message: 'test error message',
  };
  (error as any).status = '400';
  it('should throw an error with message from response.data.body.message', () => {
    const response = {
      data: error,
    };

    expect(() => throwFacetError(response)).toThrowError();
    try {
      throwFacetError(response);
    } catch (err: any) {
      expect(err.message).toBe('test error message');
      expect(err.name).toBe('400');
      expect(err.status).toBe('400');
    }
  });
});

describe('isSearchQuery', () => {
  it('should return false if query language is not PPL', () => {
    const query: Query = {
      language: 'lucene',
      query: 'test',
    };

    expect(isSearchQuery(query)).toBe(false);
  });

  it('should return false if query is not string', () => {
    const query: Query = {
      language: 'PPL',
      query: {
        field: 'something',
      },
    };

    expect(isSearchQuery(query)).toBe(false);
  });

  it('should return false if query is not using search command', () => {
    const query: Query = {
      language: 'PPL',
      query: 'test',
    };

    expect(isSearchQuery(query)).toBe(false);
  });

  it('should return true if query is using search command', () => {
    const query: Query = {
      language: 'PPL',
      query: 'source = test | stats count',
    };

    expect(isSearchQuery(query)).toBe(true);

    query.query = 'search source = test | stats count';
    expect(isSearchQuery(query)).toBe(true);
  });
});
