/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { isPPLSearchQuery, throwFacetError, formatDate } from './utils';
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

describe('formatDate', () => {
  it('should format date string with milliseconds', () => {
    const dateString = '2025-07-30T20:30:31.567Z';
    const result = formatDate(dateString);
    expect(result).toBe('2025-07-30 20:30:31.567');
  });

  it('should format date string with zero milliseconds', () => {
    const dateString = '2025-07-30T20:30:31.000Z';
    const result = formatDate(dateString);
    expect(result).toBe('2025-07-30 20:30:31.000');
  });

  it('should format date string with single digit milliseconds', () => {
    const dateString = '2025-07-30T20:30:31.005Z';
    const result = formatDate(dateString);
    expect(result).toBe('2025-07-30 20:30:31.005');
  });

  it('should format date string with double digit milliseconds', () => {
    const dateString = '2025-07-30T20:30:31.050Z';
    const result = formatDate(dateString);
    expect(result).toBe('2025-07-30 20:30:31.050');
  });

  it('should format date string with maximum milliseconds', () => {
    const dateString = '2025-07-30T20:30:31.999Z';
    const result = formatDate(dateString);
    expect(result).toBe('2025-07-30 20:30:31.999');
  });

  it('should handle different date formats', () => {
    const dateString = '2025-01-01T00:00:00.123Z';
    const result = formatDate(dateString);
    expect(result).toBe('2025-01-01 00:00:00.123');
  });

  it('should pad single digit months and days', () => {
    const dateString = '2025-01-05T09:08:07.456Z';
    const result = formatDate(dateString);
    expect(result).toBe('2025-01-05 09:08:07.456');
  });

  it('should handle leap year dates', () => {
    const dateString = '2024-02-29T12:34:56.789Z';
    const result = formatDate(dateString);
    expect(result).toBe('2024-02-29 12:34:56.789');
  });

  it('should handle end of year dates', () => {
    const dateString = '2025-12-31T23:59:59.999Z';
    const result = formatDate(dateString);
    expect(result).toBe('2025-12-31 23:59:59.999');
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
