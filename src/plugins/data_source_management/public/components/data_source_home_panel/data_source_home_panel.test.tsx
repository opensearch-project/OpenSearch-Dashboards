/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow, mount } from 'enzyme';
import { RouteComponentProps } from 'react-router-dom';
import { EuiTab } from '@elastic/eui';
import { DataSourceHomePanel } from './data_source_home_panel';
import { DataSourceTableWithRouter } from '../data_source_table/data_source_table';
import { ManageDirectQueryDataConnectionsTable } from '../direct_query_data_sources_components/direct_query_data_connection/manage_direct_query_data_connections_table';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { getListBreadcrumbs } from '../breadcrumbs';
import { navigationPluginMock } from 'src/plugins/navigation/public/mocks';

jest.mock('../../../../opensearch_dashboards_react/public');
jest.mock('../breadcrumbs');
jest.mock('../data_source_table/data_source_table', () => ({
  DataSourceTableWithRouter: () => <div>DataSourceTableWithRouter</div>,
}));
jest.mock(
  '../direct_query_data_sources_components/direct_query_data_connection/manage_direct_query_data_connections_table',
  () => ({
    ManageDirectQueryDataConnectionsTable: () => <div>ManageDirectQueryDataConnectionsTable</div>,
  })
);
jest.mock('../create_button', () => ({
  CreateButton: ({ history, dataTestSubj }) => (
    <button data-test-subj={dataTestSubj} onClick={() => history.push('/create')}>
      Create Data Source
    </button>
  ),
}));

describe('DataSourceHomePanel', () => {
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

  const shallowComponent = (props = defaultProps) => shallow(<DataSourceHomePanel {...props} />);
  const mountComponent = (props = defaultProps) => mount(<DataSourceHomePanel {...props} />);

  test('renders correctly', () => {
    const wrapper = shallowComponent();
    expect(wrapper).toMatchSnapshot();
  });

  test('renders DataSourceTableWithRouter when manageOpensearchDataSources tab is selected', () => {
    const wrapper = mountComponent();
    wrapper.find(EuiTab).at(0).simulate('click');
    expect(wrapper.find(DataSourceTableWithRouter)).toHaveLength(1);
    expect(wrapper.find(ManageDirectQueryDataConnectionsTable)).toHaveLength(0);
  });

  test('renders ManageDirectQueryDataConnectionsTable when manageDirectQueryDataSources tab is selected', () => {
    const wrapper = mountComponent();
    wrapper.find(EuiTab).at(1).simulate('click');
    expect(wrapper.find(ManageDirectQueryDataConnectionsTable)).toHaveLength(1);
    expect(wrapper.find(DataSourceTableWithRouter)).toHaveLength(0);
  });

  test('handles tab changes', () => {
    const wrapper = mountComponent();
    expect(wrapper.find(DataSourceTableWithRouter)).toHaveLength(1);
    wrapper.find(EuiTab).at(1).simulate('click');
    expect(wrapper.find(ManageDirectQueryDataConnectionsTable)).toHaveLength(1);
  });

  test('does not render OpenSearch connections tab when featureFlagStatus is false', () => {
    const wrapper = shallowComponent({ ...defaultProps, featureFlagStatus: false });
    expect(wrapper.find(EuiTab)).toHaveLength(1);
  });

  test('calls history.push when CreateButton is clicked', () => {
    const historyMock = { push: jest.fn() };
    const wrapper = mountComponent({ ...defaultProps, history: historyMock });
    wrapper.find('button[data-test-subj="createDataSourceButton"]').simulate('click');
    expect(historyMock.push).toHaveBeenCalledWith('/create');
  });
});
