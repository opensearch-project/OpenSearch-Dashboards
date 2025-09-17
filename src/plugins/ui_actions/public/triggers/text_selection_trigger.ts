/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { Trigger } from '.';

export const TEXT_SELECTION_TRIGGER = 'TEXT_SELECTION_TRIGGER';
export const textSelectionTrigger: Trigger<'TEXT_SELECTION_TRIGGER'> = {
  id: TEXT_SELECTION_TRIGGER,
  title: i18n.translate('uiActions.triggers.textSelectionTitle', {
    defaultMessage: 'Text selection',
  }),
  description: i18n.translate('uiActions.triggers.textSelectionDescription', {
    defaultMessage: 'Text selected on the page for use as dynamic context',
  }),
};
