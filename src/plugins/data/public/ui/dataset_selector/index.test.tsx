/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mount } from 'enzyme';
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
  const mockQueryString = {
    getQuery: jest.fn().mockReturnValue({}),
    getDefaultQuery: jest.fn().mockReturnValue({}),
    getInitialQueryByDataset: jest.fn().mockReturnValue({}),
    setQuery: jest.fn(),
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
      setSelectedDataset: expect.any(Function),
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
    const setSelectedDataset = wrapper.find(DatasetSelector).prop('setSelectedDataset') as (
      dataset?: Dataset
    ) => void;

    const newDataset: Dataset = { id: 'test', title: 'Test Dataset', type: 'test' };
    setSelectedDataset(newDataset);

    expect(mockQueryString.getInitialQueryByDataset).toHaveBeenCalledTimes(1);
    expect(mockQueryString.setQuery).toHaveBeenCalledTimes(1);
    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
  });
});
