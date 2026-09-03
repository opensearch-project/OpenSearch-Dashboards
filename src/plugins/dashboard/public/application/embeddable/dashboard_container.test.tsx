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

test('ungroupSection repositions members to the section location, then removes only the section', () => {
  const initialInput = getSampleDashboardInput({
    panels: {
      section1: {
        gridData: { x: 0, y: 0, w: 48, h: 4, i: 'section1' },
        type: 'dashboard_section',
        // Option 1: the section owns its members via explicitInput.members.
        explicitInput: {
          id: 'section1',
          title: 'Section 1',
          collapsed: false,
          members: [
            { id: 'm1', gridData: { x: 0, y: 0, w: 6, h: 6 } },
            { id: 'm2', gridData: { x: 6, y: 0, w: 6, h: 6 } },
          ],
        },
      } as any,
      m1: getSampleDashboardPanel<ContactCardEmbeddableInput>({
        explicitInput: { firstName: 'a', id: 'm1' },
        type: CONTACT_CARD_EMBEDDABLE,
      }),
      m2: getSampleDashboardPanel<ContactCardEmbeddableInput>({
        explicitInput: { firstName: 'b', id: 'm2' },
        type: CONTACT_CARD_EMBEDDABLE,
      }),
    },
  });
  // Member panels start at some absolute home; ungroup must reposition them to
  // the section's rendered location (sectionY + HEADER_ROWS + memberY).
  initialInput.panels.m1.gridData = { x: 0, y: 40, w: 6, h: 6, i: 'm1' };
  initialInput.panels.m2.gridData = { x: 6, y: 40, w: 6, h: 6, i: 'm2' };

  const container = new DashboardContainer(initialInput, options);
  // Ungrouping a section converts its members' section-relative layout to
  // absolute at the section's location, then removes the section panel (only).
  container.ungroupSection('section1');

  const panels = container.getInput().panels;
  expect(panels.section1).toBeUndefined();
  expect(panels.m1).toBeDefined();
  expect(panels.m2).toBeDefined();
  // section1 is at y:0, SECTION_HEADER_ROWS=2, so members land at y = 2 + memberY.
  expect(panels.m1.gridData).toEqual({ x: 0, y: 2, w: 6, h: 6, i: 'm1' });
  expect(panels.m2.gridData).toEqual({ x: 6, y: 2, w: 6, h: 6, i: 'm2' });
});

test('removeEmbeddable on a section confirms, then deletes the section AND its members', async () => {
  const openConfirm = jest.fn().mockResolvedValue(true);
  const deleteOptions = { ...options, overlays: { openConfirm } as any };
  const initialInput = getSampleDashboardInput({
    panels: {
      section1: {
        gridData: { x: 0, y: 0, w: 48, h: 4, i: 'section1' },
        type: 'dashboard_section',
        explicitInput: {
          id: 'section1',
          title: 'Section 1',
          collapsed: false,
          members: [
            { id: 'm1', gridData: { x: 0, y: 0, w: 6, h: 6 } },
            { id: 'm2', gridData: { x: 6, y: 0, w: 6, h: 6 } },
          ],
        },
      } as any,
      m1: getSampleDashboardPanel<ContactCardEmbeddableInput>({
        explicitInput: { firstName: 'a', id: 'm1' },
        type: CONTACT_CARD_EMBEDDABLE,
      }),
      m2: getSampleDashboardPanel<ContactCardEmbeddableInput>({
        explicitInput: { firstName: 'b', id: 'm2' },
        type: CONTACT_CARD_EMBEDDABLE,
      }),
    },
  });

  const container = new DashboardContainer(initialInput, deleteOptions);
  container.removeEmbeddable('section1');
  // openConfirm is async (fire-and-forget from the sync removeEmbeddable);
  // let the microtasks settle before asserting.
  await new Promise((resolve) => setTimeout(resolve, 0));

  expect(openConfirm).toHaveBeenCalledTimes(1);
  const panels = container.getInput().panels;
  // Section AND both members are gone.
  expect(panels.section1).toBeUndefined();
  expect(panels.m1).toBeUndefined();
  expect(panels.m2).toBeUndefined();
});

test('removeEmbeddable on a section does nothing when the delete confirm is cancelled', async () => {
  const openConfirm = jest.fn().mockResolvedValue(false);
  const deleteOptions = { ...options, overlays: { openConfirm } as any };
  const initialInput = getSampleDashboardInput({
    panels: {
      section1: {
        gridData: { x: 0, y: 0, w: 48, h: 4, i: 'section1' },
        type: 'dashboard_section',
        explicitInput: {
          id: 'section1',
          title: 'Section 1',
          collapsed: false,
          members: [{ id: 'm1', gridData: { x: 0, y: 0, w: 6, h: 6 } }],
        },
      } as any,
      m1: getSampleDashboardPanel<ContactCardEmbeddableInput>({
        explicitInput: { firstName: 'a', id: 'm1' },
        type: CONTACT_CARD_EMBEDDABLE,
      }),
    },
  });

  const container = new DashboardContainer(initialInput, deleteOptions);
  container.removeEmbeddable('section1');
  await new Promise((resolve) => setTimeout(resolve, 0));

  expect(openConfirm).toHaveBeenCalledTimes(1);
  const panels = container.getInput().panels;
  // Nothing removed.
  expect(panels.section1).toBeDefined();
  expect(panels.m1).toBeDefined();
});
