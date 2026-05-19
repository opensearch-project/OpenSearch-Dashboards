/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { first } from 'rxjs/operators';
import { CoreSetup, CoreStart, Logger, Plugin, PluginInitializerContext } from 'src/core/server';
import { BackendCompatibilityConfig } from './config';
import { CompatibilityTransport } from './transport/compatibility_transport';
import { BackendInfo } from './transport/types';
import { PLUGIN_NAME } from '../common';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface BackendCompatibilityPluginSetup {}

export interface BackendCompatibilityPluginStart {
  getBackendInfo: () => BackendInfo | undefined;
}

export class BackendCompatibilityPlugin
  implements Plugin<BackendCompatibilityPluginSetup, BackendCompatibilityPluginStart> {
  private readonly logger: Logger;
  private readonly initializerContext: PluginInitializerContext;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
    this.initializerContext = initializerContext;
  }

  public async setup(core: CoreSetup): Promise<BackendCompatibilityPluginSetup> {
    const config = await this.initializerContext.config
      .create<BackendCompatibilityConfig>()
      .pipe(first())
      .toPromise();

    if (!config.enabled) {
      this.logger.info(`${PLUGIN_NAME} is disabled`);
      return {};
    }

    this.logger.info(`Setting up ${PLUGIN_NAME}`);
    core.opensearch.registerClientTransport(CompatibilityTransport);
    this.logger.info('CompatibilityTransport registered with core');
    return {};
  }

  public async start(core: CoreStart): Promise<BackendCompatibilityPluginStart> {
    return {
      getBackendInfo: () => CompatibilityTransport.lastDetectedBackend ?? undefined,
    };
  }

  public stop() {
    this.logger.info(`Stopping ${PLUGIN_NAME}`);
  }
}
