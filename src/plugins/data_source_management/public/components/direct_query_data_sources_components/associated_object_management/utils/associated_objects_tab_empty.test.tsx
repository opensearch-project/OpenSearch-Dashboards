/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow, mount } from 'enzyme';
import { AssociatedObjectsTabEmpty } from './associated_objects_tab_empty';
import { EuiButton, EuiEmptyPrompt, EuiText } from '@elastic/eui';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { DataSourceManagementContext } from 'src/plugins/data_source_management/public/types';

// Mock useOpenSearchDashboards hook
jest.mock('../../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn(),
}));

describe('AssociatedObjectsTabEmpty', () => {
  const mockNavigateToApp = jest.fn();
  const mockServices = {
    application: {
      navigateToApp: mockNavigateToApp,
    },
  };

  const mockUseOpenSearchDashboards = useOpenSearchDashboards as jest.Mock;
  mockUseOpenSearchDashboards.mockReturnValue({ services: mockServices });

  const defaultProps = {
    cacheType: 'databases' as 'databases' | 'tables',
  };

  const shallowComponent = (props = defaultProps) =>
    shallow(<AssociatedObjectsTabEmpty {...props} />);
  const mountComponent = (props = defaultProps) => mount(<AssociatedObjectsTabEmpty {...props} />);

  test('renders correctly', () => {
    const wrapper = shallowComponent();
    expect(wrapper).toMatchSnapshot();
  });

  test('displays the correct title and body text for databases', () => {
    const wrapper = mountComponent({ cacheType: 'databases' });
    expect(wrapper.find(EuiText).find('h4').text()).toEqual(
      'You have no databases in your data source'
    );
    expect(wrapper.find(EuiText).find('p').text()).toEqual(
      'Add databases and tables to your data source or use Query Workbench'
    );
  });

  test('displays the correct title and body text for tables', () => {
    const wrapper = mountComponent({ cacheType: 'tables' });
    expect(wrapper.find(EuiText).find('h4').text()).toEqual('You have no associated objects');
    expect(wrapper.find(EuiText).find('p').text()).toEqual(
      'Add tables to your data source or use Query Workbench'
    );
  });

  test('renders the Query Workbench button', () => {
    const wrapper = mountComponent();
    expect(wrapper.find(EuiButton).text()).toEqual('Query Workbench');
  });

  test('calls navigateToApp when Query Workbench button is clicked', () => {
    const wrapper = mountComponent();
    wrapper.find(EuiButton).simulate('click');
    expect(mockNavigateToApp).toHaveBeenCalledWith('opensearch-query-workbench');
  });
});
