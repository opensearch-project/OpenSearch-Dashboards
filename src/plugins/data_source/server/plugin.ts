/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { first } from 'rxjs/operators';
import { dataSource, credential, CredentialSavedObjectsClientWrapper } from './saved_objects';
import { DataSourcePluginConfigType } from '../config';
import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
} from '../../../../src/core/server';
import { DataSourceService } from './data_source_service';
import { createDataSourceRouteHandlerContext } from './data_source_route_handler_context';
import { DataSourcePluginSetup, DataSourcePluginStart } from './types';
import { CryptographyClient } from './cryptography';

export class DataSourcePlugin implements Plugin<DataSourcePluginSetup, DataSourcePluginStart> {
  private readonly logger: Logger;
  private dataSourceService?: DataSourceService;

  constructor(private initializerContext: PluginInitializerContext<DataSourcePluginConfigType>) {
    this.logger = this.initializerContext.logger.get();
  }

  public async setup(core: CoreSetup) {
    this.logger.debug('data_source: Setup');

    // Register credential saved object type
    core.savedObjects.registerType(credential);

    // Register data source saved object type
    core.savedObjects.registerType(dataSource);

    const config$ = this.initializerContext.config.create<DataSourcePluginConfigType>();
    const config: DataSourcePluginConfigType = await config$.pipe(first()).toPromise();

    // Fetch configs used to create credential saved objects client wrapper
    const { wrappingKeyName, wrappingKeyNamespace, wrappingKey } = config.encryption;

    // Create credential saved objects client wrapper
    const credentialSavedObjectsClientWrapper = new CredentialSavedObjectsClientWrapper(
      new CryptographyClient(wrappingKeyName, wrappingKeyNamespace, wrappingKey)
    );

    // Add credential saved objects client wrapper factory
    core.savedObjects.addClientWrapper(
      1,
      'credential',
      credentialSavedObjectsClientWrapper.wrapperFactory
    );

    this.dataSourceService = new DataSourceService(this.logger, config);
    this.dataSourceService.setup();

    // Register plugin context to route handler context
    core.http.registerRouteHandlerContext(
      'data_source',
      createDataSourceRouteHandlerContext(this.dataSourceService, this.logger)
    );

    /**
     * TODO: Test purpose ,need removal
     */
    const router = core.http.createRouter();
    router.get(
      {
        path: '/data-source/test',
        validate: false,
      },
      async (context, request, response) => {
        // const client = await context.dataSources.getOpenSearchClient('37df1970-b6b0-11ec-a339-c18008b701cd');
        const client = await context.data_source.opensearch.getClient('aaa');
        return response.ok();
      }
    );

    return {};
  }

  public start(core: CoreStart) {
    this.logger.debug('data_source: Started');
    return {};
  }

  public stop() {
    this.dataSourceService!.stop();
  }
}
