/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { isPPLSearchQuery, throwFacetError } from './utils';
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

describe('isPPLSearchQuery', () => {
  it('should return false if query language is not PPL', () => {
    const query: Query = {
      language: 'lucene',
      query: 'test',
    };

    expect(isPPLSearchQuery(query)).toBe(false);
  });

  it('should return false if query is not string', () => {
    const query: Query = {
      language: 'PPL',
      query: {
        field: 'something',
      },
    };

    expect(isPPLSearchQuery(query)).toBe(false);
  });

  it('should return false if query is not using search command', () => {
    const query: Query = {
      language: 'PPL',
      query: 'test',
    };

    expect(isPPLSearchQuery(query)).toBe(false);
  });

  it('should return true if query is using search command', () => {
    const query: Query = {
      language: 'PPL',
      query: 'source = test | stats count',
    };

    expect(isPPLSearchQuery(query)).toBe(true);

    query.query = 'search source = test | stats count';
    expect(isPPLSearchQuery(query)).toBe(true);
  });
});
