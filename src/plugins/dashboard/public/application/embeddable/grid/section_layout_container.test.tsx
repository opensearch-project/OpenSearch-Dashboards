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

import sizeMe from 'react-sizeme';
import { mount, ReactWrapper } from 'enzyme';
import { act } from 'react';
import { waitFor } from '@testing-library/react';
import { I18nProvider } from '@osd/i18n/react';
import { findTestSubject } from 'test_utils/helpers';
import { ViewMode } from '../../../../../embeddable/public';
import {
  CONTACT_CARD_EMBEDDABLE,
  ContactCardEmbeddableFactory,
  ContactCardEmbeddableInput,
} from '../../../../../embeddable/public/lib/test_samples';
import { embeddablePluginMock } from '../../../../../embeddable/public/mocks';
import { coreMock } from '../../../../../../core/public/mocks';
import { OpenSearchDashboardsContextProvider } from '../../../../../opensearch_dashboards_react/public';
import { DashboardContainer, DashboardContainerOptions } from '../dashboard_container';
import { getSampleDashboardInput, getSampleDashboardPanel } from '../../test_helpers';
import { SectionLayoutContainer } from './section_layout_container';

sizeMe.noPlaceholders = true;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSectionLayout(
  sections: Array<{
    id: string;
    name: string;
    collapsed?: boolean;
    members?: Array<{ idRef: string; x?: number; y?: number; w?: number; h?: number }>;
  }>
) {
  return {
    type: 'SectionLayout' as const,
    items: sections.map((s) => ({
      id: s.id,
      type: 'section' as const,
      name: s.name,
      collapsed: s.collapsed ?? false,
      members: (s.members ?? []).map((m) => ({
        idRef: m.idRef,
        type: 'panel' as const,
        gridData: { x: m.x ?? 0, y: m.y ?? 0, w: m.w ?? 24, h: m.h ?? 15 },
      })),
    })),
  };
}

function setup(overrides?: {
  layout?: ReturnType<typeof makeSectionLayout>;
  panels?: Record<string, any>;
  viewMode?: ViewMode;
  extraPanelIds?: string[];
}) {
  const { setup: embSetup, doStart } = embeddablePluginMock.createInstance();
  embSetup.registerEmbeddableFactory(
    CONTACT_CARD_EMBEDDABLE,
    new ContactCardEmbeddableFactory((() => null) as any, {} as any)
  );
  const embeddableStart = doStart();
  const coreStart = coreMock.createStart();

  // Default: two sections, each with one member panel
  const defaultLayout = makeSectionLayout([
    { id: 's1', name: 'Section 1', members: [{ idRef: 'p1' }] },
    { id: 's2', name: 'Section 2', members: [{ idRef: 'p2' }] },
  ]);

  const defaultPanels: Record<string, any> = {
    p1: getSampleDashboardPanel<ContactCardEmbeddableInput>({
      explicitInput: { firstName: 'Alice', id: 'p1' },
      type: CONTACT_CARD_EMBEDDABLE,
    }),
    p2: getSampleDashboardPanel<ContactCardEmbeddableInput>({
      explicitInput: { firstName: 'Bob', id: 'p2' },
      type: CONTACT_CARD_EMBEDDABLE,
    }),
  };

  // Add extra unclaimed panels if requested
  const panels = overrides?.panels ?? { ...defaultPanels };
  if (overrides?.extraPanelIds) {
    overrides.extraPanelIds.forEach((id) => {
      panels[id] = getSampleDashboardPanel<ContactCardEmbeddableInput>({
        explicitInput: { firstName: id, id },
        type: CONTACT_CARD_EMBEDDABLE,
      });
    });
  }

  const options: DashboardContainerOptions = {
    application: {} as any,
    embeddable: embeddableStart,
    chrome: {} as any,
    notifications: coreStart.notifications,
    overlays: coreStart.overlays,
    inspector: {} as any,
    SavedObjectFinder: () => null,
    ExitFullScreenButton: () => null,
    uiActions: {} as any,
  };

  const input = getSampleDashboardInput({
    panels,
    layout: overrides?.layout ?? defaultLayout,
    viewMode: overrides?.viewMode ?? ViewMode.EDIT,
  } as any);

  const container = new DashboardContainer(input, options);

  const services = {
    overlays: coreStart.overlays,
    notifications: coreStart.notifications,
    SavedObjectFinder: () => null,
    embeddable: embeddableStart,
  };

  const component = mount(
    <I18nProvider>
      <OpenSearchDashboardsContextProvider services={services}>
        <SectionLayoutContainer container={container} PanelComponent={() => <div />} />
      </OpenSearchDashboardsContextProvider>
    </I18nProvider>
  );

  return { container, component, coreStart, options };
}

function updateAndWait(component: ReactWrapper) {
  component.update();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

afterEach(() => {
  jest.restoreAllMocks();
});

describe('SectionLayoutContainer', () => {
  describe('rendering', () => {
    test('renders section headers for each section', () => {
      const { component } = setup();
      expect(findTestSubject(component, 'dashboardSection-s1').length).toBe(1);
      expect(findTestSubject(component, 'dashboardSection-s2').length).toBe(1);
    });

    test('renders the root section layout wrapper', () => {
      const { component } = setup();
      expect(findTestSubject(component, 'dashboardSectionLayout').length).toBe(1);
    });
  });

  describe('collapse toggle', () => {
    test('toggles collapsed state on the target section only', async () => {
      const { container, component } = setup();

      // Initially both sections are NOT collapsed
      const layoutBefore = container.getInput().layout as any;
      expect(layoutBefore.items[0].collapsed).toBe(false);
      expect(layoutBefore.items[1].collapsed).toBe(false);

      // Click toggle on section 1
      await act(async () => {
        findTestSubject(component, 'dashboardSectionToggle-s1').simulate('click');
      });
      updateAndWait(component);

      const layoutAfter = container.getInput().layout as any;
      expect(layoutAfter.items[0].collapsed).toBe(true);
      expect(layoutAfter.items[1].collapsed).toBe(false);
    });

    test('clicking toggle again expands the section', async () => {
      const { container, component } = setup({
        layout: makeSectionLayout([
          { id: 's1', name: 'Section 1', collapsed: true, members: [{ idRef: 'p1' }] },
          { id: 's2', name: 'Section 2', members: [{ idRef: 'p2' }] },
        ]),
      });

      expect((container.getInput().layout as any).items[0].collapsed).toBe(true);

      await act(async () => {
        findTestSubject(component, 'dashboardSectionToggle-s1').simulate('click');
      });
      updateAndWait(component);

      expect((container.getInput().layout as any).items[0].collapsed).toBe(false);
    });
  });

  describe('rename', () => {
    test('rename updates only the target section name', async () => {
      const { container, component } = setup();

      // Open kebab for s1
      await act(async () => {
        findTestSubject(component, 'dashboardSectionMenuButton-s1').simulate('click');
      });
      updateAndWait(component);

      // Click rename
      await act(async () => {
        findTestSubject(component, 'dashboardSectionRename-s1').simulate('click');
      });
      updateAndWait(component);

      // Modal should be visible with input
      const renameInput = findTestSubject(component, 'dashboardSectionRenameInput');
      expect(renameInput.length).toBe(1);

      // Type a new name
      await act(async () => {
        renameInput.simulate('change', { target: { value: 'Renamed Section' } });
      });
      updateAndWait(component);

      // Confirm
      await act(async () => {
        findTestSubject(component, 'dashboardSectionRenameConfirm').simulate('click');
      });
      updateAndWait(component);

      const layout = container.getInput().layout as any;
      expect(layout.items[0].name).toBe('Renamed Section');
      expect(layout.items[1].name).toBe('Section 2');
    });
  });

  describe('delete section', () => {
    test('confirmed delete removes section and its member panels', async () => {
      const { container, component, coreStart } = setup();

      // Mock openConfirm to resolve true (user confirms)
      (coreStart.overlays.openConfirm as jest.Mock).mockResolvedValueOnce(true);

      // Open kebab for s1
      await act(async () => {
        findTestSubject(component, 'dashboardSectionMenuButton-s1').simulate('click');
      });
      updateAndWait(component);

      // Click delete
      await act(async () => {
        findTestSubject(component, 'dashboardSectionDelete-s1').simulate('click');
      });

      // Wait for the async openConfirm to resolve
      await waitFor(() => {
        updateAndWait(component);
        const layout = container.getInput().layout as any;
        // s1 should be gone
        expect(layout.items.length).toBe(1);
        expect(layout.items[0].id).toBe('s2');
      });

      // Panel p1 should be removed
      expect(container.getInput().panels.p1).toBeUndefined();
      // Panel p2 should still exist
      expect(container.getInput().panels.p2).toBeDefined();
    });

    test('cancelled delete is a no-op', async () => {
      const { container, component, coreStart } = setup();

      (coreStart.overlays.openConfirm as jest.Mock).mockResolvedValueOnce(false);

      await act(async () => {
        findTestSubject(component, 'dashboardSectionMenuButton-s1').simulate('click');
      });
      updateAndWait(component);

      await act(async () => {
        findTestSubject(component, 'dashboardSectionDelete-s1').simulate('click');
      });

      await waitFor(() => {
        updateAndWait(component);
        const layout = container.getInput().layout as any;
        expect(layout.items.length).toBe(2);
      });

      expect(container.getInput().panels.p1).toBeDefined();
    });

    test('deleting the last section reverts to GridLayout', async () => {
      const { container, component, coreStart } = setup({
        layout: makeSectionLayout([{ id: 's1', name: 'Only Section', members: [{ idRef: 'p1' }] }]),
        panels: {
          p1: getSampleDashboardPanel<ContactCardEmbeddableInput>({
            explicitInput: { firstName: 'Alice', id: 'p1' },
            type: CONTACT_CARD_EMBEDDABLE,
          }),
        },
      });

      (coreStart.overlays.openConfirm as jest.Mock).mockResolvedValueOnce(true);

      await act(async () => {
        findTestSubject(component, 'dashboardSectionMenuButton-s1').simulate('click');
      });
      updateAndWait(component);

      await act(async () => {
        findTestSubject(component, 'dashboardSectionDelete-s1').simulate('click');
      });

      await waitFor(() => {
        updateAndWait(component);
        const layout = container.getInput().layout as any;
        expect(layout.type).toBe('GridLayout');
      });
    });
  });

  describe('ungroup all sections', () => {
    test('confirmed ungroup flattens to GridLayout', async () => {
      const { container, component, coreStart } = setup();

      (coreStart.overlays.openConfirm as jest.Mock).mockResolvedValueOnce(true);

      await act(async () => {
        findTestSubject(component, 'dashboardSectionMenuButton-s1').simulate('click');
      });
      updateAndWait(component);

      await act(async () => {
        findTestSubject(component, 'dashboardSectionUngroupAll-s1').simulate('click');
      });

      await waitFor(() => {
        updateAndWait(component);
        const layout = container.getInput().layout as any;
        expect(layout.type).toBe('GridLayout');
      });

      // Both panels should still exist
      expect(container.getInput().panels.p1).toBeDefined();
      expect(container.getInput().panels.p2).toBeDefined();
    });

    test('cancelled ungroup is a no-op', async () => {
      const { container, component, coreStart } = setup();

      (coreStart.overlays.openConfirm as jest.Mock).mockResolvedValueOnce(false);

      await act(async () => {
        findTestSubject(component, 'dashboardSectionMenuButton-s1').simulate('click');
      });
      updateAndWait(component);

      await act(async () => {
        findTestSubject(component, 'dashboardSectionUngroupAll-s1').simulate('click');
      });

      await waitFor(() => {
        updateAndWait(component);
        const layout = container.getInput().layout as any;
        expect(layout.type).toBe('SectionLayout');
        expect(layout.items.length).toBe(2);
      });
    });
  });

  describe('virtual Ungrouped section', () => {
    test('unclaimed panel renders in Ungrouped virtual section', () => {
      const { component } = setup({
        extraPanelIds: ['orphan1'],
      });

      const ungrouped = findTestSubject(component, 'dashboardSectionUngrouped');
      expect(ungrouped.length).toBe(1);
    });

    test('Ungrouped section is not shown when all panels are claimed', () => {
      const { component } = setup();

      const ungrouped = findTestSubject(component, 'dashboardSectionUngrouped');
      expect(ungrouped.length).toBe(0);
    });

    test('Ungrouped section has no drag handle', () => {
      const { component } = setup({ extraPanelIds: ['orphan1'] });

      // The virtual section should not have a drag handle
      const ungroupedSection = findTestSubject(component, 'dashboardSectionUngrouped');
      expect(ungroupedSection.length).toBe(1);
      // No drag handle with any prefix matching ungrouped
      expect(findTestSubject(component, 'dashboardSectionDragHandle-__ungrouped__').length).toBe(0);
    });
  });

  describe('drag handle visibility', () => {
    test('drag handle is present in edit mode', () => {
      const { component } = setup({ viewMode: ViewMode.EDIT });

      expect(findTestSubject(component, 'dashboardSectionDragHandle-s1').length).toBe(1);
      expect(findTestSubject(component, 'dashboardSectionDragHandle-s2').length).toBe(1);
    });

    test('drag handle is absent in view mode', () => {
      const { component } = setup({ viewMode: ViewMode.VIEW });

      expect(findTestSubject(component, 'dashboardSectionDragHandle-s1').length).toBe(0);
      expect(findTestSubject(component, 'dashboardSectionDragHandle-s2').length).toBe(0);
    });
  });

  describe('kebab menu visibility', () => {
    test('kebab menu button is present in edit mode', () => {
      const { component } = setup({ viewMode: ViewMode.EDIT });

      expect(findTestSubject(component, 'dashboardSectionMenuButton-s1').length).toBe(1);
      expect(findTestSubject(component, 'dashboardSectionMenuButton-s2').length).toBe(1);
    });

    test('kebab menu button is absent in view mode', () => {
      const { component } = setup({ viewMode: ViewMode.VIEW });

      expect(findTestSubject(component, 'dashboardSectionMenuButton-s1').length).toBe(0);
      expect(findTestSubject(component, 'dashboardSectionMenuButton-s2').length).toBe(0);
    });
  });

  describe('maximize (expanded member)', () => {
    test('the owning section is marked maximized and other sections are hidden', () => {
      const { container, component } = setup();
      act(() => {
        container.updateInput({ expandedPanelId: 'p1' });
      });
      component.update();

      const owning = findTestSubject(component, 'dashboardSection-s1').first();
      const other = findTestSubject(component, 'dashboardSection-s2').first();
      expect(owning.hasClass('dshSectionLayout__section--maximized')).toBe(true);
      expect(owning.hasClass('dshSectionLayout__section--hidden')).toBe(false);
      expect(other.hasClass('dshSectionLayout__section--hidden')).toBe(true);
      expect(other.hasClass('dshSectionLayout__section--maximized')).toBe(false);
    });

    test('no section is marked maximized when nothing is expanded', () => {
      const { component } = setup();
      const s1 = findTestSubject(component, 'dashboardSection-s1').first();
      const s2 = findTestSubject(component, 'dashboardSection-s2').first();
      expect(s1.hasClass('dshSectionLayout__section--maximized')).toBe(false);
      expect(s2.hasClass('dshSectionLayout__section--maximized')).toBe(false);
    });

    test('the virtual Ungrouped section is marked maximized when it owns the expanded panel', () => {
      // p3 is unclaimed -> renders in the virtual "Ungrouped" section.
      const { container, component } = setup({ extraPanelIds: ['p3'] });
      act(() => {
        container.updateInput({ expandedPanelId: 'p3' });
      });
      component.update();

      const ungrouped = findTestSubject(component, 'dashboardSectionUngrouped').first();
      expect(ungrouped.hasClass('dshSectionLayout__section--maximized')).toBe(true);
      expect(ungrouped.hasClass('dshSectionLayout__section--hidden')).toBe(false);
      // Real sections (which don't own the expanded panel) are hidden.
      expect(
        findTestSubject(component, 'dashboardSection-s1')
          .first()
          .hasClass('dshSectionLayout__section--hidden')
      ).toBe(true);
    });
  });
});
