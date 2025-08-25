/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act } from 'react-dom/test-utils';
import { mount } from 'enzyme';
import { createDatasetSelect } from './create_dataset_select';
import { coreMock } from '../../../../../core/public/mocks';
import { dataPluginMock } from '../../mocks';
import { DatasetSelect } from './index';
import { DataStorage } from '../../../common';

describe('createDatasetSelect', () => {
  const core = coreMock.createStart();
  const mockData = dataPluginMock.createStartContract();
  const mockStorage = ({
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
    clear: jest.fn(),
  } as unknown) as DataStorage;

  const mockOnSelect = jest.fn();
  const mockAppName = 'testApp';

  it('creates a wrapped DatasetSelect component', async () => {
    const CreatedDatasetSelect = createDatasetSelect({
      core,
      data: mockData,
      storage: mockStorage,
    });

    expect(typeof CreatedDatasetSelect).toBe('function');

    const wrapper = mount(<CreatedDatasetSelect onSelect={mockOnSelect} appName={mockAppName} />);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    wrapper.update();

    expect(wrapper.find(DatasetSelect).exists()).toBe(true);

    const datasetSelectProps = wrapper.find(DatasetSelect).props();
    expect(datasetSelectProps.onSelect).toBe(mockOnSelect);
    expect(datasetSelectProps.appName).toBe(mockAppName);
  });

  it('provides required services to the OpenSearchDashboardsContextProvider', async () => {
    const CreatedDatasetSelect = createDatasetSelect({
      core,
      data: mockData,
      storage: mockStorage,
    });

    const wrapper = mount(<CreatedDatasetSelect onSelect={mockOnSelect} appName={mockAppName} />);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    wrapper.update();

    expect(wrapper.find(DatasetSelect).props().appName).toBe(mockAppName);

    expect(wrapper.find(DatasetSelect)).toHaveLength(1);
  });

  it('passes custom appName prop to context', async () => {
    const customAppName = 'customApp';
    const CreatedDatasetSelect = createDatasetSelect({
      core,
      data: mockData,
      storage: mockStorage,
    });

    const wrapper = mount(<CreatedDatasetSelect onSelect={mockOnSelect} appName={customAppName} />);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    wrapper.update();

    expect(wrapper.find(DatasetSelect).props().appName).toBe(customAppName);
  });
});
