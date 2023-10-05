/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Abstract class representing a data source. This class provides foundational
 * interfaces for specific data sources. Any data source connection needs to extend
 * and implement from this base class
 *
 * DataSourceMetaData: Represents metadata associated with the data source.
 * SourceDataSet: Represents the dataset associated with the data source.
 * DataSourceQueryResult: Represents the result from querying the data source.
 */

import { ConnectionStatus } from './types';

/**
 * @experimental this class is experimental and might change in future releases.
 */
export abstract class DataSource<
  DataSourceMetaData,
  DataSetParams,
  SourceDataSet,
  DataSourceQueryParams,
  DataSourceQueryResult
> {
  constructor(
    private readonly name: string,
    private readonly type: string,
    private readonly metadata: DataSourceMetaData
  ) {}

  getName() {
    return this.name;
  }

  getType() {
    return this.type;
  }

  getMetadata() {
    return this.metadata;
  }

  /**
   * Abstract method to get the dataset associated with the data source.
   * Implementing classes need to provide the specific implementation.
   *
   * Data source selector needs to display data sources with pattern
   * group (connection name) - a list of datasets. For example, get
   * all available tables for flint datasources, and get all index
   * patterns for OpenSearch data source
   *
   * @experimental This API is experimental and might change in future releases.
   * @returns {SourceDataSet} Dataset associated with the data source.
   */
  abstract getDataSet(dataSetParams?: DataSetParams): SourceDataSet;

  /**
   * Abstract method to run a query against the data source.
   * Implementing classes need to provide the specific implementation.
   *
   * @experimental This API is experimental and might change in future releases.
   * @returns {DataSourceQueryResult} Result from querying the data source.
   */
  abstract runQuery(queryParams: DataSourceQueryParams): DataSourceQueryResult;

  /**
   * Abstract method to test the connection to the data source.
   * Implementing classes should provide the specific logic to determine
   * the connection status, typically indicating success or failure.
   *
   * @experimental This API is experimental and might change in future releases.
   * @returns {ConnectionStatus | Promise<void>} Status of the connection test.
   * @experimental
   */
  abstract testConnection(): ConnectionStatus | Promise<boolean>;
}
