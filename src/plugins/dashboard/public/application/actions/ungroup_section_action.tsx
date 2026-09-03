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

// Section support (Option 1): a section-only "Ungroup section" context-menu
// action. It removes the section via DashboardContainer.ungroupSection, which
// releases the members back into absolute dashboard space at the section's
// location (the members stay on the dashboard) -- behind a confirmation dialog
// so the (irreversible) ungrouping is intentional. Contrast with the generic
// "Delete from dashboard", which removes the section AND its member panels.

import { i18n } from '@osd/i18n';
import { EUI_MODAL_CONFIRM_BUTTON } from '@elastic/eui';
import { EuiIconType } from '@elastic/eui/src/components/icon/icon';
import { CoreStart } from 'src/core/public';
import { IEmbeddable, ViewMode } from '../../../../embeddable/public';
import { ActionByType, IncompatibleActionError } from '../../../../ui_actions/public';
import { DASHBOARD_CONTAINER_TYPE, DashboardContainer } from '../embeddable';
import { isSectionEmbeddable } from '../embeddable/section';

export const ACTION_UNGROUP_SECTION = 'ungroupSection';

export interface UngroupSectionActionContext {
  embeddable: IEmbeddable;
}

export class UngroupSectionAction implements ActionByType<typeof ACTION_UNGROUP_SECTION> {
  public readonly type = ACTION_UNGROUP_SECTION;
  public readonly id = ACTION_UNGROUP_SECTION;
  // Sits just below "Add existing visualization" (43) / "Move to section" (44).
  public order = 42;

  constructor(private core: CoreStart) {}

  public getDisplayName() {
    return i18n.translate('dashboard.section.ungroup.actionLabel', {
      defaultMessage: 'Ungroup section',
    });
  }

  public getIconType(): EuiIconType {
    return 'exit';
  }

  public async isCompatible({ embeddable }: UngroupSectionActionContext) {
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

  public async execute({ embeddable }: UngroupSectionActionContext) {
    if (!isSectionEmbeddable(embeddable)) {
      throw new IncompatibleActionError();
    }
    const container = embeddable.getRoot() as DashboardContainer;

    const confirmed = await this.core.overlays.openConfirm(
      i18n.translate('dashboard.section.ungroup.confirmDescription', {
        defaultMessage:
          'The section will be removed. Its panels stay on the dashboard and keep their positions.',
      }),
      {
        title: i18n.translate('dashboard.section.ungroup.confirmTitle', {
          defaultMessage: 'Ungroup this section?',
        }),
        confirmButtonText: i18n.translate('dashboard.section.ungroup.confirmButtonLabel', {
          defaultMessage: 'Ungroup',
        }),
        cancelButtonText: i18n.translate('dashboard.section.ungroup.cancelButtonLabel', {
          defaultMessage: 'Cancel',
        }),
        defaultFocusedButton: EUI_MODAL_CONFIRM_BUTTON,
      }
    );

    if (!confirmed) {
      return;
    }

    // Keep the panels: DashboardContainer.ungroupSection releases the members
    // to absolute space at the section's location, then drops the section.
    container.ungroupSection(embeddable.id);
  }
}
