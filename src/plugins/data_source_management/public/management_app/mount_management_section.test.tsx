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
import { ScopedHistory } from '../../../../core/public';
import { OpenSearchDashboardsContextProvider } from '../../../opensearch_dashboards_react/public';
import { CreateDataSourcePanel } from '../components/data_source_creation_panel/create_data_source_panel';
import { CreateDataSourceWizardWithRouter } from '../components/create_data_source_wizard';
import { EditDataSourceWithRouter } from '../components/edit_data_source';
import { DataSourceHomePanel } from '../components/data_source_home_panel/data_source_home_panel';
import { ConfigureDirectQueryDataSourceWithRouter } from '../components/direct_query_data_sources_components/direct_query_data_source_configuration/configure_direct_query_data_sources';
import { AuthenticationMethodRegistry } from '../auth_registry';
import { act } from 'react';
import { DirectQueryConnectionFlowRegistry } from '../direct_query_connection_flow_registry';
import { DataConnectionsExperience } from '../components/data_connections_experience';

jest.mock('../components/data_source_creation_panel/create_data_source_panel', () => ({
  CreateDataSourcePanel: () => <div>CreateDataSourcePanel</div>,
}));
jest.mock('../components/create_data_connection_panel/create_data_connection_panel', () => ({
  CreateDataConnectionPanel: () => <div>CreateDataConnectionPanel</div>,
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
jest.mock('../components/data_connections_home_panel/data_connections_home_panel', () => ({
  DataConnectionsHomePanel: () => <div>DataConnectionsHomePanel</div>,
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
      // The app's history is scoped, as in production; flows get a sub history of it.
      const history = new ScopedHistory(
        createMemoryHistory({ initialEntries: [`/app/dataSources${path}`] }),
        '/app/dataSources'
      );
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
      expect(flow.mount.mock.calls[0][0]).toEqual(
        expect.objectContaining({ path: '', setBreadcrumbs: mockParams.setBreadcrumbs })
      );
      const { history: flowHistory } = flow.mount.mock.calls[0][0] as { history?: unknown };
      expect(flowHistory).toBeInstanceOf(ScopedHistory);
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

    describe('with a flow that does not require data source management', () => {
      const createRegistryWithOpenFlow = () => {
        const { registry, flow } = createRegistryWithFlow();
        const openFlow = {
          id: 'open-flow',
          title: 'Open connection',
          buttonLabel: 'Connect open data source',
          requiresDataSourceManagement: false,
          mount: jest.fn(({ element }: { element: HTMLElement }) => {
            element.textContent = 'OpenFlow';
            return () => {};
          }),
        };
        registry.registerDirectQueryConnectionFlow(openFlow);
        return { registry, flow, openFlow };
      };

      it('mounts that flow for a user who cannot manage data sources', async () => {
        const { registry, openFlow } = createRegistryWithOpenFlow();
        const { element, unmount } = await mountAt('/flows/open-flow/manage/so-1', false, registry);
        expect(openFlow.mount).toHaveBeenCalledTimes(1);
        expect(openFlow.mount.mock.calls[0][0]).toEqual(
          expect.objectContaining({ path: '/manage/so-1' })
        );
        expect(element.textContent).toContain('OpenFlow');
        act(() => unmount());
      });

      it('shows "not available" for the other flows there', async () => {
        const { registry, flow } = createRegistryWithOpenFlow();
        const { element, unmount } = await mountAt('/flows/example-flow', false, registry);
        expect(flow.mount).not.toHaveBeenCalled();
        expect(element.textContent).toContain('This connection flow is not available.');
        expect(element.textContent).not.toContain('EditDataSourceWithRouter');
        act(() => unmount());
      });

      it('still has no Create page without the data connections experience', async () => {
        const { registry } = createRegistryWithOpenFlow();
        const { element, unmount } = await mountAt('/create', false, registry);
        expect(element.textContent).not.toContain('CreateDataSourcePanel');
        expect(element.textContent).not.toContain('CreateDataConnectionPanel');
        act(() => unmount());
      });
    });

    it.each([
      ['an empty registry', () => new DirectQueryConnectionFlowRegistry()],
      ['no registry', () => undefined],
    ])(
      'shows the "not available" callout for a flow link with %s',
      async (_name, createRegistry) => {
        const { element, unmount } = await mountAt('/flows/example-flow', true, createRegistry());
        expect(element.textContent).toContain('This connection flow is not available.');
        expect(element.textContent).not.toContain('EditDataSourceWithRouter');
        act(() => unmount());
      }
    );
  });
});

describe('data connections experience', () => {
  // A plugin registers the experience; here it is on when a made-up capability says so.
  const experience: DataConnectionsExperience = {
    isEnabled: (capabilities) => (capabilities as any).exampleFlags?.connectionsTable === true,
  };
  const mountPage = async (
    path: string,
    capabilities: Record<string, unknown>,
    // null: no plugin registered an experience.
    registered: DataConnectionsExperience | null = experience
  ) => {
    const history = new ScopedHistory(
      createMemoryHistory({ initialEntries: [`/app/dataSources${path}`] }),
      '/app/dataSources'
    );
    const element = document.createElement('div');
    let unmount: () => void = () => {};
    await act(async () => {
      unmount = await mountManagementSection(
        jest.fn().mockResolvedValue([
          {
            chrome: { docTitle: { reset: jest.fn() } },
            application: { capabilities },
            savedObjects: {},
            uiSettings: { get: jest.fn(() => false) },
            notifications: { toasts: { addDanger: jest.fn() } },
            overlays: {},
            http: {},
            docLinks: {},
          },
          { navigation: {} },
        ]) as unknown as StartServicesAccessor<DataSourceManagementStartDependencies>,
        { ...mockParams, element, history },
        mockAuthMethodsRegistry,
        true,
        undefined,
        registered ?? undefined
      );
    });
    return { element, unmount };
  };

  it('lists every connection in one table when the registered experience is on', async () => {
    const { element, unmount } = await mountPage('/', {
      dataSource: { canManage: true },
      exampleFlags: { connectionsTable: true },
    });
    expect(element.textContent).toContain('DataConnectionsHomePanel');
    expect(element.textContent).not.toContain('DataSourceHomePanel');
    act(() => unmount());
  });

  it.each([
    ['the experience is off for the session', { connectionsTable: false }, experience],
    ['no plugin registered an experience', { connectionsTable: true }, null],
    [
      'isEnabled throws',
      { connectionsTable: true },
      {
        isEnabled: () => {
          throw new Error('broken');
        },
      },
    ],
  ])('keeps the tabbed list when %s', async (_, exampleFlags, registered) => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { element, unmount } = await mountPage(
      '/',
      { dataSource: { canManage: true }, exampleFlags },
      registered
    );
    error.mockRestore();
    expect(element.textContent).toContain('DataSourceHomePanel');
    expect(element.textContent).not.toContain('DataConnectionsHomePanel');
    act(() => unmount());
  });

  it('shows the type cards on the Create page when the experience is on', async () => {
    const { element, unmount } = await mountPage('/create', {
      dataSource: { canManage: true },
      exampleFlags: { connectionsTable: true },
    });
    expect(element.textContent).toContain('CreateDataConnectionPanel');
    expect(element.textContent).not.toContain('CreateDataSourcePanel');
    act(() => unmount());
  });

  it("keeps today's Create page when the experience is off", async () => {
    const { element, unmount } = await mountPage('/create', {
      dataSource: { canManage: true },
      exampleFlags: { connectionsTable: false },
    });
    expect(element.textContent).toContain('CreateDataSourcePanel');
    expect(element.textContent).not.toContain('CreateDataConnectionPanel');
    act(() => unmount());
  });

  // The page lists only the types the user may connect (a flow may not require data source
  // management); see CreateDataConnectionPanel.
  it('opens the Create page for a user who cannot manage data sources when the experience is on', async () => {
    const { element, unmount } = await mountPage('/create', {
      dataSource: { canManage: false },
      exampleFlags: { connectionsTable: true },
    });
    expect(element.textContent).toContain('CreateDataConnectionPanel');
    act(() => unmount());
  });

  it('has no Create page for a user who cannot manage data sources when the experience is off', async () => {
    const { element, unmount } = await mountPage('/create', {
      dataSource: { canManage: false },
      exampleFlags: { connectionsTable: false },
    });
    expect(element.textContent).not.toContain('CreateDataSourcePanel');
    expect(element.textContent).not.toContain('CreateDataConnectionPanel');
    act(() => unmount());
  });

  const flagOn = {
    dataSource: { canManage: true },
    exampleFlags: { connectionsTable: true },
  };
  const flagOff = {
    dataSource: { canManage: true },
    exampleFlags: { connectionsTable: false },
  };

  // The Create page lists the types; a type's setup page is a page of its own, with or without the
  // flag, so it never shows the type page's cards.
  it.each([
    ['/configure/Prometheus', 'ConfigureDirectQueryDataSourceWithRouter', flagOn],
    ['/configure/OpenSearch', 'CreateDataSourceWizardWithRouter', flagOn],
    ['/configure/Prometheus', 'ConfigureDirectQueryDataSourceWithRouter', flagOff],
    ['/configure/OpenSearch', 'CreateDataSourceWizardWithRouter', flagOff],
  ])('opens the setup page at %s on a page of its own', async (path, page, capabilities) => {
    const { element, unmount } = await mountPage(path, capabilities);
    expect(element.textContent).toBe(page);
    act(() => unmount());
  });

  it.each([
    ['on', flagOn],
    ['off', flagOff],
  ])(
    'opens a flow page without the Create page when the flag is %s',
    async (_label, capabilities) => {
      const { element, unmount } = await mountPage('/flows/example-flow', capabilities);
      expect(element.textContent).not.toContain('CreateDataConnectionPanel');
      expect(element.textContent).not.toContain('CreateDataSourcePanel');
      act(() => unmount());
    }
  );
});
