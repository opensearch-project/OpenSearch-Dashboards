/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { Trigger } from '.';

export const ABORT_DATA_QUERY_TRIGGER = 'ABORT_DATA_QUERY_TRIGGER';
export const abortDataQueryTrigger: Trigger<'ABORT_DATA_QUERY_TRIGGER'> = {
  id: ABORT_DATA_QUERY_TRIGGER,
  title: i18n.translate('uiActions.triggers.abortDataQueryTrigger', {
    defaultMessage: 'Abort data query',
  }),
  description: i18n.translate('uiActions.triggers.abortDataQueryDescription', {
    defaultMessage: 'Abort present data query request',
  }),
};
