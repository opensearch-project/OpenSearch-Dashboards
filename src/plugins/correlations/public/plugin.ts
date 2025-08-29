/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Plugin,
  CoreSetup,
  CoreStart,
  SavedObjectsClientContract,
  PluginInitializerContext,
} from '../../../core/public';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface CorrelationsSetup {}

export interface CorrelationsStart {
  savedObjectsClient: SavedObjectsClientContract;
}

export class CorrelationsPlugin implements Plugin<CorrelationsSetup, CorrelationsStart> {
  constructor(initializerContext: PluginInitializerContext) {}

  public setup(core: CoreSetup): CorrelationsSetup {
    return {};
  }

  public start(core: CoreStart): CorrelationsStart {
    return {
      savedObjectsClient: core.savedObjects.client,
    };
  }

  public stop() {}
}
