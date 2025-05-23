/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpStart, SavedObjectsClientContract } from 'opensearch-dashboards/public';
import { httpServiceMock, savedObjectsServiceMock } from '../../../../../../core/public/mocks';
import {
  fetchDirectQuerySyncInfo,
  resolveConcreteIndex,
  fetchIndexMapping,
  extractIndexInfo,
  extractIndexParts,
  generateRefreshQuery,
  DirectQuerySyncInfo,
  IndexExtractionResult,
} from './direct_query_sync_utils';

describe('DirectQuerySyncUtils', () => {
  let http: jest.Mocked<HttpStart>;
  let savedObjectsClient: jest.Mocked<SavedObjectsClientContract>;
  let onError: jest.Mock;

  beforeEach(() => {
    http = httpServiceMock.createStartContract();
    savedObjectsClient = savedObjectsServiceMock.createStartContract();
    // Explicitly mock savedObjectsClient.get as a Jest mock function
    savedObjectsClient.get = jest.fn();
    onError = jest.fn();
  });

  describe('fetchDirectQuerySyncInfo', () => {
    it('returns null if dashboard object is not found', async () => {
      http.get.mockResolvedValueOnce({
        version: '1.0.0',
        objects: [],
      });

      const result = await fetchDirectQuerySyncInfo({
        http,
        savedObjectsClient,
        dashboardId: 'dashboard-1',
        onError,
      });

      expect(result).toBeNull();
      expect(onError).toHaveBeenCalledWith('Failed to fetch dashboard information');
      expect(http.get).toHaveBeenCalledWith('/api/opensearch-dashboards/dashboards/export', {
        query: { dashboard: 'dashboard-1' },
      });
    });

    it('returns null if index patterns are inconsistent', async () => {
      http.get.mockResolvedValueOnce({
        version: '1.0.0',
        objects: [
          {
            id: 'dashboard-1',
            type: 'dashboard',
            attributes: {},
            references: [
              { name: 'panel_0', type: 'visualization', id: 'vis-1' },
              { name: 'panel_1', type: 'visualization', id: 'vis-2' },
            ],
          },
          {
            id: 'vis-1',
            type: 'visualization',
            attributes: {},
            references: [{ name: 'ref_0', type: 'index-pattern', id: 'index-1' }],
          },
          {
            id: 'vis-2',
            type: 'visualization',
            attributes: {},
            references: [{ name: 'ref_0', type: 'index-pattern', id: 'index-2' }],
          },
        ],
      });

      const result = await fetchDirectQuerySyncInfo({
        http,
        savedObjectsClient,
        dashboardId: 'dashboard-1',
        onError,
      });

      expect(result).toBeNull();
      expect(onError).not.toHaveBeenCalled();
      expect(http.get).toHaveBeenCalledWith('/api/opensearch-dashboards/dashboards/export', {
        query: { dashboard: 'dashboard-1' },
      });
    });

    it('returns null if no index patterns are found', async () => {
      http.get.mockResolvedValueOnce({
        version: '1.0.0',
        objects: [
          {
            id: 'dashboard-1',
            type: 'dashboard',
            attributes: {},
            references: [{ name: 'panel_0', type: 'visualization', id: 'vis-1' }],
          },
          {
            id: 'vis-1',
            type: 'visualization',
            attributes: {},
            references: [], // No index-pattern reference
          },
        ],
      });

      const result = await fetchDirectQuerySyncInfo({
        http,
        savedObjectsClient,
        dashboardId: 'dashboard-1',
        onError,
      });

      expect(result).toBeNull();
      expect(onError).not.toHaveBeenCalled();
    });

    it('returns sync info for a consistent index pattern', async () => {
      http.get
        .mockResolvedValueOnce({
          version: '1.0.0',
          objects: [
            {
              id: 'dashboard-1',
              type: 'dashboard',
              attributes: {},
              references: [{ name: 'panel_0', type: 'visualization', id: 'vis-1' }],
            },
            {
              id: 'vis-1',
              type: 'visualization',
              attributes: {},
              references: [{ name: 'ref_0', type: 'index-pattern', id: 'index-1' }],
            },
          ],
        })
        .mockResolvedValueOnce({
          indices: [{ name: 'concrete-index' }],
        })
        .mockResolvedValueOnce({
          'concrete-index': {
            mappings: {
              _meta: {
                name: 'test_datasource.test_database.test_index',
                properties: {
                  refreshInterval: 300,
                  lastRefreshTime: 1625097600000,
                },
              },
            },
          },
        });

      (savedObjectsClient.get as jest.Mock).mockResolvedValueOnce({
        id: 'index-1',
        type: 'index-pattern',
        attributes: { title: 'index-pattern-*' }, // Use a wildcard to trigger resolveConcreteIndex HTTP call
        references: [{ name: 'ref_0', type: 'data-source', id: 'mds-1' }],
      });

      const result = await fetchDirectQuerySyncInfo({
        http,
        savedObjectsClient,
        dashboardId: 'dashboard-1',
        onError,
      });

      expect(result).toEqual({
        refreshQuery: 'REFRESH MATERIALIZED VIEW `test_datasource`.`test_database`.`test_index`',
        refreshInterval: 300,
        lastRefreshTime: 1625097600000,
        mappingName: 'test_datasource.test_database.test_index',
        mdsId: 'mds-1',
      });
      expect(http.get).toHaveBeenCalledTimes(3);
      expect(http.get).toHaveBeenCalledWith('/api/opensearch-dashboards/dashboards/export', {
        query: { dashboard: 'dashboard-1' },
      });
      expect(http.get).toHaveBeenCalledWith(
        '/internal/index-pattern-management/resolve_index/index-pattern-*',
        {
          query: { data_source: 'mds-1' },
        }
      );
      expect(http.get).toHaveBeenCalledWith(
        '/api/directquery/dsl/indices.getFieldMapping/dataSourceMDSId=mds-1',
        {
          query: { index: 'concrete-index' },
        }
      );
      expect(savedObjectsClient.get).toHaveBeenCalledWith('index-pattern', 'index-1');
      expect(onError).not.toHaveBeenCalled();
    });

    it('returns null and calls onError if index pattern title is missing', async () => {
      http.get.mockResolvedValueOnce({
        version: '1.0.0',
        objects: [
          {
            id: 'dashboard-1',
            type: 'dashboard',
            attributes: {},
            references: [{ name: 'panel_0', type: 'visualization', id: 'vis-1' }],
          },
          {
            id: 'vis-1',
            type: 'visualization',
            attributes: {},
            references: [{ name: 'ref_0', type: 'index-pattern', id: 'index-1' }],
          },
        ],
      });

      (savedObjectsClient.get as jest.Mock).mockResolvedValueOnce({
        id: 'index-1',
        type: 'index-pattern',
        attributes: { title: '' }, // Missing title
        references: [{ name: 'ref_0', type: 'data-source', id: 'mds-1' }],
      });

      const result = await fetchDirectQuerySyncInfo({
        http,
        savedObjectsClient,
        dashboardId: 'dashboard-1',
        onError,
      });

      expect(result).toBeNull();
      expect(onError).toHaveBeenCalledWith('Failed to fetch dashboard information');
    });
  });

  describe('resolveConcreteIndex', () => {
    it('returns indexTitle if it does not contain wildcards', async () => {
      const result = await resolveConcreteIndex('my-index', http, 'mds-1');
      expect(result).toBe('my-index');
      expect(http.get).not.toHaveBeenCalled();
    });

    it('resolves index pattern to concrete index with mdsId', async () => {
      http.get.mockResolvedValueOnce({
        indices: [{ name: 'resolved-index' }],
      });

      const result = await resolveConcreteIndex('my-index*', http, 'mds-1');
      expect(result).toBe('resolved-index');
      expect(http.get).toHaveBeenCalledWith(
        '/internal/index-pattern-management/resolve_index/my-index*',
        {
          query: { data_source: 'mds-1' },
        }
      );
    });

    it('resolves index pattern to concrete index without mdsId', async () => {
      http.get.mockResolvedValueOnce({
        indices: [{ name: 'resolved-index' }],
      });

      const result = await resolveConcreteIndex('my-index*', http);
      expect(result).toBe('resolved-index');
      expect(http.get).toHaveBeenCalledWith(
        '/internal/index-pattern-management/resolve_index/my-index*',
        {
          query: {},
        }
      );
    });

    it('returns null if resolution fails', async () => {
      http.get.mockRejectedValueOnce(new Error('Failed to resolve index'));

      const result = await resolveConcreteIndex('my-index*', http, 'mds-1');
      expect(result).toBeNull();
      expect(http.get).toHaveBeenCalled();
    });

    it('returns null if no indices are matched', async () => {
      http.get.mockResolvedValueOnce({
        indices: [],
      });

      const result = await resolveConcreteIndex('my-index*', http, 'mds-1');
      expect(result).toBeNull();
      expect(http.get).toHaveBeenCalled();
    });
  });

  describe('fetchIndexMapping', () => {
    it('fetches index mapping with mdsId', async () => {
      const mockMapping = { 'my-index': { mappings: { some: 'mapping' } } };
      http.get.mockResolvedValueOnce(mockMapping);

      const result = await fetchIndexMapping('my-index', http, 'mds-1');
      expect(result).toEqual(mockMapping);
      expect(http.get).toHaveBeenCalledWith(
        '/api/directquery/dsl/indices.getFieldMapping/dataSourceMDSId=mds-1',
        {
          query: { index: 'my-index' },
        }
      );
    });

    it('fetches index mapping without mdsId', async () => {
      const mockMapping = { 'my-index': { mappings: { some: 'mapping' } } };
      http.get.mockResolvedValueOnce(mockMapping);

      const result = await fetchIndexMapping('my-index', http);
      expect(result).toEqual(mockMapping);
      expect(http.get).toHaveBeenCalledWith('/api/directquery/dsl/indices.getFieldMapping', {
        query: { index: 'my-index' },
      });
    });

    it('returns null if fetch fails', async () => {
      http.get.mockRejectedValueOnce(new Error('Failed to fetch mapping'));

      const result = await fetchIndexMapping('my-index', http, 'mds-1');
      expect(result).toBeNull();
      expect(http.get).toHaveBeenCalled();
    });
  });

  describe('extractIndexInfo', () => {
    it('returns null values if mappingValues is missing', () => {
      const mapping = {};
      const concreteTitle = 'flint_test_datasource_default_test_index';

      const result = extractIndexInfo(mapping, concreteTitle);
      expect(result).toEqual({
        parts: expect.any(Object),
        refreshInterval: null,
        lastRefreshTime: null,
        mappingName: null,
      });
    });

    it('extracts info from mapping with meta data', () => {
      const mapping = {
        'my-index': {
          mappings: {
            _meta: {
              name: 'test_datasource.test_database.test_index',
              properties: {
                refreshInterval: 300,
                lastRefreshTime: 1625097600000,
              },
            },
          },
        },
      };
      const concreteTitle = 'flint_test_datasource_default_test_index';

      const result = extractIndexInfo(mapping, concreteTitle);
      expect(result).toEqual({
        parts: {
          datasource: 'test_datasource',
          database: 'test_database',
          index: 'test_index',
        },
        refreshInterval: 300,
        lastRefreshTime: 1625097600000,
        mappingName: 'test_datasource.test_database.test_index',
      });
    });

    it('falls back to concreteTitle if mappingName is missing', () => {
      const mapping = {
        'my-index': {
          mappings: {
            _meta: {
              properties: {
                refreshInterval: 300,
                lastRefreshTime: 1625097600000,
              },
            },
          },
        },
      };
      const concreteTitle = 'flint_test_datasource_default_test_index';

      const result = extractIndexInfo(mapping, concreteTitle);
      expect(result).toEqual({
        parts: {
          datasource: 'test_datasource',
          database: 'default',
          index: 'test_index',
        },
        refreshInterval: 300,
        lastRefreshTime: 1625097600000,
        mappingName: null,
      });
    });
  });

  describe('extractIndexParts', () => {
    it('extracts parts from mappingName with sufficient parts', () => {
      const mappingName = 'test_datasource.test_database.test_index';
      const result = extractIndexParts(mappingName);
      expect(result).toEqual({
        datasource: 'test_datasource',
        database: 'test_database',
        index: 'test_index',
      });
    });

    it('returns null result if mappingName has insufficient parts', () => {
      const mappingName = 'test_datasource';
      const result = extractIndexParts(mappingName);
      expect(result).toEqual({
        datasource: null,
        database: null,
        index: null,
      });
    });

    it('extracts parts from concreteTitle using flint pattern', () => {
      const concreteTitle = 'flint_test_datasource_default_test_index';
      const result = extractIndexParts(undefined, concreteTitle);
      expect(result).toEqual({
        datasource: 'test_datasource',
        database: 'default',
        index: 'test_index',
      });
    });

    it('returns null result if concreteTitle does not match flint pattern', () => {
      const concreteTitle = 'invalid_title';
      const result = extractIndexParts(undefined, concreteTitle);
      expect(result).toEqual({
        datasource: null,
        database: null,
        index: null,
      });
    });

    it('returns null result if neither mappingName nor concreteTitle is provided', () => {
      const result = extractIndexParts();
      expect(result).toEqual({
        datasource: null,
        database: null,
        index: null,
      });
    });
  });

  describe('generateRefreshQuery', () => {
    it('generates refresh query with valid parts', () => {
      const parts: IndexExtractionResult = {
        datasource: 'test_datasource',
        database: 'test_database',
        index: 'test_index',
      };
      const result = generateRefreshQuery(parts);
      expect(result).toBe(
        'REFRESH MATERIALIZED VIEW `test_datasource`.`test_database`.`test_index`'
      );
    });

    it('throws error if datasource is missing', () => {
      const parts: IndexExtractionResult = {
        datasource: null,
        database: 'test_database',
        index: 'test_index',
      };
      expect(() => generateRefreshQuery(parts)).toThrow(
        'Cannot generate refresh query: missing required datasource, database, or index'
      );
    });

    it('throws error if database is missing', () => {
      const parts: IndexExtractionResult = {
        datasource: 'test_datasource',
        database: null,
        index: 'test_index',
      };
      expect(() => generateRefreshQuery(parts)).toThrow(
        'Cannot generate refresh query: missing required datasource, database, or index'
      );
    });

    it('throws error if index is missing', () => {
      const parts: IndexExtractionResult = {
        datasource: 'test_datasource',
        database: 'test_database',
        index: null,
      };
      expect(() => generateRefreshQuery(parts)).toThrow(
        'Cannot generate refresh query: missing required datasource, database, or index'
      );
    });
  });
});
