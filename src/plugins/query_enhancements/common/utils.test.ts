/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { isPPLSearchQuery, queryEndsWithHead, throwFacetError, formatDate } from './utils';
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

describe('queryEndsWithHead', () => {
  it('should detect head at end of query', () => {
    expect(queryEndsWithHead('source=t | head 100')).toBe(true);
  });

  it('should return false when head is followed by other commands', () => {
    expect(queryEndsWithHead('source=t | head 100 | fields age')).toBe(false);
    expect(queryEndsWithHead('source=t | head 100 | sort name ASC')).toBe(false);
  });

  it('should detect head at end after other commands', () => {
    expect(queryEndsWithHead('source=t | where age > 20 | head 200')).toBe(true);
  });

  it('should return false when no head is present', () => {
    expect(queryEndsWithHead('source=t | fields age')).toBe(false);
  });

  it('should allow trailing where clause (time-range filter)', () => {
    expect(
      queryEndsWithHead(
        "source=t | head 800 | where timestamp >= '2024-01-01' and timestamp <= '2024-12-31'"
      )
    ).toBe(true);
  });

  it('should return false when head is followed by non-where commands then where', () => {
    expect(
      queryEndsWithHead("source=t | head 800 | sort name ASC | where timestamp >= '2024-01-01'")
    ).toBe(false);
  });

  it('should return false when head is only inside a subquery', () => {
    expect(queryEndsWithHead('source=t | where id in [source=other | head 10] | fields age')).toBe(
      false
    );
  });

  it('should return false for join query with head only in subquery', () => {
    expect(
      queryEndsWithHead(
        'source=state_country | inner join left=a, right=b ON a.name = b.name' +
          ' [source=state_country | sort name | head 3] | sort a.name | fields a.name, a.age'
      )
    ).toBe(false);
  });

  it('should detect head at end of join query', () => {
    expect(
      queryEndsWithHead(
        'source=state_country | inner join left=a, right=b ON a.name = b.name' +
          ' [source=state_country | sort name | head 3] | sort a.name | head 100'
      )
    ).toBe(true);
  });

  it('should be case insensitive', () => {
    expect(queryEndsWithHead('source=t | HEAD 100')).toBe(true);
    expect(queryEndsWithHead('source=t | Head 50')).toBe(true);
  });

  it('should detect head without a number (PPL defaults to 10)', () => {
    expect(queryEndsWithHead('source=t | head')).toBe(true);
  });

  it('should not match field names containing head', () => {
    expect(queryEndsWithHead('source=t | fields header, headline')).toBe(false);
  });

  it('should detect head with extra whitespace', () => {
    expect(queryEndsWithHead('source=t |   head   100')).toBe(true);
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
