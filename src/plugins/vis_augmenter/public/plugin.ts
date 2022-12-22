/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginInitializerContext, CoreSetup, CoreStart, Plugin } from '../../../core/public';
import { DataPublicPluginSetup, DataPublicPluginStart } from '../../data/public';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface VisAugmenterSetup {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface VisAugmenterStart {}

export interface VisAugmenterSetupDeps {
  data: DataPublicPluginSetup;
}

export interface VisAugmenterStartDeps {
  data: DataPublicPluginStart;
}

export class VisAugmenterPlugin
  implements
    Plugin<VisAugmenterSetup, VisAugmenterStart, VisAugmenterSetupDeps, VisAugmenterStartDeps> {
  constructor(initializerContext: PluginInitializerContext) {}

  public setup(
    core: CoreSetup<VisAugmenterStartDeps, VisAugmenterStart>,
    { data }: VisAugmenterSetupDeps
  ): VisAugmenterSetup {
    return {};
  }

  public start(core: CoreStart, { data }: VisAugmenterStartDeps): VisAugmenterStart {
    return {};
  }

  public stop() {}
}
