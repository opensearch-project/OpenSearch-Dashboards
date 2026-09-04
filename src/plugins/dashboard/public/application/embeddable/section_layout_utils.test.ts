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

import { SectionLayout } from '../../../common';
import { DashboardPanelState } from './types';
import {
  appendEmptySection,
  appendMemberToSection,
  computeAppendedMemberGridData,
  computeUnclaimedPanels,
  computeUngroupedLayout,
  flattenSectionsToPanels,
  getNextSectionName,
  migrateAllPanelsToSection,
  moveMemberToSection,
  removeMemberFromLayout,
  removeSection,
  renameSection,
} from './section_layout_utils';

const panel = (id: string, x: number, y: number, w: number, h: number): DashboardPanelState =>
  ({
    type: 'visualization',
    explicitInput: { id },
    gridData: { x, y, w, h, i: id },
  }) as DashboardPanelState;

const section = (id: string, name: string, members: SectionLayout['members']): SectionLayout => ({
  id,
  type: 'section',
  name,
  collapsed: false,
  members,
});

describe('section_layout_utils', () => {
  describe('migrateAllPanelsToSection', () => {
    it('repacks panels into fresh section-relative coordinates (same-row-first), keeping each own w/h', () => {
      const panels = {
        a: panel('a', 0, 0, 24, 10),
        b: panel('b', 24, 0, 24, 15),
      };
      const result = migrateAllPanelsToSection(panels, 'Section 1');
      expect(result.type).toBe('section');
      expect(result.name).toBe('Section 1');
      expect(result.collapsed).toBe(false);
      expect(result.members).toHaveLength(2);
      const a = result.members.find((m) => m.idRef === 'a')!;
      const b = result.members.find((m) => m.idRef === 'b')!;
      // a and b fit on the same row (24 + 24 <= 48), so b packs right of a --
      // matching their original x/y here is coincidental, not a copy.
      expect(a).toEqual({ idRef: 'a', type: 'panel', gridData: { x: 0, y: 0, w: 24, h: 10 } });
      expect(b).toEqual({ idRef: 'b', type: 'panel', gridData: { x: 24, y: 0, w: 24, h: 15 } });
    });

    it('does NOT copy a panel absolute y that has no valid meaning in the section (always repacks from y=0)', () => {
      // A single panel sitting mid-grid at y=40 in GridLayout mode -- its
      // absolute y is meaningless inside a section's own coordinate space,
      // which always starts at y=0.
      const panels = { solo: panel('solo', 0, 40, 24, 15) };
      const result = migrateAllPanelsToSection(panels);
      expect(result.members).toEqual([
        { idRef: 'solo', type: 'panel', gridData: { x: 0, y: 0, w: 24, h: 15 } },
      ]);
    });

    it('wraps to a new row when panels do not fit on the same row, using each panel own w/h', () => {
      const panels = {
        a: panel('a', 0, 0, 30, 10),
        b: panel('b', 30, 0, 30, 8),
      };
      const result = migrateAllPanelsToSection(panels);
      const a = result.members.find((m) => m.idRef === 'a')!;
      const b = result.members.find((m) => m.idRef === 'b')!;
      // 30 + 30 > 48 -> b cannot share a's row, so it wraps below.
      expect(a.gridData).toEqual({ x: 0, y: 0, w: 30, h: 10 });
      expect(b.gridData).toEqual({ x: 0, y: 10, w: 30, h: 8 });
    });

    it('orders members by original y then x before packing', () => {
      const panels = {
        bottom: panel('bottom', 0, 20, 24, 5),
        topRight: panel('topRight', 24, 0, 24, 5),
        topLeft: panel('topLeft', 0, 0, 24, 5),
      };
      const ids = migrateAllPanelsToSection(panels).members.map((m) => m.idRef);
      expect(ids).toEqual(['topLeft', 'topRight', 'bottom']);
    });
  });

  describe('getNextSectionName', () => {
    it('returns the smallest unused "Section N" name', () => {
      expect(getNextSectionName([])).toBe('Section 1');
      expect(getNextSectionName([section('x', 'Section 1', [])])).toBe('Section 2');
      // Gap-filling: Section 2 deleted -> reuse 2 before 3.
      expect(
        getNextSectionName([section('x', 'Section 1', []), section('z', 'Section 3', [])])
      ).toBe('Section 2');
    });
  });

  describe('appendEmptySection', () => {
    it('appends an auto-named empty expanded section', () => {
      const items = appendEmptySection([section('x', 'Section 1', [])]);
      expect(items).toHaveLength(2);
      expect(items[1].type).toBe('section');
      expect(items[1].name).toBe('Section 2');
      expect(items[1].members).toEqual([]);
      expect(items[1].collapsed).toBe(false);
    });
  });

  describe('computeAppendedMemberGridData', () => {
    it('places the new member below the tallest existing member', () => {
      const members = [
        { idRef: 'a', type: 'panel' as const, gridData: { x: 0, y: 0, w: 24, h: 10 } },
        { idRef: 'b', type: 'panel' as const, gridData: { x: 24, y: 0, w: 24, h: 18 } },
      ];
      expect(computeAppendedMemberGridData(members).y).toBe(18);
    });

    it('places the first member at y=0', () => {
      expect(computeAppendedMemberGridData([]).y).toBe(0);
    });

    it('places the new member on the SAME row, right of the last panel, when it fits', () => {
      const members = [
        { idRef: 'a', type: 'panel' as const, gridData: { x: 0, y: 0, w: 24, h: 10 } },
      ];
      expect(computeAppendedMemberGridData(members)).toEqual({ x: 24, y: 0, w: 24, h: 15 });
    });

    it('wraps to a new row when the incoming panel does not fit on the current row', () => {
      const members = [
        { idRef: 'a', type: 'panel' as const, gridData: { x: 0, y: 0, w: 48, h: 12 } },
      ];
      expect(computeAppendedMemberGridData(members)).toEqual({ x: 0, y: 12, w: 24, h: 15 });
    });

    it('uses the given w/h instead of the default panel size when provided', () => {
      const members = [
        { idRef: 'a', type: 'panel' as const, gridData: { x: 0, y: 0, w: 12, h: 10 } },
      ];
      expect(computeAppendedMemberGridData(members, 30, 8)).toEqual({ x: 12, y: 0, w: 30, h: 8 });
    });
  });

  describe('appendMemberToSection', () => {
    it('appends a member with computed gridData to the target section', () => {
      const items = [section('s1', 'Section 1', [])];
      const result = appendMemberToSection(items, 's1', 'p1')!;
      expect(result.items[0].members).toHaveLength(1);
      expect(result.items[0].members[0]).toEqual({
        idRef: 'p1',
        type: 'panel',
        gridData: result.gridData,
      });
    });

    it('returns undefined for an unknown section', () => {
      expect(appendMemberToSection([], 'nope', 'p1')).toBeUndefined();
    });
  });

  describe('removeMemberFromLayout', () => {
    it('removes the member from whichever section holds it', () => {
      const items = [
        section('s1', 'S1', [{ idRef: 'p1', type: 'panel', gridData: { x: 0, y: 0, w: 4, h: 4 } }]),
        section('s2', 'S2', [{ idRef: 'p2', type: 'panel', gridData: { x: 0, y: 0, w: 4, h: 4 } }]),
      ];
      const result = removeMemberFromLayout(items, 'p1');
      expect(result[0].members).toHaveLength(0);
      expect(result[1].members).toHaveLength(1);
    });
  });

  describe('renameSection', () => {
    it('renames only the target section', () => {
      const items = [section('s1', 'Section 1', []), section('s2', 'Section 2', [])];
      const result = renameSection(items, 's2', 'Renamed');
      expect(result.map((s) => s.name)).toEqual(['Section 1', 'Renamed']);
    });
  });

  describe('removeSection', () => {
    it('removes the section and reports its member ids for deletion', () => {
      const items = [
        section('s1', 'S1', [
          { idRef: 'p1', type: 'panel', gridData: { x: 0, y: 0, w: 4, h: 4 } },
          { idRef: 'p2', type: 'panel', gridData: { x: 4, y: 0, w: 4, h: 4 } },
        ]),
        section('s2', 'S2', []),
      ];
      const result = removeSection(items, 's1');
      expect(result.items.map((s) => s.id)).toEqual(['s2']);
      expect(result.removedMemberIds).toEqual(['p1', 'p2']);
    });
  });

  describe('moveMemberToSection', () => {
    it('moves a member from its section to another', () => {
      const items = [
        section('s1', 'S1', [{ idRef: 'p1', type: 'panel', gridData: { x: 0, y: 0, w: 4, h: 4 } }]),
        section('s2', 'S2', []),
      ];
      const result = moveMemberToSection(items, 'p1', 's2');
      expect(result[0].members).toHaveLength(0);
      expect(result[1].members.map((m) => m.idRef)).toEqual(['p1']);
    });

    it('is a no-op for an unknown target section', () => {
      const items = [
        section('s1', 'S1', [{ idRef: 'p1', type: 'panel', gridData: { x: 0, y: 0, w: 4, h: 4 } }]),
      ];
      expect(moveMemberToSection(items, 'p1', 'nope')).toEqual(items);
    });

    it('preserves the member panel w/h across the move', () => {
      const items = [
        section('s1', 'S1', [
          { idRef: 'p1', type: 'panel', gridData: { x: 0, y: 0, w: 36, h: 20 } },
        ]),
        section('s2', 'S2', []),
      ];
      const result = moveMemberToSection(items, 'p1', 's2');
      const movedMember = result[1].members.find((m) => m.idRef === 'p1')!;
      expect(movedMember.gridData.w).toBe(36);
      expect(movedMember.gridData.h).toBe(20);
    });
  });

  describe('flattenSectionsToPanels', () => {
    it('stacks sections top-to-bottom into absolute panel gridData', () => {
      const panels = {
        p1: panel('p1', 0, 0, 24, 10),
        p2: panel('p2', 0, 0, 24, 8),
      };
      const items = [
        section('s1', 'S1', [
          { idRef: 'p1', type: 'panel', gridData: { x: 0, y: 0, w: 24, h: 10 } },
        ]),
        section('s2', 'S2', [
          { idRef: 'p2', type: 'panel', gridData: { x: 0, y: 0, w: 24, h: 8 } },
        ]),
      ];
      const result = flattenSectionsToPanels(items, panels);
      // s1 occupies rows 0..10, so s2's member starts at absolute y=10.
      expect(result.p1.gridData).toEqual({ x: 0, y: 0, w: 24, h: 10, i: 'p1' });
      expect(result.p2.gridData).toEqual({ x: 0, y: 10, w: 24, h: 8, i: 'p2' });
    });

    it('leaves panels not referenced by any section untouched', () => {
      const panels = { orphan: panel('orphan', 3, 7, 5, 5) };
      const result = flattenSectionsToPanels([], panels);
      expect(result.orphan.gridData).toEqual({ x: 3, y: 7, w: 5, h: 5, i: 'orphan' });
    });
  });

  describe('computeUnclaimedPanels', () => {
    it('returns only panels not claimed by any section, in panels-array order', () => {
      const items = [
        section('s1', 'S1', [
          { idRef: 'a', type: 'panel', gridData: { x: 0, y: 0, w: 24, h: 10 } },
        ]),
      ];
      const panels = {
        a: panel('a', 0, 0, 24, 10), // claimed
        c: panel('c', 0, 5, 24, 10), // unclaimed (inserted before b)
        b: panel('b', 24, 0, 24, 15), // unclaimed
      };
      // Order follows the panels map (insertion), NOT sorted by y/x.
      const result = computeUnclaimedPanels(items, panels);
      expect(result.map((p) => p.explicitInput.id)).toEqual(['c', 'b']);
    });

    it('returns all panels when there are no sections', () => {
      const panels = { a: panel('a', 0, 0, 24, 10), b: panel('b', 0, 10, 24, 10) };
      expect(computeUnclaimedPanels([], panels).map((p) => p.explicitInput.id)).toEqual(['a', 'b']);
    });

    it('returns empty when every panel is claimed', () => {
      const items = [
        section('s1', 'S1', [
          { idRef: 'a', type: 'panel', gridData: { x: 0, y: 0, w: 24, h: 10 } },
          { idRef: 'b', type: 'panel', gridData: { x: 24, y: 0, w: 24, h: 10 } },
        ]),
      ];
      const panels = { a: panel('a', 0, 0, 24, 10), b: panel('b', 24, 0, 24, 10) };
      expect(computeUnclaimedPanels(items, panels)).toEqual([]);
    });
  });

  describe('computeUngroupedLayout', () => {
    it('flows panels by array order using their own w/h, ignoring stored x/y', () => {
      // Stored coords are deliberately overlapping/garbage to prove they are ignored.
      const panels = [
        panel('a', 99, 99, 24, 10),
        panel('b', 99, 99, 24, 12),
        panel('c', 99, 99, 24, 8),
      ];
      const result = computeUngroupedLayout(panels);
      // a,b fill row 0 (0..48); c wraps to the next row below the tallest of row 0 (h=12).
      expect(result).toEqual([
        { idRef: 'a', type: 'panel', gridData: { x: 0, y: 0, w: 24, h: 10 } },
        { idRef: 'b', type: 'panel', gridData: { x: 24, y: 0, w: 24, h: 12 } },
        { idRef: 'c', type: 'panel', gridData: { x: 0, y: 12, w: 24, h: 8 } },
      ]);
    });

    it('keeps a full-width panel on its own row', () => {
      const panels = [panel('a', 0, 0, 48, 15), panel('b', 0, 0, 24, 10)];
      const result = computeUngroupedLayout(panels);
      expect(result.map((m) => m.gridData)).toEqual([
        { x: 0, y: 0, w: 48, h: 15 },
        { x: 0, y: 15, w: 24, h: 10 },
      ]);
    });

    it('never wraps a row-leading panel wider than the grid', () => {
      const panels = [panel('wide', 0, 0, 60, 10)];
      expect(computeUngroupedLayout(panels)[0].gridData).toEqual({ x: 0, y: 0, w: 60, h: 10 });
    });
  });
});
