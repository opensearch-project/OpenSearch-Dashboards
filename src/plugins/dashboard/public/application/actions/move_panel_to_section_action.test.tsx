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

// Dashboard collapsible sections (v2 layout model).
// Exercises MovePanelToSectionAction ("Move to section") against a real
// DashboardContainer in SectionLayout mode. The move mutation itself
// (moveMemberToSection) is unit-tested in section_layout_utils.test.ts.

import React from 'react';
import { mount } from 'enzyme';
import { act } from 'react-dom/test-utils';

// toMountPoint identity mock: lets us enzyme-mount the React element passed to
// overlays.openModal instead of receiving an opaque MountPoint function.
jest.mock('../../../../opensearch_dashboards_react/public', () => {
  const actual = jest.requireActual('../../../../opensearch_dashboards_react/public');
  return { ...actual, toMountPoint: (el: any) => el };
});

import {
  isErrorEmbeddable,
  IContainer,
  ErrorEmbeddable,
  ViewMode,
} from '../../../../embeddable/public';
import {
  CONTACT_CARD_EMBEDDABLE,
  ContactCardEmbeddableFactory,
  ContactCardEmbeddable,
  ContactCardEmbeddableInput,
  ContactCardEmbeddableOutput,
} from '../../../../embeddable/public/lib/test_samples';
import { embeddablePluginMock } from '../../../../embeddable/public/mocks';
import { DashboardContainer } from '../embeddable';
import { getSampleDashboardInput } from '../test_helpers';
import { coreMock } from '../../../../../core/public/mocks';
import { CoreStart } from 'opensearch-dashboards/public';
import { MovePanelToSectionAction } from '.';

const { setup, doStart } = embeddablePluginMock.createInstance();
setup.registerEmbeddableFactory(
  CONTACT_CARD_EMBEDDABLE,
  new ContactCardEmbeddableFactory((() => null) as any, {} as any)
);
const start = doStart();

let container: DashboardContainer;
let embeddable: ContactCardEmbeddable;
let coreStart: CoreStart;

const twoSectionLayout = {
  type: 'SectionLayout',
  items: [
    { id: 's1', type: 'section', name: 'Section 1', collapsed: false, members: [] },
    { id: 's2', type: 'section', name: 'Section 2', collapsed: false, members: [] },
  ],
};

beforeEach(async () => {
  coreStart = coreMock.createStart();

  const options = {
    ExitFullScreenButton: () => null,
    SavedObjectFinder: () => null,
    application: {} as any,
    embeddable: start,
    chrome: {} as any,
    inspector: {} as any,
    notifications: {} as any,
    overlays: coreStart.overlays,
    savedObjectMetaData: {} as any,
    uiActions: {} as any,
  };
  // Start in a two-section SectionLayout so "Move to section" is meaningful
  // (>1 section to move between).
  const input = getSampleDashboardInput({ panels: {}, layout: twoSectionLayout } as any);
  container = new DashboardContainer(input, options);

  // The new panel is added unclaimed (no funnel); "Move to section" can still
  // move it into either section since >1 section exists.
  const contactCardEmbeddable = await container.addNewEmbeddable<
    ContactCardEmbeddableInput,
    ContactCardEmbeddableOutput,
    ContactCardEmbeddable
  >(CONTACT_CARD_EMBEDDABLE, { firstName: 'opensearchDashboards' });

  if (isErrorEmbeddable(contactCardEmbeddable)) {
    throw new Error('Failed to create embeddable');
  } else {
    embeddable = contactCardEmbeddable;
  }
});

test('Move to section is incompatible with Error Embeddables', async () => {
  const action = new MovePanelToSectionAction(coreStart);
  const errorEmbeddable = new ErrorEmbeddable(
    'Wow what an awful error',
    { id: '404' },
    embeddable.getRoot() as IContainer
  );
  expect(await action.isCompatible({ embeddable: errorEmbeddable })).toBe(false);
});

test('Move to section is compatible with a member panel in edit mode (>1 section)', async () => {
  const action = new MovePanelToSectionAction(coreStart);
  embeddable.updateInput({ viewMode: ViewMode.EDIT });
  expect(await action.isCompatible({ embeddable })).toBe(true);
});

test('Move to section is NOT compatible in view mode', async () => {
  const action = new MovePanelToSectionAction(coreStart);
  embeddable.updateInput({ viewMode: ViewMode.VIEW });
  expect(await action.isCompatible({ embeddable })).toBe(false);
});

test('Move to section is NOT compatible when only one section exists', async () => {
  const action = new MovePanelToSectionAction(coreStart);
  container.updateInput({
    layout: {
      type: 'SectionLayout',
      items: [
        {
          id: 's1',
          type: 'section',
          name: 'Section 1',
          collapsed: false,
          members: [
            { idRef: embeddable.id, type: 'panel', gridData: { x: 0, y: 0, w: 24, h: 15 } },
          ],
        },
      ],
    },
  } as any);
  embeddable.updateInput({ viewMode: ViewMode.EDIT });
  expect(await action.isCompatible({ embeddable })).toBe(false);
});

test('Move to section IS compatible for an unclaimed (Ungrouped) panel even with only one section', async () => {
  // The panel is not a member of any section (it renders in the read-only
  // "Ungrouped" group). The Ungrouped group only exists alongside >=1 explicit
  // section, so that single section is always a valid move target.
  const action = new MovePanelToSectionAction(coreStart);
  container.updateInput({
    layout: {
      type: 'SectionLayout',
      items: [{ id: 's1', type: 'section', name: 'Section 1', collapsed: false, members: [] }],
    },
  } as any);
  embeddable.updateInput({ viewMode: ViewMode.EDIT });
  expect(await action.isCompatible({ embeddable })).toBe(true);
});

test('Move to section is NOT compatible in GridLayout mode', async () => {
  const action = new MovePanelToSectionAction(coreStart);
  container.updateInput({ layout: { type: 'GridLayout', items: [] } } as any);
  embeddable.updateInput({ viewMode: ViewMode.EDIT });
  expect(await action.isCompatible({ embeddable })).toBe(false);
});

test('getDisplayName is "Move to section"', () => {
  const action = new MovePanelToSectionAction(coreStart);
  expect(action.getDisplayName({ embeddable })).toBe('Move to section');
});

test('execute() opens a modal to pick the target section', async () => {
  const action = new MovePanelToSectionAction(coreStart);
  embeddable.updateInput({ viewMode: ViewMode.EDIT });

  await action.execute({ embeddable });

  expect(coreStart.overlays.openModal).toHaveBeenCalledTimes(1);
  const mountPointArg = (coreStart.overlays.openModal as jest.Mock).mock.calls[0][0];
  expect(mountPointArg).toBeDefined();
});

// ---------------------------------------------------------------------------
// New tests: execute() error paths, getIconType, and modal interaction
// ---------------------------------------------------------------------------

test('getIconType returns "folderOpen"', () => {
  const action = new MovePanelToSectionAction(coreStart);
  expect(action.getIconType()).toBe('folderOpen');
});

test('getDisplayName throws IncompatibleActionError for a non-dashboard embeddable', () => {
  const action = new MovePanelToSectionAction(coreStart);
  const orphan = {
    getRoot: () => ({ isContainer: false, type: 'not_dashboard' }),
  } as any;
  expect(() => action.getDisplayName({ embeddable: orphan })).toThrow();
});

test('execute() throws IncompatibleActionError for a non-dashboard embeddable', async () => {
  const action = new MovePanelToSectionAction(coreStart);
  const orphan = {
    getRoot: () => ({ isContainer: false, type: 'not_dashboard' }),
  } as any;
  await expect(action.execute({ embeddable: orphan })).rejects.toThrow();
});

test('execute() throws IncompatibleActionError when layout is not SectionLayout', async () => {
  const action = new MovePanelToSectionAction(coreStart);
  container.updateInput({ layout: { type: 'GridLayout', items: [] } } as any);
  await expect(action.execute({ embeddable })).rejects.toThrow();
});

// ---------------------------------------------------------------------------
// Modal content and interaction tests (toMountPoint identity mock)
// ---------------------------------------------------------------------------

describe('MoveToSectionModal (captured via identity mount)', () => {
  let closeFn: jest.Mock;

  /** Place the embeddable into s1 and execute the action; returns the mounted modal. */
  async function openModalAndMount() {
    // Place embeddable into s1 so it has a current owning section.
    container.updateInput({
      layout: {
        type: 'SectionLayout',
        items: [
          {
            id: 's1',
            type: 'section',
            name: 'Section 1',
            collapsed: false,
            members: [
              {
                idRef: embeddable.id,
                type: 'panel',
                gridData: { x: 0, y: 0, w: 24, h: 15 },
              },
            ],
          },
          { id: 's2', type: 'section', name: 'Section 2', collapsed: true, members: [] },
        ],
      },
    } as any);

    closeFn = jest.fn();
    const openModal = jest.fn().mockReturnValue({ close: closeFn });
    const core = { ...coreStart, overlays: { ...coreStart.overlays, openModal } } as any;

    const action = new MovePanelToSectionAction(core);
    await action.execute({ embeddable });

    // toMountPoint is identity, so the first arg IS the React element.
    const capturedElement: React.ReactElement = openModal.mock.calls[0][0];
    return { wrapper: mount(capturedElement), openModal };
  }

  test('modal renders the header title "Move to section"', async () => {
    const { wrapper } = await openModalAndMount();
    const title = wrapper.find('EuiModalHeaderTitle');
    expect(title.text()).toBe('Move to section');
  });

  test('modal renders a radio option for each section', async () => {
    const { wrapper } = await openModalAndMount();
    const radioGroup = wrapper.find('EuiRadioGroup');
    expect(radioGroup.exists()).toBe(true);
    const options = radioGroup.prop('options') as Array<{ id: string; label: string }>;
    expect(options).toHaveLength(2);
    expect(options[0]).toEqual({ id: 's1', label: 'Section 1' });
    expect(options[1]).toEqual({ id: 's2', label: 'Section 2' });
  });

  test('modal pre-selects the current owning section', async () => {
    const { wrapper } = await openModalAndMount();
    const radioGroup = wrapper.find('EuiRadioGroup');
    expect(radioGroup.prop('idSelected')).toBe('s1');
  });

  test('Cancel button closes the modal without moving', async () => {
    const { wrapper } = await openModalAndMount();
    const cancelBtn = wrapper.find('EuiButtonEmpty');
    cancelBtn.simulate('click');
    expect(closeFn).toHaveBeenCalledTimes(1);
    // Layout should be unchanged (panel still in s1).
    const layout = container.getInput().layout as any;
    const s1 = layout.items.find((s: any) => s.id === 's1');
    expect(s1.members.some((m: any) => m.idRef === embeddable.id)).toBe(true);
  });

  test('Confirm with a different section moves the panel and closes the modal', async () => {
    const { wrapper } = await openModalAndMount();

    // Select s2 via the radio group's onChange callback inside act() to flush
    // React hooks state.
    act(() => {
      (wrapper.find('EuiRadioGroup').prop('onChange') as Function)('s2');
    });
    wrapper.update();

    // Click "Move" button.
    act(() => {
      (wrapper.find('EuiButton[fill=true]').prop('onClick') as Function)();
    });
    wrapper.update();

    expect(closeFn).toHaveBeenCalledTimes(1);

    // Verify the embeddable moved from s1 to s2.
    const layout = container.getInput().layout as any;
    const s1 = layout.items.find((s: any) => s.id === 's1');
    const s2 = layout.items.find((s: any) => s.id === 's2');
    expect(s1.members.some((m: any) => m.idRef === embeddable.id)).toBe(false);
    expect(s2.members.some((m: any) => m.idRef === embeddable.id)).toBe(true);
  });

  test('Confirm with the same section (no-op) closes the modal without mutating layout', async () => {
    const { wrapper } = await openModalAndMount();

    // Radio stays on s1 (default). Click Move via onClick prop.
    const moveBtn = wrapper.find('EuiButton[fill=true]');
    (moveBtn.prop('onClick') as Function)();

    expect(closeFn).toHaveBeenCalledTimes(1);
    // Panel should still be in s1.
    const layout = container.getInput().layout as any;
    const s1 = layout.items.find((s: any) => s.id === 's1');
    expect(s1.members.some((m: any) => m.idRef === embeddable.id)).toBe(true);
  });

  test('Moving to a collapsed section auto-expands it', async () => {
    const { wrapper } = await openModalAndMount();

    // s2 starts collapsed.
    const layoutBefore = container.getInput().layout as any;
    expect(layoutBefore.items.find((s: any) => s.id === 's2').collapsed).toBe(true);

    // Select s2 and click Move inside act() to flush hooks state.
    act(() => {
      (wrapper.find('EuiRadioGroup').prop('onChange') as Function)('s2');
    });
    wrapper.update();
    act(() => {
      (wrapper.find('EuiButton[fill=true]').prop('onClick') as Function)();
    });

    // s2 should now be expanded (collapsed: false).
    const layoutAfter = container.getInput().layout as any;
    expect(layoutAfter.items.find((s: any) => s.id === 's2').collapsed).toBe(false);
  });
});
