/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mount } from 'enzyme';
import { DatasetSelector } from './dataset_selector';
import { getQueryService } from '../../services';
import { CoreStart } from 'opensearch-dashboards/public';
import { DataStorage, Dataset } from '../../../common';
import { IDataPluginServices, DataPublicPluginStart } from '../../types';
import { DatasetTypeConfig } from '../..';

jest.mock('../../services', () => ({
  getQueryService: jest.fn(),
}));

describe('DatasetSelector', () => {
  const nextTick = () => new Promise((res) => process.nextTick(res));

  const fetchMock = jest.fn().mockResolvedValue([]);
  const setDatasetsMock = jest.fn();
  const mockDatasetTypeConfig: DatasetTypeConfig = {
    id: 'mockType',
    title: 'Mock Type',
    meta: { icon: { type: 'mockIcon' }, tooltip: 'Mock Tooltip' },
    fetch: fetchMock,
    toDataset: jest.fn(),
    fetchFields: jest.fn(),
    supportedLanguages: jest.fn().mockReturnValue(['mockLanguage']),
  };

  const getTypeMock = jest.fn().mockReturnValue(mockDatasetTypeConfig);

  const mockServices: IDataPluginServices = {
    appName: 'testApp',
    uiSettings: {} as CoreStart['uiSettings'],
    savedObjects: {} as CoreStart['savedObjects'],
    notifications: ({
      toasts: {
        addSuccess: jest.fn(),
        addError: jest.fn(),
      },
    } as unknown) as CoreStart['notifications'],
    http: {} as CoreStart['http'],
    storage: {} as DataStorage,
    data: {} as DataPublicPluginStart,
    overlays: ({
      openModal: jest.fn(),
    } as unknown) as CoreStart['overlays'],
  };

  beforeEach(() => {
    (getQueryService as jest.Mock).mockReturnValue({
      queryString: {
        getDatasetService: jest.fn().mockReturnValue({
          getType: getTypeMock,
          getRecentDatasets: jest.fn().mockReturnValue([]),
          addRecentDataset: jest.fn(),
        }),
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch datasets once on mount', async () => {
    const props = {
      selectedDataset: undefined as Dataset | undefined,
      onSelect: jest.fn(),
      services: mockServices,
    };

    const wrapper = mount(<DatasetSelector {...props} />);

    await nextTick();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('should not fetch datasets on re-render', async () => {
    const props = {
      selectedDataset: undefined as Dataset | undefined,
      onSelect: jest.fn(),
      services: mockServices,
    };

    const wrapper = mount(<DatasetSelector {...props} />);
    await nextTick();

    // Simulate a re-render
    wrapper.setProps({});
    await nextTick();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('should not update datasets state on re-render', async () => {
    const props = {
      selectedDataset: undefined as Dataset | undefined,
      onSelect: jest.fn(),
      services: mockServices,
    };

    const wrapper = mount(<DatasetSelector {...props} />);
    await nextTick();

    setDatasetsMock.mockClear();

    // Simulate a re-render
    wrapper.setProps({});
    await nextTick();

    expect(setDatasetsMock).not.toHaveBeenCalled();
  });
});
