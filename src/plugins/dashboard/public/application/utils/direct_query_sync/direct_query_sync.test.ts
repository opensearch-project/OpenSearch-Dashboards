/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  sourceCheck,
  resolveConcreteIndex,
  extractIndexParts,
  generateRefreshQuery,
  fetchIndexMapping,
  extractIndexInfoFromDashboard,
} from './direct_query_sync';
import { HttpStart, SavedObjectsClientContract } from 'opensearch-dashboards/public';

describe('sourceCheck', () => {
  it('returns true if all indexPatternIds and mdsIds are the same', () => {
    const indexPatternIds = ['pattern-1', 'pattern-1', 'pattern-1'];
    const mdsIds = ['mds-1', 'mds-1', 'mds-1'];

    expect(sourceCheck(indexPatternIds, mdsIds)).toBe(true);
  });

  it('returns false if indexPatternIds are different', () => {
    const indexPatternIds = ['pattern-1', 'pattern-2', 'pattern-1'];
    const mdsIds = ['mds-1', 'mds-1', 'mds-1'];

    expect(sourceCheck(indexPatternIds, mdsIds)).toBe(false);
  });

  it('returns false if mdsIds are different', () => {
    const indexPatternIds = ['pattern-1', 'pattern-1', 'pattern-1'];
    const mdsIds = ['mds-1', 'mds-2', 'mds-1'];

    expect(sourceCheck(indexPatternIds, mdsIds)).toBe(false);
  });

  it('returns false if both indexPatternIds and mdsIds are different', () => {
    const indexPatternIds = ['pattern-1', 'pattern-2'];
    const mdsIds = ['mds-1', 'mds-2'];

    expect(sourceCheck(indexPatternIds, mdsIds)).toBe(false);
  });

  it('returns true if empty arrays (edge case)', () => {
    expect(sourceCheck([], [])).toBe(true);
  });

  it('returns true if single entry arrays', () => {
    expect(sourceCheck(['pattern-1'], ['mds-1'])).toBe(true);
  });

  it('returns false if mdsIds contains undefined and other values', () => {
    const indexPatternIds = ['pattern-1', 'pattern-1'];
    const mdsIds = [undefined, 'mds-1'];
    expect(sourceCheck(indexPatternIds, mdsIds)).toBe(false);
  });

  it('returns true if all mdsIds are undefined', () => {
    const indexPatternIds = ['pattern-1', 'pattern-1'];
    const mdsIds = [undefined, undefined];
    expect(sourceCheck(indexPatternIds, mdsIds)).toBe(true);
  });
});

describe('resolveConcreteIndex', () => {
  let mockHttp: jest.Mocked<HttpStart>;

  beforeEach(() => {
    mockHttp = ({
      get: jest.fn(),
    } as unknown) as jest.Mocked<HttpStart>;
  });

  it('returns the input index if it does not contain wildcards', async () => {
    const result = await resolveConcreteIndex('my_index', mockHttp);
    expect(result).toBe('my_index');
    expect(mockHttp.get).not.toHaveBeenCalled();
  });

  it('resolves wildcard index with mdsId', async () => {
    mockHttp.get.mockResolvedValue({ indices: [{ name: 'resolved_index' }] });
    const result = await resolveConcreteIndex('my_index*', mockHttp, 'mds-1');
    expect(mockHttp.get).toHaveBeenCalledWith(
      '/internal/index-pattern-management/resolve_index/my_index*',
      {
        query: { data_source: 'mds-1' },
      }
    );
    expect(result).toBe('resolved_index');
  });

  it('returns null if no matching indices are found', async () => {
    mockHttp.get.mockResolvedValue({ indices: [] });
    const result = await resolveConcreteIndex('my_index*', mockHttp);
    expect(result).toBe(null);
  });

  it('returns null on HTTP error', async () => {
    mockHttp.get.mockRejectedValue(new Error('Network error'));
    const result = await resolveConcreteIndex('my_index*', mockHttp);
    expect(result).toBe(null);
  });
});

describe('extractIndexParts', () => {
  it('correctly extracts parts from a mapping name', () => {
    const result = extractIndexParts('datasource1.database1.my_index');
    expect(result).toEqual({
      datasource: 'datasource1',
      database: 'database1',
      index: 'my_index',
    });
  });

  it('handles missing parts with null values', () => {
    const result = extractIndexParts('datasource1');
    expect(result).toEqual({
      datasource: 'datasource1',
      database: null,
      index: null,
    });
  });

  it('handles empty mapping name with null values', () => {
    const result = extractIndexParts('');
    expect(result).toEqual({
      datasource: null,
      database: null,
      index: null,
    });
  });

  it('returns null values when mappingName is undefined', () => {
    const result = extractIndexParts(undefined);
    expect(result).toEqual({
      datasource: null,
      database: null,
      index: null,
    });
  });
});

describe('generateRefreshQuery', () => {
  it('generates correct refresh query', () => {
    const info = {
      datasource: 'datasource1',
      database: 'database1',
      index: 'my_index',
    };
    const result = generateRefreshQuery(info);
    expect(result).toBe('REFRESH MATERIALIZED VIEW `datasource1`.`database1`.`my_index`');
  });

  it('throws an error if datasource is null', () => {
    const info = {
      datasource: null,
      database: 'database1',
      index: 'my_index',
    };
    expect(() => generateRefreshQuery(info)).toThrow(
      'Cannot generate refresh query: missing required datasource, database, or index'
    );
  });

  it('throws an error if database is null', () => {
    const info = {
      datasource: 'datasource1',
      database: null,
      index: 'my_index',
    };
    expect(() => generateRefreshQuery(info)).toThrow(
      'Cannot generate refresh query: missing required datasource, database, or index'
    );
  });

  it('throws an error if index is null', () => {
    const info = {
      datasource: 'datasource1',
      database: 'database1',
      index: null,
    };
    expect(() => generateRefreshQuery(info)).toThrow(
      'Cannot generate refresh query: missing required datasource, database, or index'
    );
  });
});

describe('fetchIndexMapping', () => {
  let mockHttp: jest.Mocked<HttpStart>;

  beforeEach(() => {
    mockHttp = ({
      get: jest.fn(),
    } as unknown) as jest.Mocked<HttpStart>;
  });

  it('fetches mapping without mdsId', async () => {
    const mockResponse = { mapping: { _meta: { properties: { lastRefreshTime: 12345 } } } };
    mockHttp.get.mockResolvedValue(mockResponse);
    const result = await fetchIndexMapping('my_index', mockHttp);
    expect(mockHttp.get).toHaveBeenCalledWith('/api/directquery/dsl/indices.getFieldMapping', {
      query: { index: 'my_index' },
    });
    expect(result).toBe(mockResponse);
  });

  it('fetches mapping with mdsId', async () => {
    const mockResponse = { mapping: { _meta: { properties: { lastRefreshTime: 12345 } } } };
    mockHttp.get.mockResolvedValue(mockResponse);
    const result = await fetchIndexMapping('my_index', mockHttp, 'mds-1');
    expect(mockHttp.get).toHaveBeenCalledWith(
      '/api/directquery/dsl/indices.getFieldMapping/dataSourceMDSId=mds-1',
      {
        query: { index: 'my_index' },
      }
    );
    expect(result).toBe(mockResponse);
  });

  it('returns null on error', async () => {
    mockHttp.get.mockRejectedValue(new Error('Network error'));
    const result = await fetchIndexMapping('my_index', mockHttp);
    expect(result).toBe(null);
  });
});

describe('extractIndexInfoFromDashboard', () => {
  let mockSavedObjectsClient: jest.Mocked<SavedObjectsClientContract>;
  let mockHttp: jest.Mocked<HttpStart>;

  beforeEach(() => {
    mockSavedObjectsClient = ({
      get: jest.fn(),
    } as unknown) as jest.Mocked<SavedObjectsClientContract>;
    mockHttp = ({
      get: jest.fn(),
    } as unknown) as jest.Mocked<HttpStart>;
  });

  it('returns null if panels have no savedObjectId', async () => {
    const panels = { panel1: { explicitInput: {} } };
    const result = await extractIndexInfoFromDashboard(panels, mockSavedObjectsClient, mockHttp);
    expect(result).toBe(null);
    expect(mockSavedObjectsClient.get).not.toHaveBeenCalled();
  });

  it('returns null if references include non-index-pattern types', async () => {
    mockSavedObjectsClient.get.mockResolvedValueOnce({
      references: [{ type: 'data-source', id: 'ds-1', name: 'Data Source 1' }],
      attributes: {},
    });
    const panels = { panel1: { explicitInput: { savedObjectId: 'so-1' }, type: 'visualization' } };
    const result = await extractIndexInfoFromDashboard(panels, mockSavedObjectsClient, mockHttp);
    expect(result).toBe(null);
  });

  it('returns null if no index-pattern reference is found', async () => {
    mockSavedObjectsClient.get.mockResolvedValueOnce({
      references: [{ type: 'other', id: 'other-1', name: 'Other 1' }],
      attributes: {},
    });
    const panels = { panel1: { explicitInput: { savedObjectId: 'so-1' }, type: 'visualization' } };
    const result = await extractIndexInfoFromDashboard(panels, mockSavedObjectsClient, mockHttp);
    expect(result).toBe(null);
  });

  it('returns null if concrete index cannot be resolved', async () => {
    mockSavedObjectsClient.get
      .mockResolvedValueOnce({
        references: [{ type: 'index-pattern', id: 'ip-1', name: 'Index Pattern 1' }],
        attributes: {},
      })
      .mockResolvedValueOnce({
        attributes: { title: 'my_index*' },
        references: [],
      })
      .mockResolvedValueOnce({
        attributes: { title: 'my_index*' },
        references: [],
      });
    mockHttp.get.mockResolvedValueOnce({ indices: [] });
    const panels = { panel1: { explicitInput: { savedObjectId: 'so-1' }, type: 'visualization' } };
    const result = await extractIndexInfoFromDashboard(panels, mockSavedObjectsClient, mockHttp);
    expect(result).toBe(null);
  });

  it('handles 404 saved object errors gracefully', async () => {
    mockSavedObjectsClient.get.mockRejectedValueOnce({ response: { status: 404 } });
    const panels = { panel1: { explicitInput: { savedObjectId: 'so-1' }, type: 'visualization' } };
    const result = await extractIndexInfoFromDashboard(panels, mockSavedObjectsClient, mockHttp);
    expect(result).toBe(null);
  });

  it('throws non-404 saved object errors', async () => {
    mockSavedObjectsClient.get.mockRejectedValueOnce({ response: { status: 500 } });
    const panels = { panel1: { explicitInput: { savedObjectId: 'so-1' }, type: 'visualization' } };
    await expect(
      extractIndexInfoFromDashboard(panels, mockSavedObjectsClient, mockHttp)
    ).rejects.toMatchObject({ response: { status: 500 } });
  });
});
