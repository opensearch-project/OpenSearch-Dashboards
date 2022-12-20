/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginInitializerContext, CoreSetup, CoreStart, Plugin } from '../../../core/public';
import { DataPublicPluginSetup, DataPublicPluginStart } from '../../data/public';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PluginIntegrationSetup {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PluginIntegrationStart {}

export interface PluginIntegrationSetupDeps {
  data: DataPublicPluginSetup;
}

export interface PluginIntegrationStartDeps {
  data: DataPublicPluginStart;
}

export class PluginIntegrationPlugin
  implements
    Plugin<
      PluginIntegrationSetup,
      PluginIntegrationStart,
      PluginIntegrationSetupDeps,
      PluginIntegrationStartDeps
    > {
  constructor(initializerContext: PluginInitializerContext) {}

  public setup(
    core: CoreSetup<PluginIntegrationStartDeps, PluginIntegrationStart>,
    { data }: PluginIntegrationSetupDeps
  ): PluginIntegrationSetup {
    return {};
  }

  public start(core: CoreStart, { data }: PluginIntegrationStartDeps): PluginIntegrationStart {
    return {};
  }

  public stop() {}
}
