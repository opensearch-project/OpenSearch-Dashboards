/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { first } from 'rxjs/operators';
import { Client } from '@opensearch-project/opensearch';
import {
  Logger,
  PluginInitializerContext,
  SavedObject,
  SavedObjectsClientContract,
  SavedObjectsErrorHelpers,
} from '../../../../src/core/server';
import { DataSourcePluginConfigType } from '../config';
import { OpenSearchClientPool } from './client_pool';
import { DataSourceAttributes } from '../common/data_sources';
import { CREDENTIAL_SAVED_OBJECT_TYPE, DATA_SOURCE_SAVED_OBJECT_TYPE } from '../common';
import { CredentialSavedObjectAttributes } from '../common/credentials/types';
import { OpenSearchClientPoolSetup } from './client_pool/client_pool';

export interface DataSourceServiceSetup {
  getDataSourceClient: (
    dataSourceId: string,
    // this saved objects client is used to fetch data source on behalf of users, caller should pass scoped saved objects client
    savedObjects: SavedObjectsClientContract
  ) => Promise<Client>;
}
export class DataSourceService {
  private readonly openSearchClientPool: OpenSearchClientPool;

  constructor(
    private logger: Logger,
    private initializerContext: PluginInitializerContext<DataSourcePluginConfigType>
  ) {
    this.openSearchClientPool = new OpenSearchClientPool(logger, initializerContext);
  }

  async setup() {
    const config$ = this.initializerContext.config.create<DataSourcePluginConfigType>();
    const config: DataSourcePluginConfigType = await config$.pipe(first()).toPromise();

    const openSearchClientPoolSetup = await this.openSearchClientPool.setup();

    const getDataSourceClient = async (
      dataSourceId: string,
      savedObjects: SavedObjectsClientContract
    ): Promise<Client> => {
      const dataSource = await this.getDataSource(dataSourceId, savedObjects);
      const rootClient = this.getRootClient(
        dataSource.attributes,
        config,
        openSearchClientPoolSetup
      );

      return this.getQueryClient(rootClient, dataSource, savedObjects);
    };

    return { getDataSourceClient };
  }

  start() {}

  stop() {
    this.openSearchClientPool.stop();
  }

  private async getDataSource(
    dataSourceId: string,
    savedObjects: SavedObjectsClientContract
  ): Promise<SavedObject<DataSourceAttributes>> {
    try {
      const dataSource = await savedObjects.get<DataSourceAttributes>(
        DATA_SOURCE_SAVED_OBJECT_TYPE,
        dataSourceId
      );
      return dataSource;
    } catch (error: any) {
      // it will cause 500 error when failed to get saved objects, need to handle such error gracefully
      throw SavedObjectsErrorHelpers.createBadRequestError(error.message);
    }
  }

  private async getCredential(
    credentialId: string,
    savedObjects: SavedObjectsClientContract
  ): Promise<SavedObject<CredentialSavedObjectAttributes>> {
    try {
      const credential = await savedObjects.get<CredentialSavedObjectAttributes>(
        CREDENTIAL_SAVED_OBJECT_TYPE,
        credentialId
      );
      return credential;
    } catch (error: any) {
      // it will cause 500 error when failed to get saved objects, need to handle such error gracefully
      throw SavedObjectsErrorHelpers.createBadRequestError(error.message);
    }
  }

  /**
   * Create a child client object with given auth info.
   *
   * @param rootClient root client for the connection with given data source endpoint.
   * @param dataSource data source saved object
   * @param savedObjects scoped saved object client
   * @returns child client.
   */
  private async getQueryClient(
    rootClient: Client,
    dataSource: SavedObject<DataSourceAttributes>,
    savedObjects: SavedObjectsClientContract
  ): Promise<Client> {
    if (dataSource.attributes.noAuth) {
      return rootClient.child();
    } else {
      const credential = await this.getCredential(dataSource.references[0].id, savedObjects);
      return this.getBasicAuthClient(rootClient, credential.attributes);
    }
  }

  /**
   * Gets a root client object of the OpenSearch endpoint.
   * Will attempt to get from cache, if cache miss, create a new one and load into cache.
   *
   * @param dataSourceAttr data source saved objects attributes.
   * @returns OpenSearch client for the given data source endpoint.
   */
  private getRootClient(
    dataSourceAttr: DataSourceAttributes,
    config: DataSourcePluginConfigType,
    { getClientFromPool, addClientToPool }: OpenSearchClientPoolSetup
  ): Client {
    const endpoint = dataSourceAttr.endpoint;
    const cachedClient = getClientFromPool(endpoint);

    if (cachedClient) {
      return cachedClient;
    } else {
      const client = this.configureDataSourceClient(config, endpoint);

      addClientToPool(endpoint, client);
      return client;
    }
  }

  private getBasicAuthClient(
    rootClient: Client,
    credentialAttr: CredentialSavedObjectAttributes
  ): Client {
    const { username, password } = credentialAttr.credentialMaterials.credentialMaterialsContent;
    return rootClient.child({
      auth: {
        username,
        password,
      },
    });
  }

  // TODO: will use client configs, that comes from a merge result of user config and defaults
  private configureDataSourceClient(config: DataSourcePluginConfigType, endpoint: string) {
    const client = new Client({
      node: endpoint,
      ssl: {
        requestCert: true,
        rejectUnauthorized: true,
      },
    });

    return client;
  }
}
