/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { first } from 'rxjs/operators';

import { PluginInitializerContext, CoreSetup, CoreStart, Plugin, Logger } from 'src/core/server';
import { dataSource, credential, CredentialSavedObjectsClientWrapper } from './saved_objects';
import { DataSourcePluginConfigType } from '../config';

import { DataSourcePluginSetup, DataSourcePluginStart } from './types';

import { CryptographyClient } from './cryptography';

export class DataSourcePlugin implements Plugin<DataSourcePluginSetup, DataSourcePluginStart> {
  private readonly logger: Logger;

  constructor(private initializerContext: PluginInitializerContext<DataSourcePluginConfigType>) {
    this.logger = this.initializerContext.logger.get();
  }

  public async setup(core: CoreSetup) {
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

    return {};
  }

  public start(core: CoreStart) {
    this.logger.debug('data_source: Started');
    return {};
  }

  public stop() {}
}
