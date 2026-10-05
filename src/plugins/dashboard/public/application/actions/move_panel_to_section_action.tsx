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

import React from 'react';
import { i18n } from '@osd/i18n';
import { CoreStart } from 'src/core/public';
import {
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiButton,
  EuiButtonEmpty,
  EuiRadioGroup,
  EuiRadioGroupOption,
} from '@elastic/eui';
import { EuiIconType } from '@elastic/eui/src/components/icon/icon';
import { IEmbeddable, ViewMode, isErrorEmbeddable } from '../../../../embeddable/public';
import { ActionByType, IncompatibleActionError } from '../../../../ui_actions/public';
import { DASHBOARD_CONTAINER_TYPE, DashboardContainer } from '..';
import { DashboardLayout } from '../../../common';
import { moveMemberToSection, setSectionCollapsed } from '../embeddable/section_layout_utils';
import { toMountPoint } from '../../../../opensearch_dashboards_react/public';

export const ACTION_MOVE_PANEL_TO_SECTION = 'movePanelToSection';

export interface MovePanelToSectionActionContext {
  embeddable: IEmbeddable;
}

const getSectionLayout = (dashboard: DashboardContainer): DashboardLayout | undefined => {
  const layout = dashboard.getInput().layout;
  return layout && layout.type === 'SectionLayout' && layout.items.length > 0 ? layout : undefined;
};

const findOwningSectionId = (layout: DashboardLayout, memberId: string): string | undefined =>
  layout.items.find((section) => section.members.some((m) => m.idRef === memberId))?.id;

export class MovePanelToSectionAction implements ActionByType<typeof ACTION_MOVE_PANEL_TO_SECTION> {
  public readonly type = ACTION_MOVE_PANEL_TO_SECTION;
  public readonly id = ACTION_MOVE_PANEL_TO_SECTION;
  public order = 44;

  constructor(private core: CoreStart) {}

  public getDisplayName({ embeddable }: MovePanelToSectionActionContext) {
    if (!this.isDashboardChild(embeddable)) {
      throw new IncompatibleActionError();
    }
    return i18n.translate('dashboard.panel.movePanelToSection.changeSection', {
      defaultMessage: 'Move to section',
    });
  }

  public getIconType(): EuiIconType {
    return 'folderOpen';
  }

  public async isCompatible({ embeddable }: MovePanelToSectionActionContext) {
    if (!this.isDashboardChild(embeddable) || isErrorEmbeddable(embeddable)) {
      return false;
    }
    if (embeddable.getInput()?.viewMode === ViewMode.VIEW) {
      return false;
    }
    const dashboard = embeddable.getRoot() as DashboardContainer;
    const layout = getSectionLayout(dashboard);
    if (!layout) {
      return false;
    }
    // A claimed panel needs another section as a target; an unclaimed panel can
    // move into the first section.
    const owningSectionId = findOwningSectionId(layout, embeddable.id);
    return owningSectionId === undefined || layout.items.length > 1;
  }

  private isDashboardChild(embeddable: IEmbeddable): boolean {
    return Boolean(
      embeddable.getRoot() &&
      embeddable.getRoot().isContainer &&
      embeddable.getRoot().type === DASHBOARD_CONTAINER_TYPE
    );
  }

  public async execute({ embeddable }: MovePanelToSectionActionContext) {
    if (!this.isDashboardChild(embeddable)) {
      throw new IncompatibleActionError();
    }
    const dashboard = embeddable.getRoot() as DashboardContainer;
    const layout = getSectionLayout(dashboard);
    if (!layout) {
      throw new IncompatibleActionError();
    }
    const currentSectionId = findOwningSectionId(layout, embeddable.id);

    // Select by id so duplicate section names remain unambiguous.
    const options: EuiRadioGroupOption[] = layout.items.map((section) => ({
      id: section.id,
      label: section.name,
    }));

    const initialSelectedId = currentSectionId ?? layout.items[0]?.id;

    const modalSession = this.core.overlays.openModal(
      toMountPoint(
        <MoveToSectionModal
          options={options}
          initialSelectedId={initialSelectedId}
          onClose={() => modalSession.close()}
          onSelect={(targetId) => {
            if (targetId && targetId !== currentSectionId) {
              const panelSize = dashboard.getInput().panels[embeddable.id]?.gridData;
              const moved = moveMemberToSection(layout.items, embeddable.id, targetId, panelSize);
              const items = setSectionCollapsed(moved, targetId, false);
              dashboard.reparentPanels([embeddable.id], { type: 'SectionLayout', items });
            }
            modalSession.close();
          }}
        />
      ),
      { className: 'dshMovePanelToSectionModal' }
    );
  }
}

function MoveToSectionModal({
  options,
  initialSelectedId,
  onClose,
  onSelect,
}: {
  options: EuiRadioGroupOption[];
  initialSelectedId: string;
  onClose: () => void;
  onSelect: (targetId: string) => void;
}) {
  const [selectedId, setSelectedId] = React.useState(initialSelectedId);

  return (
    <>
      <EuiModalHeader>
        <EuiModalHeaderTitle>
          {i18n.translate('dashboard.panel.movePanelToSection.changeSectionModalTitle', {
            defaultMessage: 'Move to section',
          })}
        </EuiModalHeaderTitle>
      </EuiModalHeader>
      <EuiModalBody>
        <EuiRadioGroup
          options={options}
          idSelected={selectedId}
          onChange={(id) => setSelectedId(id)}
        />
      </EuiModalBody>
      <EuiModalFooter>
        <EuiButtonEmpty onClick={onClose}>
          {i18n.translate('dashboard.panel.movePanelToSection.cancel', {
            defaultMessage: 'Cancel',
          })}
        </EuiButtonEmpty>
        <EuiButton fill onClick={() => onSelect(selectedId)}>
          {i18n.translate('dashboard.panel.movePanelToSection.move', {
            defaultMessage: 'Move',
          })}
        </EuiButton>
      </EuiModalFooter>
    </>
  );
}
