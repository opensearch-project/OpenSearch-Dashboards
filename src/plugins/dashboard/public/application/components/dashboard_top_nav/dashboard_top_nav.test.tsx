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

jest.mock(
  'lodash',
  () => ({
    ...jest.requireActual('lodash'),
    // mock debounce to fire immediately with no internal timer
    debounce: (func: any) => {
      function debounced(this: any, ...args: any[]) {
        return func.apply(this, args);
      }
      return debounced;
    },
  }),
  { virtual: true }
);

import { I18nProvider } from '@osd/i18n/react';
import { OpenSearchDashboardsContextProvider } from 'src/plugins/opensearch_dashboards_react/public';
import { DashboardTopNav } from './dashboard_top_nav';
import React from 'react';
import { DashboardAppState, DashboardAppStateContainer } from '../../../types';
import { Dashboard } from '../../../dashboard';
import { DashboardContainer } from '../../embeddable';
import { createDashboardServicesMock } from '../../utils/mocks';
import { mount } from 'enzyme';
import { TopNavMenu } from 'src/plugins/navigation/public';
import { dashboardAppStateStub } from '../../utils/stubs';

let mockURL = '?_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-15m,to:now))';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({
    search: mockURL,
    pathname: '',
    hash: '',
    state: undefined,
  }),
}));

function wrapDashboardTopNavInContext(mockServices: any, currentState: DashboardAppState) {
  const services = {
    ...mockServices,
    dashboardCapabilities: {
      saveQuery: true,
    },
    navigation: {
      ui: { TopNavMenu },
    },
  };

  const topNavProps = {
    isChromeVisible: false,
    savedDashboardInstance: {},
    appState: {
      getState: () => currentState,
    } as DashboardAppStateContainer,
    dashboard: {} as Dashboard,
    currentAppState: currentState,
    isEmbeddableRendered: true,
    currentContainer: {} as DashboardContainer,
    indexPatterns: [],
    dashboardIdFromUrl: '',
  };

  return (
    <I18nProvider>
      <OpenSearchDashboardsContextProvider services={services}>
        <DashboardTopNav {...topNavProps} />
      </OpenSearchDashboardsContextProvider>
    </I18nProvider>
  );
}

describe('Dashboard top nav', () => {
  let mockServices: any;
  let currentState: DashboardAppState;

  beforeEach(() => {
    mockServices = createDashboardServicesMock();
    currentState = dashboardAppStateStub;
  });

  test('render with all components', async () => {
    const component = mount(wrapDashboardTopNavInContext(mockServices, currentState));

    // Ensure all promises resolve
    await new Promise((resolve) => process.nextTick(resolve));
    // Ensure the state changes are reflected
    component.update();

    expect(component).toMatchSnapshot();
  });

  test('render in full screen mode, no componenets should be shown', async () => {
    currentState.fullScreenMode = true;
    const component = mount(wrapDashboardTopNavInContext(mockServices, currentState));

    // Ensure all promises resolve
    await new Promise((resolve) => process.nextTick(resolve));
    // Ensure the state changes are reflected
    component.update();

    expect(component).toMatchSnapshot();
  });

  test('render in full screen mode with appended URL param but none of the componenets can be forced show', async () => {
    currentState.fullScreenMode = true;
    mockURL =
      '?_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-15m,to:now))&show-time-filter=true';
    const component = mount(wrapDashboardTopNavInContext(mockServices, currentState));

    // Ensure all promises resolve
    await new Promise((resolve) => process.nextTick(resolve));
    // Ensure the state changes are reflected
    component.update();

    expect(component).toMatchSnapshot();
  });

  test('render in embed mode', async () => {
    mockURL =
      '?_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-15m,to:now))&embed=true';
    const component = mount(wrapDashboardTopNavInContext(mockServices, currentState));

    // Ensure all promises resolve
    await new Promise((resolve) => process.nextTick(resolve));
    // Ensure the state changes are reflected
    component.update();

    expect(component).toMatchSnapshot();
  });

  test('render in embed mode, components can be forced show by appending URL param', async () => {
    mockURL =
      '?_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-15m,to:now))&embed=true&show-time-filter=true';
    const component = mount(wrapDashboardTopNavInContext(mockServices, currentState));

    // Ensure all promises resolve
    await new Promise((resolve) => process.nextTick(resolve));
    // Ensure the state changes are reflected
    component.update();

    expect(component).toMatchSnapshot();
  });

  test('render in embed mode, and force hide filter bar', async () => {
    mockURL =
      '?_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-15m,to:now))&embed=true&hide-filter-bar=true';
    const component = mount(wrapDashboardTopNavInContext(mockServices, currentState));

    // Ensure all promises resolve
    await new Promise((resolve) => process.nextTick(resolve));
    // Ensure the state changes are reflected
    component.update();

    expect(component).toMatchSnapshot();
  });
});
