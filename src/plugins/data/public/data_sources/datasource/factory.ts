/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The DataSourceFactory is responsible for managing the registration and creation of data source classes.
 * It serves as a registry for different data source types and provides a way to instantiate them.
 */

import { DataSourceType } from '../datasource_services';
import { DataSource } from '../datasource';

type DataSourceClass<
  MetaData = any,
  SetParams = any,
  DataSet = any,
  QueryParams = any,
  QueryResult = any
> = new (config: any) => DataSource<MetaData, SetParams, DataSet, QueryParams, QueryResult>;

export class DataSourceFactory {
  // Holds the singleton instance of the DataSourceFactory.
  private static factory: DataSourceFactory;

  // A dictionary holding the data source type as the key and its corresponding class constructor as the value.
  private dataSourceClasses: { [type: string]: DataSourceClass } = {};

  /**
   * Private constructor to ensure only one instance of DataSourceFactory is created.
   */
  private constructor() {}

  /**
   * Returns the singleton instance of the DataSourceFactory. If it doesn't exist, it creates one.
   *
   * @experimental This API is experimental and might change in future releases.
   * @returns {DataSourceFactory} The single instance of DataSourceFactory.
   */
  static getInstance(): DataSourceFactory {
    if (!this.factory) {
      this.factory = new DataSourceFactory();
    }
    return this.factory;
  }

  /**
   * Registers a new data source type with its associated class.
   * If the type has already been registered, an error is thrown.
   *
   * @experimental This API is experimental and might change in future releases.
   * @param {string} type - The identifier for the data source type.
   * @param {DataSourceClass} dataSourceClass - The constructor of the data source class.
   * @throws {Error} Throws an error if the data source type has already been registered.
   */
  registerDataSourceType(type: string, dataSourceClass: DataSourceClass): void {
    if (this.dataSourceClasses[type]) {
      throw new Error('This data source type has already been registered');
    }
    this.dataSourceClasses[type] = dataSourceClass;
  }

  /**
   * Creates and returns an instance of the specified data source type with the given configuration.
   * If the type hasn't been registered, an error is thrown.
   *
   * @experimental This API is experimental and might change in future releases.
   * @param {string} type - The identifier for the data source type.
   * @param {any} config - The configuration for the data source instance.
   * @returns {DataSourceType} An instance of the specified data source type.
   * @throws {Error} Throws an error if the data source type is not supported.
   */
  getDataSourceInstance(type: string, config: any): DataSourceType {
    const DataSourceClass = this.dataSourceClasses[type];
    if (!DataSourceClass) {
      throw new Error('Unsupported data source type');
    }
    return new DataSourceClass(config);
  }
}
