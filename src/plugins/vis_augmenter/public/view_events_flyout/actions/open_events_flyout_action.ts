/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { CoreStart } from 'opensearch-dashboards/public';
import { Action, IncompatibleActionError } from '../../../../ui_actions/public';
import { AugmentVisContext } from '../../ui_actions_bootstrap';
import { openViewEventsFlyout } from './open_events_flyout';
import { VIEW_EVENTS_FLYOUT_STATE, getFlyoutState } from '../flyout_state';

export const OPEN_EVENTS_FLYOUT_ACTION = 'OPEN_EVENTS_FLYOUT_ACTION';

/**
 * This action is identical to VIEW_EVENTS_OPTION_ACTION, but with different context.
 * This is because the chart doesn't persist the embeddable, which is the default
 * context used by the CONTEXT_MENU_TRIGGER. Because of that, we need a separate
 * one that can be persisted in the chart - in this case, the AugmentVisContext,
 * which is just a saved object ID.
 */

export class OpenEventsFlyoutAction implements Action<AugmentVisContext> {
  public readonly type = OPEN_EVENTS_FLYOUT_ACTION;
  public readonly id = OPEN_EVENTS_FLYOUT_ACTION;
  public order = 1;

  constructor() {}

  public getIconType() {
    return undefined;
  }

  public getDisplayName() {
    return i18n.translate('dashboard.actions.viewEvents.displayName', {
      defaultMessage: 'View Events',
    });
  }

  public async isCompatible({ savedObjectId }: AugmentVisContext) {
    // checks for null / undefined / empty string
    return savedObjectId ? true : false;
  }

  public async execute({ savedObjectId }: AugmentVisContext) {
    if (!(await this.isCompatible({ savedObjectId }))) {
      throw new IncompatibleActionError();
    }

    // This action may get triggered even when the flyout is already open (e.g.,
    // clicking on an annotation point within a chart displayed in the flyout).
    // In such case, we want to ignore it such that users can't keep endlessly
    // re-opening it.
    if (getFlyoutState() === VIEW_EVENTS_FLYOUT_STATE.CLOSED) {
      openViewEventsFlyout({
        savedObjectId,
      });
    }
  }
}
