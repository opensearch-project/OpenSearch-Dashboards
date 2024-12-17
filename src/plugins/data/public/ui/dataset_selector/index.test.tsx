/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mount } from 'enzyme';
import { DatasetSelector as ConnectedDatasetSelector } from './index';
import { DatasetSelector } from './dataset_selector';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { Dataset, Query } from '../../../common';

jest.mock('../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn(),
}));

jest.mock('./dataset_selector', () => ({
  DatasetSelector: jest.fn(() => null),
}));

describe('ConnectedDatasetSelector', () => {
  const mockSubscribe = jest.fn();
  const mockUnsubscribe = jest.fn();
  const mockQueryString = {
    getQuery: jest.fn().mockReturnValue({}),
    getDefaultQuery: jest.fn().mockReturnValue({}),
    getInitialQuery: jest.fn().mockReturnValue({}),
    setQuery: jest.fn(),
    getDatasetService: jest.fn().mockReturnValue({
      addRecentDataset: jest.fn(),
    }),
    getUpdates$: jest.fn().mockReturnValue({
      subscribe: mockSubscribe.mockReturnValue({ unsubscribe: mockUnsubscribe }),
    }),
  };
  const mockOnSubmit = jest.fn();
  const mockServices = {
    data: {
      query: {
        // @ts-ignore
        queryString: mockQueryString,
      },
    },
  };

  beforeEach(() => {
    (useOpenSearchDashboards as jest.Mock).mockReturnValue({ services: mockServices });
  });

  it('should render DatasetSelector with correct props', () => {
    const wrapper = mount(<ConnectedDatasetSelector onSubmit={mockOnSubmit} />);
    expect(wrapper.find(DatasetSelector).props()).toEqual({
      selectedDataset: undefined,
      onSelect: expect.any(Function),
      services: mockServices,
    });
  });

  it('should initialize selectedDataset correctly', () => {
    const mockDataset: Dataset = { id: 'initial', title: 'Initial Dataset', type: 'test' };
    mockQueryString.getQuery.mockReturnValueOnce({ dataset: mockDataset });

    const wrapper = mount(<ConnectedDatasetSelector onSubmit={mockOnSubmit} />);
    expect(wrapper.find(DatasetSelector).prop('selectedDataset')).toEqual(mockDataset);
  });

  it('should call handleDatasetChange only once when dataset changes', () => {
    const wrapper = mount(<ConnectedDatasetSelector onSubmit={mockOnSubmit} />);
    const onSelect = wrapper.find(DatasetSelector).prop('onSelect') as (
      query: Partial<Query>
    ) => void;

    const newDataset: Dataset = { id: 'test', title: 'Test Dataset', type: 'test' };
    onSelect(newDataset);

    expect(mockQueryString.getInitialQuery).toHaveBeenCalledTimes(1);
    expect(mockQueryString.setQuery).toHaveBeenCalledTimes(1);
    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
  });
});
