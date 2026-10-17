/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { shallow } from 'enzyme';
import { Route, Router, Switch } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import { I18nProvider } from '@osd/i18n/react';
import {
  mountManagementSection,
  DataSourceManagementStartDependencies,
} from './mount_management_section';
import { StartServicesAccessor } from 'src/core/public';
import { OpenSearchDashboardsContextProvider } from '../../../opensearch_dashboards_react/public';
import { CreateDataSourcePanel } from '../components/data_source_creation_panel/create_data_source_panel';
import { CreateDataSourceWizardWithRouter } from '../components/create_data_source_wizard';
import { EditDataSourceWithRouter } from '../components/edit_data_source';
import { DataSourceHomePanel } from '../components/data_source_home_panel/data_source_home_panel';
import { ConfigureDirectQueryDataSourceWithRouter } from '../components/direct_query_data_sources_components/direct_query_data_source_configuration/configure_direct_query_data_sources';
import { AuthenticationMethodRegistry } from '../auth_registry';
import { act } from 'react';
import { DirectQueryConnectionFlowRegistry } from '../direct_query_connection_flow_registry';

jest.mock('../components/data_source_creation_panel/create_data_source_panel', () => ({
  CreateDataSourcePanel: () => <div>CreateDataSourcePanel</div>,
}));
jest.mock('../components/create_data_source_wizard', () => ({
  CreateDataSourceWizardWithRouter: () => <div>CreateDataSourceWizardWithRouter</div>,
}));
jest.mock('../components/edit_data_source', () => ({
  EditDataSourceWithRouter: () => <div>EditDataSourceWithRouter</div>,
}));
jest.mock('../components/data_source_home_panel/data_source_home_panel', () => ({
  DataSourceHomePanel: () => <div>DataSourceHomePanel</div>,
}));
jest.mock(
  '../components/direct_query_data_sources_components/direct_query_data_source_configuration/configure_direct_query_data_sources',
  () => ({
    ConfigureDirectQueryDataSourceWithRouter: () => (
      <div>ConfigureDirectQueryDataSourceWithRouter</div>
    ),
  })
);

const mockStartServices: StartServicesAccessor<DataSourceManagementStartDependencies> = jest
  .fn()
  .mockResolvedValue([
    {
      chrome: { docTitle: { reset: jest.fn() } },
      application: {},
      savedObjects: {},
      uiSettings: {
        get: jest.fn((key) => {
          if (key === 'home:useNewHomePage') {
            return false;
          }
          return 'default';
        }),
      },
      notifications: {},
      overlays: {},
      http: {},
      docLinks: {},
    },
    {
      navigation: {},
    },
  ]);

const mockParams: any = {
  element: document.createElement('div'),
  history: createMemoryHistory(), // Use createMemoryHistory
  setBreadcrumbs: jest.fn(),
};

const mockAuthMethodsRegistry: AuthenticationMethodRegistry = {} as AuthenticationMethodRegistry;

describe('mountManagementSection', () => {
  it('renders routes correctly with feature flag enabled', async () => {
    await mountManagementSection(mockStartServices, mockParams, mockAuthMethodsRegistry, true);
    const wrapper = shallow(
      <OpenSearchDashboardsContextProvider services={{}}>
        <I18nProvider>
          <Router history={mockParams.history}>
            <Switch>
              <Route path={['/create']} component={CreateDataSourcePanel} />
              <Route
                path={['/configure/OpenSearch']}
                component={CreateDataSourceWizardWithRouter}
              />
              <Route
                path={['/configure/:type']}
                component={ConfigureDirectQueryDataSourceWithRouter}
              />
              <Route path={['/:id']} component={EditDataSourceWithRouter} />
              <Route path={['/']} component={DataSourceHomePanel} />
            </Switch>
          </Router>
        </I18nProvider>
      </OpenSearchDashboardsContextProvider>
    );

    expect(wrapper.find(Route)).toHaveLength(5);
    const pathProp = wrapper.find(Route).at(3).prop('path');
    expect(pathProp).toEqual(['/:id']);
  });

  it('renders routes correctly with feature flag disabled', async () => {
    await mountManagementSection(mockStartServices, mockParams, mockAuthMethodsRegistry, false);
    const wrapper = shallow(
      <OpenSearchDashboardsContextProvider services={{}}>
        <I18nProvider>
          <Router history={mockParams.history}>
            <Switch>
              <Route path={['/create']} component={CreateDataSourcePanel} />
              <Route
                path={['/configure/:type']}
                component={ConfigureDirectQueryDataSourceWithRouter}
              />
              <Route path={['/']} component={DataSourceHomePanel} />
            </Switch>
          </Router>
        </I18nProvider>
      </OpenSearchDashboardsContextProvider>
    );

    expect(wrapper.find(Route)).toHaveLength(3);
    wrapper.find(Route).forEach((route) => {
      expect(route.prop('path')).not.toEqual(['/:id']);
    });
  });

  it('renders CreateDataSourcePanel when canManageDataSource is true', async () => {
    const mockGetStartServices: StartServicesAccessor<DataSourceManagementStartDependencies> = jest
      .fn()
      .mockResolvedValue([
        {
          chrome: { docTitle: { reset: jest.fn() } },
          application: { capabilities: { dataSource: { canManage: false } } },
          savedObjects: {},
          uiSettings: {
            get: jest.fn((key) => {
              if (key === 'home:useNewHomePage') {
                return false;
              }
              return 'default';
            }),
          },
          notifications: {},
          overlays: {},
          http: {},
          docLinks: {},
        },
        {
          navigation: {},
        },
      ]);

    await mountManagementSection(mockGetStartServices, mockParams, mockAuthMethodsRegistry, true);
    const wrapper = shallow(
      <OpenSearchDashboardsContextProvider services={{}}>
        <I18nProvider>
          <Router history={mockParams.history}>
            <Switch>
              <Route path={['/:id']} component={EditDataSourceWithRouter} />
              <Route path={['/']} component={DataSourceHomePanel} />
            </Switch>
          </Router>
        </I18nProvider>
      </OpenSearchDashboardsContextProvider>
    );

    expect(wrapper.find(Route)).toHaveLength(2);
  });

  describe('direct query connection flow routes', () => {
    const createStartServices = (canManage: boolean) =>
      jest.fn().mockResolvedValue([
        {
          chrome: { docTitle: { reset: jest.fn() } },
          application: { capabilities: { dataSource: { canManage } } },
          savedObjects: {},
          uiSettings: { get: jest.fn(() => false) },
          notifications: { toasts: { addDanger: jest.fn() } },
          overlays: {},
          http: {},
          docLinks: {},
        },
        { navigation: {} },
      ]) as unknown as StartServicesAccessor<DataSourceManagementStartDependencies>;

    const createRegistryWithFlow = () => {
      const unmountFlow = jest.fn();
      const flow = {
        id: 'example-flow',
        title: 'Example connection',
        buttonLabel: 'Connect example data source',
        mount: jest.fn(({ element }: { element: HTMLElement }) => {
          element.textContent = 'ExampleFlow';
          return unmountFlow;
        }),
      };
      const registry = new DirectQueryConnectionFlowRegistry();
      registry.registerDirectQueryConnectionFlow(flow);
      return { registry, flow, unmountFlow };
    };

    const mountAt = async (
      path: string,
      canManage: boolean,
      registry?: DirectQueryConnectionFlowRegistry
    ) => {
      const history = createMemoryHistory();
      history.push(path);
      const element = document.createElement('div');
      let unmount: () => void = () => {};
      await act(async () => {
        unmount = await mountManagementSection(
          createStartServices(canManage),
          { ...mockParams, element, history },
          mockAuthMethodsRegistry,
          true,
          registry
        );
      });
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
      return { element, unmount, history };
    };

    it('mounts a registered flow at /flows/:flowId and unmounts it with the app', async () => {
      const { registry, flow, unmountFlow } = createRegistryWithFlow();
      const { element, unmount } = await mountAt('/flows/example-flow', true, registry);
      expect(flow.mount).toHaveBeenCalledTimes(1);
      expect(flow.mount.mock.calls[0][0]).toEqual(expect.objectContaining({ path: '' }));
      expect(element.textContent).toContain('ExampleFlow');

      act(() => unmount());
      expect(unmountFlow).toHaveBeenCalledTimes(1);
    });

    it('matches /flows/:flowId/* sub-paths', async () => {
      const { registry, flow } = createRegistryWithFlow();
      const { unmount } = await mountAt('/flows/example-flow/manage/so-1', true, registry);
      expect(flow.mount.mock.calls[0][0]).toEqual(
        expect.objectContaining({ path: '/manage/so-1' })
      );
      act(() => unmount());
    });

    it('does not register flow routes when the user cannot manage data sources', async () => {
      const { registry, flow } = createRegistryWithFlow();
      const { element, unmount } = await mountAt('/flows/example-flow', false, registry);
      expect(flow.mount).not.toHaveBeenCalled();
      expect(element.textContent).toContain('EditDataSourceWithRouter');
      act(() => unmount());
    });

    it('falls through to the existing routes when no flow is registered', async () => {
      const { element, unmount } = await mountAt(
        '/flows/example-flow',
        true,
        new DirectQueryConnectionFlowRegistry()
      );
      expect(element.textContent).toContain('EditDataSourceWithRouter');
      act(() => unmount());
    });
  });
});
