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

import { claimPanelIntoSection } from './section_create_target';
import { DashboardContainer } from './dashboard_container';

// Minimal fake container: just the input get/update surface the helper uses.
const makeContainer = (input: any) => {
  let current = input;
  return {
    getInput: () => current,
    updateInput: jest.fn((patch: any) => {
      current = { ...current, ...patch };
    }),
    // Mirrors DashboardContainer.reparentPanels' net effect (final panels +
    // layout); the destroy/recreate cycling is not observable here.
    reparentPanels: jest.fn((_ids: string[], layout: any, panels?: any) => {
      current = { ...current, panels: panels ?? current.panels, layout };
    }),
  } as unknown as DashboardContainer;
};

const panel = (id: string, x = 0, y = 0, w = 24, h = 15) => ({
  type: 'visualization',
  explicitInput: { id },
  gridData: { x, y, w, h, i: id },
});

describe('section_create_target', () => {
  describe('claimPanelIntoSection', () => {
    it('appends the panel to the target section and expands it, leaving the panel gridData untouched', () => {
      const container = makeContainer({
        // Panel sits mid-grid in GridLayout terms; its own gridData must NOT be
        // overwritten with the section-relative slot.
        panels: { p1: panel('p1', 10, 40, 12, 8) },
        layout: {
          type: 'SectionLayout',
          items: [
            { id: 's1', type: 'section', name: 'S1', collapsed: false, members: [] },
            { id: 's2', type: 'section', name: 'S2', collapsed: true, members: [] },
          ],
        },
      });

      // This is the exact regression: a "Create new visualization" launched from
      // section s2 returns as an unclaimed panel and must land in s2 (not the
      // "Ungrouped" virtual section).
      const ok = claimPanelIntoSection(container, 's2', 'p1');
      expect(ok).toBe(true);

      const next = container.getInput();
      const layout = next.layout as any;
      expect(layout.items[0].members).toEqual([]);
      expect(layout.items[1].members.map((m: any) => m.idRef)).toEqual(['p1']);
      // Target section auto-expanded.
      expect(layout.items[1].collapsed).toBe(false);
      // Member carries the fresh section-relative slot (in layoutJSON).
      expect(layout.items[1].members[0].gridData).toEqual({ x: 0, y: 0, w: 24, h: 15 });
      // Panel's own gridData (GridLayout representation) is left untouched.
      expect(next.panels.p1.gridData).toEqual({ x: 10, y: 40, w: 12, h: 8, i: 'p1' });
    });

    it('is a no-op in GridLayout mode', () => {
      const container = makeContainer({
        panels: { p1: panel('p1') },
        layout: { type: 'GridLayout', items: [] },
      });
      expect(claimPanelIntoSection(container, 's2', 'p1')).toBe(false);
      expect(container.reparentPanels as jest.Mock).not.toHaveBeenCalled();
    });

    it('is a no-op when the target section does not exist', () => {
      const container = makeContainer({
        panels: { p1: panel('p1') },
        layout: {
          type: 'SectionLayout',
          items: [{ id: 's1', type: 'section', name: 'S1', collapsed: false, members: [] }],
        },
      });
      expect(claimPanelIntoSection(container, 'nope', 'p1')).toBe(false);
      expect(container.reparentPanels as jest.Mock).not.toHaveBeenCalled();
    });
  });
});
