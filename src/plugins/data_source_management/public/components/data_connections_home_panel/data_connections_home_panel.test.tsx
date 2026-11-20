/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { shallow, mount } from 'enzyme';
import { RouteComponentProps } from 'react-router-dom';
import { EuiTab } from '@elastic/eui';
import { DataConnectionsHomePanel } from './data_connections_home_panel';
import { DataConnectionsTableWithRouter } from '../data_connections_table/data_connections_table';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { getListBreadcrumbs } from '../breadcrumbs';
import { navigationPluginMock } from 'src/plugins/navigation/public/mocks';
import { act } from 'react';
import {
  DirectQueryConnectionFlow,
  DirectQueryConnectionFlowRegistry,
} from '../../direct_query_connection_flow_registry';

jest.mock('../../../../opensearch_dashboards_react/public');
jest.mock('../breadcrumbs');
jest.mock('../data_connections_table/data_connections_table', () => ({
  DataConnectionsTableWithRouter: () => <div>DataConnectionsTableWithRouter</div>,
}));
jest.mock('../create_button', () => ({
  // @ts-expect-error TS7031 TODO(ts-error): fixme
  CreateButton: ({ history, dataTestSubj }) => (
    <button data-test-subj={dataTestSubj} onClick={() => history.push('/create')}>
      Create Data Source
    </button>
  ),
}));

describe('DataConnectionsHomePanel', () => {
  const mockedContext = {
    services: {
      setBreadcrumbs: jest.fn(),
      notifications: {},
      http: {},
      savedObjects: {},
      uiSettings: {},
      application: { capabilities: { dataSource: { canManage: true } } },
      docLinks: {
        links: {
          opensearchDashboards: {
            dataSource: {
              guide: 'https://opensearch.org/docs/latest/dashboards/discover/multi-data-sources/',
            },
          },
        },
      },
      navigation: navigationPluginMock.createStartContract(),
    },
  };

  beforeAll(() => {
    (useOpenSearchDashboards as jest.Mock).mockReturnValue(mockedContext);
    (getListBreadcrumbs as jest.Mock).mockReturnValue([{ text: 'Data sources' }]);
  });

  const defaultProps: RouteComponentProps & { featureFlagStatus: boolean } = {
    featureFlagStatus: true,
    history: { push: jest.fn() } as any,
    location: {} as any,
    match: {} as any,
  };

  const shallowComponent = (props = defaultProps) =>
    shallow(<DataConnectionsHomePanel useNewUX={false} {...props} />);
  const mountComponent = (props = defaultProps) =>
    mount(<DataConnectionsHomePanel useNewUX={false} {...props} />);

  test('renders correctly', () => {
    const wrapper = shallowComponent();
    expect(wrapper).toMatchSnapshot();
  });

  test('renders one table for every connection, without tabs', () => {
    const wrapper = mountComponent();
    expect(wrapper.find(EuiTab)).toHaveLength(0);
    expect(wrapper.find(DataConnectionsTableWithRouter)).toHaveLength(1);
    expect(wrapper.find(DataConnectionsTableWithRouter).prop('featureFlagStatus')).toBe(true);
  });

  test('renders one table without tabs in the new UX', () => {
    const wrapper = mount(<DataConnectionsHomePanel useNewUX={true} {...defaultProps} />);
    expect(wrapper.find(EuiTab)).toHaveLength(0);
    expect(wrapper.find(DataConnectionsTableWithRouter)).toHaveLength(1);
  });

  test('does not render any tab when featureFlagStatus is false', () => {
    const wrapper = shallowComponent({ ...defaultProps, featureFlagStatus: false });
    expect(wrapper.find(EuiTab)).toHaveLength(0);
  });

  test('calls history.push when CreateButton is clicked', () => {
    const historyMock = { push: jest.fn() };
    // @ts-expect-error TS2740 TODO(ts-error): fixme
    const wrapper = mountComponent({ ...defaultProps, history: historyMock });
    wrapper.find('button[data-test-subj="createDataSourceButton"]').simulate('click');
    expect(historyMock.push).toHaveBeenCalledWith('/create');
  });

  describe('direct query connection flows', () => {
    const anyFlowButton = 'button[data-test-subj^="directQueryConnectionFlowButton-"]';
    const createButton = 'button[data-test-subj="createDataSourceButton"]';
    const createFlow = (
      overrides: Partial<DirectQueryConnectionFlow> = {}
    ): DirectQueryConnectionFlow => ({
      id: 'example-flow',
      title: 'Example connection',
      buttonLabel: 'Connect example data source',
      mount: jest.fn(() => jest.fn()),
      ...overrides,
    });
    const withFlows = (flows: DirectQueryConnectionFlow[], canManage = true) => {
      const registry = new DirectQueryConnectionFlowRegistry();
      flows.forEach((flow) => registry.registerDirectQueryConnectionFlow(flow));
      const navigation = navigationPluginMock.createStartContract();
      (useOpenSearchDashboards as jest.Mock).mockReturnValue({
        services: {
          ...mockedContext.services,
          application: {
            capabilities: { dataSource: { canManage } },
            setAppRightControls: jest.fn(),
            setAppDescriptionControls: jest.fn(),
          },
          navigation,
          directQueryConnectionFlowRegistry: registry,
        },
      });
      return { registry, navigation };
    };
    const mountAndFlush = async (props: any, useNewUX = false) => {
      let wrapper: any;
      await act(async () => {
        wrapper = mount(<DataConnectionsHomePanel useNewUX={useNewUX} {...props} />);
      });
      // resolve isVisible promises
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
      wrapper.update();
      return wrapper;
    };

    afterEach(() => {
      (useOpenSearchDashboards as jest.Mock).mockReturnValue(mockedContext);
    });

    test.each([true, false])(
      'shows only the Create button, no button per visible flow (multiple data sources %s)',
      async (featureFlagStatus) => {
        withFlows([
          createFlow({ isVisible: () => Promise.resolve(true) }),
          createFlow({ id: 'other-flow' }),
        ]);
        const historyMock = { push: jest.fn() };
        const wrapper = await mountAndFlush({
          ...defaultProps,
          featureFlagStatus,
          history: historyMock,
        });
        expect(wrapper.find(anyFlowButton)).toHaveLength(0);
        wrapper.find(createButton).simulate('click');
        expect(historyMock.push).toHaveBeenCalledWith('/create');
      }
    );

    test('gives the header only the Create button in the new UX', async () => {
      const { navigation } = withFlows([createFlow()]);
      const historyMock = { push: jest.fn() };
      await mountAndFlush({ ...defaultProps, history: historyMock }, true);
      const HeaderControl = navigation.ui.HeaderControl as jest.Mock;
      const lastRightControls = HeaderControl.mock.calls
        .map(([controlProps]) => controlProps.controls)
        .filter((controls) => controls.some((c: any) => c.id === 'Create data source'))
        .pop();
      expect(lastRightControls.map((c: any) => c.id)).toEqual(['Create data source']);
      lastRightControls[0].run();
      expect(historyMock.push).toHaveBeenCalledWith('/create');
    });

    test.each([true, false])(
      'names the header button Create data connection, with the plus icon (multiple data sources %s)',
      async (featureFlagStatus) => {
        const { navigation } = withFlows([createFlow()]);
        await mountAndFlush({ ...defaultProps, featureFlagStatus }, true);
        const HeaderControl = navigation.ui.HeaderControl as jest.Mock;
        const create = HeaderControl.mock.calls
          .flatMap(([controlProps]) => controlProps.controls)
          .filter((c: any) => c.id === 'Create data source')
          .pop();
        expect(create).toEqual(
          expect.objectContaining({ label: 'Create data connection', iconType: 'plus', fill: true })
        );
      }
    );

    test('shows no buttons when the user cannot manage data sources', async () => {
      withFlows([createFlow()], false);
      const wrapper = await mountAndFlush(defaultProps);
      expect(wrapper.find(anyFlowButton)).toHaveLength(0);
      expect(wrapper.find(createButton).exists()).toBe(false);
    });

    // A flow may not require data source management; its card is then a type the user can connect.
    const openFlowWithCard = (overrides: Partial<DirectQueryConnectionFlow> = {}) =>
      createFlow({
        requiresDataSourceManagement: false,
        createPageCard: { description: 'Example data connection' },
        ...overrides,
      });

    test('shows the Create button to a user who cannot manage data sources but has a type card', async () => {
      withFlows([openFlowWithCard()], false);
      const historyMock = { push: jest.fn() };
      const wrapper = await mountAndFlush({ ...defaultProps, history: historyMock });
      expect(wrapper.find(anyFlowButton)).toHaveLength(0);
      wrapper.find(createButton).simulate('click');
      expect(historyMock.push).toHaveBeenCalledWith('/create');
    });

    test('gives the header the Create button for that user in the new UX', async () => {
      const { navigation } = withFlows([openFlowWithCard()], false);
      await mountAndFlush(defaultProps, true);
      const HeaderControl = navigation.ui.HeaderControl as jest.Mock;
      const ids = HeaderControl.mock.calls
        .flatMap(([controlProps]) => controlProps.controls)
        .map((c: any) => c.id);
      expect(ids).toContain('Create data source');
    });

    test.each([
      ['its flow requires data source management', { requiresDataSourceManagement: undefined }],
      ['its flow is hidden', { isVisible: () => Promise.resolve(false) }],
      ['its flow has no card', { createPageCard: undefined }],
    ])(
      'shows no Create button to a user who cannot manage data sources when %s',
      async (_name, overrides) => {
        const { navigation } = withFlows([openFlowWithCard(overrides)], false);
        const wrapper = await mountAndFlush(defaultProps);
        expect(wrapper.find(createButton).exists()).toBe(false);
        await mountAndFlush(defaultProps, true);
        const HeaderControl = navigation.ui.HeaderControl as jest.Mock;
        const ids = HeaderControl.mock.calls
          .flatMap(([controlProps]) => controlProps.controls)
          .map((c: any) => c.id);
        expect(ids).not.toContain('Create data source');
      }
    );

    test('ignores the tab state of links made before the tabs were merged', async () => {
      withFlows([createFlow()]);
      const wrapper = await mountAndFlush({
        ...defaultProps,
        location: { state: { selectedTabId: 'manageDirectQueryDataSources' } },
      });
      expect(wrapper.find(EuiTab)).toHaveLength(0);
      expect(wrapper.find(DataConnectionsTableWithRouter)).toHaveLength(1);
      expect(wrapper.find(anyFlowButton)).toHaveLength(0);
    });
  });
});
