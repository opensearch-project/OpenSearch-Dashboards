/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { QUERY_STATE_TRIGGER_TYPES, QueryStateTrigger } from '../types';

export const SAVED_SEARCH_LOADED_TRIGGER: QueryStateTrigger = {
  id: QUERY_STATE_TRIGGER_TYPES.SAVED_SEARCH_LOADED,
  title: i18n.translate('data.triggers.savedSearchLoadedTitle', {
    defaultMessage: 'Saved search loaded',
  }),
  description: i18n.translate('data.triggers.savedSearchLoadedDescription', {
    defaultMessage: 'When a saved search is loaded',
  }),
};
