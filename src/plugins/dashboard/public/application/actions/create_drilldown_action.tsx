/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { i18n } from '@osd/i18n';
import { CoreStart } from 'src/core/public';
import { EuiIconType } from '@elastic/eui/src/components/icon/icon';
import { IEmbeddable, ViewMode, EmbeddableStart } from '../../../../embeddable/public';
import { DASHBOARD_CONTAINER_TYPE, DashboardContainer } from '../embeddable';
import { ActionByType, IncompatibleActionError } from '../../../../ui_actions/public';

// TODO: Change to import from the flyout of create drilldown
import { openReplacePanelFlyout } from './open_replace_panel_flyout';

export const ACTION_CREATE_DRILLDOWN = 'createDrilldown';

function isDashboard(embeddable: IEmbeddable): embeddable is DashboardContainer {
  return embeddable.type === DASHBOARD_CONTAINER_TYPE;
}

// TODO:   this function is to make the button to create drilldown
//         becomes edit drilldown, because no more than 1 drilldown
//         can be created
// function isCreated(embeddable: IEmbeddable) {

// }

export interface CreateDrilldownActionContext {
  embeddable: IEmbeddable;
}

export class CreateDrilldownAction implements ActionByType<typeof ACTION_CREATE_DRILLDOWN> {
  public readonly type = ACTION_CREATE_DRILLDOWN;
  public readonly id = ACTION_CREATE_DRILLDOWN;
  public order = 6;

  constructor(
    private core: CoreStart,
    private savedobjectfinder: React.ComponentType<any>,
    private notifications: CoreStart['notifications'],
    private getEmbeddableFactories: EmbeddableStart['getEmbeddableFactories']
  ) {}

  public getDisplayName({ embeddable }: CreateDrilldownActionContext) {
    if (!embeddable.parent || !isDashboard(embeddable.parent)) {
      throw new IncompatibleActionError();
    }

    // TODO: Change the translation for create drilldown text (Create drilldown)
    return i18n.translate('dashboard...', {
      defaultMessage: 'Create drilldown',
    });
  }

  // TODO: Change the icon
  public getIconType({ embeddable }: CreateDrilldownActionContext): EuiIconType {
    if (!embeddable.parent || !isDashboard(embeddable.parent)) {
      throw new IncompatibleActionError();
    }
    return 'kqlOperand';
  }

  public async isCompatible({ embeddable }: CreateDrilldownActionContext) {
    if (embeddable.getInput().viewMode) {
      if (embeddable.getInput().viewMode === ViewMode.VIEW) {
        return false;
      }
    }

    return Boolean(embeddable.parent && isDashboard(embeddable.parent));
  }

  public async execute({ embeddable }: CreateDrilldownActionContext) {
    if (!embeddable.parent || !isDashboard(embeddable.parent)) {
      throw new IncompatibleActionError();
    }

    const view = embeddable;
    const dash = embeddable.parent;

    // TODO: change to create drilldown flyout
    openReplacePanelFlyout({
      embeddable: dash,
      core: this.core,
      savedObjectFinder: this.savedobjectfinder,
      notifications: this.notifications,
      panelToRemove: view,
      getEmbeddableFactories: this.getEmbeddableFactories,
    });
  }
}
