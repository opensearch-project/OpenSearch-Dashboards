/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { get } from 'lodash';
import { CoreStart } from 'opensearch-dashboards/public';
import { VisualizeEmbeddable } from '../../../visualizations/public';
import { EmbeddableContext } from '../../../embeddable/public';
import { EuiIconType } from '@elastic/eui/src/components/icon/icon';
import { Action, IncompatibleActionError } from '../../../ui_actions/public';
import { openViewEventsFlyout } from './open_events_flyout';

export const VIEW_EVENTS_OPTION_ACTION = 'VIEW_EVENTS_OPTION_ACTION';

export class ViewEventsOptionAction implements Action<EmbeddableContext> {
  public readonly type = VIEW_EVENTS_OPTION_ACTION;
  public readonly id = VIEW_EVENTS_OPTION_ACTION;
  public order = 1;

  constructor(private core: CoreStart) {}

  public getIconType(): EuiIconType {
    return 'apmTrace';
  }

  public getDisplayName() {
    return i18n.translate('dashboard.actions.viewEvents.displayName', {
      defaultMessage: 'View Events',
    });
  }

  public async isCompatible({ embeddable }: EmbeddableContext) {
    // TODO: add the logic for compatibility here, probably from some helper fn.
    // see https://github.com/opensearch-project/OpenSearch-Dashboards/issues/3268
    return true;
  }

  public async execute({ embeddable }: EmbeddableContext) {
    if (!(await this.isCompatible({ embeddable }))) {
      throw new IncompatibleActionError();
    }

    const visEmbeddable = embeddable as VisualizeEmbeddable;
    const savedObjectId = get(visEmbeddable.getInput(), 'savedObjectId', '');

    openViewEventsFlyout({
      core: this.core,
      savedObjectId,
    });
  }
}
