/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';
import { InactiveDataConnectionCallout } from './inactive_data_connection_callout';
import { EuiCallOut, EuiButton } from '@elastic/eui';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { DirectQueryDatasourceType } from '../../../../types';
import { DATACONNECTIONS_BASE, DATACONNECTIONS_UPDATE_STATUS, EDIT } from '../../../../constants';
import { act } from 'react-dom/test-utils';

jest.mock('../../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn(),
}));

describe('InactiveDataConnectionCallout', () => {
  const mockFetchSelectedDatasource = jest.fn();
  const mockAddSuccess = jest.fn();
  const mockAddDanger = jest.fn();
  const mockPost = jest.fn().mockResolvedValue({});
  const mockUseOpenSearchDashboards = useOpenSearchDashboards as jest.Mock;
  mockUseOpenSearchDashboards.mockReturnValue({
    services: {
      notifications: {
        toasts: {
          addSuccess: mockAddSuccess,
          addDanger: mockAddDanger,
        },
      },
      http: {
        post: mockPost,
      },
    },
  });

  const defaultProps = {
    datasourceDetails: {
      name: 'TestDataSource',
      description: 'Test Description',
      connector: 'PROMETHEUS' as DirectQueryDatasourceType, // Use the correct type here
      properties: {},
      allowedRoles: [],
      status: 'inactive',
    },
    fetchSelectedDatasource: mockFetchSelectedDatasource,
  };

  const shallowComponent = (props = defaultProps) =>
    shallow(<InactiveDataConnectionCallout {...props} />);

  test('renders correctly', () => {
    const wrapper = shallowComponent();
    expect(wrapper).toMatchSnapshot();
  });

  test('displays the correct callout title and body text', () => {
    const wrapper = shallowComponent();
    const callout = wrapper.find(EuiCallOut);
    expect(callout.prop('title')).toEqual('This data source connection is inactive');
    expect(callout.find('p').text()).toEqual(
      'Associated objects and accelerations are not available while this connection is inactive.'
    );
  });

  test('calls enableDataSource when the button is clicked', () => {
    const wrapper = shallowComponent();
    wrapper.find(EuiButton).simulate('click');
    expect(mockPost).toHaveBeenCalledWith(
      `${DATACONNECTIONS_BASE}${EDIT}${DATACONNECTIONS_UPDATE_STATUS}`,
      {
        body: JSON.stringify({ name: defaultProps.datasourceDetails.name, status: 'active' }),
      }
    );
  });

  test('shows success toast when enabling is successful', async () => {
    const wrapper = shallowComponent();
    await act(async () => {
      wrapper.find(EuiButton).simulate('click');
    });
    expect(mockAddSuccess).toHaveBeenCalledWith(
      'Data connection TestDataSource enabled successfully'
    );
    expect(mockFetchSelectedDatasource).toHaveBeenCalled();
  });

  test('shows danger toast when enabling fails', async () => {
    mockPost.mockRejectedValueOnce(new Error('Error enabling data connection'));
    const wrapper = shallowComponent();
    await act(async () => {
      wrapper.find(EuiButton).simulate('click');
    });
    expect(mockAddDanger).toHaveBeenCalledWith(
      'Data connection TestDataSource could not be enabled.'
    );
  });
});
