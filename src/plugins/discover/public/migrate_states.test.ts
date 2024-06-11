/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { migrateUrlState } from './migrate_state';
import { setStateToOsdUrl, getStateFromOsdUrl } from '../../opensearch_dashboards_utils/public';

jest.mock('../../opensearch_dashboards_utils/public', () => ({
  setStateToOsdUrl: jest.fn(),
  getStateFromOsdUrl: jest.fn(),
}));

describe('migrateUrlState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the new path if no matching pattern', () => {
    const result = migrateUrlState('#/unknown', '/newPath');
    expect(result).toBe('/newPath');
  });

  it('should migrate doc view', () => {
    const result = migrateUrlState('#/doc/indexPattern/id', '/newPath');
    expect(result).toBe('#/doc/indexPattern/id');
  });

  it('should migrate context view', () => {
    const result = migrateUrlState('#/context/indexPattern/id', '/newPath');
    expect(result).toBe('#/context/indexPattern/id');
  });

  it('should migrate discover view with saved search id and with global state', () => {
    (getStateFromOsdUrl as jest.Mock).mockImplementation((key) => {
      if (key === '_a') {
        return {
          columns: ['column1'],
          filters: [],
          index: 'indexPattern',
          interval: 'auto',
          query: { language: 'kuery', query: 'test' },
          sort: [['field', 'desc']],
          savedQuery: 'savedQueryId',
        };
      }
      if (key === '_g') {
        return {
          time: { from: 'now-15m', to: 'now' },
          filters: [],
          refreshInterval: { pause: true, value: 0 },
        };
      }
      return null;
    });

    (setStateToOsdUrl as jest.Mock).mockImplementation((key, state, options, rawUrl) => {
      const query = new URLSearchParams(rawUrl.split('?')[1] || '');
      query.set(key, JSON.stringify(state)); // Simplified encoding
      return `${rawUrl.split('?')[0]}?${query.toString()}`;
    });

    const result = migrateUrlState('#/view/savedSearchId', '/newPath');
    const decodedResult = decodeURIComponent(result);
    const expectedPath =
      '/newPath#/view/savedSearchId?_g={"time":{"from":"now-15m","to":"now"},"filters":[],"refreshInterval":{"pause":true,"value":0}}&_a={"discover":{"columns":["column1"],"interval":"auto","sort":[["field","desc"]],"savedQuery":"savedQueryId"},"metadata":{"indexPattern":"indexPattern"}}&_q={"query":{"language":"kuery","query":"test"},"filters":[]}';
    expect(decodedResult).toBe(expectedPath);
  });

  it('should migrate discover view without saved search id and with global state', () => {
    (getStateFromOsdUrl as jest.Mock).mockImplementation((key) => {
      if (key === '_a') {
        return {
          columns: ['column1'],
          filters: [],
          index: 'indexPattern',
          interval: 'auto',
          query: { language: 'kuery', query: 'test' },
          sort: [['field', 'desc']],
          savedQuery: 'savedQueryId',
        };
      }
      if (key === '_g') {
        return {
          time: { from: 'now-15m', to: 'now' },
          filters: [],
          refreshInterval: { pause: true, value: 0 },
        };
      }
      return null;
    });

    const result = migrateUrlState('#/', '/newPath');
    const decodedResult = decodeURIComponent(result);
    const expectedPath =
      '/newPath?_g={"time":{"from":"now-15m","to":"now"},"filters":[],"refreshInterval":{"pause":true,"value":0}}&_a={"discover":{"columns":["column1"],"interval":"auto","sort":[["field","desc"]],"savedQuery":"savedQueryId"},"metadata":{"indexPattern":"indexPattern"}}&_q={"query":{"language":"kuery","query":"test"},"filters":[]}';
    expect(decodedResult).toBe(expectedPath);
  });

  it('should migrate discover view without saved search id and without global state', () => {
    (getStateFromOsdUrl as jest.Mock).mockImplementation((key) => {
      if (key === '_a') {
        return {
          columns: ['column1'],
          filters: [],
          index: 'indexPattern',
          interval: 'auto',
          query: { language: 'kuery', query: 'test' },
          sort: [['field', 'desc']],
          savedQuery: 'savedQueryId',
        };
      }
      return null;
    });

    (setStateToOsdUrl as jest.Mock).mockImplementation((key, state, options, rawUrl) => {
      const query = new URLSearchParams(rawUrl.split('?')[1] || '');
      query.set(key, JSON.stringify(state)); // Simplified encoding
      return `${rawUrl.split('?')[0]}?${query.toString()}`;
    });

    const result = migrateUrlState('#/', '/newPath');
    const decodedResult = decodeURIComponent(result);
    const expectedPath =
      '/newPath?_g=null&_a={"discover":{"columns":["column1"],"interval":"auto","sort":[["field","desc"]],"savedQuery":"savedQueryId"},"metadata":{"indexPattern":"indexPattern"}}&_q={"query":{"language":"kuery","query":"test"},"filters":[]}';
    expect(decodedResult).toBe(expectedPath);
  });

  it('should return the new path if appState is null', () => {
    (getStateFromOsdUrl as jest.Mock).mockImplementation((key) => {
      if (key === '_a') {
        return null;
      }
      return null;
    });

    const result = migrateUrlState('#/view/savedSearchId', '/newPath');
    expect(result).toBe('/newPath#/view/savedSearchId');
  });

  it('should handle missing global state to null', () => {
    (getStateFromOsdUrl as jest.Mock).mockImplementation((key) => {
      if (key === '_a') {
        return {
          columns: ['column1'],
          filters: [],
          index: 'indexPattern',
          interval: 'auto',
          query: { language: 'kuery', query: 'test' },
          sort: [['field', 'desc']],
          savedQuery: 'savedQueryId',
        };
      }
      if (key === '_g') {
        return null;
      }
      return null;
    });

    const result = migrateUrlState('#/view/savedSearchId', '/newPath');
    const decodedResult = decodeURIComponent(result);
    const expectedPath =
      '/newPath#/view/savedSearchId?_g=null&_a={"discover":{"columns":["column1"],"interval":"auto","sort":[["field","desc"]],"savedQuery":"savedQueryId"},"metadata":{"indexPattern":"indexPattern"}}&_q={"query":{"language":"kuery","query":"test"},"filters":[]}';
    expect(decodedResult).toBe(expectedPath);
  });

  it('should handle present global state', () => {
    (getStateFromOsdUrl as jest.Mock).mockImplementation((key) => {
      if (key === '_a') {
        return {
          columns: ['column1'],
          filters: [],
          index: 'indexPattern',
          interval: 'auto',
          query: { language: 'kuery', query: 'test' },
          sort: [['field', 'desc']],
          savedQuery: 'savedQueryId',
        };
      }
      if (key === '_g') {
        return {
          time: { from: 'now-15m', to: 'now' },
          filters: [],
          refreshInterval: { pause: true, value: 0 },
        };
      }
      return null;
    });

    const result = migrateUrlState('#/view/savedSearchId', '/newPath');
    const decodedResult = decodeURIComponent(result);
    const expectedPath =
      '/newPath#/view/savedSearchId?_g={"time":{"from":"now-15m","to":"now"},"filters":[],"refreshInterval":{"pause":true,"value":0}}&_a={"discover":{"columns":["column1"],"interval":"auto","sort":[["field","desc"]],"savedQuery":"savedQueryId"},"metadata":{"indexPattern":"indexPattern"}}&_q={"query":{"language":"kuery","query":"test"},"filters":[]}';
    expect(decodedResult).toBe(expectedPath);
  });
});
