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

// Section support (Option 1): a section-only context-menu action that opens the
// add-panel-to-section flyout (appears in the section container's kebab / More
// menu). The same flyout is offered as an in-body call-to-action when an
// expanded section is empty (see DashboardGrid/DashboardSectionGrid).

import { i18n } from '@osd/i18n';
import React from 'react';
import { CoreStart } from 'src/core/public';
import { EuiIconType } from '@elastic/eui/src/components/icon/icon';
import { IEmbeddable, ViewMode, EmbeddableStart } from '../../../../embeddable/public';
import { ActionByType, IncompatibleActionError } from '../../../../ui_actions/public';
import { DASHBOARD_CONTAINER_TYPE, DashboardContainer } from '../embeddable';
import { isSectionEmbeddable } from '../embeddable/section';
import { openAddPanelToSectionFlyout } from './add_panel_to_section_flyout';

export const ACTION_ADD_PANEL_TO_SECTION = 'addPanelToSection';

export interface AddPanelToSectionActionContext {
  embeddable: IEmbeddable;
}

export class AddPanelToSectionAction implements ActionByType<typeof ACTION_ADD_PANEL_TO_SECTION> {
  public readonly type = ACTION_ADD_PANEL_TO_SECTION;
  public readonly id = ACTION_ADD_PANEL_TO_SECTION;
  // Sits just above "Move to section" (44) in the section's menu.
  public order = 43;

  constructor(
    private core: CoreStart,
    private savedObjectFinder: React.ComponentType<any>,
    private getEmbeddableFactories: EmbeddableStart['getEmbeddableFactories']
  ) {}

  public getDisplayName() {
    return i18n.translate('dashboard.section.addPanel.actionLabel', {
      defaultMessage: 'Add existing visualization',
    });
  }

  public getIconType(): EuiIconType {
    return 'plusInCircle';
  }

  public async isCompatible({ embeddable }: AddPanelToSectionActionContext) {
    // Only for a section container, in edit mode, inside a dashboard.
    if (!isSectionEmbeddable(embeddable)) {
      return false;
    }
    const root = embeddable.getRoot();
    return Boolean(
      root &&
      root.isContainer &&
      root.type === DASHBOARD_CONTAINER_TYPE &&
      embeddable.getInput()?.viewMode !== ViewMode.VIEW
    );
  }

  public async execute({ embeddable }: AddPanelToSectionActionContext) {
    if (!isSectionEmbeddable(embeddable)) {
      throw new IncompatibleActionError();
    }
    const container = embeddable.getRoot() as DashboardContainer;
    openAddPanelToSectionFlyout({
      overlays: this.core.overlays,
      notifications: this.core.notifications,
      container,
      sectionId: embeddable.id,
      savedObjectFinder: this.savedObjectFinder,
      getEmbeddableFactories: this.getEmbeddableFactories,
    });
  }
}
