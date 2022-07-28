/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
} from '../../../core/server';

import { CredentialManagementPluginSetup, CredentialManagementPluginStart } from './types';
import { defineRoutes } from './routes';

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
    defineRoutes(router);

    return {};
  }

  public start(core: CoreStart) {
    this.logger.debug('credentialManagement: Started');
    return {};
  }

  public stop() {}
}
