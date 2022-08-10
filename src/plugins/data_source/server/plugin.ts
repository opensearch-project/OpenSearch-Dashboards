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
  IContextProvider,
  RequestHandler,
} from '../../../../src/core/server';
import { DataSourceClient } from './client/data_source_client';
import { DataSourceRouteHandlerContext } from './data_source_route_handler_context';

import { DataSourcePluginSetup, DataSourcePluginStart } from './types';

import { CryptographyClient } from './cryptography';

export class DataSourcePlugin implements Plugin<DataSourcePluginSetup, DataSourcePluginStart> {
  private readonly logger: Logger;
  private readonly dataSourceClient: DataSourceClient;

  constructor(private initializerContext: PluginInitializerContext<DataSourcePluginConfigType>) {
    this.logger = this.initializerContext.logger.get();
    this.dataSourceClient = new DataSourceClient(this.logger);
  }

  public setup(core: CoreSetup) {
    this.logger.debug('data_source: Setup');

    // Register credential saved object type
    core.savedObjects.registerType(credential);

    // Register data source saved object type
    core.savedObjects.registerType(dataSource);

    // Fetch configs used to create redential saved objects client wrapper
    const { encryption } = await this.initializerContext.config.create().pipe(first()).toPromise();
    const { wrappingKeyName, wrappingKeyNamespace, wrappingKey } = encryption;

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
    // Register plugin context to route handler context
    core.http.registerRouteHandlerContext('data_source', this.createRouteHandlerContext(core));

    return {};
  }

  public start(core: CoreStart) {
    this.logger.debug('data_source: Started');
    return {};
  }

  public stop() {
    this.dataSourceClient.close();
  }

  private createRouteHandlerContext = (
    core: CoreSetup
  ): IContextProvider<RequestHandler<unknown, unknown, unknown>, 'data_source'> => {
    return async (context, req) => {
      const [{ savedObjects }] = await core.getStartServices();
      this.dataSourceClient.attachScopedSavedObjectsClient(savedObjects.getScopedClient(req));
      return new DataSourceRouteHandlerContext(this.dataSourceClient, this.logger);
    };
  };
}
