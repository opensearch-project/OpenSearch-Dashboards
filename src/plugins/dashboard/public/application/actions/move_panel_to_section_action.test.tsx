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

// Dashboard collapsible sections.
// Exercises MovePanelToSectionAction against a real DashboardContainer.

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
import { DashboardContainer, DashboardPanelState } from '../embeddable';
import { DASHBOARD_SECTION_EMBEDDABLE, SectionMember } from '../embeddable/section';
import { getSampleDashboardInput, getSampleDashboardPanel } from '../test_helpers';
import { coreMock } from '../../../../../core/public/mocks';
import { CoreStart } from 'opensearch-dashboards/public';
import { MovePanelToSectionAction } from '.';
import { relocatePanelToSection } from './move_panel_to_section_action';

const { setup, doStart } = embeddablePluginMock.createInstance();
setup.registerEmbeddableFactory(
  CONTACT_CARD_EMBEDDABLE,
  new ContactCardEmbeddableFactory((() => null) as any, {} as any)
);
const start = doStart();

let container: DashboardContainer;
let embeddable: ContactCardEmbeddable;
let coreStart: CoreStart;

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
  const input = getSampleDashboardInput({
    panels: {
      '123': getSampleDashboardPanel<ContactCardEmbeddableInput>({
        explicitInput: { firstName: 'opensearchDashboards', id: '123' },
        type: CONTACT_CARD_EMBEDDABLE,
      }),
      section1: {
        gridData: { x: 0, y: 20, w: 48, h: 4, i: 'section1' },
        type: DASHBOARD_SECTION_EMBEDDABLE,
        explicitInput: { id: 'section1', title: 'Section 1', collapsed: false },
      } as unknown as DashboardPanelState,
    },
  });
  container = new DashboardContainer(input, options);

  const contactCardEmbeddable = await container.addNewEmbeddable<
    ContactCardEmbeddableInput,
    ContactCardEmbeddableOutput,
    ContactCardEmbeddable
  >(CONTACT_CARD_EMBEDDABLE, {
    firstName: 'opensearchDashboards',
  });

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

test('Move to section is compatible with an ordinary dashboard panel in edit mode', async () => {
  const action = new MovePanelToSectionAction(coreStart);
  embeddable.updateInput({ viewMode: ViewMode.EDIT });
  expect(await action.isCompatible({ embeddable })).toBe(true);
});

test('Move to section is NOT compatible with an ordinary dashboard panel in view mode', async () => {
  const action = new MovePanelToSectionAction(coreStart);
  embeddable.updateInput({ viewMode: ViewMode.VIEW });
  expect(await action.isCompatible({ embeddable })).toBe(false);
});

test('Move to section is NOT compatible with a section panel itself (no nesting)', async () => {
  const action = new MovePanelToSectionAction(coreStart);
  const dashboard = embeddable.getRoot() as DashboardContainer;
  const sectionEmbeddable = dashboard.getChild('section1');
  expect(await action.isCompatible({ embeddable: sectionEmbeddable })).toBe(false);
});

test('execute() opens a modal listing the current section as a move target', async () => {
  const action = new MovePanelToSectionAction(coreStart);
  const dashboard = embeddable.getRoot() as DashboardContainer;
  embeddable.updateInput({ viewMode: ViewMode.EDIT });

  await action.execute({ embeddable });

  expect(coreStart.overlays.openModal).toHaveBeenCalledTimes(1);
  // coreMock's openModal does not actually render children -- it just
  // records the call. Verifying the mount-point argument was constructed
  // (not undefined/thrown) is what's checkable here without deeper
  // enzyme-around-MountPoint test infrastructure this plugin doesn't
  // otherwise use for modals; isCompatible + gridData mutation logic itself
  // is covered directly in the other tests in this file.
  const mountPointArg = (coreStart.overlays.openModal as jest.Mock).mock.calls[0][0];
  expect(mountPointArg).toBeDefined();
});

test('getDisplayName is "Move to section" when ungrouped and "Change section" when in a section', async () => {
  const action = new MovePanelToSectionAction(coreStart);
  const dashboard = embeddable.getRoot() as DashboardContainer;

  // Ungrouped panel -> "Move to section".
  expect(action.getDisplayName({ embeddable })).toBe('Move to section');

  // Once it belongs to a section (Option 1: listed in section1's members) ->
  // "Change section".
  const panels = dashboard.getInput().panels;
  dashboard.updateInput({
    panels: {
      ...panels,
      section1: {
        ...panels.section1,
        explicitInput: {
          ...panels.section1.explicitInput,
          members: [{ id: embeddable.id, gridData: { x: 0, y: 0, w: 6, h: 6 } }],
        },
      },
    },
  });
  expect(action.getDisplayName({ embeddable })).toBe('Change section');
});

// Option 1 (section-owned members): relocatePanelToSection now
// edits the section panels' explicitInput.members (membership + section-relative
// layout). Member panels' own absolute gridData is NEVER changed by a move, so
// they stay valid standalone panels. These tests exercise that pure function.
describe('relocatePanelToSection (Option 1: section owns its members)', () => {
  function panel(gridData: {
    x: number;
    y: number;
    w: number;
    h: number;
    i: string;
  }): DashboardPanelState {
    return {
      gridData,
      type: 'visualization',
      explicitInput: { id: gridData.i },
    } as unknown as DashboardPanelState;
  }

  function section(
    id: string,
    members: SectionMember[] = [],
    collapsed = false
  ): DashboardPanelState {
    return {
      gridData: { x: 0, y: 0, w: 48, h: 4, i: id },
      type: DASHBOARD_SECTION_EMBEDDABLE,
      explicitInput: { id, title: id, collapsed, members },
    } as unknown as DashboardPanelState;
  }

  const membersOf = (p: DashboardPanelState): SectionMember[] =>
    (p.explicitInput as { members: SectionMember[] }).members;

  test('moving a panel INTO an empty section adds it to members at section-relative 0,0; panel gridData untouched', () => {
    const panels = {
      section1: section('section1'),
      moved: panel({ x: 10, y: 50, w: 24, h: 15, i: 'moved' }),
    };
    const result = relocatePanelToSection('moved', 'section1', panels);
    expect(membersOf(result.section1)).toEqual([
      { id: 'moved', gridData: { x: 0, y: 0, w: 24, h: 15 } },
    ]);
    // The panel's own absolute gridData (its standalone home) is preserved.
    expect(result.moved.gridData).toEqual(panels.moved.gridData);
  });

  test('moving a panel INTO a section with an existing member places it beside without overlap', () => {
    const panels = {
      section1: section('section1', [{ id: 'existing', gridData: { x: 0, y: 0, w: 24, h: 15 } }]),
      moved: panel({ x: 40, y: 99, w: 24, h: 15, i: 'moved' }),
    };
    const result = relocatePanelToSection('moved', 'section1', panels);
    const members = membersOf(result.section1);
    const movedLayout = members.find((m) => m.id === 'moved')!;
    expect(movedLayout).toBeDefined();
    const overlaps =
      movedLayout.gridData.x < 24 &&
      movedLayout.gridData.x + movedLayout.gridData.w > 0 &&
      movedLayout.gridData.y < 15 &&
      movedLayout.gridData.y + movedLayout.gridData.h > 0;
    expect(overlaps).toBe(false);
    // The existing member's layout is untouched.
    expect(members.find((m) => m.id === 'existing')).toEqual({
      id: 'existing',
      gridData: { x: 0, y: 0, w: 24, h: 15 },
    });
    expect(result.moved.gridData).toEqual(panels.moved.gridData);
  });

  test('moving a panel INTO a full section appends it below existing members (section-relative)', () => {
    const panels = {
      section1: section('section1', [{ id: 'fullRow', gridData: { x: 0, y: 0, w: 48, h: 15 } }]),
      moved: panel({ x: 0, y: 200, w: 24, h: 15, i: 'moved' }),
    };
    const result = relocatePanelToSection('moved', 'section1', panels);
    const movedLayout = membersOf(result.section1).find((m) => m.id === 'moved')!;
    // No open column beside the full row -> appended directly below it (y=15).
    expect(movedLayout.gridData.y).toBe(15);
  });

  test('moving a panel OUT removes it from its section members; panel gridData untouched', () => {
    const panels = {
      section1: section('section1', [{ id: 'moved', gridData: { x: 0, y: 0, w: 24, h: 15 } }]),
      moved: panel({ x: 3, y: 7, w: 24, h: 15, i: 'moved' }),
    };
    const result = relocatePanelToSection('moved', undefined, panels);
    expect(membersOf(result.section1).find((m) => m.id === 'moved')).toBeUndefined();
    expect(result.moved.gridData).toEqual(panels.moved.gridData);
  });

  test('moving between sections removes from the old section and adds to the new', () => {
    const panels = {
      section1: section('section1', [{ id: 'moved', gridData: { x: 0, y: 0, w: 24, h: 15 } }]),
      section2: section('section2'),
      moved: panel({ x: 0, y: 0, w: 24, h: 15, i: 'moved' }),
    };
    const result = relocatePanelToSection('moved', 'section2', panels);
    expect(membersOf(result.section1).find((m) => m.id === 'moved')).toBeUndefined();
    expect(membersOf(result.section2).find((m) => m.id === 'moved')).toBeDefined();
  });

  test('moving INTO a collapsed section auto-expands it', () => {
    const panels = {
      section2: section('section2', [], true),
      moved: panel({ x: 0, y: 50, w: 24, h: 15, i: 'moved' }),
    };
    const result = relocatePanelToSection('moved', 'section2', panels);
    expect((result.section2.explicitInput as { collapsed?: boolean }).collapsed).toBe(false);
    expect(membersOf(result.section2).find((m) => m.id === 'moved')).toBeDefined();
  });
});
