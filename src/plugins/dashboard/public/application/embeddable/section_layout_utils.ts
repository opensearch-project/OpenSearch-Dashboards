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

// Pure helpers for the SectionLayout (v2) data model. All functions are
// side-effect free and operate on plain data (the `layout.items` array and the
// container's `panels` map) so they are trivially unit-testable and reused by
// every section action (create / add / remove / reorder / rename / ungroup).

import { v4 as uuidv4 } from 'uuid';
import { SectionLayout, SectionLayoutMember, SectionMemberGridData } from '../../../common';
import { DashboardPanelState } from './types';
import {
  DEFAULT_PANEL_WIDTH,
  DEFAULT_PANEL_HEIGHT,
  DASHBOARD_GRID_COLUMN_COUNT,
} from './dashboard_constants';

interface PanelMap {
  [id: string]: DashboardPanelState;
}

export const generateSectionId = (): string => `section_${uuidv4()}`;

/**
 * The smallest unused "Section N" name. Using the smallest free integer (rather
 * than items.length + 1) keeps names stable and collision-free after a middle
 * section is deleted.
 */
export const getNextSectionName = (items: SectionLayout[]): string => {
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
 * First "Add section": move ALL current panels into a single new section,
 * repacked into fresh SECTION-RELATIVE coordinates (same-row-first, wrap on
 * overflow -- the same placement policy as computeAppendedMemberGridData,
 * applied to each panel in turn). A panel's absolute GridLayout gridData has
 * no valid meaning inside a section's own coordinate space (which always
 * starts at y=0), so it is read only for each panel's own w/h -- never for
 * its x/y. panelsJSON.gridData itself is left untouched by this move; it
 * remains the dashboard's GridLayout-mode representation and is only ever
 * recomputed on ungroup (see flattenSectionsToPanels).
 */
export const migrateAllPanelsToSection = (
  panels: PanelMap,
  name: string = 'Section 1'
): SectionLayout => {
  const ordered = Object.values(panels).sort((a, b) =>
    a.gridData.y === b.gridData.y ? a.gridData.x - b.gridData.x : a.gridData.y - b.gridData.y
  );
  const members: SectionLayoutMember[] = [];
  ordered.forEach((panel) => {
    const { w, h } = panel.gridData;
    const gridData = computeAppendedMemberGridData(members, w, h);
    members.push({ idRef: panel.explicitInput.id, type: 'panel', gridData });
  });
  return { id: generateSectionId(), type: 'section', name, collapsed: false, members };
};

/** Append a new empty (expanded) section with an auto-generated name. */
export const appendEmptySection = (items: SectionLayout[]): SectionLayout[] => [
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
 * Slot for a newly added member: place it on the SAME row as the existing
 * bottom-most panel, immediately to its right, when the incoming panel still
 * fits within the grid width; otherwise wrap to a new row below everything.
 * (Used by add-to-section, move-to-section, and bulk migration into a new
 * section -- each passes the incoming panel's own w/h so panels keep their
 * size; callers adding a brand-new panel omit w/h and get the default size.)
 */
export const computeAppendedMemberGridData = (
  members: SectionLayoutMember[],
  w: number = DEFAULT_PANEL_WIDTH,
  h: number = DEFAULT_PANEL_HEIGHT
): SectionMemberGridData => {
  if (members.length === 0) return { x: 0, y: 0, w, h };

  // Bottom-most, then right-most member = the current insertion anchor.
  const anchor = members.reduce((best, m) =>
    m.gridData.y > best.gridData.y ||
    (m.gridData.y === best.gridData.y && m.gridData.x > best.gridData.x)
      ? m
      : best
  );
  const nextX = anchor.gridData.x + anchor.gridData.w;
  // Same line if the incoming panel fits in the remaining width of that row.
  if (nextX + w <= DASHBOARD_GRID_COLUMN_COUNT) {
    return { x: nextX, y: anchor.gridData.y, w, h };
  }
  // Otherwise wrap: new row below all existing members.
  const maxBottom = members.reduce((mx, m) => Math.max(mx, m.gridData.y + m.gridData.h), 0);
  return { x: 0, y: maxBottom, w, h };
};

/**
 * Append a member (by panel id) to a specific section. Returns the new items and
 * the section-relative gridData assigned to the member. Returns undefined if the
 * section doesn't exist. Pass optional `w`/`h` to preserve the panel's current
 * size (e.g. when moving between sections); omit for the default panel size.
 */
export const appendMemberToSection = (
  items: SectionLayout[],
  sectionId: string,
  memberId: string,
  w?: number,
  h?: number
): { items: SectionLayout[]; gridData: SectionMemberGridData } | undefined => {
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

/** Every panel id referenced as a member of some section. */
export const getClaimedMemberIds = (items: SectionLayout[]): Set<string> => {
  const ids = new Set<string>();
  items.forEach((section) => section.members.forEach((m) => ids.add(m.idRef)));
  return ids;
};

/**
 * Panels present in the dashboard's `panels` map that are NOT a member of any
 * explicit section. These are rendered in the trailing read-only "Ungrouped"
 * virtual section (never stored in layoutJSON). This is what makes the render
 * invariant `rendered = section members + unclaimed panels` hold, so panels
 * added by callers that only write panelsJSON (Explore / agent_traces
 * "add to dashboard") still show up instead of silently disappearing.
 * Returned in panels-array (map insertion) order, which mirrors panelsJSON.
 */
export const computeUnclaimedPanels = (
  items: SectionLayout[],
  panels: PanelMap
): DashboardPanelState[] => {
  const claimed = getClaimedMemberIds(items);
  return Object.values(panels).filter((panel) => !claimed.has(panel.explicitInput.id));
};

/**
 * Flow layout for the read-only "Ungrouped" section. It ignores each panel's
 * stored x/y and instead packs panels left-to-right in ARRAY ORDER using their
 * own w/h, wrapping to a new row when the next panel doesn't fit the grid
 * width. Each wrapped row starts below the tallest panel of the previous row.
 * This keeps the Ungrouped display order-driven and stable regardless of the
 * panels' absolute coordinates in panelsJSON.
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

/** Remove a member (panel id) from whichever section holds it. */
export const removeMemberFromLayout = (items: SectionLayout[], memberId: string): SectionLayout[] =>
  items.map((s) => ({ ...s, members: s.members.filter((m) => m.idRef !== memberId) }));

export const renameSection = (
  items: SectionLayout[],
  sectionId: string,
  name: string
): SectionLayout[] => items.map((s) => (s.id === sectionId ? { ...s, name } : s));

export const setSectionCollapsed = (
  items: SectionLayout[],
  sectionId: string,
  collapsed: boolean
): SectionLayout[] => items.map((s) => (s.id === sectionId ? { ...s, collapsed } : s));

/**
 * Remove a section; returns the new items plus the member panel ids that should
 * also be deleted from the container's panels map (delete-section removes the
 * section AND its panels).
 */
export const removeSection = (
  items: SectionLayout[],
  sectionId: string
): { items: SectionLayout[]; removedMemberIds: string[] } => {
  const section = items.find((s) => s.id === sectionId);
  return {
    items: items.filter((s) => s.id !== sectionId),
    removedMemberIds: section ? section.members.map((m) => m.idRef) : [],
  };
};

/**
 * Move a member from its current section to another. Returns the new items with
 * the member removed from its old section and appended to the target (with a
 * fresh section-relative slot). The panel's own w/h are preserved across the
 * move. No-op if the target section doesn't exist.
 */
export const moveMemberToSection = (
  items: SectionLayout[],
  memberId: string,
  targetSectionId: string
): SectionLayout[] => {
  if (!items.some((s) => s.id === targetSectionId)) return items;
  // Capture the member's current w/h BEFORE removing it from the old section.
  let memberW: number | undefined;
  let memberH: number | undefined;
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
 * Ungroup: stack sections top-to-bottom and translate each member's
 * section-relative gridData into ABSOLUTE gridData on its panel. Returns a new
 * panels map. Sections are laid out in array order; a member's absolute y is the
 * running vertical cursor plus its section-relative y. The section chrome
 * disappears, so no header rows are inserted. Panels not referenced by any
 * section are left untouched.
 */
export const flattenSectionsToPanels = (items: SectionLayout[], panels: PanelMap): PanelMap => {
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
