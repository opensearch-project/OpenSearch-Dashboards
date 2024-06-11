/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { Trigger } from '../../../ui_actions/public';

export const PLUGIN_RESOURCE_DELETE_TRIGGER = 'PLUGIN_RESOURCE_DELETE_TRIGGER';
export const pluginResourceDeleteTrigger: Trigger<'PLUGIN_RESOURCE_DELETE_TRIGGER'> = {
  id: PLUGIN_RESOURCE_DELETE_TRIGGER,
  title: i18n.translate('visAugmenter.triggers.pluginResourceDeleteTitle', {
    defaultMessage: 'Plugin resource delete',
  }),
  description: i18n.translate('visAugmenter.triggers.pluginResourceDeleteDescription', {
    defaultMessage: 'Delete augment-vis saved objs associated to the deleted plugin resource',
  }),
};
