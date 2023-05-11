/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExpressionsSetup } from '../../expressions/public';
import { PluginInitializerContext, CoreSetup, CoreStart, Plugin } from '../../../core/public';
import { DataPublicPluginSetup, DataPublicPluginStart } from '../../data/public';
import { visLayers } from './expressions';
import { setSavedAugmentVisLoader } from './services';
import { createSavedAugmentVisLoader, SavedAugmentVisLoader } from './saved_augment_vis';
import {
  UiActionsSetup,
  EXTERNAL_ACTION_TRIGGER,
  externalActionTrigger,
} from '../../ui_actions/public';
import { createExternalActionAction } from './actions/external_action_action';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface VisAugmenterSetup {}

export interface VisAugmenterStart {
  savedAugmentVisLoader: SavedAugmentVisLoader;
}

export interface VisAugmenterSetupDeps {
  data: DataPublicPluginSetup;
  expressions: ExpressionsSetup;
  uiActions: UiActionsSetup;
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
    { data, expressions, uiActions }: VisAugmenterSetupDeps
  ): VisAugmenterSetup {
    expressions.registerType(visLayers);
    try {
      uiActions.registerTrigger(externalActionTrigger);
      uiActions.addTriggerAction(EXTERNAL_ACTION_TRIGGER, createExternalActionAction());
    } catch (error: any) {
      // NYI
    }
    return {};
  }

  public start(core: CoreStart, { data }: VisAugmenterStartDeps): VisAugmenterStart {
    const savedAugmentVisLoader = createSavedAugmentVisLoader({
      savedObjectsClient: core.savedObjects.client,
      indexPatterns: data.indexPatterns,
      search: data.search,
      chrome: core.chrome,
      overlays: core.overlays,
    });
    setSavedAugmentVisLoader(savedAugmentVisLoader);
    return { savedAugmentVisLoader };
  }

  public stop() {}
}
