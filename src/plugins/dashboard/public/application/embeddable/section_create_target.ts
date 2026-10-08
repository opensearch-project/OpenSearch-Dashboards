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

import type { DashboardContainer } from './dashboard_container';
import { appendMemberToSection, setSectionCollapsed } from './section_layout_utils';

/**
 * Claim a panel returned by an editor, assign it a section-relative slot, and
 * expand the target section.
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
  container.reparentPanels([panelId], { type: 'SectionLayout', items });
  return true;
};
