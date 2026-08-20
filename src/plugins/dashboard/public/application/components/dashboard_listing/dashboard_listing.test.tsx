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

import { mount } from 'enzyme';
import { act } from 'react';

import { DashboardListing } from './dashboard_listing';
import { createDashboardServicesMock } from '../../utils/mocks';
import {
  OpenSearchDashboardsContextProvider,
  TableListView,
} from 'src/plugins/opensearch_dashboards_react/public';
import { I18nProvider } from '@osd/i18n/react';
import { IOsdUrlStateStorage } from 'src/plugins/opensearch_dashboards_utils/public';

function wrapDashboardListingInContext(mockServices: any) {
  const osdUrlStateStorage = {
    set: jest.fn(),
    get: jest.fn(() => ({ linked: false })),
    flush: jest.fn(),
  } as unknown as IOsdUrlStateStorage;
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

describe('dashboard tags', () => {
  it('adds the selected tag as a saved object reference filter', async () => {
    const mockServices = createDashboardServicesMock();
    mockServices.savedObjectsClient.find.mockResolvedValue({
      savedObjects: [
        {
          type: 'dashboard',
          id: 'dashboard-1',
          attributes: {
            title: 'Dashboard',
            description: '',
            version: 1,
            timeRestore: false,
          },
          references: [],
        },
      ],
      total: 1,
    });
    mockServices.dashboardConfig.getHideWriteControls = () => false;
    mockServices.savedObjectsPublic.settings.getListingLimit = () => 100;
    mockServices.navigation = {
      ui: {
        HeaderControl: () => null,
      },
    };
    mockServices.savedObjectTags.ui.TagSelector = ({ onChange }: any) => (
      <button data-test-subj="selectProductionTag" onClick={() => onChange('tag-production')} />
    );

    let component: ReturnType<typeof mount>;
    await act(async () => {
      component = mount(wrapDashboardListingInContext(mockServices));
      await new Promise((resolve) => setImmediate(resolve));
    });
    component.update();

    await act(async () => {
      component.find('[data-test-subj="selectProductionTag"]').simulate('click');
      await new Promise((resolve) => setImmediate(resolve));
    });
    component.update();

    expect(mockServices.savedObjectsClient.find).toHaveBeenLastCalledWith(
      expect.objectContaining({
        hasReference: {
          type: 'saved-object-annotation',
          id: 'tag-production',
        },
      })
    );
  });

  it('adds a Tags column after Last updated', async () => {
    const mockServices = createDashboardServicesMock();
    mockServices.savedObjectsClient.find.mockResolvedValue({
      savedObjects: [
        {
          type: 'dashboard',
          id: 'dashboard-1',
          attributes: {
            title: 'Dashboard',
            description: '',
          },
          references: [],
        },
      ],
      total: 1,
    });
    mockServices.dashboardConfig.getHideWriteControls = () => false;
    mockServices.savedObjectsPublic.settings.getListingLimit = () => 100;
    mockServices.navigation = {
      ui: {
        HeaderControl: () => null,
      },
    };
    mockServices.savedObjectTags.ui.TagList = ({ target }: any) => (
      <span data-test-subj="dashboardListingTags">
        {target.objectType}:{target.objectId}
      </span>
    );

    let component: ReturnType<typeof mount>;
    await act(async () => {
      component = mount(wrapDashboardListingInContext(mockServices));
      await new Promise((resolve) => setImmediate(resolve));
    });
    component.update();

    const columns = component.find(TableListView).prop('tableColumns') as any[];
    const updatedAtColumnIndex = columns.findIndex(
      (column) => column['data-test-subj'] === 'updated-at'
    );
    const tagsColumn = columns[updatedAtColumnIndex + 1];
    const tableListView = component.find(TableListView).instance() as any;
    const dashboard = tableListView.state.items[0];

    expect(tagsColumn.name).toBe('Tags');
    expect(dashboard.savedObjectType).toBe('dashboard');

    const renderedCell = mount(<>{tagsColumn.render(dashboard.id, dashboard)}</>);
    expect(renderedCell.find('[data-test-subj="dashboardListingTags"]').text()).toBe(
      'dashboard:dashboard-1'
    );
  });
});

// TODO: https://github.com/opensearch-project/OpenSearch-Dashboards/issues/7488
// skipping because not sure why it even needs to keep state seems like it isn't being used
describe.skip('dashboard listing', () => {
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
