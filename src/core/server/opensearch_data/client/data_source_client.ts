/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import { Client } from '@opensearch-project/opensearch';
import { Logger } from '../../logging';
import { OpenSearchClient, OpenSearchClientConfig } from '../../opensearch/client';
import { SavedObjectsClientContract } from '../../saved_objects/types';
// @ts-ignore
import { CryptographySingleton } from '../../../../../src/plugins/credential_management/server/crypto/singleton/cryptography_singleton';

/**
 * TODO: update doc
 * Represents an OpenSearch cluster API client created by the platform.
 * It allows to call API on behalf of the internal OpenSearch Dashboards user and
 * the actual user that is derived from the request headers (via `asScoped(...)`).
 *
 * @public
 **/
export interface IDdataSourceClient {
  /**
   * TODO: update doc. Creates a {@link IScopedClusterClient | scoped cluster client} bound to given {@link ScopeableRequest | request}
   */
  asDataSource: (dataSourceId: string) => Promise<OpenSearchClient>;
}

/**
 * See {@link IClusterClient}
 *
 * @public
 */
export interface ICustomDataSourceClient extends IDdataSourceClient {
  /**
   * Closes the data source client. After that client cannot be used and one should
   * create a new client instance to be able to interact with OpenSearch API.
   */
  close: () => Promise<void>;
}

// TODO: tmp
interface DataSourceInfo {
  endpoint: string;
  credentialId: string;
}

interface CredentialInfo {
  username: string;
  password: string;
}

export class DataSourceClient implements ICustomDataSourceClient {
  public dataSourceClientsPool: Map<string, Client>;
  private savedObjectClient: SavedObjectsClientContract;
  private isDataSourceFeatureEnabled = true;
  private isClosed = false;
  // TODO: need add size limit(maps to config item in osd.yml)
  private CLIENT_POOL_SIZE_LIMIT = 50;

  constructor(
    // @ts-ignore
    private readonly config: OpenSearchClientConfig,
    savedObjectClient: SavedObjectsClientContract,
    logger: Logger
  ) {
    // init pool as empty
    this.dataSourceClientsPool = new Map<string, Client>();
    this.savedObjectClient = savedObjectClient;
    // TODO: 1.read config and determine isDataSourceEnabled Flag
    // 2. throw error if isDataSourceEnabled == false, while API is called
  }
  async asDataSource(dataSourceId: string) {
    if (!this.isDataSourceFeatureEnabled) {
      throw Error('isDataSourceFeatureEnabled == false, please enable the feature in osd.yml');
    }
    const { endpoint, credentialId } = await this.getDataSourceInfo(dataSourceId);
    const { username, password } = await this.getCredentialInfo(credentialId);
    // 2. build/find client and return
    let dataSourceClient = this.dataSourceClientsPool.get(dataSourceId);
    if (!dataSourceClient) {
      // TODO: make use of existing default clientConfig to build client
      dataSourceClient = new Client({
        node: endpoint,
        auth: {
          username,
          password,
        },
      });
      // update pool
      this.updateDataSourceClientPool(dataSourceId, dataSourceClient);
    }
    return dataSourceClient;
  }

  private async getDataSourceInfo(dataSourceId: string): Promise<DataSourceInfo> {
    // 1. fetch meta info of data source using saved_object client
    const dataSource = await this.savedObjectClient.get('data-source', dataSourceId);
    // 2. TODO: parse to DataSource object, need update once dataSource type is in place
    const dataSourceObj = dataSource!.attributes as any;
    const endpoint = dataSourceObj.endpoint;
    const credentialId = dataSource!.references[0].id;

    return { endpoint, credentialId };
  }

  private updateDataSourceClientPool(dataSourceId: string, dataSourceClient: Client) {
    // TODO: need to optimize to pop up least recent used client instead of first one
    if (this.dataSourceClientsPool.size > this.CLIENT_POOL_SIZE_LIMIT) {
      const [firstDataSourceId] = this.dataSourceClientsPool.keys();
      this.dataSourceClientsPool.delete(firstDataSourceId);
      this.dataSourceClientsPool.set(dataSourceId, dataSourceClient);
    }
  }

  private async getCredentialInfo(credentialId: string): Promise<CredentialInfo> {
    /**
     * TODO:
     * credential manager will provide "decrypt(authId: string)" to return auth
     * Example code: cosnt {username, password} = credentialManager.decrpt(dataSourceObj.authId)
     */
    const credential = await this.savedObjectClient.get('credential', credentialId);
    const credentialObj = credential!.attributes as any;
    const { user_name: username, password: encryptedPassword } = credentialObj.credential_material;

    const password = await CryptographySingleton.getInstance().decrypt(
      Buffer.from(encryptedPassword, 'base64')
    );
    return { username, password };
  }

  // close anything in pool
  public async close() {
    if (this.isClosed) {
      return;
    }
    this.isClosed = true;
    await Promise.all([
      this.dataSourceClientsPool.forEach((v, k) => {
        v.close();
      }),
    ]);
  }
}
