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

import { v4 as uuidv4 } from 'uuid';
import { DashboardSection, SectionLayoutMember, SectionMemberGridData } from '../../../common';
import { DashboardPanelState } from './types';
import {
  DEFAULT_PANEL_WIDTH,
  DEFAULT_PANEL_HEIGHT,
  DASHBOARD_GRID_COLUMN_COUNT,
} from './dashboard_constants';
import { findOpenSpace } from './panel/dashboard_panel_placement';

interface PanelMap {
  [id: string]: DashboardPanelState;
}

export const generateSectionId = (): string => `section_${uuidv4()}`;

/**
 * The smallest unused "Section N" name. Using the smallest free integer (rather
 * than items.length + 1) keeps names stable and collision-free after a middle
 * section is deleted.
 */
export const getNextSectionName = (items: DashboardSection[]): string => {
  const used = new Set<number>();
  items.forEach((section) => {
    const match = /^Section (\d+)$/.exec(section.name);
    if (match) used.add(parseInt(match[1], 10));
  });
  let n = 1;
  while (used.has(n)) n += 1;
  return `Section ${n}`;
};

/**
 * Move all panels into the first section without repacking them. The minimum
 * panel y becomes zero and the remaining relative spacing is preserved.
 */
export const migrateAllPanelsToSection = (
  panels: PanelMap,
  name: string = 'Section 1'
): DashboardSection => {
  const ordered = Object.values(panels).sort((a, b) =>
    a.gridData.y === b.gridData.y ? a.gridData.x - b.gridData.x : a.gridData.y - b.gridData.y
  );
  const minY = ordered[0]?.gridData.y ?? 0;
  const members: SectionLayoutMember[] = ordered.map((panel) => {
    const { x, y, w, h } = panel.gridData;
    return {
      idRef: panel.explicitInput.id,
      type: 'panel',
      gridData: { x, y: y - minY, w, h },
    };
  });
  return { id: generateSectionId(), type: 'section', name, collapsed: false, members };
};

export const appendEmptySection = (items: DashboardSection[]): DashboardSection[] => [
  ...items,
  {
    id: generateSectionId(),
    type: 'section',
    name: getNextSectionName(items),
    collapsed: false,
    members: [],
  },
];

/**
 * Reuse the flat-grid placement algorithm so new members fill the first
 * available section-relative slot. Existing panels pass their current size;
 * new panels use the dashboard defaults.
 */
export const computeAppendedMemberGridData = (
  members: SectionLayoutMember[],
  w: number = DEFAULT_PANEL_WIDTH,
  h: number = DEFAULT_PANEL_HEIGHT
): SectionMemberGridData => {
  return findOpenSpace(
    members.map((m) => m.gridData),
    w,
    h
  );
};

export const appendMemberToSection = (
  items: DashboardSection[],
  sectionId: string,
  memberId: string,
  w?: number,
  h?: number
): { items: DashboardSection[]; gridData: SectionMemberGridData } | undefined => {
  const section = items.find((s) => s.id === sectionId);
  if (!section) return undefined;
  const gridData = computeAppendedMemberGridData(section.members, w, h);
  const newItems = items.map((s) =>
    s.id === sectionId
      ? { ...s, members: [...s.members, { idRef: memberId, type: 'panel' as const, gridData }] }
      : s
  );
  return { items: newItems, gridData };
};

export const getClaimedMemberIds = (items: DashboardSection[]): Set<string> => {
  const ids = new Set<string>();
  items.forEach((section) => section.members.forEach((m) => ids.add(m.idRef)));
  return ids;
};

/**
 * Panels not claimed by an explicit section render in the read-only,
 * non-persisted "Ungrouped" section.
 */
export const computeUnclaimedPanels = (
  items: DashboardSection[],
  panels: PanelMap
): DashboardPanelState[] => {
  const claimed = getClaimedMemberIds(items);
  return Object.values(panels).filter((panel) => !claimed.has(panel.explicitInput.id));
};

/**
 * Lay out unclaimed panels in map order without changing their stored
 * GridLayout coordinates.
 */
export const computeUngroupedLayout = (panels: DashboardPanelState[]): SectionLayoutMember[] => {
  let cursorX = 0;
  let rowY = 0;
  let rowHeight = 0;
  return panels.map((panel) => {
    const { w, h } = panel.gridData;
    // Wrap to a new row when the next panel doesn't fit (but never wrap a row's
    // first panel, so a panel wider than the grid still starts at x=0).
    if (cursorX > 0 && cursorX + w > DASHBOARD_GRID_COLUMN_COUNT) {
      rowY += rowHeight;
      cursorX = 0;
      rowHeight = 0;
    }
    const member: SectionLayoutMember = {
      idRef: panel.explicitInput.id,
      type: 'panel',
      gridData: { x: cursorX, y: rowY, w, h },
    };
    cursorX += w;
    rowHeight = Math.max(rowHeight, h);
    return member;
  });
};

export const removeMemberFromLayout = (
  items: DashboardSection[],
  memberId: string
): DashboardSection[] =>
  items.map((s) => ({ ...s, members: s.members.filter((m) => m.idRef !== memberId) }));

export const renameSection = (
  items: DashboardSection[],
  sectionId: string,
  name: string
): DashboardSection[] => items.map((s) => (s.id === sectionId ? { ...s, name } : s));

export const setSectionCollapsed = (
  items: DashboardSection[],
  sectionId: string,
  collapsed: boolean
): DashboardSection[] => items.map((s) => (s.id === sectionId ? { ...s, collapsed } : s));

// Deleting a section also deletes its member panels.
export const removeSection = (
  items: DashboardSection[],
  sectionId: string
): { items: DashboardSection[]; removedMemberIds: string[] } => {
  const section = items.find((s) => s.id === sectionId);
  return {
    items: items.filter((s) => s.id !== sectionId),
    removedMemberIds: section ? section.members.map((m) => m.idRef) : [],
  };
};

/**
 * Preserve the member's current size when moving it. The fallback size is used
 * when the panel is currently unclaimed.
 */
export const moveMemberToSection = (
  items: DashboardSection[],
  memberId: string,
  targetSectionId: string,
  fallbackSize?: Pick<SectionMemberGridData, 'w' | 'h'>
): DashboardSection[] => {
  if (!items.some((s) => s.id === targetSectionId)) return items;
  // Read the current size before removing the member from its source section.
  let memberW = fallbackSize?.w;
  let memberH = fallbackSize?.h;
  for (const section of items) {
    const member = section.members.find((m) => m.idRef === memberId);
    if (member) {
      memberW = member.gridData.w;
      memberH = member.gridData.h;
      break;
    }
  }
  const pruned = removeMemberFromLayout(items, memberId);
  const appended = appendMemberToSection(pruned, targetSectionId, memberId, memberW, memberH);
  return appended ? appended.items : pruned;
};

/**
 * Flatten sections in array order by translating member coordinates into the
 * panel map. Unclaimed panels are left unchanged.
 */
export const flattenSectionsToPanels = (items: DashboardSection[], panels: PanelMap): PanelMap => {
  const next: PanelMap = { ...panels };
  let yCursor = 0;
  items.forEach((section) => {
    let sectionRows = 0;
    section.members.forEach((member) => {
      sectionRows = Math.max(sectionRows, member.gridData.y + member.gridData.h);
      const panel = next[member.idRef];
      if (!panel) return;
      next[member.idRef] = {
        ...panel,
        gridData: {
          x: member.gridData.x,
          y: yCursor + member.gridData.y,
          w: member.gridData.w,
          h: member.gridData.h,
          i: member.idRef,
        },
      };
    });
    yCursor += sectionRows;
  });
  return next;
};
