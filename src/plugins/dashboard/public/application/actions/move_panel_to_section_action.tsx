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

// Dashboard collapsible sections.
// "Move to section" panel action. Mirrors ReplacePanelAction's shape (a single
// ActionByType whose execute() opens a small overlay to gather a choice) --
// uiActions registers actions statically at plugin setup, before any sections
// exist, so a real dynamic submenu-per-target isn't expressible as separate
// registered actions; the overlay is where the current section list is read.

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
import { DASHBOARD_CONTAINER_TYPE, DashboardContainer, DashboardPanelState } from '..';
import { findTopLeftMostOpenSpace } from '../embeddable/panel/dashboard_panel_placement';
import {
  DASHBOARD_SECTION_EMBEDDABLE,
  buildSectionMemberMap,
  SectionMember,
  DashboardSectionEmbeddableInput,
} from '../embeddable/section';
import { toMountPoint } from '../../../../opensearch_dashboards_react/public';

export const ACTION_MOVE_PANEL_TO_SECTION = 'movePanelToSection';

export interface MovePanelToSectionActionContext {
  embeddable: IEmbeddable;
}

const OUTER_TARGET_ID = '__outer__';

/**
 * "Move to section" updates section membership: it adds the panel's id to the
 * target section's `members` list with a section-relative layout (or removes
 * that entry when moving the panel out). The panel's own entry in the flat
 * panels map is left untouched.
 *
 * A member's layout (stored in the section's `members` list) is
 * SECTION-RELATIVE -- coordinates within the target section's own inner
 * react-grid-layout -- whereas an ungrouped panel's gridData is absolute
 * outer-dashboard coordinates. Moving between the two is therefore a
 * coordinate-SPACE change, and the panel must be re-placed into open space in
 * the destination space. We reuse the existing, unmodified
 * findTopLeftMostOpenSpace() placement algorithm -- just fed a `currentPanels`
 * set PRE-FILTERED to the destination space (the target section's members, or
 * the ungrouped/outer panels). No hand-rolled cross-space push-down logic:
 * each grid's own compactType='vertical' resolves any residual overlap
 * natively, and members of OTHER sections are never touched because they are
 * simply never in the filtered set.
 */

/** Synthetic {id: {gridData}} map from a section's member layouts, so the
 * shared findTopLeftMostOpenSpace() can pick an open SECTION-RELATIVE slot. */
function sectionMembersAsPanels(members: SectionMember[]): {
  [key: string]: DashboardPanelState;
} {
  const out: { [key: string]: DashboardPanelState } = {};
  members.forEach((m) => {
    // Only gridData is read by findTopLeftMostOpenSpace; a minimal synthetic
    // panel keyed by the member id is enough to reserve its section-relative
    // slot when placing a new member.
    out[m.id] = { gridData: { ...m.gridData, i: m.id } } as unknown as DashboardPanelState;
  });
  return out;
}

/**
 * Compute the updated panels map after moving `panelToMove` to
 * `nextSectionId` (undefined = remove from any section, back to the outer
 * dashboard space). Pure -- returns a new map, mutates nothing.
 *
 * Exported for direct unit testing -- the coordinate-space placement is the
 * load-bearing behavior and is not observable through the modal-driven tests.
 */
export function relocatePanelToSection(
  panelToMoveId: string,
  nextSectionId: string | undefined,
  panels: { [key: string]: DashboardPanelState }
): { [key: string]: DashboardPanelState } {
  const panelToMove = panels[panelToMoveId];
  if (!panelToMove) return panels;
  const { w, h } = panelToMove.gridData;

  // Option 1: membership lives in each section's explicitInput.members. Moving
  // a panel means editing section member-lists ONLY -- the panel's own
  // (absolute) gridData is never touched, so it stays a valid standalone panel.
  const memberMap = buildSectionMemberMap(panels);
  const currentSectionId = memberMap.get(panelToMoveId)?.sectionId;

  const getMembers = (sectionId: string): SectionMember[] =>
    (
      (panels[sectionId]?.explicitInput as Partial<DashboardSectionEmbeddableInput>)?.members ?? []
    ).slice();

  const withMembers = (
    map: { [key: string]: DashboardPanelState },
    sectionId: string,
    members: SectionMember[]
  ): { [key: string]: DashboardPanelState } => {
    const sectionPanel = map[sectionId];
    if (!sectionPanel) return map;
    return {
      ...map,
      [sectionId]: {
        ...sectionPanel,
        explicitInput: { ...sectionPanel.explicitInput, members },
      },
    };
  };

  let next = { ...panels };

  // Remove from the current section (if any), so a move never leaves the panel
  // listed in two sections.
  if (currentSectionId && currentSectionId !== nextSectionId) {
    next = withMembers(
      next,
      currentSectionId,
      getMembers(currentSectionId).filter((m) => m.id !== panelToMoveId)
    );
  }

  // Moving OUT (no target): nothing else to do -- the panel already has its
  // absolute gridData and will render in the outer grid.
  if (nextSectionId === undefined) {
    return next;
  }

  // Moving IN: pick an open SECTION-RELATIVE slot among the target section's
  // existing members (excluding this panel if it was already there), then add
  // (or update) its layout entry. Auto-expand a collapsed target so the move
  // is visible.
  const targetMembers = getMembers(nextSectionId).filter((m) => m.id !== panelToMoveId);
  const placement = findTopLeftMostOpenSpace({
    width: w,
    height: h,
    currentPanels: sectionMembersAsPanels(targetMembers),
  });
  const newLayout: SectionMember = {
    id: panelToMoveId,
    gridData: {
      x: placement.x,
      y: placement.y,
      w,
      h,
    },
  };
  next = withMembers(next, nextSectionId, [...targetMembers, newLayout]);

  const targetSection = next[nextSectionId];
  if (targetSection && (targetSection.explicitInput as { collapsed?: boolean }).collapsed) {
    next = {
      ...next,
      [nextSectionId]: {
        ...targetSection,
        explicitInput: { ...targetSection.explicitInput, collapsed: false },
      },
    };
  }

  return next;
}

export class MovePanelToSectionAction implements ActionByType<typeof ACTION_MOVE_PANEL_TO_SECTION> {
  public readonly type = ACTION_MOVE_PANEL_TO_SECTION;
  public readonly id = ACTION_MOVE_PANEL_TO_SECTION;
  public order = 44;

  constructor(private core: CoreStart) {}

  public getDisplayName({ embeddable }: MovePanelToSectionActionContext) {
    if (!this.isDashboardChild(embeddable)) {
      throw new IncompatibleActionError();
    }
    // Context-aware label: a panel already inside a section is "changing" its
    // section (which includes removing it), whereas an ungrouped panel is
    // "moving into" one. Same modal either way.
    return this.isInSection(embeddable)
      ? i18n.translate('dashboard.panel.movePanelToSection.changeSection', {
          defaultMessage: 'Change section',
        })
      : i18n.translate('dashboard.panel.movePanelToSection', {
          defaultMessage: 'Move to section',
        });
  }

  public getIconType(): EuiIconType {
    return 'folderOpen';
  }

  public async isCompatible({ embeddable }: MovePanelToSectionActionContext) {
    if (!this.isDashboardChild(embeddable)) {
      return false;
    }
    if (embeddable.type === DASHBOARD_SECTION_EMBEDDABLE) {
      // a section itself is not movable into another section (no nesting)
      return false;
    }
    return Boolean(
      !isErrorEmbeddable(embeddable) && embeddable.getInput()?.viewMode !== ViewMode.VIEW
    );
  }

  private isDashboardChild(embeddable: IEmbeddable): boolean {
    return Boolean(
      embeddable.getRoot() &&
      embeddable.getRoot().isContainer &&
      embeddable.getRoot().type === DASHBOARD_CONTAINER_TYPE
    );
  }

  /** True when this panel currently belongs to a section (has a sectionId). */
  /** True when this panel currently belongs to a section (Option 1: listed in
   * some section's explicitInput.members). */
  private isInSection(embeddable: IEmbeddable): boolean {
    const root = embeddable.getRoot() as DashboardContainer;
    const panels = root?.getInput?.().panels;
    if (!panels) return false;
    return buildSectionMemberMap(panels).has(embeddable.id);
  }

  public async execute({ embeddable }: MovePanelToSectionActionContext) {
    if (!this.isDashboardChild(embeddable)) {
      throw new IncompatibleActionError();
    }
    const dashboard = embeddable.getRoot() as DashboardContainer;
    const panels = dashboard.getInput().panels;
    // Option 1: current membership comes from the section member-lists, not a
    // sectionId on the panel.
    const currentSectionId = buildSectionMemberMap(panels).get(embeddable.id)?.sectionId;

    const sortedSections = Object.values(panels)
      .filter((p) => p.type === DASHBOARD_SECTION_EMBEDDABLE)
      // List sections in their real top-to-bottom dashboard order (by y, then
      // x) rather than panels-map insertion order, so the list matches what the
      // user sees on the dashboard.
      .sort((a, b) => {
        if (a.gridData.y !== b.gridData.y) return a.gridData.y - b.gridData.y;
        return a.gridData.x - b.gridData.x;
      });

    // Selection is tracked by section id (EuiRadioGroup `idSelected`), NOT by
    // label -- so section titles may safely repeat. (EuiSelectable was avoided
    // here because it resolves its highlighted option by `label === clicked
    // .label`, which mis-highlights duplicate-named sections.)
    const sectionOptions: EuiRadioGroupOption[] = sortedSections.map((p) => ({
      id: p.gridData.i,
      label: (p.explicitInput as { title?: string }).title || p.gridData.i,
    }));

    const outerOption: EuiRadioGroupOption = {
      id: OUTER_TARGET_ID,
      label: i18n.translate('dashboard.panel.movePanelToSection.outerOption', {
        defaultMessage: 'No section (move to dashboard)',
      }),
    };

    const options: EuiRadioGroupOption[] = [outerOption, ...sectionOptions];
    const initialSelectedId = currentSectionId ?? OUTER_TARGET_ID;

    const modalSession = this.core.overlays.openModal(
      toMountPoint(
        <MoveToSectionModal
          options={options}
          hasNoSections={sectionOptions.length === 0}
          inSection={Boolean(currentSectionId)}
          initialSelectedId={initialSelectedId}
          onClose={() => modalSession.close()}
          onSelect={(targetId) => {
            const nextSectionId = targetId === OUTER_TARGET_ID ? undefined : targetId;
            const newPanels = relocatePanelToSection(embeddable.id, nextSectionId, panels);
            dashboard.updateInput({ panels: newPanels });
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
  hasNoSections,
  inSection,
  initialSelectedId,
  onClose,
  onSelect,
}: {
  options: EuiRadioGroupOption[];
  hasNoSections: boolean;
  inSection: boolean;
  initialSelectedId: string;
  onClose: () => void;
  onSelect: (targetId: string) => void;
}) {
  const [selectedId, setSelectedId] = React.useState(initialSelectedId);

  return (
    <>
      <EuiModalHeader>
        <EuiModalHeaderTitle>
          {inSection
            ? i18n.translate('dashboard.panel.movePanelToSection.changeSectionModalTitle', {
                defaultMessage: 'Change section',
              })
            : i18n.translate('dashboard.panel.movePanelToSection.modalTitle', {
                defaultMessage: 'Move to section',
              })}
        </EuiModalHeaderTitle>
      </EuiModalHeader>
      <EuiModalBody>
        {hasNoSections && (
          <p>
            {i18n.translate('dashboard.panel.movePanelToSection.noSections', {
              defaultMessage: 'No sections exist yet on this dashboard.',
            })}
          </p>
        )}
        {/* Radio group selects by id, so duplicate section titles are fine and
            never mis-highlight (unlike EuiSelectable's label-based matching). */}
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
