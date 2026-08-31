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

import React from 'react';
import { mount } from 'enzyme';
import { findTestSubject } from 'test_utils/helpers';
import { DashboardSectionGrid, DashboardSectionGridProps } from './dashboard_section_grid';
import { DashboardPanelState } from '../types';
import { SectionLayoutMember } from '../../../../common';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Stub out EmbeddableChildPanel to a lightweight div so we don't need a real
// embeddable registry or container child lifecycle.
jest.mock('../../../../../embeddable/public', () => ({
  EmbeddableChildPanel: ({
    embeddableId,
  }: {
    embeddableId: string;
    container: unknown;
    PanelComponent: unknown;
  }) => <div data-test-subj="mockEmbeddablePanel">{embeddableId}</div>,
}));

// Stub ResponsiveSizedGrid to render children in a plain div while still
// forwarding the onLayoutChange ref so the unit under test can call it.
jest.mock('./dashboard_responsive_grid', () => ({
  PANEL_DRAG_HANDLE: '.embPanel__dragger',
  ResponsiveSizedGrid: ({
    children,
    onLayoutChange,
  }: {
    children: React.ReactNode;
    onLayoutChange: (
      layout: Array<{ i: string; x: number; y: number; w: number; h: number }>
    ) => void;
    [k: string]: unknown;
  }) => (
    <div data-test-subj="responsiveSizedGrid" data-onlayoutchange={onLayoutChange as any}>
      {children}
    </div>
  ),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SECTION_ID = 'section-1';

function makePanel(id: string): DashboardPanelState {
  return {
    type: 'visualization',
    explicitInput: { id } as any,
    gridData: { x: 0, y: 0, w: 24, h: 15, i: id },
  };
}

function makeMember(
  id: string,
  gridData: { x: number; y: number; w: number; h: number }
): { panel: DashboardPanelState; member: SectionLayoutMember } {
  return {
    panel: makePanel(id),
    member: { idRef: id, type: 'panel', gridData },
  };
}

function getDefaultProps(
  overrides?: Partial<DashboardSectionGridProps>
): DashboardSectionGridProps {
  return {
    container: {} as any,
    PanelComponent: (() => null) as any,
    sectionId: SECTION_ID,
    members: [
      makeMember('panel-a', { x: 0, y: 10, w: 24, h: 15 }),
      makeMember('panel-b', { x: 0, y: 0, w: 24, h: 10 }),
    ],
    isViewMode: false,
    useMargins: true,
    collapsed: false,
    onMembersLayoutChange: jest.fn(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DashboardSectionGrid', () => {
  it('renders member panels sorted by y then x', () => {
    const props = getDefaultProps();
    const wrapper = mount(<DashboardSectionGrid {...props} />);

    // panel-b (y=0) should come before panel-a (y=10)
    const panels = findTestSubject(wrapper, 'dashboardPanel');
    expect(panels).toHaveLength(2);
    expect(panels.at(0).text()).toBe('panel-b');
    expect(panels.at(1).text()).toBe('panel-a');

    wrapper.unmount();
  });

  it('sorts by x when y values are equal', () => {
    const members = [
      makeMember('right', { x: 24, y: 0, w: 24, h: 10 }),
      makeMember('left', { x: 0, y: 0, w: 24, h: 10 }),
    ];
    const wrapper = mount(<DashboardSectionGrid {...getDefaultProps({ members })} />);

    const panels = findTestSubject(wrapper, 'dashboardPanel');
    expect(panels.at(0).text()).toBe('left');
    expect(panels.at(1).text()).toBe('right');

    wrapper.unmount();
  });

  // -- Collapsed behavior ---------------------------------------------------

  it('shows collapsed hint when collapsed=true', () => {
    const wrapper = mount(<DashboardSectionGrid {...getDefaultProps({ collapsed: true })} />);

    const hint = findTestSubject(wrapper, `dashboardSectionCollapsedHint-${SECTION_ID}`);
    expect(hint).toHaveLength(1);
    expect(hint.text()).toContain('collapsed');

    wrapper.unmount();
  });

  it('hides collapsed hint when collapsed=true and hideCollapsedHint=true', () => {
    const wrapper = mount(
      <DashboardSectionGrid {...getDefaultProps({ collapsed: true, hideCollapsedHint: true })} />
    );

    const hint = findTestSubject(wrapper, `dashboardSectionCollapsedHint-${SECTION_ID}`);
    expect(hint).toHaveLength(0);

    wrapper.unmount();
  });

  it('does not show collapsed hint when not collapsed', () => {
    const wrapper = mount(<DashboardSectionGrid {...getDefaultProps({ collapsed: false })} />);

    const hint = findTestSubject(wrapper, `dashboardSectionCollapsedHint-${SECTION_ID}`);
    expect(hint).toHaveLength(0);

    wrapper.unmount();
  });

  // -- Empty section CTA widget ---------------------------------------------

  it('shows empty section CTA widget with both buttons when callbacks provided', () => {
    const onCreateNewPanel = jest.fn();
    const onAddPanel = jest.fn();
    const wrapper = mount(
      <DashboardSectionGrid
        {...getDefaultProps({
          members: [],
          collapsed: false,
          onCreateNewPanel,
          onAddPanel,
        })}
      />
    );

    expect(findTestSubject(wrapper, 'emptySectionWidget')).toHaveLength(1);

    const createBtn = findTestSubject(wrapper, 'createNewVisToSectionButton');
    expect(createBtn).toHaveLength(1);
    createBtn.simulate('click');
    expect(onCreateNewPanel).toHaveBeenCalledTimes(1);

    const addBtn = findTestSubject(wrapper, 'addExistingVisToSectionButton');
    expect(addBtn).toHaveLength(1);
    addBtn.simulate('click');
    expect(onAddPanel).toHaveBeenCalledTimes(1);

    wrapper.unmount();
  });

  it('hides CTA buttons when callbacks are absent', () => {
    const wrapper = mount(
      <DashboardSectionGrid
        {...getDefaultProps({
          members: [],
          collapsed: false,
          onCreateNewPanel: undefined,
          onAddPanel: undefined,
        })}
      />
    );

    expect(findTestSubject(wrapper, 'emptySectionWidget')).toHaveLength(1);
    expect(findTestSubject(wrapper, 'createNewVisToSectionButton')).toHaveLength(0);
    expect(findTestSubject(wrapper, 'addExistingVisToSectionButton')).toHaveLength(0);

    wrapper.unmount();
  });

  it('does not show CTA widget when members are present', () => {
    const wrapper = mount(<DashboardSectionGrid {...getDefaultProps()} />);

    expect(findTestSubject(wrapper, 'emptySectionWidget')).toHaveLength(0);

    wrapper.unmount();
  });

  it('does not show CTA widget when collapsed even with no members', () => {
    const wrapper = mount(
      <DashboardSectionGrid {...getDefaultProps({ members: [], collapsed: true })} />
    );

    expect(findTestSubject(wrapper, 'emptySectionWidget')).toHaveLength(0);

    wrapper.unmount();
  });

  // -- onLayoutChange -------------------------------------------------------

  it('onLayoutChange filters unknown panel ids and maps to SectionLayoutMember[]', () => {
    const onMembersLayoutChange = jest.fn();
    const props = getDefaultProps({ onMembersLayoutChange });
    const wrapper = mount(<DashboardSectionGrid {...props} />);

    const instance = wrapper.instance() as DashboardSectionGrid;
    instance.onLayoutChange([
      { i: 'panel-a', x: 5, y: 2, w: 20, h: 10 },
      { i: 'panel-b', x: 0, y: 0, w: 24, h: 10 },
      { i: 'unknown-panel', x: 0, y: 30, w: 10, h: 5 },
    ] as any);

    expect(onMembersLayoutChange).toHaveBeenCalledTimes(1);
    const [calledSectionId, updatedLayouts] = onMembersLayoutChange.mock.calls[0];
    expect(calledSectionId).toBe(SECTION_ID);
    expect(updatedLayouts).toHaveLength(2);
    expect(updatedLayouts).toEqual([
      { idRef: 'panel-a', type: 'panel', gridData: { x: 5, y: 2, w: 20, h: 10 } },
      { idRef: 'panel-b', type: 'panel', gridData: { x: 0, y: 0, w: 24, h: 10 } },
    ]);

    wrapper.unmount();
  });

  // -- expandedPanelId (maximize) -------------------------------------------

  it('applies expanded class to matching member and hidden to siblings', () => {
    const wrapper = mount(
      <DashboardSectionGrid {...getDefaultProps({ expandedPanelId: 'panel-b' })} />
    );

    const panels = findTestSubject(wrapper, 'dashboardPanel');
    // panel-b is y=0 (sorted first), panel-a is y=10 (sorted second)
    const panelB = panels.at(0);
    const panelA = panels.at(1);

    expect(panelB.hasClass('dshDashboardGrid__item--expanded')).toBe(true);
    expect(panelB.hasClass('dshDashboardGrid__item--hidden')).toBe(false);
    expect(panelA.hasClass('dshDashboardGrid__item--hidden')).toBe(true);
    expect(panelA.hasClass('dshDashboardGrid__item--expanded')).toBe(false);

    wrapper.unmount();
  });

  it('applies no expand/hide classes when expandedPanelId does not match any member', () => {
    const wrapper = mount(
      <DashboardSectionGrid {...getDefaultProps({ expandedPanelId: 'some-other-panel' })} />
    );

    const panels = findTestSubject(wrapper, 'dashboardPanel');
    panels.forEach((panel) => {
      expect(panel.getDOMNode().className).not.toContain('dshDashboardGrid__item--expanded');
      expect(panel.getDOMNode().className).not.toContain('dshDashboardGrid__item--hidden');
    });

    wrapper.unmount();
  });

  it('applies no expand/hide classes when expandedPanelId is undefined', () => {
    const wrapper = mount(
      <DashboardSectionGrid {...getDefaultProps({ expandedPanelId: undefined })} />
    );

    const panels = findTestSubject(wrapper, 'dashboardPanel');
    panels.forEach((panel) => {
      expect(panel.getDOMNode().className).not.toContain('dshDashboardGrid__item--expanded');
      expect(panel.getDOMNode().className).not.toContain('dshDashboardGrid__item--hidden');
    });

    wrapper.unmount();
  });

  // -- data-test-subj on root -----------------------------------------------

  it('renders with correct data-test-subj on root', () => {
    const wrapper = mount(<DashboardSectionGrid {...getDefaultProps()} />);
    expect(findTestSubject(wrapper, `dashboardSectionGrid-${SECTION_ID}`)).toHaveLength(1);
    wrapper.unmount();
  });
});
