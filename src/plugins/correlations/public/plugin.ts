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
