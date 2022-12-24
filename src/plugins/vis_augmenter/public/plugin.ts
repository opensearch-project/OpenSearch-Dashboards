/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExpressionsSetup } from '../../expressions/public';
import { PluginInitializerContext, CoreSetup, CoreStart, Plugin } from '../../../core/public';
import { DataPublicPluginSetup, DataPublicPluginStart } from '../../data/public';
import { visLayers } from './expressions';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface VisAugmenterSetup {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface VisAugmenterStart {}

export interface VisAugmenterSetupDeps {
  data: DataPublicPluginSetup;
  expressions: ExpressionsSetup;
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
    { data, expressions }: VisAugmenterSetupDeps
  ): VisAugmenterSetup {
    expressions.registerType(visLayers);
    return {};
  }

  public start(core: CoreStart, { data }: VisAugmenterStartDeps): VisAugmenterStart {
    return {};
  }

  public stop() {}
}
