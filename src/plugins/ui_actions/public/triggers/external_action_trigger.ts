/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { Trigger } from '.';

export const EXTERNAL_ACTION_TRIGGER = 'EXTERNAL_ACTION_TRIGGER';
export const externalActionTrigger: Trigger<'EXTERNAL_ACTION_TRIGGER'> = {
  id: EXTERNAL_ACTION_TRIGGER,
  title: i18n.translate('uiActions.triggers.externalActionTitle', {
    defaultMessage: 'Single click',
  }),
  description: i18n.translate('uiActions.triggers.externalActionDescription', {
    defaultMessage:
      'A data point click on the visualization used to trigger external action like show flyout, etc.',
  }),
};
