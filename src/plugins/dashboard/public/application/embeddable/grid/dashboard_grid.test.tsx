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

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// @ts-ignore
import sizeMe from 'react-sizeme';

import { act } from 'react';
import { waitFor } from '@testing-library/react';
import { mountWithIntl } from 'test_utils/enzyme_helpers';
import { skip } from 'rxjs/operators';
import { DashboardGrid, DashboardGridProps } from './dashboard_grid';
import { DashboardContainer, DashboardContainerOptions } from '../dashboard_container';
import { getSampleDashboardInput } from '../../test_helpers';
import {
  CONTACT_CARD_EMBEDDABLE,
  ContactCardEmbeddableFactory,
} from '../../../../../embeddable/public/lib/test_samples';
import { embeddablePluginMock } from '../../../../../embeddable/public/mocks';
import { OpenSearchDashboardsContextProvider } from '../../../../../opensearch_dashboards_react/public';
import { SectionEmbeddableFactory } from '../section';
import { SECTION_HEADER_ROWS } from '../dashboard_constants';

let dashboardContainer: DashboardContainer | undefined;

function prepare(props?: Partial<DashboardGridProps>, { withSections = true } = {}) {
  const { setup, doStart } = embeddablePluginMock.createInstance();
  setup.registerEmbeddableFactory(
    CONTACT_CARD_EMBEDDABLE,
    new ContactCardEmbeddableFactory((() => null) as any, {} as any)
  );
  // Option 1: sections are "enabled" iff the section embeddable factory is
  // registered (mirrors the allowDashboardSections flag gating in plugin.tsx).
  if (withSections) {
    setup.registerEmbeddableFactory('dashboard_section', new SectionEmbeddableFactory() as any);
  }
  const start = doStart();

  const getEmbeddableFactory = start.getEmbeddableFactory;
  const initialInput = getSampleDashboardInput({
    panels: {
      '1': {
        gridData: { x: 0, y: 0, w: 6, h: 6, i: '1' },
        type: CONTACT_CARD_EMBEDDABLE,
        explicitInput: { id: '1' },
      },
      '2': {
        gridData: { x: 6, y: 6, w: 6, h: 6, i: '2' },
        type: CONTACT_CARD_EMBEDDABLE,
        explicitInput: { id: '2' },
      },
    },
  });
  const options: DashboardContainerOptions = {
    application: {} as any,
    embeddable: {
      getTriggerCompatibleActions: (() => []) as any,
      getEmbeddableFactories: start.getEmbeddableFactories,
      getEmbeddablePanel: jest.fn(),
      getEmbeddableFactory,
    } as any,
    notifications: {} as any,
    chrome: {} as any,
    overlays: {} as any,
    inspector: {
      isAvailable: jest.fn(),
    } as any,
    SavedObjectFinder: () => null,
    ExitFullScreenButton: () => null,
    uiActions: {
      getTriggerCompatibleActions: (() => []) as any,
    } as any,
  };
  dashboardContainer = new DashboardContainer(initialInput, options);
  const defaultTestProps: DashboardGridProps = {
    container: dashboardContainer,
    PanelComponent: () => <div />,
    opensearchDashboards: null as any,
    intl: null as any,
  };

  return {
    props: Object.assign(defaultTestProps, props),
    options,
  };
}

beforeAll(() => {
  // sizeme detects the width to be 0 in our test environment. noPlaceholder will mean that the grid contents will
  // get rendered even when width is 0, which will improve our tests.
  sizeMe.noPlaceholders = true;
});

afterAll(() => {
  sizeMe.noPlaceholders = false;
});

test('renders DashboardGrid', () => {
  const { props, options } = prepare();
  const component = mountWithIntl(
    <OpenSearchDashboardsContextProvider services={options}>
      <DashboardGrid {...props} />
    </OpenSearchDashboardsContextProvider>
  );
  const panelElements = component.find('EmbeddableChildPanel');
  expect(panelElements.length).toBe(2);
});

test('renders DashboardGrid with no visualizations', async () => {
  const { props, options } = prepare();
  const component = mountWithIntl(
    <OpenSearchDashboardsContextProvider services={options}>
      <DashboardGrid {...props} />
    </OpenSearchDashboardsContextProvider>
  );

  // Wrap container input update in act() for React 18
  await act(async () => {
    props.container.updateInput({ panels: {} });
  });

  // Use waitFor to wait for the component to re-render after the RxJS subscription triggers state update
  await waitFor(() => {
    component.update();
    expect(component.find('EmbeddableChildPanel').length).toBe(0);
  });
});

test('DashboardGrid removes panel when removed from container', async () => {
  const { props, options } = prepare();
  const component = mountWithIntl(
    <OpenSearchDashboardsContextProvider services={options}>
      <DashboardGrid {...props} />
    </OpenSearchDashboardsContextProvider>
  );

  const originalPanels = props.container.getInput().panels;
  const filteredPanels = { ...originalPanels };
  delete filteredPanels['1'];

  // Wrap container input update in act() for React 18
  await act(async () => {
    props.container.updateInput({ panels: filteredPanels });
  });

  // Use waitFor to wait for the component to re-render after the RxJS subscription triggers state update
  await waitFor(() => {
    component.update();
    const panelElements = component.find('EmbeddableChildPanel');
    expect(panelElements.length).toBe(1);
  });
});

test('DashboardGrid renders expanded panel', async () => {
  const { props, options } = prepare();
  const component = mountWithIntl(
    <OpenSearchDashboardsContextProvider services={options}>
      <DashboardGrid {...props} />
    </OpenSearchDashboardsContextProvider>
  );

  // Wrap container input update in act() for React 18
  await act(async () => {
    props.container.updateInput({ expandedPanelId: '1' });
  });

  // Use waitFor to wait for the component to re-render after the RxJS subscription triggers state update
  await waitFor(() => {
    component.update();
    // Both panels should still exist in the dom, so nothing needs to be re-fetched once minimized.
    expect(component.find('EmbeddableChildPanel').length).toBe(2);
    expect(
      (component.find('DashboardGridUi').state() as { expandedPanelId?: string }).expandedPanelId
    ).toBe('1');
  });

  // Wrap second container input update in act() for React 18
  await act(async () => {
    props.container.updateInput({ expandedPanelId: undefined });
  });

  await waitFor(() => {
    component.update();
    expect(component.find('EmbeddableChildPanel').length).toBe(2);
    expect(
      (component.find('DashboardGridUi').state() as { expandedPanelId?: string }).expandedPanelId
    ).toBeUndefined();
  });
});

test('DashboardGrid unmount unsubscribes', (done) => {
  const { props, options } = prepare();
  const component = mountWithIntl(
    <OpenSearchDashboardsContextProvider services={options}>
      <DashboardGrid {...props} />
    </OpenSearchDashboardsContextProvider>
  );

  component.unmount();

  props.container
    .getInput$()
    .pipe(skip(1))
    .subscribe(() => {
      done();
    });

  props.container.updateInput({ expandedPanelId: '1' });
});

// Dashboard collapsible sections.
// Exercises the real DashboardGrid lockstep renderPanels()/buildLayoutFromPanels()
// filtering against the section-as-panel data model -- not a standalone mock.
describe('collapsible sections', () => {
  const DASHBOARD_SECTION_EMBEDDABLE = 'dashboard_section';

  function prepareWithSection() {
    const { props, options } = prepare();
    return { props, options };
  }

  test('member panels of an expanded section render normally', async () => {
    const { props, options } = prepareWithSection();
    const component = mountWithIntl(
      <OpenSearchDashboardsContextProvider services={options}>
        <DashboardGrid {...props} />
      </OpenSearchDashboardsContextProvider>
    );

    await act(async () => {
      props.container.updateInput({
        panels: {
          section1: {
            gridData: { x: 0, y: 0, w: 48, h: 4, i: 'section1' },
            type: DASHBOARD_SECTION_EMBEDDABLE,
            explicitInput: {
              id: 'section1',
              title: 'Section 1',
              collapsed: false,
              members: [{ id: '1', gridData: { x: 0, y: 0, w: 6, h: 6 } }],
            },
          },
          '1': {
            gridData: { x: 0, y: 0, w: 6, h: 6, i: '1' },
            type: CONTACT_CARD_EMBEDDABLE,
            explicitInput: { id: '1' },
          },
        },
      });
    });

    await waitFor(() => {
      component.update();
      // section panel itself + its one member both render/mount.
      expect(component.find('EmbeddableChildPanel').length).toBe(2);
    });
  });

  test('maximizing a section MEMBER expands its owning section and the member, hiding siblings', async () => {
    const { props, options } = prepareWithSection();
    const component = mountWithIntl(
      <OpenSearchDashboardsContextProvider services={options}>
        <DashboardGrid {...props} />
      </OpenSearchDashboardsContextProvider>
    );

    await act(async () => {
      props.container.updateInput({
        panels: {
          section1: {
            gridData: { x: 0, y: 0, w: 48, h: 4, i: 'section1' },
            type: DASHBOARD_SECTION_EMBEDDABLE,
            explicitInput: {
              id: 'section1',
              title: 'Section 1',
              collapsed: false,
              members: [
                { id: '1', gridData: { x: 0, y: 0, w: 6, h: 6 } },
                { id: '2', gridData: { x: 6, y: 0, w: 6, h: 6 } },
              ],
            },
          },
          '1': {
            gridData: { x: 0, y: 0, w: 6, h: 6, i: '1' },
            type: CONTACT_CARD_EMBEDDABLE,
            explicitInput: { id: '1' },
          },
          '2': {
            gridData: { x: 6, y: 0, w: 6, h: 6, i: '2' },
            type: CONTACT_CARD_EMBEDDABLE,
            explicitInput: { id: '2' },
          },
        },
      });
    });

    // Maximize member '1' (as ExpandPanelAction does: sets container-level
    // expandedPanelId to the member's id).
    await act(async () => {
      props.container.updateInput({ expandedPanelId: '1' });
    });

    await waitFor(() => {
      component.update();
      // Owning section item + the maximized member both carry --expanded.
      expect(component.find('.dshDashboardGrid__item--expanded').length).toBeGreaterThanOrEqual(1);
      // The sibling member '2' is hidden.
      expect(component.find('.dshDashboardGrid__item--hidden').length).toBeGreaterThanOrEqual(1);
      // All panels remain mounted (maximize must not destroy anything).
      expect(component.find('EmbeddableChildPanel').length).toBe(3);
    });

    // Minimize -- everything returns to normal, nothing hidden.
    await act(async () => {
      props.container.updateInput({ expandedPanelId: undefined });
    });

    await waitFor(() => {
      component.update();
      expect(component.find('.dshDashboardGrid__item--hidden').length).toBe(0);
      expect(component.find('EmbeddableChildPanel').length).toBe(3);
    });
  });

  test('member panels stay mounted but are hidden when their section is collapsed', async () => {
    const { props, options } = prepareWithSection();
    const component = mountWithIntl(
      <OpenSearchDashboardsContextProvider services={options}>
        <DashboardGrid {...props} />
      </OpenSearchDashboardsContextProvider>
    );

    await act(async () => {
      props.container.updateInput({
        panels: {
          section1: {
            gridData: { x: 0, y: 0, w: 48, h: 4, i: 'section1' },
            type: DASHBOARD_SECTION_EMBEDDABLE,
            explicitInput: {
              id: 'section1',
              title: 'Section 1',
              collapsed: false,
              members: [
                { id: '1', gridData: { x: 0, y: 0, w: 6, h: 6 } },
                { id: '2', gridData: { x: 6, y: 0, w: 6, h: 6 } },
              ],
            },
          },
          '1': {
            gridData: { x: 0, y: 0, w: 6, h: 6, i: '1' },
            type: CONTACT_CARD_EMBEDDABLE,
            explicitInput: { id: '1' },
          },
          '2': {
            gridData: { x: 6, y: 0, w: 6, h: 6, i: '2' },
            type: CONTACT_CARD_EMBEDDABLE,
            explicitInput: { id: '2' },
          },
        },
      });
    });

    await waitFor(() => {
      component.update();
      // section header + 2 members = 3 mounted EmbeddableChildPanel entries.
      expect(component.find('EmbeddableChildPanel').length).toBe(3);
    });

    // Collapse the section -- this is a real container.updateInput on the
    // section's OWN explicitInput, exactly the primitive Phase 3's toggle
    // action would call (container.updateInputForChild equivalent).
    await act(async () => {
      const panels = props.container.getInput().panels;
      props.container.updateInput({
        panels: {
          ...panels,
          section1: {
            ...panels.section1,
            explicitInput: { ...panels.section1.explicitInput, collapsed: true },
          },
        },
      });
    });

    await waitFor(() => {
      component.update();
      // CORRECTED behavior (see DashboardSectionGrid `collapsed` prop): a
      // collapsed section's members stay MOUNTED -- all 3 EmbeddableChildPanel
      // entries (header + 2 members) remain -- because unmounting would call
      // EmbeddablePanel.componentWillUnmount -> embeddable.destroy() and the
      // members would come back blank on expand. Collapse hides the inner grid
      // via the --collapsed CSS modifier instead.
      expect(component.find('EmbeddableChildPanel').length).toBe(3);
      expect(component.find('.dshDashboardSectionGrid__inner--collapsed').length).toBeGreaterThan(
        0
      );
    });

    // Expand again -- members remount.
    await act(async () => {
      const panels = props.container.getInput().panels;
      props.container.updateInput({
        panels: {
          ...panels,
          section1: {
            ...panels.section1,
            explicitInput: { ...panels.section1.explicitInput, collapsed: false },
          },
        },
      });
    });

    await waitFor(() => {
      component.update();
      expect(component.find('EmbeddableChildPanel').length).toBe(3);
    });
  });

  test('ungrouped panels (no sectionId) are unaffected by any section collapse state', async () => {
    const { props, options } = prepareWithSection();
    const component = mountWithIntl(
      <OpenSearchDashboardsContextProvider services={options}>
        <DashboardGrid {...props} />
      </OpenSearchDashboardsContextProvider>
    );

    await act(async () => {
      props.container.updateInput({
        panels: {
          section1: {
            gridData: { x: 0, y: 0, w: 48, h: 4, i: 'section1' },
            type: DASHBOARD_SECTION_EMBEDDABLE,
            explicitInput: {
              id: 'section1',
              title: 'Section 1',
              collapsed: true,
              members: [{ id: 'member1', gridData: { x: 0, y: 0, w: 6, h: 6 } }],
            },
          },
          member1: {
            gridData: { x: 0, y: 0, w: 6, h: 6, i: 'member1' },
            type: CONTACT_CARD_EMBEDDABLE,
            explicitInput: { id: 'member1' },
          },
          ungrouped1: {
            gridData: { x: 0, y: 20, w: 6, h: 6, i: 'ungrouped1' },
            type: CONTACT_CARD_EMBEDDABLE,
            explicitInput: { id: 'ungrouped1' },
          },
        },
      });
    });

    await waitFor(() => {
      component.update();
      // section header + ungrouped1 + member1 (mounted-but-hidden under the
      // collapsed section) = 3. The point of THIS test is that the ungrouped
      // panel is present and unaffected by section1's collapsed state.
      expect(component.find('EmbeddableChildPanel').length).toBe(3);
      expect(component.find('[data-test-subj="dashboardPanel"]').length).toBeGreaterThan(0);
    });
  });

  test('with sections disabled, section panels are dropped and members render ungrouped', async () => {
    const { props, options } = prepare(undefined, { withSections: false });
    const component = mountWithIntl(
      <OpenSearchDashboardsContextProvider services={options}>
        <DashboardGrid {...props} />
      </OpenSearchDashboardsContextProvider>
    );

    await act(async () => {
      props.container.updateInput({
        panels: {
          section1: {
            gridData: { x: 0, y: 0, w: 48, h: 4, i: 'section1' },
            type: DASHBOARD_SECTION_EMBEDDABLE,
            explicitInput: {
              id: 'section1',
              title: 'Section 1',
              collapsed: false,
              members: [{ id: '1', gridData: { x: 0, y: 0, w: 6, h: 6 } }],
            },
          },
          '1': {
            gridData: { x: 0, y: 10, w: 6, h: 6, i: '1' },
            type: CONTACT_CARD_EMBEDDABLE,
            explicitInput: { id: '1' },
          },
        },
      });
    });

    await waitFor(() => {
      component.update();
      // Section factory unregistered (feature off): the section panel is
      // filtered out entirely (no inner section grid), and the former member
      // renders as an ordinary standalone panel at its absolute gridData.
      expect(component.find('[data-test-subj="dashboardSectionGrid-section1"]').length).toBe(0);
      expect(component.find('EmbeddableChildPanel').length).toBe(1);
    });
  });
});

// Directly exercises the outer-grid layout math for sections
// (buildLayoutFromPanels -> computeSectionOuterHeight): the section item's
// reserved height and the exclusion of member panels from the outer grid.
// jsdom can't lay out pixels, but the computed row `h` is a pure function of
// the section's member list, so we assert it via the component instance.
describe('collapsible sections: outer-grid height', () => {
  const DASHBOARD_SECTION_EMBEDDABLE = 'dashboard_section';
  // Mirrors EMPTY_SECTION_CTA_ROWS in dashboard_grid.tsx (rows reserved for the
  // "add visualization" call-to-action shown in an empty, expanded section).
  const EMPTY_SECTION_CTA_ROWS = 5;

  interface OuterItem {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    isResizable?: boolean;
  }

  const sectionPanel = (
    collapsed: boolean,
    members: Array<{ id: string; gridData: { x: number; y: number; w: number; h: number } }>
  ) => ({
    gridData: { x: 0, y: 0, w: 48, h: 4, i: 'section1' },
    type: DASHBOARD_SECTION_EMBEDDABLE,
    explicitInput: { id: 'section1', title: 'Section 1', collapsed, members },
  });

  const memberPanel = (id: string, gridData: { x: number; y: number; w: number; h: number }) => ({
    gridData: { ...gridData, i: id },
    type: CONTACT_CARD_EMBEDDABLE,
    explicitInput: { id },
  });

  async function outerLayoutFor(panels: Record<string, unknown>): Promise<OuterItem[]> {
    const { props, options } = prepare();
    const component = mountWithIntl(
      <OpenSearchDashboardsContextProvider services={options}>
        <DashboardGrid {...props} />
      </OpenSearchDashboardsContextProvider>
    );
    await act(async () => {
      props.container.updateInput({ panels: panels as any });
    });
    component.update();
    const instance = component.find('DashboardGridUi').instance() as any;
    return instance.buildLayoutFromPanels() as OuterItem[];
  }

  test('a collapsed section reserves exactly SECTION_HEADER_ROWS, full width, not resizable', async () => {
    const layout = await outerLayoutFor({
      section1: sectionPanel(true, [{ id: '1', gridData: { x: 0, y: 0, w: 24, h: 15 } }]),
      '1': memberPanel('1', { x: 0, y: 0, w: 24, h: 15 }),
    });
    const section = layout.find((l) => l.i === 'section1');
    expect(section?.h).toBe(SECTION_HEADER_ROWS);
    expect(section?.w).toBe(48);
    expect(section?.isResizable).toBe(false);
  });

  test('an expanded EMPTY section reserves header rows + CTA rows', async () => {
    const layout = await outerLayoutFor({ section1: sectionPanel(false, []) });
    const section = layout.find((l) => l.i === 'section1');
    expect(section?.h).toBe(SECTION_HEADER_ROWS + EMPTY_SECTION_CTA_ROWS);
  });

  test('an expanded section height = header rows + tallest member bottom (max y + h)', async () => {
    const members = [
      { id: '1', gridData: { x: 0, y: 0, w: 24, h: 10 } }, // bottom 10
      { id: '2', gridData: { x: 24, y: 0, w: 24, h: 15 } }, // bottom 15
      { id: '3', gridData: { x: 0, y: 10, w: 24, h: 8 } }, // bottom 18 (tallest)
    ];
    const layout = await outerLayoutFor({
      section1: sectionPanel(false, members),
      '1': memberPanel('1', { x: 0, y: 0, w: 24, h: 10 }),
      '2': memberPanel('2', { x: 24, y: 0, w: 24, h: 15 }),
      '3': memberPanel('3', { x: 0, y: 10, w: 24, h: 8 }),
    });
    const section = layout.find((l) => l.i === 'section1');
    expect(section?.h).toBe(SECTION_HEADER_ROWS + 18);
  });

  test('member panels are excluded from the outer layout (rendered by the inner grid)', async () => {
    const layout = await outerLayoutFor({
      section1: sectionPanel(false, [
        { id: '1', gridData: { x: 0, y: 0, w: 24, h: 15 } },
        { id: '2', gridData: { x: 24, y: 0, w: 24, h: 15 } },
      ]),
      '1': memberPanel('1', { x: 0, y: 0, w: 24, h: 15 }),
      '2': memberPanel('2', { x: 24, y: 0, w: 24, h: 15 }),
      free: memberPanel('free', { x: 0, y: 30, w: 12, h: 6 }), // ungrouped panel
    });
    const ids = layout.map((l) => l.i).sort();
    // Only the section item and the ungrouped panel appear at the outer level;
    // members '1' and '2' are owned by the inner grid.
    expect(ids).toEqual(['free', 'section1']);
  });

  test('with sections disabled, the section panel is dropped and members fall through as ungrouped', async () => {
    const { props, options } = prepare(undefined, { withSections: false });
    const component = mountWithIntl(
      <OpenSearchDashboardsContextProvider services={options}>
        <DashboardGrid {...props} />
      </OpenSearchDashboardsContextProvider>
    );
    await act(async () => {
      props.container.updateInput({
        panels: {
          section1: sectionPanel(false, [
            { id: '1', gridData: { x: 0, y: 0, w: 24, h: 15 } },
          ]) as any,
          '1': memberPanel('1', { x: 3, y: 7, w: 24, h: 15 }) as any,
        },
      });
    });
    component.update();
    const instance = component.find('DashboardGridUi').instance() as any;
    const layout = instance.buildLayoutFromPanels() as OuterItem[];
    // Flag off: the dashboard_section panel is filtered out (factory absent) and
    // the former member falls through as an ordinary panel at the outer level.
    // (Its y may be vertically compacted by react-grid-layout, so assert only
    // presence and the stable dimensions, not the exact y.)
    expect(layout.find((l) => l.i === 'section1')).toBeUndefined();
    const member = layout.find((l) => l.i === '1');
    expect(member).toBeDefined();
    expect(member).toMatchObject({ x: 3, w: 24, h: 15 });
  });
});
