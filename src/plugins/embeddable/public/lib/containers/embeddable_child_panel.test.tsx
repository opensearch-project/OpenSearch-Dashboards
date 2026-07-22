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

import { nextTick } from 'test_utils/enzyme_helpers';
import { EmbeddableChildPanel } from './embeddable_child_panel';
import { CONTACT_CARD_EMBEDDABLE } from '../test_samples/embeddables/contact_card/contact_card_embeddable_factory';
import { SlowContactCardEmbeddableFactory } from '../test_samples/embeddables/contact_card/slow_contact_card_embeddable_factory';
import { HelloWorldContainer } from '../test_samples/embeddables/hello_world_container';
import {
  ContactCardEmbeddableInput,
  ContactCardEmbeddableOutput,
  ContactCardEmbeddable,
} from '../test_samples/embeddables/contact_card/contact_card_embeddable';
import { inspectorPluginMock } from '../../../../inspector/public/mocks';
import { mount } from 'enzyme';
import { embeddablePluginMock, createEmbeddablePanelMock } from '../../mocks';

let intersectionCallback: (entries: Array<{ isIntersecting: boolean }>) => void;
let mockDisconnect: jest.Mock;
const originalIO = window.IntersectionObserver;

beforeEach(() => {
  mockDisconnect = jest.fn();
  const MockIntersectionObserver = jest.fn().mockImplementation((callback) => {
    intersectionCallback = callback;
    return {
      observe: jest.fn(),
      disconnect: mockDisconnect,
      unobserve: jest.fn(),
    };
  });
  window.IntersectionObserver = MockIntersectionObserver as any;
});

afterEach(() => {
  window.IntersectionObserver = originalIO;
});

test('EmbeddableChildPanel renders an embeddable when it is done loading and visible', async () => {
  const inspector = inspectorPluginMock.createStartContract();
  const { setup, doStart } = embeddablePluginMock.createInstance();
  setup.registerEmbeddableFactory(
    CONTACT_CARD_EMBEDDABLE,
    new SlowContactCardEmbeddableFactory({ execAction: (() => null) as any })
  );
  const start = doStart();
  const getEmbeddableFactory = start.getEmbeddableFactory;

  const container = new HelloWorldContainer({ id: 'hello', panels: {} }, {
    getEmbeddableFactory,
  } as any);
  const newEmbeddable = await container.addNewEmbeddable<
    ContactCardEmbeddableInput,
    ContactCardEmbeddableOutput,
    ContactCardEmbeddable
  >(CONTACT_CARD_EMBEDDABLE, {
    firstName: 'Theon',
    lastName: 'Greyjoy',
    id: '123',
  });

  expect(newEmbeddable.id).toBeDefined();

  const testPanel = createEmbeddablePanelMock({
    getAllEmbeddableFactories: start.getEmbeddableFactories,
    getEmbeddableFactory,
    inspector,
  });

  const component = mount(
    <EmbeddableChildPanel
      container={container}
      embeddableId={newEmbeddable.id}
      PanelComponent={testPanel}
    />
  );

  await nextTick();
  component.update();

  // Simulate panel entering viewport
  intersectionCallback([{ isIntersecting: true }]);
  await nextTick();
  component.update();

  expect(
    component
      .getDOMNode()
      .querySelectorAll('[data-test-subj="embeddablePanelHeading-HelloTheonGreyjoy"]').length
  ).toBe(1);
});

test('EmbeddableChildPanel does not mount PanelComponent when not visible', async () => {
  const inspector = inspectorPluginMock.createStartContract();
  const { setup, doStart } = embeddablePluginMock.createInstance();
  setup.registerEmbeddableFactory(
    CONTACT_CARD_EMBEDDABLE,
    new SlowContactCardEmbeddableFactory({ execAction: (() => null) as any })
  );
  const start = doStart();
  const getEmbeddableFactory = start.getEmbeddableFactory;

  const container = new HelloWorldContainer({ id: 'hello', panels: {} }, {
    getEmbeddableFactory,
  } as any);
  await container.addNewEmbeddable<
    ContactCardEmbeddableInput,
    ContactCardEmbeddableOutput,
    ContactCardEmbeddable
  >(CONTACT_CARD_EMBEDDABLE, {
    firstName: 'Theon',
    lastName: 'Greyjoy',
    id: '123',
  });

  const testPanel = createEmbeddablePanelMock({
    getAllEmbeddableFactories: start.getEmbeddableFactories,
    getEmbeddableFactory,
    inspector,
  });

  const component = mount(
    <EmbeddableChildPanel container={container} embeddableId={'123'} PanelComponent={testPanel} />
  );

  await nextTick();
  component.update();

  // Observer has not fired isIntersecting=true, so panel should show loading
  expect(component.find('EuiLoadingChart').length).toBe(1);
  expect(
    component
      .getDOMNode()
      .querySelectorAll('[data-test-subj="embeddablePanelHeading-HelloTheonGreyjoy"]').length
  ).toBe(0);
});

test('EmbeddableChildPanel mounts PanelComponent when it becomes visible', async () => {
  const inspector = inspectorPluginMock.createStartContract();
  const { setup, doStart } = embeddablePluginMock.createInstance();
  setup.registerEmbeddableFactory(
    CONTACT_CARD_EMBEDDABLE,
    new SlowContactCardEmbeddableFactory({ execAction: (() => null) as any })
  );
  const start = doStart();
  const getEmbeddableFactory = start.getEmbeddableFactory;

  const container = new HelloWorldContainer({ id: 'hello', panels: {} }, {
    getEmbeddableFactory,
  } as any);
  const newEmbeddable = await container.addNewEmbeddable<
    ContactCardEmbeddableInput,
    ContactCardEmbeddableOutput,
    ContactCardEmbeddable
  >(CONTACT_CARD_EMBEDDABLE, {
    firstName: 'Theon',
    lastName: 'Greyjoy',
    id: '123',
  });

  const testPanel = createEmbeddablePanelMock({
    getAllEmbeddableFactories: start.getEmbeddableFactories,
    getEmbeddableFactory,
    inspector,
  });

  const component = mount(
    <EmbeddableChildPanel
      container={container}
      embeddableId={newEmbeddable.id}
      PanelComponent={testPanel}
    />
  );

  await nextTick();
  component.update();

  // Initially not visible
  expect(component.find('EuiLoadingChart').length).toBe(1);

  // Simulate scrolling into view
  intersectionCallback([{ isIntersecting: true }]);
  await nextTick();
  component.update();

  // Now PanelComponent should be mounted
  expect(component.find('EuiLoadingChart').length).toBe(0);
  expect(
    component
      .getDOMNode()
      .querySelectorAll('[data-test-subj="embeddablePanelHeading-HelloTheonGreyjoy"]').length
  ).toBe(1);
  expect(mockDisconnect).toHaveBeenCalled();
});

test('EmbeddableChildPanel disconnects observer on unmount', async () => {
  const inspector = inspectorPluginMock.createStartContract();
  const { setup, doStart } = embeddablePluginMock.createInstance();
  setup.registerEmbeddableFactory(
    CONTACT_CARD_EMBEDDABLE,
    new SlowContactCardEmbeddableFactory({ execAction: (() => null) as any })
  );
  const start = doStart();
  const getEmbeddableFactory = start.getEmbeddableFactory;

  const container = new HelloWorldContainer({ id: 'hello', panels: {} }, {
    getEmbeddableFactory,
  } as any);
  await container.addNewEmbeddable<
    ContactCardEmbeddableInput,
    ContactCardEmbeddableOutput,
    ContactCardEmbeddable
  >(CONTACT_CARD_EMBEDDABLE, {
    firstName: 'Arya',
    lastName: 'Stark',
    id: '456',
  });

  const testPanel = createEmbeddablePanelMock({
    getAllEmbeddableFactories: start.getEmbeddableFactories,
    getEmbeddableFactory,
    inspector,
  });

  const component = mount(
    <EmbeddableChildPanel container={container} embeddableId={'456'} PanelComponent={testPanel} />
  );

  await nextTick();
  component.update();

  component.unmount();
  expect(mockDisconnect).toHaveBeenCalled();
});

test(`EmbeddableChildPanel renders an error message if the factory doesn't exist`, async () => {
  const inspector = inspectorPluginMock.createStartContract();
  const getEmbeddableFactory = () => undefined;
  const container = new HelloWorldContainer(
    {
      id: 'hello',
      panels: { '1': { type: 'idontexist', explicitInput: { id: '1' } } },
    },
    { getEmbeddableFactory } as any
  );

  const testPanel = createEmbeddablePanelMock({ inspector });
  const component = mount(
    <EmbeddableChildPanel container={container} embeddableId={'1'} PanelComponent={testPanel} />
  );

  await nextTick();
  component.update();

  // Simulate visibility so the error panel can mount
  intersectionCallback([{ isIntersecting: true }]);
  await nextTick();
  component.update();

  expect(
    component.getDOMNode().querySelectorAll('[data-test-subj="embeddableStackError"]').length
  ).toBe(1);
});
