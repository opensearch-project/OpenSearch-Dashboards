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

import { isErrorEmbeddable, IContainer, ErrorEmbeddable } from '../../../../embeddable/public';
import {
  CONTACT_CARD_EMBEDDABLE,
  ContactCardEmbeddableFactory,
  ContactCardEmbeddable,
  ContactCardEmbeddableInput,
  ContactCardEmbeddableOutput,
} from '../../../../embeddable/public/lib/test_samples';
import { embeddablePluginMock } from '../../../../embeddable/public/mocks';
import { DashboardContainer, DashboardPanelState } from '../embeddable';
import { getSampleDashboardInput, getSampleDashboardPanel } from '../test_helpers';
import { coreMock } from '../../../../../core/public/mocks';
import { CoreStart } from 'opensearch-dashboards/public';
import { ClonePanelAction } from '.';

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
  coreStart.savedObjects.client = {
    ...coreStart.savedObjects.client,
    get: jest.fn().mockImplementation(() => ({ attributes: { title: 'Holy moly' } })),
    find: jest.fn().mockImplementation(() => ({ total: 15 })),
    create: jest.fn().mockImplementation(() => ({ id: 'brandNewSavedObject' })),
  };

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

test('Clone is incompatible with Error Embeddables', async () => {
  const action = new ClonePanelAction(coreStart);
  const errorEmbeddable = new ErrorEmbeddable(
    'Wow what an awful error',
    { id: ' 404' },
    embeddable.getRoot() as IContainer
  );
  expect(await action.isCompatible({ embeddable: errorEmbeddable })).toBe(false);
});

test('Clone adds a new embeddable', async () => {
  const dashboard = embeddable.getRoot() as IContainer;
  const originalPanelCount = Object.keys(dashboard.getInput().panels).length;
  const originalPanelKeySet = new Set(Object.keys(dashboard.getInput().panels));
  const action = new ClonePanelAction(coreStart);
  await action.execute({ embeddable });
  expect(Object.keys(container.getInput().panels).length).toEqual(originalPanelCount + 1);
  const newPanelId = Object.keys(container.getInput().panels).find(
    (key) => !originalPanelKeySet.has(key)
  );
  expect(newPanelId).toBeDefined();
  const newPanel = container.getInput().panels[newPanelId!];
  expect(newPanel.type).toEqual(embeddable.type);
});

test('Clones an embeddable without a saved object ID', async () => {
  const dashboard = embeddable.getRoot() as IContainer;
  const panel = dashboard.getInput().panels[embeddable.id] as DashboardPanelState;
  const action = new ClonePanelAction(coreStart);
  // @ts-ignore
  const newPanel = await action.cloneEmbeddable(panel, embeddable.type);
  expect(newPanel.type).toEqual(embeddable.type);
});

test('Clones an embeddable with a saved object ID', async () => {
  const dashboard = embeddable.getRoot() as IContainer;
  const panel = dashboard.getInput().panels[embeddable.id] as DashboardPanelState;
  panel.explicitInput.savedObjectId = 'holySavedObjectBatman';
  const action = new ClonePanelAction(coreStart);
  // @ts-ignore
  const newPanel = await action.cloneEmbeddable(panel, embeddable.type);
  expect(coreStart.savedObjects.client.get).toHaveBeenCalledTimes(1);
  expect(coreStart.savedObjects.client.find).toHaveBeenCalledTimes(1);
  expect(coreStart.savedObjects.client.create).toHaveBeenCalledTimes(1);
  expect(newPanel.type).toEqual(embeddable.type);
});

test('Gets a unique title ', async () => {
  coreStart.savedObjects.client.find = jest.fn().mockImplementation(({ search }) => {
    if (search === '"testFirstTitle"') return { total: 1 };
    else if (search === '"testSecondTitle"') return { total: 41 };
    else if (search === '"testThirdTitle"') return { total: 90 };
  });
  const action = new ClonePanelAction(coreStart);
  // @ts-ignore
  expect(await action.getUniqueTitle('testFirstTitle', embeddable.type)).toEqual(
    'testFirstTitle (copy)'
  );
  // @ts-ignore
  expect(await action.getUniqueTitle('testSecondTitle (copy 39)', embeddable.type)).toEqual(
    'testSecondTitle (copy 40)'
  );
  // @ts-ignore
  expect(await action.getUniqueTitle('testSecondTitle (copy 20)', embeddable.type)).toEqual(
    'testSecondTitle (copy 40)'
  );
  // @ts-ignore
  expect(await action.getUniqueTitle('testThirdTitle', embeddable.type)).toEqual(
    'testThirdTitle (copy 89)'
  );
  // @ts-ignore
  expect(await action.getUniqueTitle('testThirdTitle (copy 10000)', embeddable.type)).toEqual(
    'testThirdTitle (copy 89)'
  );
});

test('Cloning a section member (flag on) drops the clone into the same section', async () => {
  const localCore = coreMock.createStart();
  localCore.savedObjects.client = {
    ...localCore.savedObjects.client,
    get: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
  } as any;

  const options = {
    ExitFullScreenButton: () => null,
    SavedObjectFinder: () => null,
    application: {} as any,
    embeddable: start,
    chrome: {} as any,
    inspector: {} as any,
    notifications: {} as any,
    overlays: localCore.overlays,
    savedObjectMetaData: {} as any,
    uiActions: {} as any,
    // Sections feature on: showPlaceholderUntil self-gates on this.
    allowDashboardSections: true,
  };
  const input = getSampleDashboardInput({
    panels: {
      '123': getSampleDashboardPanel<ContactCardEmbeddableInput>({
        explicitInput: { firstName: 'Neo', id: '123' },
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
          members: [{ idRef: '123', type: 'panel', gridData: { x: 0, y: 0, w: 24, h: 15 } }],
        },
      ],
    },
  } as any);
  const sectioned = new DashboardContainer(input, options as any);
  const child = await sectioned.untilEmbeddableLoaded('123');

  const action = new ClonePanelAction(localCore);
  await action.execute({ embeddable: child as any });
  // Let the async placeholder -> clone replace settle.
  await new Promise((r) => setTimeout(r, 20));

  const panels = sectioned.getInput().panels;
  const newId = Object.keys(panels).find((id) => id !== '123');
  expect(newId).toBeDefined();

  // The clone is a member of the SAME section (not the Ungrouped group), and the
  // original is still there -- the panel's own gridData stays untouched.
  const layout = sectioned.getInput().layout as any;
  const s1 = layout.items.find((s: any) => s.id === 's1');
  const memberIds = s1.members.map((m: any) => m.idRef);
  expect(memberIds).toContain('123');
  expect(memberIds).toContain(newId);
});
