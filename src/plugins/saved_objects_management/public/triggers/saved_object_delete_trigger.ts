/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { Trigger } from '../../../ui_actions/public';

/**
 * This action is currently being used behind-the-scenes in the vis_augmenter plugin
 * to clean up related augment-vis saved objects when a visualization is deleted.
 * This could be improved upon by potentially moving and maintaining this in the
 * saved_objects plugin, expanding to other situations where automatic cleanup may
 * be helpful, and communicating this better on the UI (modals, callouts, etc.)
 */
export const SAVED_OBJECT_DELETE_TRIGGER = 'SAVED_OBJECT_DELETE_TRIGGER';
export const savedObjectDeleteTrigger: Trigger<'SAVED_OBJECT_DELETE_TRIGGER'> = {
  id: SAVED_OBJECT_DELETE_TRIGGER,
  title: i18n.translate('savedObjectsManagement.triggers.savedObjectDeleteTitle', {
    defaultMessage: 'Saved object delete',
  }),
  description: i18n.translate('savedObjectsManagement.triggers.savedObjectDeleteDescription', {
    defaultMessage: 'Perform additional actions after deleting a saved object',
  }),
};
