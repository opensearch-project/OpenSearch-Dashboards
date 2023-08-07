/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { UiActionsSetup } from '../../ui_actions/public';
import { SAVED_OBJECT_DELETE_TRIGGER, savedObjectDeleteTrigger } from './triggers';

export interface SavedObjectDeleteContext {
  type: string;
  savedObjectId: string;
}

declare module '../../ui_actions/public' {
  export interface TriggerContextMapping {
    [SAVED_OBJECT_DELETE_TRIGGER]: SavedObjectDeleteContext;
  }
}

export const bootstrap = (uiActions: UiActionsSetup) => {
  uiActions.registerTrigger(savedObjectDeleteTrigger);
};
