/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Client } from '@opensearch-project/opensearch';
import {
  Logger,
  OpenSearchClient,
  SavedObject,
  SavedObjectsClientContract,
  SavedObjectsErrorHelpers,
} from 'src/core/server';
import { CREDENTIAL_SAVED_OBJECT_TYPE, DATA_SOURCE_SAVED_OBJECT_TYPE } from '../../common';
import {
  CredentialMaterials,
  CredentialSavedObjectAttributes,
} from '../../common/credentials/types';
import { DataSourceAttributes } from '../../common/data_sources';
import { DataSourcePluginConfigType } from '../../config';
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

interface DataSourceClientCtorParams {
  dataSourceService: DataSourceService;
  logger: Logger;
  scopedSavedObjectsClient: SavedObjectsClientContract;
  config: DataSourcePluginConfigType;
}
export class DataSourceClient implements IDataSourceClient {
  private dataSourceService: DataSourceService;
  private log: Logger;
  // scoped saved object client to fetch save object on behalf of user
  private scopedSavedObjectClient: SavedObjectsClientContract;
  private config: DataSourcePluginConfigType;

  constructor(ctorParams: DataSourceClientCtorParams) {
    this.dataSourceService = ctorParams.dataSourceService;
    this.log = ctorParams.logger;
    this.scopedSavedObjectClient = ctorParams.scopedSavedObjectsClient;
    this.config = ctorParams.config;
  }

  async asDataSource(dataSourceId: string) {
    const dataSource = await this.getDataSource(dataSourceId);
    const rootClient = this.getRootClient(dataSource.attributes, this.config);
    const credential = await this.getCredential(dataSource.references[0].id); // assuming there is 1 and only 1 credential for each data source

    return this.getQueryClient(rootClient, credential.attributes, dataSource.attributes.withAuth);
  }

  private async getDataSource(dataSourceId: string): Promise<SavedObject<DataSourceAttributes>> {
    try {
      const dataSource = await this.scopedSavedObjectClient.get<DataSourceAttributes>(
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
    credentialId: string
  ): Promise<SavedObject<CredentialSavedObjectAttributes>> {
    try {
      const dataSource = await this.scopedSavedObjectClient.get<CredentialSavedObjectAttributes>(
        CREDENTIAL_SAVED_OBJECT_TYPE,
        credentialId
      );
      return dataSource;
    } catch (error: any) {
      // it will cause 500 error when failed to get saved objects, need to handle such error gracefully
      throw SavedObjectsErrorHelpers.createBadRequestError(error.message);
    }
  }

  /**
   * Create a child client object with given auth info.
   *
   * @param rootClient root client for the connection with given data source endpoint.
   * @param credentialAttr credential saved object attribute.
   * @returns child client.
   */
  private getQueryClient(
    rootClient: Client,
    credentialAttr: CredentialSavedObjectAttributes,
    withAuth = false
  ): Client {
    if (withAuth) {
      return this.getBasicAuthClient(rootClient, credentialAttr.credentialMaterials);
    } else {
      return rootClient.child();
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
    config: DataSourcePluginConfigType
  ): Client {
    const endpoint = dataSourceAttr.endpoint;
    const cachedClient = this.dataSourceService.getCachedClient(endpoint);

    if (cachedClient) {
      return cachedClient;
    } else {
      const client = this.configureDataSourceClient(config, endpoint);

      this.dataSourceService.addClientToPool(endpoint, client);
      return client;
    }
  }

  private getBasicAuthClient(rootClient: Client, credential: CredentialMaterials): Client {
    const { username, password } = credential.credentialMaterialsContent;
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
