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

// Section "create new visualization" cross-navigation target.
//
// The per-section "Create new visualization" affordance calls the visualization
// factory's create(), which NAVIGATES away to the Visualize editor. On
// "Save and return" the new panel comes back through the incoming-embeddable
// path in create_dashboard_container and is added to the container UNCLAIMED
// (it would otherwise surface in the trailing "Ungrouped" virtual section).
//
// To land the returning panel in the section the user created it from, the
// target section id round-trips through the official EmbeddableStateTransfer
// mechanism: DashboardContainer.getStateTransferContainerInfoData() emits it as
// opaque `containerInfo.containerData`, the editor echoes it back on its return
// package, and create_dashboard_container reads it and calls claimPanelIntoSection.

import type { DashboardContainer } from './dashboard_container';
import { appendMemberToSection, setSectionCollapsed } from './section_layout_utils';

/**
 * Append an existing container panel to a section as a member: assign it a
 * fresh section-relative slot in the section's layout and expand the section.
 * The panel's own gridData (panelsJSON) is left untouched. No-op (returns
 * false) unless the container is in SectionLayout mode and the section exists.
 */
export const claimPanelIntoSection = (
  container: DashboardContainer,
  sectionId: string,
  panelId: string
): boolean => {
  const layout = container.getInput().layout;
  if (!layout || layout.type !== 'SectionLayout') return false;
  const appended = appendMemberToSection(layout.items, sectionId, panelId);
  if (!appended) return false;
  const items = setSectionCollapsed(appended.items, sectionId, false);
  // The panel re-parents from the Ungrouped grid into a section grid, so
  // recreate it via the container's natural remove/add lifecycle. Only the
  // section member (layoutJSON) records the section-relative position; the
  // panel's own gridData (panelsJSON) is left untouched -- it stays the
  // GridLayout-mode representation, recomputed only on ungroup.
  container.reparentPanels([panelId], { type: 'SectionLayout', items });
  return true;
};
