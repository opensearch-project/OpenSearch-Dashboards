/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CATALOG_CACHE_VERSION } from '../../../framework/constants';
import { CachedDataSourceStatus } from '../../../framework/types';
import {
  mockShowDatabasesPollingResult,
  mockShowIndexesPollingResult,
  mockShowTablesPollingResult,
} from './utils/mocks';
import {
  createLoadQuery,
  updateAccelerationsToCache,
  updateDatabasesToCache,
  updateTablesToCache,
  updateToCache,
} from '../../../framework/catlog_cache/cache_loader';
import { CatalogCacheManager } from '../../../framework/catlog_cache/cache_manager';

interface LooseObject {
  [key: string]: any;
}

// Mock localStorage
const localStorageMock = (() => {
  let store = {} as LooseObject;
  return {
    getItem(key: string) {
      return store[key] || null;
    },
    setItem(key: string, value: string) {
      store[key] = value.toString();
    },
    removeItem(key: string) {
      delete store[key];
    },
    clear() {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('loadCacheTests', () => {
  beforeEach(() => {
    jest.spyOn(window.localStorage, 'setItem');
    jest.spyOn(window.localStorage, 'getItem');
    jest.spyOn(window.localStorage, 'removeItem');
    jest.spyOn(CatalogCacheManager, 'addOrUpdateDataSource');
    jest.spyOn(CatalogCacheManager, 'updateDatabase');
    jest.spyOn(CatalogCacheManager, 'saveAccelerationsCache');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('updateDatabasesToCache', () => {
    it('should update cache with empty databases and status failed when polling result is null', () => {
      const dataSourceName = 'TestDataSource';
      const pollingResult = null;

      updateDatabasesToCache(dataSourceName, pollingResult);

      // Verify that addOrUpdateDataSource is called with the correct parameters
      expect(CatalogCacheManager.addOrUpdateDataSource).toHaveBeenCalledWith(
        {
          name: dataSourceName,
          databases: [],
          lastUpdated: expect.any(String),
          status: CachedDataSourceStatus.Failed,
        },
        undefined
      );
    });

    it('should update cache with new databases when polling result is not null', () => {
      const dataSourceName = 'TestDataSource';
      updateDatabasesToCache(dataSourceName, mockShowDatabasesPollingResult);

      // Verify that addOrUpdateDataSource is called with the correct parameters
      expect(CatalogCacheManager.addOrUpdateDataSource).toHaveBeenCalledWith(
        {
          name: dataSourceName,
          databases: [
            {
              name: 'Database1',
              tables: [],
              lastUpdated: '',
              status: CachedDataSourceStatus.Empty,
            },
            {
              name: 'Database2',
              tables: [],
              lastUpdated: '',
              status: CachedDataSourceStatus.Empty,
            },
          ],
          lastUpdated: expect.any(String),
          status: CachedDataSourceStatus.Updated,
        },
        undefined
      );
    });
  });

  describe('updateTablesToCache', () => {
    it('should update cache with empty tables and status failed when polling result is null', () => {
      const dataSourceName = 'TestDataSource';
      const databaseName = 'TestDatabase';
      const pollingResult = null;

      CatalogCacheManager.addOrUpdateDataSource(
        {
          databases: [
            {
              name: databaseName,
              lastUpdated: '',
              status: CachedDataSourceStatus.Empty,
              tables: [],
            },
          ],
          name: dataSourceName,
          lastUpdated: new Date().toUTCString(),
          status: CachedDataSourceStatus.Updated,
        },
        undefined
      );
      updateTablesToCache(dataSourceName, databaseName, pollingResult);

      // Verify that updateDatabase is called with the correct parameters
      expect(CatalogCacheManager.updateDatabase).toHaveBeenCalledWith(
        dataSourceName,
        expect.objectContaining({
          name: databaseName,
          tables: [],
          lastUpdated: expect.any(String),
          status: CachedDataSourceStatus.Failed,
        }),
        undefined
      );
    });

    it('should update cache with new tables when polling result is not null', () => {
      const dataSourceName = 'TestDataSource';
      const databaseName = 'TestDatabase';

      CatalogCacheManager.addOrUpdateDataSource({
        databases: [
          {
            name: databaseName,
            lastUpdated: '',
            status: CachedDataSourceStatus.Empty,
            tables: [],
          },
        ],
        name: dataSourceName,
        lastUpdated: new Date().toUTCString(),
        status: CachedDataSourceStatus.Updated,
      });
      updateTablesToCache(dataSourceName, databaseName, mockShowTablesPollingResult);

      // Verify that updateDatabase is called with the correct parameters
      expect(CatalogCacheManager.updateDatabase).toHaveBeenCalledWith(
        dataSourceName,
        expect.objectContaining({
          name: databaseName,
          tables: [{ name: 'http_logs1' }, { name: 'http_logs2' }],
          lastUpdated: expect.any(String),
          status: CachedDataSourceStatus.Updated,
        }),
        undefined
      );
    });
  });

  describe('updateAccelerationsToCache', () => {
    beforeEach(() => {
      // Clear mock calls before each test
      jest.clearAllMocks();
    });

    it('should save empty accelerations cache and status failed when polling result is null', () => {
      const pollingResult = null;

      updateAccelerationsToCache('sampleDS', pollingResult);

      // Verify that saveAccelerationsCache is called with the correct parameters
      expect(CatalogCacheManager.saveAccelerationsCache).toHaveBeenCalledWith({
        version: CATALOG_CACHE_VERSION,
        dataSources: [
          {
            name: 'sampleDS',
            accelerations: [],
            lastUpdated: expect.any(String),
            status: CachedDataSourceStatus.Failed,
          },
        ],
      });
    });

    it('should save new accelerations cache when polling result is not null', () => {
      updateAccelerationsToCache('sampleDS', mockShowIndexesPollingResult);

      // Verify that saveAccelerationsCache is called with the correct parameters
      expect(CatalogCacheManager.saveAccelerationsCache).toHaveBeenCalledWith({
        version: CATALOG_CACHE_VERSION,
        dataSources: [
          {
            name: 'sampleDS',
            accelerations: [
              {
                flintIndexName: 'flint_mys3_default_http_logs_skipping_index',
                type: 'skipping',
                database: 'default',
                table: 'http_logs',
                indexName: 'skipping_index',
                autoRefresh: false,
                status: 'Active',
              },
              {
                flintIndexName: 'flint_mys3_default_http_logs_status_clientip_and_day_index',
                type: 'covering',
                database: 'default',
                table: 'http_logs',
                indexName: 'status_clientip_and_day',
                autoRefresh: true,
                status: 'Active',
              },
              {
                flintIndexName: 'flint_mys3_default_http_count_view',
                type: 'materialized',
                database: 'default',
                table: '',
                indexName: 'http_count_view',
                autoRefresh: true,
                status: 'Active',
              },
            ],
            lastUpdated: expect.any(String),
            status: CachedDataSourceStatus.Updated,
          },
        ],
      });
    });
  });

  describe('updateToCache', () => {
    it('should call updateDatabasesToCache when loadCacheType is "databases"', () => {
      const loadCacheType = 'databases';
      const dataSourceName = 'TestDataSource';

      updateToCache(mockShowDatabasesPollingResult, loadCacheType, dataSourceName);

      // Verify that addOrUpdateDataSource is called
      expect(CatalogCacheManager.addOrUpdateDataSource).toHaveBeenCalled();
      expect(CatalogCacheManager.updateDatabase).not.toHaveBeenCalled();
      expect(CatalogCacheManager.saveAccelerationsCache).not.toHaveBeenCalled();
    });

    it('should call updateTablesToCache when loadCacheType is "tables"', () => {
      const loadCacheType = 'tables';
      const dataSourceName = 'TestDataSource';
      const databaseName = 'TestDatabase';

      CatalogCacheManager.addOrUpdateDataSource({
        databases: [
          {
            name: databaseName,
            lastUpdated: '',
            status: CachedDataSourceStatus.Empty,
            tables: [],
          },
        ],
        name: dataSourceName,
        lastUpdated: new Date().toUTCString(),
        status: CachedDataSourceStatus.Updated,
      });

      updateToCache(mockShowTablesPollingResult, loadCacheType, dataSourceName, databaseName);

      // Verify that updateDatabase is called
      expect(CatalogCacheManager.addOrUpdateDataSource).toHaveBeenCalled();
      expect(CatalogCacheManager.updateDatabase).toHaveBeenCalled();
      expect(CatalogCacheManager.saveAccelerationsCache).not.toHaveBeenCalled();
    });

    it('should call updateAccelerationsToCache when loadCacheType is "accelerations"', () => {
      const loadCacheType = 'accelerations';
      const dataSourceName = 'TestDataSource';

      updateToCache(mockShowIndexesPollingResult, loadCacheType, dataSourceName);

      // Verify that saveAccelerationsCache is called
      expect(CatalogCacheManager.addOrUpdateDataSource).not.toHaveBeenCalled();
      expect(CatalogCacheManager.updateDatabase).not.toHaveBeenCalled();
      expect(CatalogCacheManager.saveAccelerationsCache).toHaveBeenCalled();
    });

    it('should not call any update function when loadCacheType is not recognized', () => {
      const pollResults = {};
      const loadCacheType = '';
      const dataSourceName = 'TestDataSource';

      updateToCache(pollResults, loadCacheType, dataSourceName);

      // Verify that no update function is called
      expect(CatalogCacheManager.addOrUpdateDataSource).not.toHaveBeenCalled();
      expect(CatalogCacheManager.updateDatabase).not.toHaveBeenCalled();
      expect(CatalogCacheManager.saveAccelerationsCache).not.toHaveBeenCalled();
    });
  });

  describe('createLoadQuery', () => {
    it('should create a query for loading databases', () => {
      const loadCacheType = 'databases';
      const dataSourceName = 'example';
      const expectedQuery = 'SHOW SCHEMAS IN `example`';
      expect(createLoadQuery(loadCacheType, dataSourceName)).toEqual(expectedQuery);
    });

    it('should create a query for loading tables', () => {
      const loadCacheType = 'tables';
      const dataSourceName = 'example';
      const databaseName = 'test';
      const expectedQuery = "SHOW TABLE EXTENDED IN `example`.`test` LIKE '*'";
      expect(createLoadQuery(loadCacheType, dataSourceName, databaseName)).toEqual(expectedQuery);
    });

    it('should create a query for loading accelerations', () => {
      const loadCacheType = 'accelerations';
      const dataSourceName = 'example';
      const expectedQuery = 'SHOW FLINT INDEX in `example`';
      expect(createLoadQuery(loadCacheType, dataSourceName)).toEqual(expectedQuery);
    });

    it('should return an empty string for unknown loadCacheType', () => {
      const loadCacheType = 'unknownType';
      const dataSourceName = 'example';
      expect(createLoadQuery(loadCacheType, dataSourceName)).toEqual('');
    });

    it('should properly handle backticks in database name', () => {
      const loadCacheType = 'tables';
      const dataSourceName = 'example';
      const databaseName = '`sample`';
      const expectedQuery = "SHOW TABLE EXTENDED IN `example`.`sample` LIKE '*'";
      expect(createLoadQuery(loadCacheType, dataSourceName, databaseName)).toEqual(expectedQuery);
    });
  });
});
