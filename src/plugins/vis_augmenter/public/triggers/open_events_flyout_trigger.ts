/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { Trigger, OPEN_EVENTS_FLYOUT_TRIGGER } from '../../../ui_actions/public';

export interface AugmentVisContext {
  savedObjectId: string;
}

export const openEventsFlyoutTrigger: Trigger<'OPEN_EVENTS_FLYOUT_TRIGGER'> = {
  id: OPEN_EVENTS_FLYOUT_TRIGGER,
  title: i18n.translate('uiActions.triggers.openEventsFlyoutTrigger', {
    defaultMessage: 'Open the View Events flyout',
  }),
  description: i18n.translate('uiActions.triggers.openEventsFlyoutDescription', {
    defaultMessage: `Opening the 'View Events' flyout`,
  }),
};
