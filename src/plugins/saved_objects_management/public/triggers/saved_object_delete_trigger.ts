/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { Trigger } from '../../../ui_actions/public';

export const SAVED_OBJECT_DELETE_TRIGGER = 'SAVED_OBJECT_DELETE_TRIGGER';
export const savedObjectDeleteTrigger: Trigger<'SAVED_OBJECT_DELETE_TRIGGER'> = {
  id: SAVED_OBJECT_DELETE_TRIGGER,
  title: i18n.translate('savedObjectsManagement.triggers.savedObjectDeleteTitle', {
    defaultMessage: 'Saved object delete',
  }),
  description: i18n.translate('savedObjectsManagement.triggers.savedObjectDeleteDescription', {
    defaultMessage: 'Delete augment-vis saved objs associated to the deleted saved object',
  }),
};
