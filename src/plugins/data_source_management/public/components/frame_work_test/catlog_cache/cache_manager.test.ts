/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CATALOG_CACHE_VERSION } from '../../../../framework/constants';
import {
  ASYNC_QUERY_ACCELERATIONS_CACHE,
  ASYNC_QUERY_DATASOURCE_CACHE,
} from '../../../../framework/utils/shared';
import {
  AccelerationsCacheData,
  CachedAccelerationByDataSource,
  CachedDataSource,
  CachedDataSourceStatus,
  CachedDatabase,
  DataSourceCacheData,
} from '../../../../framework/types';
import { CatalogCacheManager } from '../../../../framework/catalog_cache/cache_manager';

interface LooseObject {
  [key: string]: any;
}

// Mock sessionStorage
const sessionStorageMock = (() => {
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

Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

describe('CatalogCacheManager', () => {
  beforeEach(() => {
    jest.spyOn(window.sessionStorage, 'setItem');
    jest.spyOn(window.sessionStorage, 'getItem');
    jest.spyOn(window.sessionStorage, 'removeItem');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('saveDataSourceCache', () => {
    it('should save data source cache with correct key and data', () => {
      const cacheData: DataSourceCacheData = {
        version: CATALOG_CACHE_VERSION,
        dataSources: [
          {
            name: 'testDataSource',
            lastUpdated: '2024-03-07T12:00:00Z',
            status: CachedDataSourceStatus.Empty,
            databases: [],
          },
        ],
      };
      CatalogCacheManager.saveDataSourceCache(cacheData);
      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        ASYNC_QUERY_DATASOURCE_CACHE,
        JSON.stringify(cacheData)
      );
    });

    it('should overwrite existing data source cache with new data', () => {
      const initialCacheData: DataSourceCacheData = {
        version: CATALOG_CACHE_VERSION,
        dataSources: [
          {
            name: 'testDataSource',
            lastUpdated: '2024-03-07T12:00:00Z',
            status: CachedDataSourceStatus.Empty,
            databases: [],
          },
        ],
      };
      sessionStorage.setItem(ASYNC_QUERY_DATASOURCE_CACHE, JSON.stringify(initialCacheData));

      const newCacheData: DataSourceCacheData = {
        version: '1.1',
        dataSources: [
          {
            name: 'newTestDataSource',
            lastUpdated: '2024-03-08T12:00:00Z',
            status: CachedDataSourceStatus.Empty,
            databases: [],
          },
        ],
      };
      CatalogCacheManager.saveDataSourceCache(newCacheData);
      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        ASYNC_QUERY_DATASOURCE_CACHE,
        JSON.stringify(newCacheData)
      );
    });
  });

  describe('getDataSourceCache', () => {
    it('should retrieve data source cache from local storage', () => {
      const cacheData: DataSourceCacheData = {
        version: CATALOG_CACHE_VERSION,
        dataSources: [
          {
            name: 'testDataSource',
            lastUpdated: '2024-03-07T12:00:00Z',
            status: CachedDataSourceStatus.Empty,
            databases: [],
          },
        ],
      };
      sessionStorage.setItem(ASYNC_QUERY_DATASOURCE_CACHE, JSON.stringify(cacheData));
      expect(CatalogCacheManager.getDataSourceCache()).toEqual(cacheData);
    });

    it('should return default cache object if cache is not found', () => {
      const defaultCacheObject = {
        version: CATALOG_CACHE_VERSION,
        dataSources: [],
      };
      sessionStorage.removeItem(ASYNC_QUERY_DATASOURCE_CACHE);
      expect(CatalogCacheManager.getDataSourceCache()).toEqual(defaultCacheObject);
    });
  });

  describe('saveAccelerationsCache', () => {
    it('should save accelerations cache to local storage', () => {
      const cacheData: AccelerationsCacheData = {
        version: CATALOG_CACHE_VERSION,
        dataSources: [],
      };
      CatalogCacheManager.saveAccelerationsCache(cacheData);
      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        ASYNC_QUERY_ACCELERATIONS_CACHE,
        JSON.stringify(cacheData)
      );
    });
  });

  describe('getAccelerationsCache', () => {
    it('should retrieve accelerations cache from local storage', () => {
      const cacheData: AccelerationsCacheData = {
        version: CATALOG_CACHE_VERSION,
        dataSources: [],
      };
      sessionStorage.setItem(ASYNC_QUERY_ACCELERATIONS_CACHE, JSON.stringify(cacheData));
      expect(CatalogCacheManager.getAccelerationsCache()).toEqual(cacheData);
    });

    it('should return default cache object if cache is not found', () => {
      const defaultCacheObject: AccelerationsCacheData = {
        version: CATALOG_CACHE_VERSION,
        dataSources: [],
      };
      sessionStorage.removeItem(ASYNC_QUERY_ACCELERATIONS_CACHE);
      expect(CatalogCacheManager.getAccelerationsCache()).toEqual(defaultCacheObject);
    });
  });

  describe('addOrUpdateDataSource', () => {
    it('should add a new data source if not exists', () => {
      const dataSource: CachedDataSource = {
        name: 'testDataSource',
        lastUpdated: '2024-03-07T12:00:00Z',
        status: CachedDataSourceStatus.Empty,
        databases: [],
      };
      CatalogCacheManager.addOrUpdateDataSource(dataSource);
      const cachedData = CatalogCacheManager.getDataSourceCache();
      expect(cachedData.dataSources).toContainEqual(dataSource);
    });

    it('should update an existing data source', () => {
      const dataSource: CachedDataSource = {
        name: 'testDataSource',
        lastUpdated: '2024-03-07T12:00:00Z',
        status: CachedDataSourceStatus.Empty,
        databases: [],
      };
      CatalogCacheManager.addOrUpdateDataSource(dataSource);
      const updatedDataSource: CachedDataSource = {
        name: 'testDataSource',
        lastUpdated: '2024-03-08T12:00:00Z',
        status: CachedDataSourceStatus.Updated,
        databases: [],
      };
      CatalogCacheManager.addOrUpdateDataSource(updatedDataSource);
      const cachedData = CatalogCacheManager.getDataSourceCache();
      expect(cachedData.dataSources).toContainEqual(updatedDataSource);
    });
  });

  describe('getOrCreateDataSource', () => {
    it('should retrieve existing data source if exists', () => {
      const dataSourceName = 'testDataSource';
      const dataSource: CachedDataSource = {
        name: dataSourceName,
        lastUpdated: '2024-03-07T12:00:00Z',
        status: CachedDataSourceStatus.Empty,
        databases: [],
      };
      CatalogCacheManager.addOrUpdateDataSource(dataSource);
      expect(CatalogCacheManager.getOrCreateDataSource(dataSourceName)).toEqual(dataSource);
    });

    it('should create a new data source if not exists', () => {
      const dataSourceName = 'testDataSource';
      const createdDataSource: CachedDataSource = {
        name: dataSourceName,
        lastUpdated: '2024-03-07T12:00:00Z',
        status: CachedDataSourceStatus.Empty,
        databases: [],
      };
      expect(CatalogCacheManager.getOrCreateDataSource(dataSourceName)).toEqual(createdDataSource);
    });
  });

  describe('getDatabase', () => {
    it('should retrieve database from cache', () => {
      const dataSourceName = 'testDataSource';
      const databaseName = 'testDatabase';
      const database: CachedDatabase = {
        name: databaseName,
        tables: [],
        lastUpdated: '2024-03-07T12:00:00Z',
        status: CachedDataSourceStatus.Empty,
      };
      const dataSource: CachedDataSource = {
        name: dataSourceName,
        lastUpdated: '2024-03-07T12:00:00Z',
        status: CachedDataSourceStatus.Empty,
        databases: [database],
      };
      CatalogCacheManager.addOrUpdateDataSource(dataSource);
      expect(CatalogCacheManager.getDatabase(dataSourceName, databaseName)).toEqual(database);
    });

    it('should throw error if data source not found', () => {
      const dataSourceName = 'nonExistingDataSource';
      const databaseName = 'testDatabase';
      expect(() => CatalogCacheManager.getDatabase(dataSourceName, databaseName)).toThrowError(
        'DataSource not found exception: ' + dataSourceName
      );
    });

    it('should throw error if database not found', () => {
      const dataSourceName = 'testDataSource';
      const databaseName = 'nonExistingDatabase';
      const dataSource: CachedDataSource = {
        name: dataSourceName,
        lastUpdated: '2024-03-07T12:00:00Z',
        status: CachedDataSourceStatus.Empty,
        databases: [],
      };
      CatalogCacheManager.addOrUpdateDataSource(dataSource);
      expect(() => CatalogCacheManager.getDatabase(dataSourceName, databaseName)).toThrowError(
        'Database not found exception: ' + databaseName
      );
    });
  });

  describe('getTable', () => {
    it('should retrieve table from cache', () => {
      const dataSourceName = 'testDataSource';
      const databaseName = 'testDatabase';
      const tableName = 'testTable';
      const table = {
        name: tableName,
        columns: [],
      };
      const database = {
        name: databaseName,
        tables: [table],
        lastUpdated: '2024-03-07T12:00:00Z',
        status: CachedDataSourceStatus.Empty,
      };
      const dataSource = {
        name: dataSourceName,
        lastUpdated: '2024-03-07T12:00:00Z',
        status: CachedDataSourceStatus.Empty,
        databases: [database],
      };
      CatalogCacheManager.addOrUpdateDataSource(dataSource);
      expect(CatalogCacheManager.getTable(dataSourceName, databaseName, tableName)).toEqual(table);
    });

    it('should throw error if table not found', () => {
      const dataSourceName = 'testDataSource';
      const databaseName = 'testDatabase';
      const tableName = 'nonExistingTable';
      const dataSource = {
        name: dataSourceName,
        lastUpdated: '2024-03-07T12:00:00Z',
        status: CachedDataSourceStatus.Empty,
        databases: [
          {
            name: databaseName,
            tables: [],
            lastUpdated: '2024-03-07T12:00:00Z',
            status: CachedDataSourceStatus.Updated,
          },
        ],
      };
      CatalogCacheManager.addOrUpdateDataSource(dataSource);
      expect(() =>
        CatalogCacheManager.getTable(dataSourceName, databaseName, tableName)
      ).toThrowError('Table not found exception: ' + tableName);
    });
  });

  describe('updateDatabase', () => {
    it('should update database in cache', () => {
      const dataSourceName = 'testDataSource';
      const databaseName = 'testDatabase';
      const database = {
        name: databaseName,
        tables: [],
        lastUpdated: '2024-03-07T12:00:00Z',
        status: CachedDataSourceStatus.Empty,
      };
      const updatedDatabase = {
        name: databaseName,
        tables: [],
        lastUpdated: '2024-03-08T12:00:00Z',
        status: CachedDataSourceStatus.Updated,
      };
      const dataSource = {
        name: dataSourceName,
        lastUpdated: '2024-03-07T12:00:00Z',
        status: CachedDataSourceStatus.Empty,
        databases: [database],
      };
      CatalogCacheManager.addOrUpdateDataSource(dataSource);
      CatalogCacheManager.updateDatabase(dataSourceName, updatedDatabase);
      const cachedData = CatalogCacheManager.getDataSourceCache();
      expect(cachedData.dataSources[0].databases[0]).toEqual(updatedDatabase);
    });

    it('should throw error if data source not found', () => {
      const dataSourceName = 'nonExistingDataSource';
      const database = {
        name: 'testDatabase',
        tables: [],
        lastUpdated: '2024-03-07T12:00:00Z',
        status: CachedDataSourceStatus.Empty,
      };
      expect(() => CatalogCacheManager.updateDatabase(dataSourceName, database)).toThrowError(
        'DataSource not found exception: ' + dataSourceName
      );
    });

    it('should throw error if database not found', () => {
      const dataSourceName = 'testDataSource';
      const database = {
        name: 'nonExistingDatabase',
        tables: [],
        lastUpdated: '2024-03-07T12:00:00Z',
        status: CachedDataSourceStatus.Empty,
      };
      const dataSource = {
        name: dataSourceName,
        lastUpdated: '2024-03-07T12:00:00Z',
        status: CachedDataSourceStatus.Empty,
        databases: [],
      };
      CatalogCacheManager.addOrUpdateDataSource(dataSource);
      expect(() => CatalogCacheManager.updateDatabase(dataSourceName, database)).toThrowError(
        'Database not found exception: ' + database.name
      );
    });
  });

  describe('clearDataSourceCache', () => {
    it('should clear data source cache from local storage', () => {
      CatalogCacheManager.clearDataSourceCache();
      expect(sessionStorage.removeItem).toHaveBeenCalledWith(ASYNC_QUERY_DATASOURCE_CACHE);
    });
  });

  describe('clearAccelerationsCache', () => {
    it('should clear accelerations cache from local storage', () => {
      CatalogCacheManager.clearAccelerationsCache();
      expect(sessionStorage.removeItem).toHaveBeenCalledWith(ASYNC_QUERY_ACCELERATIONS_CACHE);
    });
  });

  describe('addOrUpdateAccelerationsByDataSource', () => {
    it('should add a new data source to the accelerations cache', () => {
      const dataSource: CachedAccelerationByDataSource = {
        name: 'TestDataSource',
        lastUpdated: '2024-03-08T12:00:00Z',
        status: CachedDataSourceStatus.Updated,
        accelerations: [],
      };

      CatalogCacheManager.addOrUpdateAccelerationsByDataSource(dataSource);

      // Verify that saveAccelerationsCache is called with the updated cache data
      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        ASYNC_QUERY_ACCELERATIONS_CACHE,
        JSON.stringify({
          version: '1.0',
          dataSources: [{ ...dataSource }],
        })
      );
    });

    it('should update an existing data source in the accelerations cache', () => {
      // Set up initial cache data
      const initialDataSource: CachedAccelerationByDataSource = {
        name: 'TestDataSource',
        lastUpdated: '2024-03-08T12:00:00Z',
        status: CachedDataSourceStatus.Updated,
        accelerations: [],
      };

      // Update the data source
      const updatedDataSource: CachedAccelerationByDataSource = {
        ...initialDataSource,
        status: CachedDataSourceStatus.Failed,
      };

      CatalogCacheManager.addOrUpdateAccelerationsByDataSource(updatedDataSource);

      // Verify that saveAccelerationsCache is called with the updated cache data
      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        ASYNC_QUERY_ACCELERATIONS_CACHE,
        JSON.stringify({
          version: '1.0',
          dataSources: [{ ...updatedDataSource }],
        })
      );
    });
  });

  describe('getOrCreateAccelerationsByDataSource', () => {
    it('should return an existing data source from the accelerations cache', () => {
      // Set up initial cache data
      const existingDataSource: CachedAccelerationByDataSource = {
        name: 'TestDataSource',
        lastUpdated: '2024-03-08T12:00:00Z',
        status: CachedDataSourceStatus.Updated,
        accelerations: [],
      };

      CatalogCacheManager.addOrUpdateAccelerationsByDataSource(existingDataSource);
      const result = CatalogCacheManager.getOrCreateAccelerationsByDataSource('TestDataSource');

      // Verify that the existing data source is returned
      expect(result).toEqual(existingDataSource);
    });

    it('should create and return a new data source if not found in the accelerations cache', () => {
      const result = CatalogCacheManager.getOrCreateAccelerationsByDataSource('TestDataSource1');

      // Verify that the new data source is created and returned
      expect(result).toEqual({
        name: 'TestDataSource1',
        lastUpdated: expect.any(String),
        status: CachedDataSourceStatus.Empty,
        accelerations: [],
      });
    });
  });
});
