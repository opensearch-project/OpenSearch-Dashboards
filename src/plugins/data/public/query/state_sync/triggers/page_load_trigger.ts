/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { QueryStateTrigger, QUERY_STATE_TRIGGER_TYPES } from '../types';

export const PAGE_LOADED_TRIGGER: QueryStateTrigger = {
  id: QUERY_STATE_TRIGGER_TYPES.PAGE_LOADED,
  title: i18n.translate('data.triggers.pageLoadedTitle', {
    defaultMessage: 'Page loaded',
  }),
  description: i18n.translate('data.triggers.pageLoadedDescription', {
    defaultMessage: 'When the page is loaded',
  }),
};
