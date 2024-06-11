/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExpressionsSetup } from '../../expressions/public';
import { PluginInitializerContext, CoreSetup, CoreStart, Plugin } from '../../../core/public';
import { visLayers } from './expressions';
import { setSavedAugmentVisLoader, setUISettings } from './services';
import { createSavedAugmentVisLoader, SavedAugmentVisLoader } from './saved_augment_vis';
import { UiActionsStart } from '../../ui_actions/public';
import {
  setUiActions,
  setEmbeddable,
  setQueryService,
  setVisualizations,
  setCore,
} from './services';
import { EmbeddableStart } from '../../embeddable/public';
import { DataPublicPluginStart } from '../../data/public';
import { VisualizationsStart } from '../../visualizations/public';
import { VIEW_EVENTS_FLYOUT_STATE, setFlyoutState } from './view_events_flyout';
import { bootstrapUiActions } from './ui_actions_bootstrap';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface VisAugmenterSetup {}

export interface VisAugmenterStart {
  savedAugmentVisLoader: SavedAugmentVisLoader;
}

export interface VisAugmenterSetupDeps {
  expressions: ExpressionsSetup;
}

export interface VisAugmenterStartDeps {
  uiActions: UiActionsStart;
  embeddable: EmbeddableStart;
  data: DataPublicPluginStart;
  visualizations: VisualizationsStart;
}

export class VisAugmenterPlugin
  implements
    Plugin<VisAugmenterSetup, VisAugmenterStart, VisAugmenterSetupDeps, VisAugmenterStartDeps> {
  constructor(initializerContext: PluginInitializerContext) {}

  public setup(
    core: CoreSetup<VisAugmenterStartDeps, VisAugmenterStart>,
    { expressions }: VisAugmenterSetupDeps
  ): VisAugmenterSetup {
    expressions.registerType(visLayers);
    setUISettings(core.uiSettings);

    return {};
  }

  public start(
    core: CoreStart,
    { uiActions, embeddable, data, visualizations }: VisAugmenterStartDeps
  ): VisAugmenterStart {
    setUiActions(uiActions);
    setEmbeddable(embeddable);
    setQueryService(data.query);
    setVisualizations(visualizations);
    setCore(core);
    setFlyoutState(VIEW_EVENTS_FLYOUT_STATE.CLOSED);

    const savedAugmentVisLoader = createSavedAugmentVisLoader({
      savedObjectsClient: core.savedObjects.client,
      indexPatterns: data.indexPatterns,
      search: data.search,
      chrome: core.chrome,
      overlays: core.overlays,
    });
    setSavedAugmentVisLoader(savedAugmentVisLoader);

    // sets up the context mappings and registers any triggers/actions for the plugin
    bootstrapUiActions(uiActions);

    return { savedAugmentVisLoader };
  }

  public stop() {}
}
