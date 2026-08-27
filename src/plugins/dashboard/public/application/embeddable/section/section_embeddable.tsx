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
// Mirrors PlaceholderEmbeddable's structure exactly: a synthetic,
// non-visualization Embeddable living in the ordinary `panels` map, with its
// own `type` and its own EmbeddableFactory (see section_embeddable_factory.ts).

import { createRoot, Root } from 'react-dom/client';
import React from 'react';
import { EuiButtonIcon } from '@elastic/eui';
import {
  Embeddable,
  EmbeddableInput,
  IContainer,
  IEmbeddable,
  ViewMode,
} from '../../../../../embeddable/public';

export const DASHBOARD_SECTION_EMBEDDABLE = 'dashboard_section';

/**
 * Shared type guard for the dashboard section container.
 *
 * Panel actions that only make sense for real content panels (Maximize /
 * Minimize, Replace panel, Clone, ...) call this from their `isCompatible`
 * gate to exclude sections. Centralizing the check here avoids scattering
 * `embeddable.type === DASHBOARD_SECTION_EMBEDDABLE` string comparisons across
 * the action files.
 */
export function isSectionEmbeddable(embeddable?: IEmbeddable): boolean {
  return Boolean(embeddable && embeddable.type === DASHBOARD_SECTION_EMBEDDABLE);
}

export interface DashboardSectionEmbeddableInput extends EmbeddableInput {
  title: string;
  collapsed: boolean;
  /**
   * Option 1 (section-owned member list). The section OWNS its
   * members: this is the authoritative list of which panels belong to the
   * section AND their SECTION-RELATIVE layout (coordinates within the section's
   * own inner grid). The member panels themselves stay in the flat dashboard
   * `panels` map with their own ABSOLUTE gridData untouched and NO sectionId --
   * so when the sections feature is disabled (or the panel is released), each
   * member is already a valid standalone panel at its absolute home position.
   */
  members: SectionMember[];
}

/** One member panel owned by the section: its id + SECTION-RELATIVE layout. */
export interface SectionMember {
  /** The member panel's id (its key in the dashboard's flat `panels` map). */
  id: string;
  /**
   * Section-relative layout within the section's own inner grid. Wrapped in a
   * `gridData` object (mirroring DashboardPanelState) so future per-member
   * properties can sit alongside it without mixing into the layout fields.
   * No `i` -- the react-grid-layout key is derived from `id` at render time.
   */
  gridData: { x: number; y: number; w: number; h: number };
}

/**
 * Build a reverse lookup: member panel id -> { sectionId, member }, by scanning
 * every section panel's `explicitInput.members`. This is how the grid and
 * actions answer "is this panel a member, and of which section?" under Option 1
 * (there is no `sectionId` on the member panel itself). First occurrence wins,
 * so a panel accidentally listed in two sections resolves deterministically.
 */
export function buildSectionMemberMap(panels: {
  [key: string]: { type: string; explicitInput: { id: string } };
}): Map<string, { sectionId: string; member: SectionMember }> {
  const map = new Map<string, { sectionId: string; member: SectionMember }>();
  Object.values(panels).forEach((panel) => {
    if (panel.type !== DASHBOARD_SECTION_EMBEDDABLE) return;
    const members = (panel.explicitInput as Partial<DashboardSectionEmbeddableInput>).members;
    if (!Array.isArray(members)) return;
    members.forEach((member) => {
      if (!map.has(member.id)) {
        map.set(member.id, { sectionId: panel.explicitInput.id, member });
      }
    });
  });
  return map;
}

export class SectionEmbeddable extends Embeddable<DashboardSectionEmbeddableInput> {
  public readonly type = DASHBOARD_SECTION_EMBEDDABLE;
  private root?: Root;
  private node?: HTMLElement;

  constructor(initialInput: DashboardSectionEmbeddableInput, parent?: IContainer) {
    super(initialInput, { title: initialInput.title }, parent);
    this.getInput$().subscribe(() => {
      // Keep the panel-chrome title in sync with the section's own title.
      if (this.output.title !== this.input.title) {
        this.updateOutput({ title: this.input.title });
      }
      // A section has no panel actions in view mode: every section-specific
      // action (Add existing visualization, Move/Change section) is edit-only,
      // and every generic panel action is suppressed for sections via
      // isSectionEmbeddable. Its kebab would therefore open an EMPTY menu.
      // Hide the kebab entirely in view mode by driving the existing
      // `hidePanelActions` input flag -- no change to the shared embeddable
      // panel chrome. EmbeddablePanel recomputes `hidePanelAction` from this on
      // the container's input$ emit, and updating our own input (a container
      // child) emits that stream, so this reacts to every view<->edit toggle.
      this.syncHidePanelActions();
      if (this.node) {
        this.renderContent(this.node);
      }
    });
  }

  /**
   * Keep `hidePanelActions` in lockstep with view mode so the section's
   * (always-empty in view mode) options kebab is hidden. Guarded so it only
   * writes on an actual change, avoiding an input$ feedback loop.
   */
  private syncHidePanelActions() {
    const shouldHide = this.getInput().viewMode === ViewMode.VIEW;
    if (Boolean(this.getInput().hidePanelActions) !== shouldHide) {
      this.updateInput({ hidePanelActions: shouldHide });
    }
  }

  /**
   * the section's name is shown by the
   * standard panel chrome title (getTitle -> output.title), NOT by a second
   * header rendered in the panel body -- that produced a duplicate title.
   */
  public getTitle() {
    return this.getInput().title;
  }

  /**
   * contribute a collapse/expand chevron to the START of the
   * panel header, BEFORE the title (see PanelHeader.getHeaderPrepend). This
   * replaces the section's old in-body header, so the title appears exactly
   * once (in the panel chrome) with the toggle immediately to its left.
   */
  public renderHeaderPrepend() {
    const { collapsed } = this.getInput();
    return (
      <EuiButtonIcon
        className="dshSectionEmbeddable__toggle"
        data-test-subj={`dashboardSectionToggle-${this.id}`}
        aria-label={collapsed ? 'Expand section' : 'Collapse section'}
        iconType={collapsed ? 'arrowRight' : 'arrowDown'}
        color="text"
        // The panel header is itself the drag handle (embPanel__dragger); stop
        // the mousedown so clicking the chevron toggles instead of starting a
        // section drag.
        onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          this.updateInput({ collapsed: !collapsed });
        }}
      />
    );
  }

  public render(node: HTMLElement) {
    this.node = node;
    this.renderContent(node);
  }

  private renderContent(node: HTMLElement) {
    if (this.root) {
      this.root.unmount();
    }
    this.root = createRoot(node);
    // The section's members are rendered by DashboardSectionGrid (a sibling in
    // the outer grid item), and the title + toggle live in the panel chrome
    // (getTitle / renderHeaderPrepend). The embeddable's own body is therefore
    // empty -- it exists only to carry the section's data + panel actions.
    this.root.render(
      <div className="dshSectionEmbeddable" data-test-subj={`dashboardSection-${this.id}`} />
    );
  }

  public reload() {
    if (this.node) {
      this.renderContent(this.node);
    }
  }
}
