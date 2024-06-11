/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { Trigger } from '../../../ui_actions/public';

/**
 * TODO: This action is currently being used behind-the-scenes in the vis_augmenter plugin
 * to clean up related augment-vis saved objects when a visualization is deleted.
 * This should be moved and maintained by the saved objects plugin. Tracking issue:
 * https://github.com/opensearch-project/OpenSearch-Dashboards/issues/4499
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
