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

import React from 'react';
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
import { createDashboardServicesMock } from '../../utils/mocks';
import { OpenSearchDashboardsContextProvider } from '../../../../../opensearch_dashboards_react/public';
import { DashboardDirectQuerySyncProps } from './dashboard_direct_query_sync';
import {
  extractIndexInfoFromDashboard,
  generateRefreshQuery,
} from '../../utils/direct_query_sync/direct_query_sync';

jest.mock('../../utils/direct_query_sync/direct_query_sync', () => {
  const actual = jest.requireActual('../../utils/direct_query_sync/direct_query_sync');
  return {
    ...actual,
    extractIndexInfoFromDashboard: jest.fn(),
    generateRefreshQuery: jest.fn(),
    EMR_STATES: new Map([
      ['submitted', { ord: 0, terminal: false }],
      ['queued', { ord: 10, terminal: false }],
      ['pending', { ord: 20, terminal: false }],
      ['scheduled', { ord: 30, terminal: false }],
      ['running', { ord: 70, terminal: false }],
      ['cancelling', { ord: 90, terminal: false }],
      ['success', { ord: 100, terminal: true }],
      ['failed', { ord: 100, terminal: true }],
      ['cancelled', { ord: 100, terminal: true }],
      ['fresh', { ord: 100, terminal: true }],
    ]),
  };
});

let dashboardContainer: DashboardContainer | undefined;

function prepare(props?: Partial<DashboardGridProps>) {
  const { setup, doStart } = embeddablePluginMock.createInstance();
  setup.registerEmbeddableFactory(
    CONTACT_CARD_EMBEDDABLE,
    new ContactCardEmbeddableFactory((() => null) as any, {} as any)
  );
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

  const services = createDashboardServicesMock();

  const defaultTestProps: DashboardGridProps = {
    container: dashboardContainer,
    PanelComponent: () => <div />,
    opensearchDashboards: {
      services,
    },
    intl: null as any,
    savedObjectsClient: services.savedObjectsClient,
    http: services.http,
    notifications: services.notifications,
    startLoading: jest.fn(),
    loadStatus: 'fresh',
    pollingResult: {},
    isDirectQuerySyncEnabled: false,
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

test('renders DashboardGrid with no visualizations', () => {
  const { props, options } = prepare();
  const component = mountWithIntl(
    <OpenSearchDashboardsContextProvider services={options}>
      <DashboardGrid {...props} />
    </OpenSearchDashboardsContextProvider>
  );

  props.container.updateInput({ panels: {} });
  component.update();
  expect(component.find('EmbeddableChildPanel').length).toBe(0);
});

test('DashboardGrid removes panel when removed from container', () => {
  const { props, options } = prepare();
  const component = mountWithIntl(
    <OpenSearchDashboardsContextProvider services={options}>
      <DashboardGrid {...props} />
    </OpenSearchDashboardsContextProvider>
  );

  const originalPanels = props.container.getInput().panels;
  const filteredPanels = { ...originalPanels };
  delete filteredPanels['1'];
  props.container.updateInput({ panels: filteredPanels });
  component.update();
  const panelElements = component.find('EmbeddableChildPanel');
  expect(panelElements.length).toBe(1);
});

test('DashboardGrid renders expanded panel', () => {
  const { props, options } = prepare();
  const component = mountWithIntl(
    <OpenSearchDashboardsContextProvider services={options}>
      <DashboardGrid {...props} />
    </OpenSearchDashboardsContextProvider>
  );

  props.container.updateInput({ expandedPanelId: '1' });
  component.update();
  // Both panels should still exist in the dom, so nothing needs to be re-fetched once minimized.
  expect(component.find('EmbeddableChildPanel').length).toBe(2);

  expect(
    (component.find('DashboardGridUi').state() as { expandedPanelId?: string }).expandedPanelId
  ).toBe('1');

  props.container.updateInput({ expandedPanelId: undefined });
  component.update();
  expect(component.find('EmbeddableChildPanel').length).toBe(2);

  expect(
    (component.find('DashboardGridUi').state() as { expandedPanelId?: string }).expandedPanelId
  ).toBeUndefined();
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

test('renders sync UI when feature flag is enabled and metadata is present', async () => {
  const { props, options } = prepare({ isDirectQuerySyncEnabled: true });

  (extractIndexInfoFromDashboard as jest.Mock).mockResolvedValue({
    parts: { datasource: 'ds', database: 'db', index: 'idx' },
    mapping: { lastRefreshTime: 123456, refreshInterval: 30000 },
    mdsId: '',
  });

  const component = mountWithIntl(
    <OpenSearchDashboardsContextProvider services={options}>
      <DashboardGrid {...props} />
    </OpenSearchDashboardsContextProvider>
  );

  // Wait for async metadata collection
  await new Promise((resolve) => setTimeout(resolve, 0));
  component.update();

  expect(component.find('DashboardDirectQuerySync').exists()).toBe(true);
});

test('does not render sync UI when feature flag is off', async () => {
  const { props, options } = prepare({ isDirectQuerySyncEnabled: false });

  (extractIndexInfoFromDashboard as jest.Mock).mockResolvedValue({
    parts: { datasource: 'ds', database: 'db', index: 'idx' },
    mapping: { lastRefreshTime: 123456, refreshInterval: 30000 },
    mdsId: '',
  });

  const component = mountWithIntl(
    <OpenSearchDashboardsContextProvider services={options}>
      <DashboardGrid {...props} />
    </OpenSearchDashboardsContextProvider>
  );

  await new Promise((resolve) => setTimeout(resolve, 0));
  component.update();

  expect(component.find('DashboardDirectQuerySync').exists()).toBe(false);
});

test('synchronizeNow triggers REFRESH query generation and startLoading', async () => {
  const { props, options } = prepare({ isDirectQuerySyncEnabled: true });

  const mockRefreshQuery = 'REFRESH MATERIALIZED VIEW ds.db.idx';
  (extractIndexInfoFromDashboard as jest.Mock).mockResolvedValue({
    parts: { datasource: 'ds', database: 'db', index: 'idx' },
    mapping: { lastRefreshTime: 123456, refreshInterval: 30000 },
    mdsId: '',
  });

  (generateRefreshQuery as jest.Mock).mockReturnValue(mockRefreshQuery);

  const startLoadingSpy = jest.fn();
  props.startLoading = startLoadingSpy;

  const component = mountWithIntl(
    <OpenSearchDashboardsContextProvider services={options}>
      <DashboardGrid {...props} />
    </OpenSearchDashboardsContextProvider>
  );

  await new Promise((resolve) => setTimeout(resolve, 0));
  component.update();

  (component
    .find('DashboardDirectQuerySync')
    .props() as DashboardDirectQuerySyncProps).onSynchronize();

  expect(startLoadingSpy).toHaveBeenCalledWith({
    query: mockRefreshQuery,
    lang: 'sql',
    datasource: 'ds',
  });
});
