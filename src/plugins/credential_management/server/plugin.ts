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

import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
} from '../../../core/server';

import { CredentialManagementPluginSetup, CredentialManagementPluginStart } from './types';
import { registerRoutes, defineRoutes } from './routes';
import { credentialSavedObjectType } from './saved_objects';

export class CredentialManagementPlugin
  implements Plugin<CredentialManagementPluginSetup, CredentialManagementPluginStart> {
  private readonly logger: Logger;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public setup(core: CoreSetup) {
    this.logger.debug('credentialManagement: Setup');
    const router = core.http.createRouter();

    // Register server side APIs
    registerRoutes(router);
    defineRoutes(router);

    // Register credential saved object type
    core.savedObjects.registerType(credentialSavedObjectType);

    return {};
  }

  public start(core: CoreStart) {
    this.logger.debug('credentialManagement: Started');
    return {};
  }

  public stop() {
    this.logger.debug('credentialManagement: Stoped');
  }
}
