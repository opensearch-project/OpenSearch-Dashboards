/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { QueryStateTrigger, QUERY_STATE_TRIGGER_TYPES } from '../types';

export const LANGUAGE_CHANGED_TRIGGER: QueryStateTrigger = {
  id: QUERY_STATE_TRIGGER_TYPES.LANGUAGE_CHANGED,
  title: i18n.translate('data.triggers.languageChangedTriggerTitle', {
    defaultMessage: 'Language changed',
  }),
  description: i18n.translate('data.triggers.languageChangedTriggerDescription', {
    defaultMessage: 'When a language is changed',
  }),
};
