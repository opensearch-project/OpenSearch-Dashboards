/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';
import { AccelerationDetailsTab } from './acceleration_details_tab';
import { ApplicationStart } from 'opensearch-dashboards/public';

const mockApplication = ({
  navigateToApp: jest.fn(),
} as unknown) as ApplicationStart;

const mockAcceleration = {
  flintIndexName: 'flint_index',
  kind: 'skipping',
  database: 'default',
  table: 'test_table',
  indexName: 'actual_index',
  autoRefresh: false,
  status: 'active',
};

const mockSettings = {
  settings: {
    index: {
      creation_date: '1627843985000',
    },
  },
};

const mockMappings = {
  data: {
    flint_index: {
      mappings: {
        _meta: {
          kind: 'skipping',
          options: {
            incremental_refresh: true,
            refresh_interval: '5m',
            checkpoint_location: '/checkpoints/location',
          },
        },
      },
    },
  },
};

const mockIndexInfo = {
  data: [
    {
      index: 'flint_index',
      health: 'green',
    },
  ],
};

describe('AccelerationDetailsTab', () => {
  const defaultProps = {
    acceleration: mockAcceleration,
    settings: mockSettings,
    mappings: mockMappings,
    indexInfo: mockIndexInfo,
    dataSourceName: 'test_data_source',
    resetFlyout: jest.fn(),
    application: mockApplication,
    featureFlagStatus: true,
    dataSourceMDSId: 'mds_id',
  };

  const shallowComponent = (props = defaultProps) => shallow(<AccelerationDetailsTab {...props} />);

  beforeAll(() => {
    // Mock the Date.now() method to always return a specific timestamp
    jest.spyOn(Date, 'now').mockImplementation(() => 1627843985000); // 2021-08-01T18:53:05.000Z

    // Mock toLocaleString to return a fixed string
    // eslint-disable-next-line no-extend-native
    Date.prototype.toLocaleString = jest.fn(() => '8/1/2021, 2:53:05 PM');
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  test('renders correctly', () => {
    const wrapper = shallowComponent();
    expect(wrapper).toMatchSnapshot();
  });

  test('displays the correct status', () => {
    const wrapper = shallowComponent();
    const statusNode = wrapper.find('DetailComponent[title="Status"]');
    expect(statusNode.prop('description').props.status).toBe('active');
  });

  test('displays the correct creation date', () => {
    const wrapper = shallowComponent();
    const creationDateNode = wrapper.find('DetailComponent[title="Creation Date"]');
    const displayedDate = creationDateNode.prop('description') as string;
    expect(displayedDate).toBe('8/1/2021, 2:53:05 PM');
  });

  test('displays the correct refresh type', () => {
    const wrapper = shallowComponent();
    const refreshTypeNode = wrapper.find('DetailComponent[title="Refresh type"]');
    expect(refreshTypeNode.prop('description')).toBe('Manual');
  });

  test('displays the correct refresh time', () => {
    const wrapper = shallowComponent();
    const refreshTimeNode = wrapper.find('DetailComponent[title="Refresh time"]');
    expect(refreshTimeNode.prop('description')).toBe('5m');
  });

  test('displays the correct checkpoint location', () => {
    const wrapper = shallowComponent();
    const checkpointLocationNode = wrapper.find('DetailComponent[title="Checkpoint location"]');
    expect(checkpointLocationNode.prop('description')).toBe('/checkpoints/location');
  });

  test('displays the correct data source connection link and handles click', () => {
    const wrapper = shallowComponent();
    const dataSourceNode = wrapper.find('DetailComponent[title="Data source connection"]');
    const linkNode = dataSourceNode.prop('description');
    expect(linkNode.props.children).toBe('test_data_source');
    linkNode.props.onClick();
    expect(mockApplication.navigateToApp).toHaveBeenCalledWith('management', {
      path: `/opensearch-dashboards/dataSources/manage/test_data_source?dataSourceMDSId=mds_id`,
      replace: true,
    });
    expect(defaultProps.resetFlyout).toHaveBeenCalled();
  });

  test('does not display index details for skipping index', () => {
    const wrapper = shallowComponent();
    expect(wrapper.find('TitleComponent[title="Index details"]')).toHaveLength(0);
  });

  test('displays index details for non-skipping index', () => {
    const nonSkippingProps = {
      ...defaultProps,
      mappings: {
        data: {
          flint_index: {
            mappings: {
              _meta: {
                kind: 'covering',
                options: {
                  incremental_refresh: true,
                  refresh_interval: '5m',
                  checkpoint_location: '/checkpoints/location',
                },
              },
            },
          },
        },
      },
    };
    const wrapper = shallowComponent(nonSkippingProps);
    expect(wrapper.find('TitleComponent[title="Index details"]')).toHaveLength(1);
  });
});
