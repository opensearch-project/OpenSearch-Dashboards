/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Logger, OpenSearchClient, SavedObjectsClientContract } from 'src/core/server';
import { DataSourceService } from '../data_source_service';

/**
 * Represents an OpenSearch cluster API client created by the platform.
 * It allows to call API on behalf of the user(credential) associated to "data source"
 *
 * @public
 **/
export interface IDataSourceClient {
  /**
   * Creates a {@link OpenSearchClient } bound to given data source
   */
  asDataSource: (dataSourceId: string) => Promise<OpenSearchClient>;
}

/**
 * See {@link IDataSourceClient}
 *
 * @public
 */
export interface ICustomDataSourceClient extends IDataSourceClient {
  /**
   * Closes the data source client. After that client cannot be used and one should
   * create a new client instance to be able to interact with OpenSearch API.
   */
  close: () => Promise<void>;
}

interface DataSourceClientCtorParams {
  dataSourceService: DataSourceService;
  logger: Logger;
  scopedSavedObjectsClient: SavedObjectsClientContract;
}
// TODO: This needs further implementation. See https://github.com/opensearch-project/OpenSearch-Dashboards/issues/1981
export class DataSourceClient implements ICustomDataSourceClient {
  private dataSourceService: DataSourceService;
  private log: Logger;
  private scopedSavedObjectClient;

  constructor(ctorParams: DataSourceClientCtorParams) {
    this.dataSourceService = ctorParams.dataSourceService;
    this.log = ctorParams.logger;
    this.scopedSavedObjectClient = ctorParams.scopedSavedObjectsClient;
  }

  asDataSource!: (dataSourceId: string) => Promise<OpenSearchClient>;

  public async close() {}
}
