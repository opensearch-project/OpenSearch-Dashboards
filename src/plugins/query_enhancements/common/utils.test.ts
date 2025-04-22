/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { isPPLSearchQuery, throwFacetError } from './utils';
import { Query } from 'src/plugins/data/common';

describe('throwFacetError', () => {
  it('should throw an error with message from response.data.body.message', () => {
    const response = {
      data: {
        body: {
          message: 'test error message',
        },
        status: '400',
      },
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

  it('should throw an error with message from response.data.body if it is a string', () => {
    const response = {
      data: {
        body: 'string error message',
        status: '500',
      },
    };

    expect(() => throwFacetError(response)).toThrowError();
    try {
      throwFacetError(response);
    } catch (err: any) {
      expect(err.message).toBe('string error message');
      expect(err.name).toBe('500');
      expect(err.status).toBe('500');
    }
  });

  it('should throw an error with message from response.data if body is undefined', () => {
    const response = {
      data: {
        message: 'fallback error message',
        status: '404',
      },
    };

    expect(() => throwFacetError(response)).toThrowError();
    try {
      throwFacetError(response);
    } catch (err: any) {
      expect(err.message).toBe('"fallback error message"');
      expect(err.name).toBe('404');
      expect(err.status).toBe('404');
    }
  });

  it('should throw an error with message from Error object', () => {
    const error = new Error('error object message');
    const response = {
      data: error,
    };

    expect(() => throwFacetError(response)).toThrowError();
    try {
      throwFacetError(response);
    } catch (err: any) {
      expect(err.message).toBe('error object message');
      expect(err.name).toBeUndefined();
      expect(err.status).toBeUndefined();
    }
  });

  it('should throw an error with stringified message if response.data.body is a plain object', () => {
    const response = {
      data: {
        body: { key: 'value' },
        status: '400',
      },
    };

    expect(() => throwFacetError(response)).toThrowError();
    try {
      throwFacetError(response);
    } catch (err: any) {
      expect(err.message).toBe('{"key":"value"}');
      expect(err.name).toBe('400');
      expect(err.status).toBe('400');
    }
  });

  it('should throw an error with default message if no valid message is found', () => {
    const response = {
      data: {},
    };

    expect(() => throwFacetError(response)).toThrowError();
    try {
      throwFacetError(response);
    } catch (err: any) {
      expect(err.message).toBe('{}');
      expect(err.name).toBeUndefined();
      expect(err.status).toBeUndefined();
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
