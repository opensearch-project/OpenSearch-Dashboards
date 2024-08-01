/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ASYNC_QUERY, DATASET } from '../constants';
import {
  AccelerationsCacheData,
  CachedAccelerationByDataSource,
  CachedDataSource,
  CachedDataSourceStatus,
  CachedDatabase,
  DataSourceCacheData,
  ExternalDataSource,
  ExternalDataSourcesCacheData,
  RecentDataSetOptionsCacheData,
} from '../types';
import { SimpleDataSet, SimpleObject } from '../../../../../common';

/**
 * Manages caching for catalog data including data sources and accelerations.
 */
export class CatalogCacheManager {
  // TODO: make this an advanced setting
  private static readonly maxRecentDataSet = 4;

  /**
   * Saves data source cache to local storage.
   * @param {DataSourceCacheData} cacheData - The data source cache data to save.
   */
  static saveDataSourceCache(cacheData: DataSourceCacheData): void {
    sessionStorage.setItem(ASYNC_QUERY.CATALOG_CACHE.KEY, JSON.stringify(cacheData));
  }

  /**
   * Retrieves data source cache from local storage.
   * @returns {DataSourceCacheData} The retrieved data source cache.
   */
  static getDataSourceCache(): DataSourceCacheData {
    const catalogData = sessionStorage.getItem(ASYNC_QUERY.CATALOG_CACHE.KEY);

    if (catalogData) {
      return JSON.parse(catalogData);
    } else {
      const defaultCacheObject = { version: ASYNC_QUERY.CATALOG_CACHE.VERSION, dataSources: [] };
      this.saveDataSourceCache(defaultCacheObject);
      return defaultCacheObject;
    }
  }

  /**
   * Saves accelerations cache to local storage.
   * @param {AccelerationsCacheData} cacheData - The accelerations cache data to save.
   */
  static saveAccelerationsCache(cacheData: AccelerationsCacheData): void {
    sessionStorage.setItem(ASYNC_QUERY.ACCELERATIONS_CACHE, JSON.stringify(cacheData));
  }

  /**
   * Retrieves accelerations cache from local storage.
   * @returns {AccelerationsCacheData} The retrieved accelerations cache.
   */
  static getAccelerationsCache(): AccelerationsCacheData {
    const accelerationCacheData = sessionStorage.getItem(ASYNC_QUERY.ACCELERATIONS_CACHE);

    if (accelerationCacheData) {
      return JSON.parse(accelerationCacheData);
    } else {
      const defaultCacheObject = {
        version: ASYNC_QUERY.CATALOG_CACHE.VERSION,
        dataSources: [],
      };
      this.saveAccelerationsCache(defaultCacheObject);
      return defaultCacheObject;
    }
  }

  /**
   * Adds or updates a data source in the accelerations cache.
   * @param {CachedAccelerationByDataSource} dataSource - The data source to add or update.
   */
  static addOrUpdateAccelerationsByDataSource(
    dataSource: CachedAccelerationByDataSource,
    dataSourceMDSId?: string
  ): void {
    let index = -1;
    const accCacheData = this.getAccelerationsCache();
    if (dataSourceMDSId) {
      index = accCacheData.dataSources.findIndex(
        (ds: CachedAccelerationByDataSource) =>
          ds.name === dataSource.name && ds.dataSourceMDSId === dataSourceMDSId
      );
    } else {
      index = accCacheData.dataSources.findIndex(
        (ds: CachedAccelerationByDataSource) => ds.name === dataSource.name
      );
    }
    if (index !== -1) {
      accCacheData.dataSources[index] = dataSource;
    } else {
      accCacheData.dataSources.push(dataSource);
    }
    this.saveAccelerationsCache(accCacheData);
  }

  /**
   * Retrieves accelerations cache from local storage by the datasource name.
   * @param {string} dataSourceName - The name of the data source.
   * @returns {CachedAccelerationByDataSource} The retrieved accelerations by datasource in cache.
   * @throws {Error} If the data source is not found.
   */
  static getOrCreateAccelerationsByDataSource(
    dataSourceName: string,
    dataSourceMDSId?: string
  ): CachedAccelerationByDataSource {
    const accCacheData = this.getAccelerationsCache();
    let cachedDataSource;
    if (dataSourceMDSId) {
      cachedDataSource = accCacheData.dataSources.find(
        (ds) => ds.name === dataSourceName && ds.dataSourceMDSId === dataSourceMDSId
      );
    } else {
      cachedDataSource = accCacheData.dataSources.find((ds) => ds.name === dataSourceName);
    }
    if (cachedDataSource) return cachedDataSource;
    else {
      let defaultDataSourceObject: CachedAccelerationByDataSource = {
        name: dataSourceName,
        lastUpdated: '',
        status: CachedDataSourceStatus.Empty,
        accelerations: [],
      };

      if (dataSourceMDSId !== '' && dataSourceMDSId !== undefined) {
        defaultDataSourceObject = { ...defaultDataSourceObject, dataSourceMDSId };
      }
      this.addOrUpdateAccelerationsByDataSource(defaultDataSourceObject, dataSourceMDSId);
      return defaultDataSourceObject;
    }
  }

  /**
   * Adds or updates a data source in the cache.
   * @param {CachedDataSource} dataSource - The data source to add or update.
   */
  static addOrUpdateDataSource(dataSource: CachedDataSource, dataSourceMDSId?: string): void {
    const cacheData = this.getDataSourceCache();
    const index = cacheData.dataSources.findIndex(
      (ds) =>
        ds.name === dataSource.name && (!dataSourceMDSId || ds.dataSourceMDSId === dataSourceMDSId)
    );
    cacheData.dataSources.splice(index, 1, dataSource);
    this.saveDataSourceCache(cacheData);
  }

  /**
   * Retrieves or creates a data source with the specified name.
   * @param {string} dataSourceName - The name of the data source.
   * @returns {CachedDataSource} The retrieved or created data source.
   */
  static getOrCreateDataSource(dataSourceName: string, dataSourceMDSId?: string): CachedDataSource {
    let cachedDataSource;
    if (dataSourceMDSId) {
      cachedDataSource = this.getDataSourceCache().dataSources.find(
        (ds) => ds.dataSourceMDSId === dataSourceMDSId && ds.name === dataSourceName
      );
    } else {
      cachedDataSource = this.getDataSourceCache().dataSources.find(
        (ds) => ds.name === dataSourceName
      );
    }
    if (cachedDataSource) {
      return cachedDataSource;
    } else {
      let defaultDataSourceObject: CachedDataSource = {
        name: dataSourceName,
        lastUpdated: '',
        status: CachedDataSourceStatus.Empty,
        databases: [],
      };
      if (dataSourceMDSId !== '' && dataSourceMDSId !== undefined) {
        defaultDataSourceObject = { ...defaultDataSourceObject, dataSourceMDSId };
      }
      this.addOrUpdateDataSource(defaultDataSourceObject, dataSourceMDSId);
      return defaultDataSourceObject;
    }
  }

  /**
   * Retrieves a database from the cache.
   * @param {string} dataSourceName - The name of the data source containing the database.
   * @param {string} databaseName - The name of the database.
   * @returns {CachedDatabase} The retrieved database.
   * @throws {Error} If the data source or database is not found.
   */
  static getDatabase(
    dataSourceName: string,
    databaseName: string,
    dataSourceMDSId?: string
  ): CachedDatabase {
    let cachedDataSource;
    if (dataSourceMDSId) {
      cachedDataSource = this.getDataSourceCache().dataSources.find(
        (ds) => ds.dataSourceMDSId === dataSourceMDSId && ds.name === dataSourceName
      );
    } else {
      cachedDataSource = this.getDataSourceCache().dataSources.find(
        (ds) => ds.name === dataSourceName
      );
    }
    if (!cachedDataSource) {
      throw new Error('DataSource not found exception: ' + dataSourceName);
    }

    const cachedDatabase = cachedDataSource.databases.find((db) => db.name === databaseName);
    if (!cachedDatabase) {
      throw new Error('Database not found exception: ' + databaseName);
    }

    return cachedDatabase;
  }

  /**
   * Retrieves a table from the cache.
   * @param {string} dataSourceName - The name of the data source containing the database.
   * @param {string} databaseName - The name of the database.
   * @param {string} tableName - The name of the database.
   * @returns {Cachedtable} The retrieved database.
   * @throws {Error} If the data source, database or table is not found.
   */
  static getTable(
    dataSourceName: string,
    databaseName: string,
    tableName: string,
    dataSourceMDSId?: string
  ): SimpleObject {
    const cachedDatabase = this.getDatabase(dataSourceName, databaseName, dataSourceMDSId);

    const cachedTable = cachedDatabase.tables!.find((table) => table.name === tableName);
    if (!cachedTable) {
      throw new Error('Table not found exception: ' + tableName);
    }
    return { id: cachedTable.name, ...cachedTable };
  }

  /**
   * Updates a database in the cache.
   * @param {string} dataSourceName - The name of the data source containing the database.
   * @param {CachedDatabase} database - The database to be updated.
   * @throws {Error} If the data source or database is not found.
   */
  static updateDatabase(
    dataSourceName: string,
    database: CachedDatabase,
    dataSourceMDSId?: string
  ): void {
    let cachedDataSource;
    if (dataSourceMDSId) {
      cachedDataSource = this.getDataSourceCache().dataSources.find(
        (ds) => ds.dataSourceMDSId === dataSourceMDSId && ds.name === dataSourceName
      );
    } else {
      cachedDataSource = this.getDataSourceCache().dataSources.find(
        (ds) => ds.name === dataSourceName
      );
    }

    if (!cachedDataSource) {
      throw new Error('DataSource not found exception: ' + dataSourceName);
    }

    const index = cachedDataSource.databases.findIndex((db) => db.name === database.name);
    if (index !== -1) {
      cachedDataSource.databases[index] = database;
      this.addOrUpdateDataSource(cachedDataSource, dataSourceMDSId);
    } else {
      throw new Error('Database not found exception: ' + database.name);
    }
  }

  /**
   * Clears the data source cache from local storage.
   */
  static clearDataSourceCache(): void {
    sessionStorage.removeItem(ASYNC_QUERY.CATALOG_CACHE.KEY);
    this.clearExternalDataSourcesCache();
  }

  /**
   * Clears the accelerations cache from local storage.
   */
  static clearAccelerationsCache(): void {
    sessionStorage.removeItem(ASYNC_QUERY.ACCELERATIONS_CACHE);
  }

  static saveExternalDataSourcesCache(cacheData: ExternalDataSourcesCacheData): void {
    sessionStorage.setItem(ASYNC_QUERY.CATALOG_CACHE.KEY, JSON.stringify(cacheData));
  }

  static getExternalDataSourcesCache(): ExternalDataSourcesCacheData {
    const externalDataSourcesData = sessionStorage.getItem(ASYNC_QUERY.CATALOG_CACHE.KEY);

    if (externalDataSourcesData) {
      return JSON.parse(externalDataSourcesData);
    } else {
      const defaultCacheObject: ExternalDataSourcesCacheData = {
        version: ASYNC_QUERY.CATALOG_CACHE.VERSION,
        dataSources: [],
        lastUpdated: '',
        status: CachedDataSourceStatus.Empty,
      };
      this.saveExternalDataSourcesCache(defaultCacheObject);
      return defaultCacheObject;
    }
  }

  static updateExternalDataSources(externalDataSources: ExternalDataSource[]): void {
    const currentTime = new Date().toUTCString();
    const cacheData = this.getExternalDataSourcesCache();
    cacheData.dataSources = externalDataSources;
    cacheData.lastUpdated = currentTime;
    cacheData.status = CachedDataSourceStatus.Updated;
    this.saveExternalDataSourcesCache(cacheData);
  }

  static getExternalDataSources(): ExternalDataSourcesCacheData {
    return this.getExternalDataSourcesCache();
  }

  static clearExternalDataSourcesCache(): void {
    sessionStorage.removeItem(ASYNC_QUERY.CATALOG_CACHE.KEY);
  }

  static setExternalDataSourcesLoadingStatus(status: CachedDataSourceStatus): void {
    const cacheData = this.getExternalDataSourcesCache();
    cacheData.status = status;
    this.saveExternalDataSourcesCache(cacheData);
  }

  static saveRecentDataSetsCache(cacheData: RecentDataSetOptionsCacheData): void {
    sessionStorage.setItem(DATASET.OPTIONS_CACHE.KEY, JSON.stringify(cacheData));
  }

  static getRecentDataSetsCache(): RecentDataSetOptionsCacheData {
    const recentDataSetOptionsData = sessionStorage.getItem(DATASET.OPTIONS_CACHE.KEY);

    if (recentDataSetOptionsData) {
      return JSON.parse(recentDataSetOptionsData);
    } else {
      const defaultCacheObject: RecentDataSetOptionsCacheData = {
        version: ASYNC_QUERY.CATALOG_CACHE.VERSION,
        recentDataSets: [],
      };
      this.saveRecentDataSetsCache(defaultCacheObject);
      return defaultCacheObject;
    }
  }

  static addRecentDataSet(dataSet: SimpleDataSet): void {
    const cacheData = this.getRecentDataSetsCache();

    cacheData.recentDataSets = cacheData.recentDataSets.filter(
      (option) => option.id !== dataSet.id
    );

    cacheData.recentDataSets.push(dataSet);

    if (cacheData.recentDataSets.length > this.maxRecentDataSet) {
      cacheData.recentDataSets.shift();
    }

    this.saveRecentDataSetsCache(cacheData);
  }

  static getRecentDataSets(): SimpleDataSet[] {
    return this.getRecentDataSetsCache().recentDataSets;
  }

  static clearRecentDataSetsCache(): void {
    sessionStorage.removeItem(DATASET.OPTIONS_CACHE.KEY);
  }
}
