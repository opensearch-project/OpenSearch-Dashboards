/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { parseResponseToOptions, filterOptionsByRegex } from './variable_query_utils';

describe('parseResponseToOptions', () => {
  it('should return empty array for undefined response', () => {
    expect(parseResponseToOptions(undefined)).toEqual([]);
  });

  it('should return empty array for empty hits', () => {
    expect(parseResponseToOptions({ hits: { hits: [] } })).toEqual([]);
  });

  it('should extract string values from _source', () => {
    const response = {
      hits: {
        hits: [
          { _source: { service: 'api' } },
          { _source: { service: 'web' } },
          { _source: { service: 'worker' } },
        ],
      },
    };
    expect(parseResponseToOptions(response)).toEqual(['api', 'web', 'worker']);
  });

  it('should deduplicate values', () => {
    const response = {
      hits: {
        hits: [
          { _source: { service: 'api' } },
          { _source: { service: 'api' } },
          { _source: { service: 'web' } },
        ],
      },
    };
    expect(parseResponseToOptions(response)).toEqual(['api', 'web']);
  });

  it('should convert numbers to strings', () => {
    const response = {
      hits: {
        hits: [{ _source: { status: 200 } }, { _source: { status: 404 } }],
      },
    };
    expect(parseResponseToOptions(response)).toEqual(['200', '404']);
  });

  it('should convert booleans to strings', () => {
    const response = {
      hits: {
        hits: [{ _source: { active: true } }, { _source: { active: false } }],
      },
    };
    expect(parseResponseToOptions(response)).toEqual(['true', 'false']);
  });

  it('should flatten array values', () => {
    const response = {
      hits: {
        hits: [{ _source: { tags: ['a', 'b'] } }, { _source: { tags: ['c'] } }],
      },
    };
    expect(parseResponseToOptions(response)).toEqual(['a', 'b', 'c']);
  });

  it('should skip null and undefined values', () => {
    const response = {
      hits: {
        hits: [
          { _source: { service: null } },
          { _source: { service: 'api' } },
          { _source: { service: undefined } },
        ],
      },
    };
    expect(parseResponseToOptions(response)).toEqual(['api']);
  });

  it('should skip empty strings', () => {
    const response = {
      hits: {
        hits: [{ _source: { service: '' } }, { _source: { service: 'api' } }],
      },
    };
    expect(parseResponseToOptions(response)).toEqual(['api']);
  });

  it('should skip object values', () => {
    const response = {
      hits: {
        hits: [{ _source: { service: { nested: 'value' } } }, { _source: { service: 'api' } }],
      },
    };
    expect(parseResponseToOptions(response)).toEqual(['api']);
  });

  it('should return empty array when _source is missing', () => {
    const response = {
      hits: {
        hits: [{ fields: { service: ['api'] } }],
      },
    };
    expect(parseResponseToOptions(response)).toEqual([]);
  });
});

describe('filterOptionsByRegex', () => {
  const options = ['prod-api', 'prod-web', 'staging-api', 'dev-worker', 'PROD-DB'];

  it('should return all options when regex is undefined', () => {
    expect(filterOptionsByRegex(options, undefined)).toEqual(options);
  });

  it('should return all options when regex is empty string', () => {
    expect(filterOptionsByRegex(options, '')).toEqual(options);
  });

  it('should filter options with a plain regex string', () => {
    expect(filterOptionsByRegex(options, '^prod')).toEqual(['prod-api', 'prod-web']);
  });

  it('should filter options with /pattern/ syntax', () => {
    expect(filterOptionsByRegex(options, '/^prod/')).toEqual(['prod-api', 'prod-web']);
  });

  it('should support /pattern/flags syntax', () => {
    expect(filterOptionsByRegex(options, '/^prod/i')).toEqual(['prod-api', 'prod-web', 'PROD-DB']);
  });

  it('should return all options for invalid regex', () => {
    expect(filterOptionsByRegex(options, '/[invalid')).toEqual(options);
  });

  it('should return empty array when no options match', () => {
    expect(filterOptionsByRegex(options, '^xyz')).toEqual([]);
  });

  it('should work with partial match', () => {
    expect(filterOptionsByRegex(options, 'api')).toEqual(['prod-api', 'staging-api']);
  });
});
