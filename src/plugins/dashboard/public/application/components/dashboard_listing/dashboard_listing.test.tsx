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

let mockURLsearch =
  '?_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-15m,to:now))';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({
    search: mockURLsearch,
    pathname: '',
    hash: '',
    state: undefined,
  }),
}));

import React from 'react';
import { mount } from 'enzyme';

import { DashboardListing } from './dashboard_listing';
import { createDashboardServicesMock } from '../../utils/mocks';
import { OpenSearchDashboardsContextProvider } from 'src/plugins/opensearch_dashboards_react/public';
import { I18nProvider } from '@osd/i18n/react';
import { IOsdUrlStateStorage } from 'src/plugins/opensearch_dashboards_utils/public';

function wrapDashboardListingInContext(mockServices: any) {
  const osdUrlStateStorage = ({
    set: jest.fn(),
    get: jest.fn(() => ({ linked: false })),
    flush: jest.fn(),
  } as unknown) as IOsdUrlStateStorage;
  const services = {
    ...mockServices,
    osdUrlStateStorage,
    dashboardProviders: () => {
      return {
        dashboard: {
          appId: '1',
          savedObjectsName: 'dashboardSavedObjects',
          viewUrlPathFn: jest.fn(),
          editUrlPathFn: jest.fn(),
        },
      };
    },
  };

  return (
    <I18nProvider>
      <OpenSearchDashboardsContextProvider services={services}>
        <DashboardListing />
      </OpenSearchDashboardsContextProvider>
    </I18nProvider>
  );
}

describe('dashboard listing', () => {
  let mockServices: any;

  beforeEach(() => {
    mockServices = createDashboardServicesMock();
    mockServices.savedObjectsClient.find = () => {
      const hits: any[] = [];
      for (let i = 0; i < 2; i++) {
        hits.push({
          type: `dashboard`,
          id: `dashboard${i}`,
          attributes: {
            title: `dashboard${i}`,
            description: `dashboard${i} desc`,
          },
        });
      }
      return Promise.resolve({
        savedObjects: hits,
      });
    };
    mockServices.dashboardConfig.getHideWriteControls = () => false;
    mockServices.savedObjectsPublic.settings.getListingLimit = () => 100;
  });

  test('renders table rows', async () => {
    const component = mount(wrapDashboardListingInContext(mockServices));

    // Ensure all promises resolve
    await new Promise((resolve) => process.nextTick(resolve));
    // Ensure the state changes are reflected
    component.update();

    expect(component).toMatchSnapshot();
  });

  test('renders call to action when no dashboards exist', async () => {
    // savedObjectsClient.find() needs to find no dashboard
    mockServices.savedObjectsClient.find = () => {
      const hits: any[] = [];
      return Promise.resolve({
        total: 0,
        hits,
      });
    };
    const component = mount(wrapDashboardListingInContext(mockServices));

    // Ensure all promises resolve
    await new Promise((resolve) => process.nextTick(resolve));
    // Ensure the state changes are reflected
    component.update();

    expect(component).toMatchSnapshot();
  });

  test('hideWriteControls', async () => {
    // dashboardConfig.getHideWriteControls() to true
    mockServices.dashboardConfig.getHideWriteControls = () => {
      return true;
    };
    const component = mount(wrapDashboardListingInContext(mockServices));

    // Ensure all promises resolve
    await new Promise((resolve) => process.nextTick(resolve));
    // Ensure the state changes are reflected
    component.update();

    expect(component).toMatchSnapshot();
  });

  test('renders warning when listingLimit is exceeded', async () => {
    mockServices.savedObjectsPublic.settings.getListingLimit = () => 1;

    const component = mount(wrapDashboardListingInContext(mockServices));

    // Ensure all promises resolve
    await new Promise((resolve) => process.nextTick(resolve));
    // Ensure the state changes are reflected
    component.update();

    expect(component).toMatchSnapshot();
  });

  test('render table listing with initial filters from URL', async () => {
    mockURLsearch =
      '?_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-15m,to:now))&filter=dashboard';

    const component = mount(wrapDashboardListingInContext(mockServices));

    // Ensure all promises resolve
    await new Promise((resolve) => process.nextTick(resolve));
    // Ensure the state changes are reflected
    component.update();

    expect(component).toMatchSnapshot();
  });
});
