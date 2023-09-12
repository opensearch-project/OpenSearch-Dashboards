/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  OpenEventsFlyoutAction,
  ViewEventsOptionAction,
  OPEN_EVENTS_FLYOUT_ACTION,
  VIEW_EVENTS_OPTION_ACTION,
} from './view_events_flyout';
import { CONTEXT_MENU_TRIGGER, EmbeddableContext } from '../../embeddable/public';
import { SAVED_OBJECT_DELETE_TRIGGER } from '../../saved_objects_management/public';
import {
  externalActionTrigger,
  EXTERNAL_ACTION_TRIGGER,
  UiActionsSetup,
} from '../../ui_actions/public';
import { ISavedAugmentVis } from './saved_augment_vis';
import { VisLayer } from './types';
import {
  PLUGIN_RESOURCE_DELETE_ACTION,
  PluginResourceDeleteAction,
  SAVED_OBJECT_DELETE_ACTION,
  SavedObjectDeleteAction,
} from './actions';
import { PLUGIN_RESOURCE_DELETE_TRIGGER, pluginResourceDeleteTrigger } from './triggers';

export interface AugmentVisContext {
  savedObjectId: string;
}

export interface SavedObjectDeleteContext {
  type: string;
  savedObjectId: string;
}

export interface PluginResourceDeleteContext {
  savedObjs: ISavedAugmentVis[];
  visLayers: VisLayer[];
}

// Overriding the mappings defined in UIActions plugin so that
// the new trigger and action definitions resolve.
// This is a common pattern among internal Dashboards plugins.
declare module '../../ui_actions/public' {
  export interface TriggerContextMapping {
    [EXTERNAL_ACTION_TRIGGER]: AugmentVisContext;
    [PLUGIN_RESOURCE_DELETE_TRIGGER]: PluginResourceDeleteContext;
  }

  export interface ActionContextMapping {
    [OPEN_EVENTS_FLYOUT_ACTION]: AugmentVisContext;
    [VIEW_EVENTS_OPTION_ACTION]: EmbeddableContext;
    [SAVED_OBJECT_DELETE_ACTION]: SavedObjectDeleteContext;
    [PLUGIN_RESOURCE_DELETE_ACTION]: PluginResourceDeleteContext;
  }
}

export const bootstrapUiActions = (uiActions: UiActionsSetup) => {
  const openEventsFlyoutAction = new OpenEventsFlyoutAction();
  const viewEventsOptionAction = new ViewEventsOptionAction();
  const savedObjectDeleteAction = new SavedObjectDeleteAction();
  const pluginResourceDeleteAction = new PluginResourceDeleteAction();

  uiActions.registerAction(openEventsFlyoutAction);
  uiActions.registerAction(viewEventsOptionAction);
  uiActions.registerAction(savedObjectDeleteAction);
  uiActions.registerAction(pluginResourceDeleteAction);

  uiActions.registerTrigger(externalActionTrigger);
  uiActions.registerTrigger(pluginResourceDeleteTrigger);

  uiActions.addTriggerAction(PLUGIN_RESOURCE_DELETE_TRIGGER, pluginResourceDeleteAction);
  uiActions.addTriggerAction(EXTERNAL_ACTION_TRIGGER, openEventsFlyoutAction);

  // These triggers are registered by other plugins. If they are disabled can throw an error.
  try {
    uiActions.addTriggerAction(CONTEXT_MENU_TRIGGER, viewEventsOptionAction);
    uiActions.addTriggerAction(SAVED_OBJECT_DELETE_TRIGGER, savedObjectDeleteAction);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
  }
};
