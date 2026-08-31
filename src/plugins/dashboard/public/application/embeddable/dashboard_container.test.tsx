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

import { I18nProvider } from '@osd/i18n/react';
import { nextTick } from 'test_utils/enzyme_helpers';
import {
  CONTEXT_MENU_TRIGGER,
  EmbeddablePanel,
  isErrorEmbeddable,
  ViewMode,
} from '../../../../embeddable/public';
import {
  CONTACT_CARD_EMBEDDABLE,
  ContactCardEmbeddableFactory,
  ContactCardEmbeddableInput,
  ContactCardEmbeddable,
  ContactCardEmbeddableOutput,
  createEditModeAction,
} from '../../../../embeddable/public/lib/test_samples';
import { embeddablePluginMock } from 'src/plugins/embeddable/public/mocks';
import { DashboardContainer, DashboardContainerOptions } from './dashboard_container';
import { getSampleDashboardInput, getSampleDashboardPanel } from '../test_helpers';
import { inspectorPluginMock } from 'src/plugins/inspector/public/mocks';
import { uiActionsPluginMock } from 'src/plugins/ui_actions/public/mocks';
import { applicationServiceMock } from '../../../../../core/public/mocks';

import { OpenSearchDashboardsContextProvider } from 'src/plugins/opensearch_dashboards_react/public';
import { mount } from 'enzyme';
import { findTestSubject } from 'test_utils/helpers';

const options: DashboardContainerOptions = {
  application: {} as any,
  embeddable: {} as any,
  chrome: {} as any,
  notifications: {} as any,
  overlays: {} as any,
  inspector: {} as any,
  SavedObjectFinder: () => null,
  ExitFullScreenButton: () => null,
  uiActions: {} as any,
};

beforeEach(() => {
  const { setup, doStart } = embeddablePluginMock.createInstance();
  setup.registerEmbeddableFactory(
    CONTACT_CARD_EMBEDDABLE,
    new ContactCardEmbeddableFactory((() => null) as any, {} as any)
  );
  options.embeddable = doStart();
});

class TestDashboardContainer extends DashboardContainer {
  public getInheritedInputForTest(id: string) {
    return this.getInheritedInput(id);
  }
}

test('DashboardContainer inherits the shared crosshair setting', () => {
  const disabledContainer = new TestDashboardContainer(
    getSampleDashboardInput({ id: 'dashboard-123', useSharedCrosshair: false }),
    options
  );
  const enabledContainer = new TestDashboardContainer(
    getSampleDashboardInput({ id: 'dashboard-123', useSharedCrosshair: true }),
    options
  );

  expect(disabledContainer.getInheritedInputForTest('panel-1').useSharedCrosshair).toBe(false);
  expect(enabledContainer.getInheritedInputForTest('panel-1').useSharedCrosshair).toBe(true);

  disabledContainer.destroy();
  enabledContainer.destroy();
});

test('DashboardContainer initializes embeddables', (done) => {
  const initialInput = getSampleDashboardInput({
    panels: {
      '123': getSampleDashboardPanel<ContactCardEmbeddableInput>({
        explicitInput: { firstName: 'Sam', id: '123' },
        type: CONTACT_CARD_EMBEDDABLE,
      }),
    },
  });
  const container = new DashboardContainer(initialInput, options);

  const subscription = container.getOutput$().subscribe((output) => {
    if (container.getOutput().embeddableLoaded['123']) {
      const embeddable = container.getChild<ContactCardEmbeddable>('123');
      expect(embeddable).toBeDefined();
      expect(embeddable.id).toBe('123');
      done();
    }
  });

  if (container.getOutput().embeddableLoaded['123']) {
    const embeddable = container.getChild<ContactCardEmbeddable>('123');
    expect(embeddable).toBeDefined();
    expect(embeddable.id).toBe('123');
    subscription.unsubscribe();
    done();
  }
});

test('DashboardContainer.addNewEmbeddable', async () => {
  const container = new DashboardContainer(getSampleDashboardInput(), options);
  const embeddable = await container.addNewEmbeddable<ContactCardEmbeddableInput>(
    CONTACT_CARD_EMBEDDABLE,
    {
      firstName: 'opensearchDashboards',
    }
  );
  expect(embeddable).toBeDefined();

  if (!isErrorEmbeddable(embeddable)) {
    expect(embeddable.getInput().firstName).toBe('opensearchDashboards');
  } else {
    expect(false).toBe(true);
  }

  const embeddableInContainer = container.getChild<ContactCardEmbeddable>(embeddable.id);
  expect(embeddableInContainer).toBeDefined();
  expect(embeddableInContainer.id).toBe(embeddable.id);
});

test('Container view mode change propagates to existing children', async () => {
  const initialInput = getSampleDashboardInput({
    panels: {
      '123': getSampleDashboardPanel<ContactCardEmbeddableInput>({
        explicitInput: { firstName: 'Sam', id: '123' },
        type: CONTACT_CARD_EMBEDDABLE,
      }),
    },
  });
  const container = new DashboardContainer(initialInput, options);
  await nextTick();

  const embeddable = await container.getChild('123');
  expect(embeddable.getInput().viewMode).toBe(ViewMode.VIEW);
  container.updateInput({ viewMode: ViewMode.EDIT });
  expect(embeddable.getInput().viewMode).toBe(ViewMode.EDIT);
});

test('Container view mode change propagates to new children', async () => {
  const container = new DashboardContainer(getSampleDashboardInput(), options);
  const embeddable = await container.addNewEmbeddable<
    ContactCardEmbeddableInput,
    ContactCardEmbeddableOutput,
    ContactCardEmbeddable
  >(CONTACT_CARD_EMBEDDABLE, {
    firstName: 'Bob',
  });

  expect(embeddable.getInput().viewMode).toBe(ViewMode.VIEW);

  container.updateInput({ viewMode: ViewMode.EDIT });

  expect(embeddable.getInput().viewMode).toBe(ViewMode.EDIT);
});

test('DashboardContainer in edit mode shows edit mode actions', async () => {
  const inspector = inspectorPluginMock.createStartContract();
  const { setup, doStart } = embeddablePluginMock.createInstance();
  const uiActionsSetup = uiActionsPluginMock.createSetupContract();

  const editModeAction = createEditModeAction();
  // @ts-expect-error TS2345 TODO(ts-error): fixme
  uiActionsSetup.registerAction(editModeAction);
  uiActionsSetup.addTriggerAction(CONTEXT_MENU_TRIGGER, editModeAction);
  setup.registerEmbeddableFactory(
    CONTACT_CARD_EMBEDDABLE,
    new ContactCardEmbeddableFactory((() => null) as any, {} as any)
  );

  const start = doStart();

  const initialInput = getSampleDashboardInput({ viewMode: ViewMode.VIEW });
  const containerOptions: DashboardContainerOptions = {
    application: applicationServiceMock.createStartContract(),
    embeddable: start,
    chrome: {} as any,
    notifications: {} as any,
    overlays: {} as any,
    inspector: {} as any,
    SavedObjectFinder: () => null,
    ExitFullScreenButton: () => null,
    uiActions: {} as any,
  };
  const container = new DashboardContainer(initialInput, containerOptions);

  const embeddable = await container.addNewEmbeddable<
    ContactCardEmbeddableInput,
    ContactCardEmbeddableOutput,
    ContactCardEmbeddable
  >(CONTACT_CARD_EMBEDDABLE, {
    firstName: 'Bob',
  });

  const component = mount(
    <I18nProvider>
      <OpenSearchDashboardsContextProvider services={containerOptions}>
        <EmbeddablePanel
          embeddable={embeddable}
          getActions={() => Promise.resolve([])}
          getAllEmbeddableFactories={(() => []) as any}
          getEmbeddableFactory={(() => null) as any}
          notifications={{} as any}
          application={containerOptions.application}
          overlays={{} as any}
          inspector={inspector}
          SavedObjectFinder={() => null}
        />
      </OpenSearchDashboardsContextProvider>
    </I18nProvider>
  );

  const button = findTestSubject(component, 'embeddablePanelToggleMenuIcon');

  expect(button.length).toBe(1);
  findTestSubject(component, 'embeddablePanelToggleMenuIcon').simulate('click');

  expect(findTestSubject(component, `embeddablePanelContextMenuOpen`).length).toBe(1);

  const editAction = findTestSubject(component, `embeddablePanelAction-${editModeAction.id}`);

  expect(editAction.length).toBe(0);

  container.updateInput({ viewMode: ViewMode.EDIT });
  await nextTick();
  component.update();
  findTestSubject(component, 'embeddablePanelToggleMenuIcon').simulate('click');
  await nextTick();
  component.update();
  expect(findTestSubject(component, 'embeddablePanelContextMenuOpen').length).toBe(0);
  findTestSubject(component, 'embeddablePanelToggleMenuIcon').simulate('click');
  await nextTick();
  component.update();
  expect(findTestSubject(component, 'embeddablePanelContextMenuOpen').length).toBe(1);

  await nextTick();
  component.update();

  // TODO: Address this.
  // const action = findTestSubject(component, `embeddablePanelAction-${editModeAction.id}`);
  // expect(action.length).toBe(1);
});

test('removeEmbeddable prunes the panel from its section in SectionLayout mode', () => {
  const initialInput = getSampleDashboardInput({
    panels: {
      m1: getSampleDashboardPanel<ContactCardEmbeddableInput>({
        explicitInput: { firstName: 'a', id: 'm1' },
        type: CONTACT_CARD_EMBEDDABLE,
      }),
      m2: getSampleDashboardPanel<ContactCardEmbeddableInput>({
        explicitInput: { firstName: 'b', id: 'm2' },
        type: CONTACT_CARD_EMBEDDABLE,
      }),
    },
    layout: {
      type: 'SectionLayout',
      items: [
        {
          id: 's1',
          type: 'section',
          name: 'Section 1',
          collapsed: false,
          members: [
            { idRef: 'm1', type: 'panel', gridData: { x: 0, y: 0, w: 6, h: 6 } },
            { idRef: 'm2', type: 'panel', gridData: { x: 6, y: 0, w: 6, h: 6 } },
          ],
        },
      ],
    },
  } as any);

  const container = new DashboardContainer(initialInput, options);
  container.removeEmbeddable('m1');

  const input = container.getInput();
  expect(input.panels.m1).toBeUndefined();
  expect((input.layout as any).items[0].members.map((m: any) => m.idRef)).toEqual(['m2']);
});

test('addNewEmbeddable no longer funnels into a section; the panel stays unclaimed', async () => {
  const initialInput = getSampleDashboardInput({
    panels: {},
    layout: {
      type: 'SectionLayout',
      items: [
        { id: 's1', type: 'section', name: 'Section 1', collapsed: false, members: [] },
        { id: 's2', type: 'section', name: 'Section 2', collapsed: true, members: [] },
      ],
    },
  } as any);

  const container = new DashboardContainer(initialInput, options);
  const embeddable = await container.addNewEmbeddable<ContactCardEmbeddableInput>(
    CONTACT_CARD_EMBEDDABLE,
    { firstName: 'z' }
  );

  const input = container.getInput();
  // No section claims the new panel -- it renders in the virtual "Ungrouped"
  // group instead (computed at render time from unclaimed panels).
  (input.layout as any).items.forEach((section: any) => expect(section.members).toEqual([]));
  expect(input.panels[embeddable.id]).toBeDefined();
});

// --- Coverage expansion tests ---

test('removeEmbeddable in GridLayout (no layout) does not touch layout', () => {
  const initialInput = getSampleDashboardInput({
    panels: {
      p1: getSampleDashboardPanel<ContactCardEmbeddableInput>({
        explicitInput: { firstName: 'a', id: 'p1' },
        type: CONTACT_CARD_EMBEDDABLE,
      }),
    },
    // No layout property → GridLayout mode
  });

  const container = new DashboardContainer(initialInput, options);
  container.removeEmbeddable('p1');

  const input = container.getInput();
  expect(input.panels.p1).toBeUndefined();
  expect(input.layout).toBeUndefined();
  container.destroy();
});

test('removeEmbeddable in SectionLayout where panel is not in any section is a no-op for layout', () => {
  const initialInput = getSampleDashboardInput({
    panels: {
      orphan: getSampleDashboardPanel<ContactCardEmbeddableInput>({
        explicitInput: { firstName: 'a', id: 'orphan' },
        type: CONTACT_CARD_EMBEDDABLE,
      }),
    },
    layout: {
      type: 'SectionLayout',
      items: [
        {
          id: 's1',
          type: 'section',
          name: 'Section 1',
          collapsed: false,
          members: [],
        },
      ],
    },
  } as any);

  const container = new DashboardContainer(initialInput, options);
  const layoutBefore = container.getInput().layout;
  container.removeEmbeddable('orphan');

  const input = container.getInput();
  expect(input.panels.orphan).toBeUndefined();
  // Layout items should be unchanged since the panel was not a member of any section
  expect(input.layout).toEqual(layoutBefore);
  container.destroy();
});

test('replacePanel removes old panel and adds new one with correct gridData', () => {
  const initialInput = getSampleDashboardInput({
    panels: {
      old1: getSampleDashboardPanel<ContactCardEmbeddableInput>({
        explicitInput: { firstName: 'Old', id: 'old1' },
        type: CONTACT_CARD_EMBEDDABLE,
      }),
    },
  });

  const container = new DashboardContainer(initialInput, options);

  container.replacePanel(initialInput.panels.old1, {
    type: CONTACT_CARD_EMBEDDABLE,
    explicitInput: { id: 'new1', firstName: 'New' } as any,
  });

  const input = container.getInput();
  expect(input.panels.old1).toBeUndefined();
  expect(input.panels.new1).toBeDefined();
  expect(input.panels.new1.gridData.i).toBe('new1');
  expect(input.panels.new1.explicitInput.id).toBe('new1');
  expect(input.lastReloadRequestTime).toBeDefined();
  container.destroy();
});

test('replacePanel generates a uuid when newPanelState has no explicit id', () => {
  const initialInput = getSampleDashboardInput({
    panels: {
      old2: getSampleDashboardPanel<ContactCardEmbeddableInput>({
        explicitInput: { firstName: 'Old', id: 'old2' },
        type: CONTACT_CARD_EMBEDDABLE,
      }),
    },
  });

  const container = new DashboardContainer(initialInput, options);

  container.replacePanel(initialInput.panels.old2, {
    type: CONTACT_CARD_EMBEDDABLE,
    explicitInput: { firstName: 'NoId' } as any,
  });

  const input = container.getInput();
  expect(input.panels.old2).toBeUndefined();
  const newPanelIds = Object.keys(input.panels);
  expect(newPanelIds.length).toBe(1);
  const newPanel = input.panels[newPanelIds[0]];
  expect(newPanel.gridData.i).toBe(newPanelIds[0]);
  expect(newPanel.explicitInput.id).toBe(newPanelIds[0]);
  container.destroy();
});

test('replacePanel transfers section membership from the replaced panel to the replacement', () => {
  const initialInput = getSampleDashboardInput({
    panels: {
      old1: getSampleDashboardPanel<ContactCardEmbeddableInput>({
        explicitInput: { firstName: 'Old', id: 'old1' },
        type: CONTACT_CARD_EMBEDDABLE,
      }),
    },
    layout: {
      type: 'SectionLayout',
      items: [
        {
          id: 's1',
          type: 'section',
          name: 'Section 1',
          collapsed: false,
          members: [{ idRef: 'old1', type: 'panel', gridData: { x: 0, y: 0, w: 24, h: 15 } }],
        },
      ],
    },
  } as any);

  const container = new DashboardContainer(initialInput, options);

  container.replacePanel(initialInput.panels.old1, {
    type: CONTACT_CARD_EMBEDDABLE,
    explicitInput: { id: 'new1', firstName: 'New' } as any,
  });

  const layout = container.getInput().layout as any;
  const s1 = layout.items.find((s: any) => s.id === 's1');
  const memberIds = s1.members.map((m: any) => m.idRef);
  // The replacement inherits the section slot; the old id is gone (not orphaned
  // in Ungrouped).
  expect(memberIds).toEqual(['new1']);
  expect(container.getInput().panels.new1).toBeDefined();
  expect(container.getInput().panels.old1).toBeUndefined();
  container.destroy();
});

test('replacePanel in GridLayout mode does not add a layout', () => {
  const initialInput = getSampleDashboardInput({
    panels: {
      old1: getSampleDashboardPanel<ContactCardEmbeddableInput>({
        explicitInput: { firstName: 'Old', id: 'old1' },
        type: CONTACT_CARD_EMBEDDABLE,
      }),
    },
  });
  const container = new DashboardContainer(initialInput, options);
  container.replacePanel(initialInput.panels.old1, {
    type: CONTACT_CARD_EMBEDDABLE,
    explicitInput: { id: 'new1', firstName: 'New' } as any,
  });
  // No SectionLayout was introduced by a plain replace.
  expect(container.getInput().layout).toBeUndefined();
  container.destroy();
});

test('addOrUpdateEmbeddable replaces existing panel when id matches', async () => {
  const initialInput = getSampleDashboardInput({
    panels: {
      exist1: getSampleDashboardPanel<ContactCardEmbeddableInput>({
        explicitInput: { firstName: 'Before', id: 'exist1' },
        type: CONTACT_CARD_EMBEDDABLE,
      }),
    },
  });

  const container = new DashboardContainer(initialInput, options);

  await container.addOrUpdateEmbeddable(
    CONTACT_CARD_EMBEDDABLE,
    { firstName: 'After' } as any,
    'exist1'
  );

  const input = container.getInput();
  // The old panel 'exist1' should be replaced (removed) and a new uuid panel added
  expect(input.panels.exist1).toBeUndefined();
  const panelIds = Object.keys(input.panels);
  expect(panelIds.length).toBe(1);
  container.destroy();
});

test('addOrUpdateEmbeddable adds new panel when id does not exist', async () => {
  const container = new DashboardContainer(getSampleDashboardInput(), options);

  await container.addOrUpdateEmbeddable(
    CONTACT_CARD_EMBEDDABLE,
    { firstName: 'Brand New' } as any,
    'nonexistent'
  );

  const panelIds = Object.keys(container.getInput().panels);
  expect(panelIds.length).toBe(1);
  container.destroy();
});

test('addOrUpdateEmbeddable uses explicitInput.id as fallback for matching', async () => {
  const initialInput = getSampleDashboardInput({
    panels: {
      match1: getSampleDashboardPanel<ContactCardEmbeddableInput>({
        explicitInput: { firstName: 'Before', id: 'match1' },
        type: CONTACT_CARD_EMBEDDABLE,
      }),
    },
  });

  const container = new DashboardContainer(initialInput, options);

  // No embeddableId param — uses explicitInput.id to find match
  await container.addOrUpdateEmbeddable(CONTACT_CARD_EMBEDDABLE, {
    id: 'match1',
    firstName: 'Replaced',
  } as any);

  const input = container.getInput();
  // Old match1 removed, new uuid panel created
  expect(input.panels.match1).toBeUndefined();
  expect(Object.keys(input.panels).length).toBe(1);
  container.destroy();
});

test('showPlaceholderUntil adds placeholder then replaces on resolve', async () => {
  const container = new DashboardContainer(getSampleDashboardInput(), options);

  const resolvedState = {
    type: CONTACT_CARD_EMBEDDABLE,
    explicitInput: { id: 'final1', firstName: 'Final' },
  };

  container.showPlaceholderUntil(Promise.resolve(resolvedState));

  // Placeholder should be added immediately
  const panelIds = Object.keys(container.getInput().panels);
  expect(panelIds.length).toBe(1);
  const placeholderId = panelIds[0];
  expect(container.getInput().panels[placeholderId].type).toBe('placeholder');

  // Wait for promise to resolve and panel replacement
  await new Promise((r) => setTimeout(r, 50));

  const input = container.getInput();
  expect(input.panels[placeholderId]).toBeUndefined();
  expect(input.panels.final1).toBeDefined();
  expect(input.panels.final1.type).toBe(CONTACT_CARD_EMBEDDABLE);
  container.destroy();
});

test('getPanelQueries returns empty array when no children have originalQuery', async () => {
  const initialInput = getSampleDashboardInput({
    panels: {
      pq1: getSampleDashboardPanel<ContactCardEmbeddableInput>({
        explicitInput: { firstName: 'X', id: 'pq1' },
        type: CONTACT_CARD_EMBEDDABLE,
      }),
    },
  });
  const container = new DashboardContainer(initialInput, options);
  // Wait for embeddable to load
  await new Promise<void>((resolve) => {
    const sub = container.getOutput$().subscribe((output) => {
      if (output.embeddableLoaded.pq1) {
        sub.unsubscribe();
        resolve();
      }
    });
  });

  const queries = container.getPanelQueries();
  // ContactCardEmbeddable does not have originalQuery
  expect(queries).toEqual([]);
  container.destroy();
});

test('getPanelQueries returns queries from children that have originalQuery', async () => {
  const initialInput = getSampleDashboardInput({
    panels: {
      pq2: getSampleDashboardPanel<ContactCardEmbeddableInput>({
        explicitInput: { firstName: 'Y', id: 'pq2' },
        type: CONTACT_CARD_EMBEDDABLE,
      }),
    },
  });
  const container = new DashboardContainer(initialInput, options);
  await new Promise<void>((resolve) => {
    const sub = container.getOutput$().subscribe((output) => {
      if (output.embeddableLoaded.pq2) {
        sub.unsubscribe();
        resolve();
      }
    });
  });

  // Monkey-patch the child to have an originalQuery
  const child = container.getChild<any>('pq2');
  child.originalQuery = 'SELECT * FROM {{myVar}}';

  const queries = container.getPanelQueries();
  expect(queries).toEqual(['SELECT * FROM {{myVar}}']);
  container.destroy();
});

test('getPanelQueries handles errors gracefully (catch branch)', () => {
  const container = new DashboardContainer(getSampleDashboardInput(), options);

  // Mock getChildIds to return ids that don't have loaded children
  jest.spyOn(container, 'getChildIds').mockReturnValue(['bogus1', 'bogus2']);
  jest.spyOn(container, 'getChild').mockImplementation(() => {
    throw new Error('not loaded');
  });

  const queries = container.getPanelQueries();
  expect(queries).toEqual([]);
  container.destroy();
});

test('destroy cleans up variable subscriptions', () => {
  const container = new DashboardContainer(getSampleDashboardInput(), options);

  // Verify variableService exists
  expect(container.variableService).toBeDefined();

  // Destroy should not throw
  container.destroy();
});

test('constructor initializes with variables when provided', () => {
  const variables = [
    { id: 'var1', name: 'test', type: 'custom' as const, value: 'hello', options: [] },
  ];
  const initialInput = getSampleDashboardInput({ variables } as any);

  const container = new DashboardContainer(initialInput, options);
  // The container should have been created with variables
  expect(container.getInput().variables).toEqual(variables);
  container.destroy();
});

test('initVariableRefreshSubscription refreshes on timeRange change when query variables exist', async () => {
  const variables = [
    { id: 'qv1', name: 'queryVar', type: 'query' as const, value: '', options: [] },
  ];
  const initialInput = getSampleDashboardInput({ variables } as any);

  const container = new DashboardContainer(initialInput, options);

  const refreshSpy = jest.spyOn(container.variableService, 'refreshTimeFilteredVariableOptions');
  jest.spyOn(container.variableService, 'getVariables').mockReturnValue(variables as any);

  // Trigger a timeRange change
  container.updateInput({
    timeRange: { from: 'now-1h', to: 'now' },
  });

  // Allow subscription to fire
  await new Promise((r) => setTimeout(r, 10));

  expect(refreshSpy).toHaveBeenCalled();
  container.destroy();
});

test('initVariableRefreshSubscription refreshes all on reload when query variables exist', async () => {
  const variables = [
    { id: 'qv2', name: 'queryVar2', type: 'query' as const, value: '', options: [] },
  ];
  const initialInput = getSampleDashboardInput({ variables } as any);

  const container = new DashboardContainer(initialInput, options);

  const refreshAllSpy = jest.spyOn(container.variableService, 'refreshAllVariableOptions');
  jest.spyOn(container.variableService, 'getVariables').mockReturnValue(variables as any);

  // Trigger a reload
  container.updateInput({
    lastReloadRequestTime: new Date().getTime(),
  });

  await new Promise((r) => setTimeout(r, 10));

  expect(refreshAllSpy).toHaveBeenCalled();
  container.destroy();
});

test('dashboard id change triggers setDashboardId on variableService', async () => {
  const initialInput = getSampleDashboardInput({ id: 'initial-id' });

  const container = new DashboardContainer(initialInput, options);
  const setIdSpy = jest.spyOn(container.variableService, 'setDashboardId');

  // Update the dashboard id
  container.updateInput({ id: 'new-saved-id' });

  await new Promise((r) => setTimeout(r, 10));

  expect(setIdSpy).toHaveBeenCalledWith('new-saved-id');
  container.destroy();
});

test('reparentPanels recreates the re-parented panel as a fresh instance with its input preserved', async () => {
  const initialInput = getSampleDashboardInput({
    panels: {
      '123': getSampleDashboardPanel<ContactCardEmbeddableInput>({
        explicitInput: { firstName: 'Sam', id: '123' },
        type: CONTACT_CARD_EMBEDDABLE,
      }),
    },
  });
  const container = new DashboardContainer(initialInput, options);
  await new Promise((r) => setTimeout(r, 10));

  const original = container.getChild<ContactCardEmbeddable>('123');
  expect(original).toBeDefined();

  // Move the panel into a section. reparentPanels cycles it through
  // onPanelRemoved (destroy) -> onPanelAdded (recreate), so the container hands
  // back a brand-new instance -- this is what keeps a moved panel from
  // rendering blank without any change to the shared embeddable/container core.
  container.reparentPanels(['123'], {
    type: 'SectionLayout',
    items: [
      {
        id: 's1',
        type: 'section',
        name: 'S1',
        collapsed: false,
        members: [{ idRef: '123', type: 'panel', gridData: { x: 0, y: 0, w: 24, h: 15 } }],
      },
    ],
  } as any);
  await new Promise((r) => setTimeout(r, 10));

  const recreated = container.getChild<ContactCardEmbeddable>('123');
  expect(recreated).toBeDefined();
  // A fresh instance (proves the destroy + recreate cycle ran).
  expect(recreated).not.toBe(original);
  // Input is preserved because it is re-seeded from the untouched panel state.
  expect(recreated.getInput().firstName).toBe('Sam');
  // The final layout landed.
  expect(container.getInput().layout?.type).toBe('SectionLayout');

  container.destroy();
});

test('getStateTransferContainerInfoData round-trips the pending create-section id (flag on)', () => {
  const container = new DashboardContainer(getSampleDashboardInput(), {
    ...options,
    allowDashboardSections: true,
  });

  // Nothing pending -> nothing to round-trip.
  expect(container.getStateTransferContainerInfoData()).toBeUndefined();

  container.setPendingCreateSectionContext('section-1');
  // Emits the opaque context the editor will echo back.
  expect(container.getStateTransferContainerInfoData()).toEqual({ sectionId: 'section-1' });
  // Consumed on read: a second read returns nothing (no stale re-claim).
  expect(container.getStateTransferContainerInfoData()).toBeUndefined();

  container.destroy();
});

test('getStateTransferContainerInfoData is inert when the sections flag is off', () => {
  const container = new DashboardContainer(getSampleDashboardInput(), {
    ...options,
    allowDashboardSections: false,
  });

  container.setPendingCreateSectionContext('section-1');
  expect(container.getStateTransferContainerInfoData()).toBeUndefined();

  container.destroy();
});
