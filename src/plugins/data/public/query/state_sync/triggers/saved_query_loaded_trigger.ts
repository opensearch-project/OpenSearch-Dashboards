/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { QueryStateTrigger, QUERY_STATE_TRIGGER_TYPES } from '../types';

export const SAVED_QUERY_LOADED_TRIGGER: QueryStateTrigger = {
  id: QUERY_STATE_TRIGGER_TYPES.SAVED_QUERY_LOADED,
  title: i18n.translate('data.triggers.savedQueryLoadedTitle', {
    defaultMessage: 'Saved query loaded',
  }),
  description: i18n.translate('data.triggers.savedQueryLoadedDescription', {
    defaultMessage: 'When a saved query is loaded',
  }),
};
