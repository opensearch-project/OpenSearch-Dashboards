/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { QueryStateTrigger, QUERY_STATE_TRIGGER_TYPES } from '../types';

export const USER_SUBMITTED_TRIGGER: QueryStateTrigger = {
  id: QUERY_STATE_TRIGGER_TYPES.USER_SUBMITTED,
  title: i18n.translate('data.triggers.userSubmittedTitle', {
    defaultMessage: 'User submitted query',
  }),
  description: i18n.translate('data.triggers.userSubmittedDescription', {
    defaultMessage:
      'When user submits query using the query editor keyboard shortcut or by clicking the run button',
  }),
};
