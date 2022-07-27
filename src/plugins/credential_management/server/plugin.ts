/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */
import { first } from 'rxjs/operators';

import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
} from '../../../core/server';

import { 
  CredentialManagementPluginSetup, 
  CredentialManagementPluginStart,
  CredentialManagementPluginStartDeps,
} from './types';

import { registerRoutes } from './routes';
import { CredentialSavedObjectsType } from './saved_objects';
import { ConfigSchema } from '../config';
import { CryptographySingleton } from './crypto';

import { CredentialSavedObjectsClientWrapper } from './saved_objects/credential_saved_objects_client_wrapper';
import { saveObject } from 'src/plugins/saved_objects_management/public/lib';

// import { SavedObjectsServiceStart } from 'src/core/server';

// export interface CredentialManagementStartDependencies {
//   savedObjects: SavedObjectsServiceStart;
// }

export class CredentialManagementPlugin
  implements 
    Plugin<
      CredentialManagementPluginSetup,
      CredentialManagementPluginStart,
      CredentialManagementPluginStartDeps  
    > {
  private readonly logger: Logger;
  private initializerContext: PluginInitializerContext<ConfigSchema>;

  private cryptographySingleton?: CryptographySingleton;

  private savedObjectClientWrapper: CredentialSavedObjectsClientWrapper;

  constructor(initializerContext: PluginInitializerContext<ConfigSchema>) {
    this.logger = initializerContext.logger.get();
    this.initializerContext = initializerContext;
    this.savedObjectClientWrapper = new CredentialSavedObjectsClientWrapper();
  }

  public async setup( core: CoreSetup<CredentialManagementPluginStartDeps> ) {
    this.logger.debug('credential_management: Setup');

    const { opensearchDashboards } = await this.initializerContext.config.legacy.globalConfig$
      .pipe(first())
      .toPromise();

    if (opensearchDashboards.multipleDataSource.enabled) {
      const {
        materialPath,
        keyName,
        keyNamespace,
      } = await this.initializerContext.config.create().pipe(first()).toPromise();

      const router = core.http.createRouter();
      // Register credential saved object type
      // core.savedObjects.registerType(CredentialSavedObjectsType);
      core.savedObjects.addClientWrapper(1, 'credential', this.savedObjectClientWrapper.wrapperFactory);
      
      core.getStartServices().then(([_, depsStart]) => {
        registerRoutes(router, depsStart.savedObjects);
      });

      // Instantiate CryptoCli for encryption / decryption
      this.cryptographySingleton = CryptographySingleton.getInstance(
        materialPath,
        keyName,
        keyNamespace
      );
    }
    return {};
  }

  public start(core: CoreStart) {
    return {};
  }

  public stop() {}
}
