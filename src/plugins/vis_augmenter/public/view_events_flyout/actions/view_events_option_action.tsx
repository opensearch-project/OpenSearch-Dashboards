/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { EuiIconType } from '@elastic/eui/src/components/icon/icon';
import { get, isEmpty } from 'lodash';
import { VisualizeEmbeddable } from '../../../../visualizations/public';
import { EmbeddableContext } from '../../../../embeddable/public';
import { Action, IncompatibleActionError } from '../../../../ui_actions/public';
import { openViewEventsFlyout } from './open_events_flyout';
import { isEligibleForVisLayers } from '../../utils';
import { VIEW_EVENTS_FLYOUT_STATE, getFlyoutState } from '../flyout_state';

export const VIEW_EVENTS_OPTION_ACTION = 'VIEW_EVENTS_OPTION_ACTION';

export class ViewEventsOptionAction implements Action<EmbeddableContext> {
  public readonly type = VIEW_EVENTS_OPTION_ACTION;
  public readonly id = VIEW_EVENTS_OPTION_ACTION;
  public order = 1;

  public grouping: Action['grouping'] = [
    {
      id: VIEW_EVENTS_OPTION_ACTION,
      getDisplayName: this.getDisplayName,
      getIconType: this.getIconType,
      category: 'vis_augmenter',
      order: 10,
    },
  ];

  constructor() {}

  public getIconType(): EuiIconType {
    return 'inspect';
  }

  public getDisplayName() {
    return i18n.translate('dashboard.actions.viewEvents.displayName', {
      defaultMessage: 'View Events',
    });
  }

  public async isCompatible({ embeddable }: EmbeddableContext) {
    const vis = (embeddable as VisualizeEmbeddable).vis;
    return (
      vis !== undefined &&
      isEligibleForVisLayers(vis) &&
      !isEmpty((embeddable as VisualizeEmbeddable).visLayers)
    );
  }

  public async execute({ embeddable }: EmbeddableContext) {
    if (!(await this.isCompatible({ embeddable }))) {
      throw new IncompatibleActionError();
    }

    const visEmbeddable = embeddable as VisualizeEmbeddable;
    const savedObjectId = get(visEmbeddable.getInput(), 'savedObjectId', '');

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
