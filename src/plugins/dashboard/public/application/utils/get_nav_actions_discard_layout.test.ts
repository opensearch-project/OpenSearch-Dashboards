/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DashboardLayout } from '../../../common';
import { Dashboard, SerializedDashboard } from '../../dashboard';

describe('Dashboard discard-changes layout revert', () => {
  function buildRevertPayload(dashboard: Dashboard) {
    const newStateContainer: Record<string, any> = {};
    newStateContainer.viewMode = 'view';
    if (dashboard.panels) {
      newStateContainer.panels = dashboard.panels;
    }
    newStateContainer.filters = dashboard.filters;
    newStateContainer.query = dashboard.query;
    newStateContainer.options = {
      hidePanelTitles: dashboard.options.hidePanelTitles,
      useMargins: dashboard.options.useMargins,
      useSharedCrosshair: dashboard.options.useSharedCrosshair,
    };
    newStateContainer.timeRestore = dashboard.timeRestore;

    newStateContainer.layout = dashboard.layout;

    return newStateContainer;
  }

  const baseSerialized: SerializedDashboard = {
    timeRestore: false,
    panels: [{ panelIndex: 'p1', gridData: { x: 0, y: 0, w: 24, h: 15 } }] as any,
    query: { query: '', language: 'kuery' },
    filters: [],
    lastSavedTitle: 'Test',
    options: { hidePanelTitles: false, useMargins: true, useSharedCrosshair: false },
  };

  test('revert payload includes `layout: undefined` for a flat GridLayout dashboard', () => {
    const dashboard = new Dashboard(baseSerialized);
    dashboard.setState(baseSerialized);

    const payload = buildRevertPayload(dashboard);
    expect(payload).toHaveProperty('layout');
    expect(payload.layout).toBeUndefined();
  });

  test('revert payload includes the original SectionLayout when it was saved with sections', () => {
    const sectionLayout: DashboardLayout = {
      type: 'SectionLayout',
      items: [
        {
          id: 'section_1',
          type: 'section',
          name: 'Section 1',
          collapsed: false,
          members: [{ idRef: 'p1', type: 'panel', gridData: { x: 0, y: 0, w: 24, h: 15 } }],
        },
      ],
    };
    const serialized: SerializedDashboard = { ...baseSerialized, layout: sectionLayout };
    const dashboard = new Dashboard(serialized);
    dashboard.setState(serialized);

    const payload = buildRevertPayload(dashboard);
    expect(payload.layout).toEqual(sectionLayout);
    expect(payload.layout.type).toBe('SectionLayout');
    expect(payload.layout.items).toHaveLength(1);
    expect(payload.layout.items[0].name).toBe('Section 1');
  });

  test('Dashboard.setState correctly deep-clones layout', () => {
    const sectionLayout: DashboardLayout = {
      type: 'SectionLayout',
      items: [
        {
          id: 'section_1',
          type: 'section',
          name: 'Original',
          collapsed: false,
          members: [],
        },
      ],
    };
    const serialized: SerializedDashboard = { ...baseSerialized, layout: sectionLayout };
    const dashboard = new Dashboard(serialized);
    dashboard.setState(serialized);

    sectionLayout.items[0].name = 'Mutated';
    expect(dashboard.layout!.items[0].name).toBe('Original');
  });

  test('Dashboard.setState clears layout when state has `layout: undefined`', () => {
    const sectionLayout: DashboardLayout = {
      type: 'SectionLayout',
      items: [
        {
          id: 'section_1',
          type: 'section',
          name: 'Section 1',
          collapsed: false,
          members: [],
        },
      ],
    };
    const serialized: SerializedDashboard = { ...baseSerialized, layout: sectionLayout };
    const dashboard = new Dashboard(serialized);
    dashboard.setState(serialized);
    expect(dashboard.layout).toBeDefined();

    dashboard.setState({ layout: undefined } as any);
    expect(dashboard.layout).toBeUndefined();
  });
});

describe('Dashboard discard-changes reparent selection', () => {
  const section = (id: string, name: string, memberIds: string[]) => ({
    id,
    type: 'section',
    name,
    collapsed: false,
    members: memberIds.map((mid) => ({
      idRef: mid,
      type: 'panel',
      gridData: { x: 0, y: 0, w: 24, h: 15 },
    })),
  });
  const sectionLayout = (sections: any[]): DashboardLayout =>
    ({ type: 'SectionLayout', items: sections }) as DashboardLayout;

  const sectionIdOf = (layout: DashboardLayout | undefined, panelId: string): string | undefined =>
    layout?.type === 'SectionLayout'
      ? (layout.items as any[]).find((s) => s.members?.some((m: any) => m.idRef === panelId))?.id
      : undefined;

  function idsToReparent(
    currentLayout: DashboardLayout | undefined,
    savedLayout: DashboardLayout | undefined,
    currentPanelIds: string[],
    savedPanelIds: string[]
  ): string[] {
    const sectionsInvolved =
      currentLayout?.type === 'SectionLayout' || savedLayout?.type === 'SectionLayout';
    if (!sectionsInvolved) return [];
    const savedSet = new Set(savedPanelIds);
    return currentPanelIds.filter(
      (id) => !savedSet.has(id) || sectionIdOf(currentLayout, id) !== sectionIdOf(savedLayout, id)
    );
  }

  test('grid -> section (add section migrates all): reparents every panel', () => {
    const current = sectionLayout([section('s1', 'S1', ['a', 'b'])]);
    expect(idsToReparent(current, undefined, ['a', 'b'], ['a', 'b']).sort()).toEqual(['a', 'b']);
  });

  test('section -> grid (ungroup all): reparents every panel', () => {
    const saved = sectionLayout([section('s1', 'S1', ['a', 'b'])]);
    expect(idsToReparent(undefined, saved, ['a', 'b'], ['a', 'b']).sort()).toEqual(['a', 'b']);
  });

  test('move one panel into a populated section: reparents ONLY the moved panel', () => {
    const saved = sectionLayout([section('s1', 'S1', ['a']), section('s2', 'S2', ['b', 'c'])]);
    const current = sectionLayout([section('s1', 'S1', []), section('s2', 'S2', ['a', 'b', 'c'])]);
    expect(idsToReparent(current, saved, ['a', 'b', 'c'], ['a', 'b', 'c'])).toEqual(['a']);
  });

  test('move a panel between two sections: reparents only the moved panel', () => {
    const saved = sectionLayout([section('s1', 'S1', ['a', 'b']), section('s2', 'S2', [])]);
    const current = sectionLayout([section('s1', 'S1', ['b']), section('s2', 'S2', ['a'])]);
    expect(idsToReparent(current, saved, ['a', 'b'], ['a', 'b'])).toEqual(['a']);
  });

  test('add a panel to Ungrouped: reparents only the added panel (to drop it)', () => {
    const layout = sectionLayout([section('s1', 'S1', ['a'])]);
    expect(idsToReparent(layout, layout, ['a', 'new'], ['a'])).toEqual(['new']);
  });

  test('nothing changed (e.g. filter-only edit with sections present): reparents nothing', () => {
    const layout = sectionLayout([section('s1', 'S1', ['a', 'b'])]);
    expect(idsToReparent(layout, layout, ['a', 'b'], ['a', 'b'])).toEqual([]);
  });

  test('pure flat-grid edit (no sections involved): reparents nothing', () => {
    expect(idsToReparent(undefined, undefined, ['a', 'b'], ['a'])).toEqual([]);
  });
});
