/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mount } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { DatasetSelector as ConnectedDatasetSelector } from './index';
import { DatasetSelector } from './dataset_selector';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { Dataset } from '../../../common';

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
    getInitialQueryByDataset: jest.fn().mockReturnValue({}),
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
        queryString: mockQueryString,
      },
    },
  };

  beforeEach(() => {
    (useOpenSearchDashboards as jest.Mock).mockReturnValue({ services: mockServices });
    jest.clearAllMocks();
  });

  it('should render DatasetSelector with correct props', () => {
    const wrapper = mount(
      <ConnectedDatasetSelector
        onSubmit={mockOnSubmit}
        selectedDataset={undefined}
        setSelectedDataset={jest.fn()}
        setIndexPattern={jest.fn()}
        services={mockServices}
      />
    );
    expect(wrapper.find(DatasetSelector).props()).toEqual({
      selectedDataset: undefined,
      setSelectedDataset: expect.any(Function),
      setIndexPattern: expect.any(Function),
      handleDatasetChange: expect.any(Function),
      services: mockServices,
    });
  });

  it('should initialize selectedDataset correctly', () => {
    const mockDataset: Dataset = { id: 'initial', title: 'Initial Dataset', type: 'test' };

    const wrapper = mount(
      <ConnectedDatasetSelector
        onSubmit={mockOnSubmit}
        selectedDataset={mockDataset}
        setSelectedDataset={jest.fn()}
        setIndexPattern={jest.fn()}
        services={mockServices}
      />
    );
    expect(wrapper.find(DatasetSelector).prop('selectedDataset')).toEqual(mockDataset);
  });

  it('should call handleDatasetChange only once when dataset changes', () => {
    const setSelectedDataset = jest.fn();
    const setIndexPattern = jest.fn();
    const wrapper = mount(
      <ConnectedDatasetSelector
        onSubmit={mockOnSubmit}
        selectedDataset={undefined}
        setSelectedDataset={setSelectedDataset}
        setIndexPattern={setIndexPattern}
        services={mockServices}
      />
    );
    const handleDatasetChange = wrapper.find(DatasetSelector).prop('handleDatasetChange') as (
      dataset?: Dataset
    ) => void;

    const newDataset: Dataset = { id: 'test', title: 'Test Dataset', type: 'test' };
    act(() => {
      handleDatasetChange(newDataset);
    });

    expect(mockQueryString.getInitialQueryByDataset).toHaveBeenCalledTimes(1);
    expect(mockQueryString.setQuery).toHaveBeenCalledTimes(1);
    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    expect(setSelectedDataset).toHaveBeenCalledWith(newDataset);
    expect(setIndexPattern).toHaveBeenCalledWith(newDataset.id);
  });

  it('should subscribe to queryString.getUpdates$ and unsubscribe on unmount', () => {
    const wrapper = mount(
      <ConnectedDatasetSelector
        onSubmit={mockOnSubmit}
        selectedDataset={undefined}
        setSelectedDataset={jest.fn()}
        setIndexPattern={jest.fn()}
        services={mockServices}
      />
    );

    expect(mockQueryString.getUpdates$).toHaveBeenCalledTimes(1);
    expect(mockSubscribe).toHaveBeenCalledTimes(1);

    wrapper.unmount();

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });
});
