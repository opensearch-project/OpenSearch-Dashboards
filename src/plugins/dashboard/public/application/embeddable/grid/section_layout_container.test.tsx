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
import { openAddPanelFlyout, ViewMode } from '../../../../../embeddable/public';
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

jest.mock('../../../../../embeddable/public', () => ({
  ...jest.requireActual('../../../../../embeddable/public'),
  openAddPanelFlyout: jest.fn(),
}));

sizeMe.noPlaceholders = true;

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

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
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

      const layoutBefore = container.getInput().layout as any;
      expect(layoutBefore.items[0].collapsed).toBe(false);
      expect(layoutBefore.items[1].collapsed).toBe(false);

      await act(async () => {
        findTestSubject(component, 'dashboardSectionToggle-s1').simulate('click');
      });
      updateAndWait(component);

      const layoutAfter = container.getInput().layout as any;
      expect(layoutAfter.items[0].collapsed).toBe(true);
      expect(layoutAfter.items[1].collapsed).toBe(false);
      expect(
        findTestSubject(component, 'dashboardSectionToggle-s1').hasClass(
          'dshSectionLayout__collapseButton--collapsed'
        )
      ).toBe(true);
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
      expect(
        findTestSubject(component, 'dashboardSectionToggle-s1').hasClass(
          'dshSectionLayout__collapseButton--collapsed'
        )
      ).toBe(false);
    });
  });

  describe('rename', () => {
    test('rename updates only the target section name', async () => {
      const { container, component } = setup();

      await act(async () => {
        findTestSubject(component, 'dashboardSectionMenuButton-s1').simulate('click');
      });
      updateAndWait(component);

      await act(async () => {
        findTestSubject(component, 'dashboardSectionRename-s1').simulate('click');
      });
      updateAndWait(component);

      const renameInput = findTestSubject(component, 'dashboardSectionRenameInput');
      expect(renameInput.length).toBe(1);

      await act(async () => {
        renameInput.simulate('change', { target: { value: 'Renamed Section' } });
      });
      updateAndWait(component);

      await act(async () => {
        findTestSubject(component, 'dashboardSectionRenameConfirm').simulate('click');
      });
      updateAndWait(component);

      const layout = container.getInput().layout as any;
      expect(layout.items[0].name).toBe('Renamed Section');
      expect(layout.items[1].name).toBe('Section 2');
    });
  });

  describe('add panel', () => {
    test('uses the generic flyout and claims its added panel into the section', async () => {
      const { container, component } = setup({ extraPanelIds: ['orphan1'] });

      await act(async () => {
        findTestSubject(component, 'dashboardSectionMenuButton-s1').simulate('click');
      });
      updateAndWait(component);

      await act(async () => {
        findTestSubject(component, 'dashboardSectionAddPanel-s1').simulate('click');
      });

      const options = (openAddPanelFlyout as jest.Mock).mock.calls[0][0];
      expect(options).toEqual(
        expect.objectContaining({
          embeddable: container,
          showCreateNew: false,
          closeAfterAdd: true,
        })
      );

      options.onPanelAdded({ id: 'orphan1' });

      const section = (container.getInput().layout as any).items.find(
        (item: any) => item.id === 's1'
      );
      expect(section.members.map((member: any) => member.idRef)).toContain('orphan1');
    });
  });

  describe('delete section', () => {
    test('confirmed delete removes section and its member panels', async () => {
      const { container, component, coreStart } = setup();

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
        expect(layout.items.length).toBe(1);
        expect(layout.items[0].id).toBe('s2');
      });

      expect(container.getInput().panels.p1).toBeUndefined();
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

    test('deleting the last section reparents surviving unclaimed panels', async () => {
      const { container, component, coreStart } = setup({
        layout: makeSectionLayout([{ id: 's1', name: 'Only Section', members: [{ idRef: 'p1' }] }]),
        panels: {
          p1: getSampleDashboardPanel<ContactCardEmbeddableInput>({
            explicitInput: { firstName: 'Alice', id: 'p1' },
            type: CONTACT_CARD_EMBEDDABLE,
          }),
        },
        extraPanelIds: ['orphan1'],
      });
      const reparentPanels = jest.spyOn(container, 'reparentPanels');

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
        expect(container.getInput().layout?.type).toBe('GridLayout');
      });

      expect(reparentPanels).toHaveBeenCalledTimes(1);
      const [ids, layout, panels] = reparentPanels.mock.calls[0];
      expect(ids).toEqual(['orphan1']);
      expect(layout).toEqual({ type: 'GridLayout', items: [] });
      expect(panels.p1).toBeUndefined();
      expect(panels.orphan1).toBeDefined();
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

      expect(container.getInput().panels.p1).toBeDefined();
      expect(container.getInput().panels.p2).toBeDefined();
    });

    test('confirmed ungroup reparents claimed and unclaimed panels', async () => {
      const { container, component, coreStart } = setup({ extraPanelIds: ['orphan1'] });
      const reparentPanels = jest.spyOn(container, 'reparentPanels');

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
        expect(container.getInput().layout?.type).toBe('GridLayout');
      });

      expect(reparentPanels).toHaveBeenCalledTimes(1);
      const [ids, layout, panels] = reparentPanels.mock.calls[0];
      expect(ids).toEqual(expect.arrayContaining(['p1', 'p2', 'orphan1']));
      expect(ids).toHaveLength(3);
      expect(layout).toEqual({ type: 'GridLayout', items: [] });
      expect(panels.p1).toBeDefined();
      expect(panels.p2).toBeDefined();
      expect(panels.orphan1).toBeDefined();
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

      const ungroupedSection = findTestSubject(component, 'dashboardSectionUngrouped');
      expect(ungroupedSection.length).toBe(1);
      const header = ungroupedSection.find('.dshSectionLayout__sectionHeader').first();
      expect(header.prop('data-rbd-drag-handle-draggable-id')).toBeUndefined();
    });
  });

  describe('section header drag handle', () => {
    test('section headers are drag handles in edit mode', () => {
      const { component } = setup({ viewMode: ViewMode.EDIT });

      const section1Header = findTestSubject(component, 'dashboardSection-s1')
        .find('.dshSectionLayout__sectionHeader')
        .first();
      const section2Header = findTestSubject(component, 'dashboardSection-s2')
        .find('.dshSectionLayout__sectionHeader')
        .first();

      expect(section1Header.prop('data-rbd-drag-handle-draggable-id')).toBe('s1');
      expect(section2Header.prop('data-rbd-drag-handle-draggable-id')).toBe('s2');
    });

    test('section headers are not drag handles in view mode', () => {
      const { component } = setup({ viewMode: ViewMode.VIEW });

      const section1Header = findTestSubject(component, 'dashboardSection-s1')
        .find('.dshSectionLayout__sectionHeader')
        .first();
      const section2Header = findTestSubject(component, 'dashboardSection-s2')
        .find('.dshSectionLayout__sectionHeader')
        .first();

      expect(section1Header.prop('data-rbd-drag-handle-draggable-id')).toBeUndefined();
      expect(section2Header.prop('data-rbd-drag-handle-draggable-id')).toBeUndefined();
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
      const { container, component } = setup({ extraPanelIds: ['p3'] });
      act(() => {
        container.updateInput({ expandedPanelId: 'p3' });
      });
      component.update();

      const ungrouped = findTestSubject(component, 'dashboardSectionUngrouped').first();
      expect(ungrouped.hasClass('dshSectionLayout__section--maximized')).toBe(true);
      expect(ungrouped.hasClass('dshSectionLayout__section--hidden')).toBe(false);
      expect(
        findTestSubject(component, 'dashboardSection-s1')
          .first()
          .hasClass('dshSectionLayout__section--hidden')
      ).toBe(true);
    });
  });
});
