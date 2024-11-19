/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { QUERY_STATE_TRIGGER_TYPES, QueryStateTrigger } from '../types';

export const SAVED_TEMPLATE_LOADED_TRIGGER: QueryStateTrigger = {
  id: QUERY_STATE_TRIGGER_TYPES.SAVED_TEMPLATE_LOADED,
  title: i18n.translate('data.triggers.savedTemplateLoadedTitle', {
    defaultMessage: 'Saved template loaded',
  }),
  description: i18n.translate('data.triggers.savedTemplateLoadedDescription', {
    defaultMessage: 'When a saved template is loaded',
  }),
};
