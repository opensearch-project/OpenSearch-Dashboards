/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { QueryStateTrigger, QUERY_STATE_TRIGGER_TYPES } from '../types';

export const FIELD_SELECTED_TRIGGER: QueryStateTrigger = {
  id: QUERY_STATE_TRIGGER_TYPES.FIELD_SELECTED,
  title: i18n.translate('data.triggers.fieldSelectedTriggerTitle', {
    defaultMessage: 'Field selected',
  }),
  description: i18n.translate('data.triggers.fieldSelectedTriggerDescription', {
    defaultMessage: 'When a field is selected',
  }),
};
