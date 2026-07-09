/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreSetup, CoreStart, Logger, Plugin, PluginInitializerContext } from 'src/core/server';
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
    this.logger.warn(
      `[EXPERIMENTAL] ${PLUGIN_NAME} is enabled. Legacy backend compatibility is experimental and may change in future releases.`
    );
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
