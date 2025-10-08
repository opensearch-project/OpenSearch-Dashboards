/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { coreMock } from '../../../../../core/public/mocks';
import { DataPublicPluginStart, IDataPluginServices } from '../..';
import { DataStorage, DEFAULT_DATA } from '../../../common';
import { dataPluginMock } from '../../mocks';
import { queryServiceMock } from '../../query/mocks';
import { getQueryService } from '../../services';
import DatasetSelect, { DatasetSelectProps } from './dataset_select';
import { OpenSearchDashboardsContextProvider } from '../../../../opensearch_dashboards_react/public';
import { I18nProvider } from '@osd/i18n/react';

jest.mock('../../services', () => ({
  getQueryService: jest.fn(),
}));

describe('DatasetSelect', () => {
  const mockOnSelect = jest.fn();
  const mockQuery = {
    dataset: {
      id: 'index-pattern-id',
      title: 'Test Index Pattern',
      type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
    },
  };

  // Use the proper mock utilities
  const mockCore = coreMock.createStart();
  const mockDataStartContract = dataPluginMock.createStartContract();
  const mockQueryService = queryServiceMock.createSetupContract();

  // Setup query service
  mockQueryService.queryString.getQuery = jest.fn().mockReturnValue(mockQuery);
  mockQueryService.queryString.getDatasetService = jest.fn().mockReturnValue({
    getType: jest.fn().mockReturnValue({
      id: 'index-pattern',
      title: 'Index Pattern',
      meta: {
        icon: {
          type: 'database',
        },
        supportedAppNames: undefined, // undefined means supported by all apps
      },
    }),
    cacheDataset: jest.fn(),
  });

  // Setup dataViews service
  const mockDataViewData = {
    id: 'index-pattern-id',
    title: 'Test Index Pattern',
    displayName: 'Test Index Pattern Display Name',
    description: 'Test Index Pattern Description',
    timeFieldName: '@timestamp',
  };

  const mockDataViews = {
    getIds: jest.fn().mockImplementation((refreshFields) => {
      return Promise.resolve(['index-pattern-id']);
    }),
    get: jest.fn().mockImplementation((id) => {
      return Promise.resolve({
        ...mockDataViewData,
        id,
      });
    }),
    getDefault: jest.fn().mockResolvedValue(mockDataViewData),
    convertToDataset: jest.fn().mockImplementation((dataView) => {
      return Promise.resolve({
        id: dataView.id,
        title: dataView.title,
        type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
      });
    }),
    clearCache: jest.fn(),
  };

  // Create services for the component
  const mockServices: IDataPluginServices = {
    appName: 'testApp',
    uiSettings: mockCore.uiSettings,
    savedObjects: mockCore.savedObjects,
    notifications: mockCore.notifications,
    http: mockCore.http,
    storage: {} as DataStorage,
    data: ({
      ...mockDataStartContract,
      dataViews: mockDataViews,
      query: {
        queryString: mockQueryService.queryString,
      },
    } as unknown) as DataPublicPluginStart,
    overlays: mockCore.overlays,
    application: mockCore.application,
  };

  const defaultProps: DatasetSelectProps = {
    onSelect: mockOnSelect,
    singalType: null,
  };

  const renderWithContext = (props: DatasetSelectProps = defaultProps) => {
    return render(
      <I18nProvider>
        <OpenSearchDashboardsContextProvider services={mockServices}>
          <DatasetSelect {...props} />
        </OpenSearchDashboardsContextProvider>
      </I18nProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getQueryService as jest.Mock).mockReturnValue(mockQueryService);
  });

  it('renders the DatasetSelect component', async () => {
    renderWithContext();

    await waitFor(() => {
      expect(mockDataViews.getIds).toHaveBeenCalled();
    });

    expect(screen.getByTestId('datasetSelectButton')).toBeInTheDocument();
  });

  it('shows the selected dataset title', async () => {
    renderWithContext();

    await waitFor(() => {
      expect(mockDataViews.get).toHaveBeenCalled();
    });

    expect(screen.getByText('Test Index Pattern Display Name')).toBeInTheDocument();
  });

  it('opens the popover when clicked', async () => {
    renderWithContext();

    await waitFor(() => {
      expect(mockDataViews.getIds).toHaveBeenCalled();
    });

    const button = screen.getByTestId('datasetSelectButton');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
    });
  });

  it.skip('selects a dataset when option is clicked', async () => {
    renderWithContext();

    await waitFor(() => {
      expect(mockDataViews.getIds).toHaveBeenCalled();
    });

    const button = screen.getByTestId('datasetSelectButton');
    fireEvent.click(button);

    await waitFor(() => {
      const datasetOption = screen.getByTestId('datasetSelectOption-index-pattern-id');
      expect(datasetOption).toBeInTheDocument();
      fireEvent.click(datasetOption);
    });

    expect(mockOnSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'index-pattern-id',
      })
    );
  });

  it('opens advanced selector when advanced button is clicked', async () => {
    renderWithContext();

    await waitFor(() => {
      expect(mockDataViews.getIds).toHaveBeenCalled();
    });

    const button = screen.getByTestId('datasetSelectButton');
    fireEvent.click(button);

    await waitFor(() => {
      const advancedButton = screen.getByTestId('datasetSelectAdvancedButton');
      expect(advancedButton).toBeInTheDocument();
      fireEvent.click(advancedButton);
    });

    expect(mockCore.overlays.openModal).toHaveBeenCalled();
  });

  it('selects default dataset if no current dataset', async () => {
    mockQueryService.queryString.getQuery = jest.fn().mockReturnValue({ dataset: null });
    renderWithContext();

    await waitFor(() => {
      expect(mockDataViews.getDefault).toHaveBeenCalled();
      expect(mockOnSelect).toHaveBeenCalled();
    });
  });

  it('filters datasets by supportedAppNames', async () => {
    // Create a dataset type that only supports 'otherApp'
    const mockGetTypeRestricted = jest.fn().mockReturnValue({
      id: 'restricted-type',
      title: 'Restricted Type',
      meta: {
        icon: { type: 'database' },
        supportedAppNames: ['otherApp'], // Does not include 'testApp'
      },
    });

    mockQueryService.queryString.getDatasetService = jest.fn().mockReturnValue({
      getType: mockGetTypeRestricted,
      cacheDataset: jest.fn(),
    });

    // Mock a dataset with the restricted type
    mockDataViews.getIds = jest.fn().mockResolvedValue(['restricted-id']);
    mockDataViews.get = jest.fn().mockResolvedValue({
      id: 'restricted-id',
      title: 'Restricted Dataset',
      displayName: 'Restricted Dataset',
      type: 'restricted-type',
    });
    mockDataViews.convertToDataset = jest.fn().mockResolvedValue({
      id: 'restricted-id',
      title: 'Restricted Dataset',
      type: 'restricted-type',
    });

    renderWithContext();

    await waitFor(() => {
      expect(mockDataViews.getIds).toHaveBeenCalled();
    });

    // The dataset should be filtered out since it doesn't support 'testApp'
    const button = screen.getByTestId('datasetSelectButton');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
    });

    // The restricted dataset should not appear in the list
    expect(screen.queryByText('Restricted Dataset')).not.toBeInTheDocument();
  });

  it('includes datasets when supportedAppNames is undefined', async () => {
    // Dataset type with undefined supportedAppNames (supports all apps)
    const mockGetTypeAll = jest.fn().mockReturnValue({
      id: 'all-apps-type',
      title: 'All Apps Type',
      meta: {
        icon: { type: 'database' },
        supportedAppNames: undefined,
      },
    });

    mockQueryService.queryString.getDatasetService = jest.fn().mockReturnValue({
      getType: mockGetTypeAll,
      cacheDataset: jest.fn(),
    });

    mockDataViews.getIds = jest.fn().mockResolvedValue(['all-apps-id']);
    mockDataViews.get = jest.fn().mockResolvedValue({
      id: 'all-apps-id',
      title: 'all-apps-dataset',
      displayName: 'All Apps Dataset',
      type: 'all-apps-type',
    });
    mockDataViews.convertToDataset = jest.fn().mockResolvedValue({
      id: 'all-apps-id',
      title: 'all-apps-dataset',
      type: 'all-apps-type',
    });
    mockQueryService.queryString.getQuery = jest.fn().mockReturnValue({
      dataset: {
        id: 'all-apps-id',
        title: 'all-apps-dataset',
        type: 'all-apps-type',
      },
    });

    renderWithContext();

    await waitFor(() => {
      expect(mockDataViews.getIds).toHaveBeenCalled();
      expect(mockDataViews.get).toHaveBeenCalled();
    });

    const button = screen.getByTestId('datasetSelectButton');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
    });

    // The dataset should appear since supportedAppNames is undefined (checking by display name)
    const allAppsElements = screen.getAllByText('All Apps Dataset');
    expect(allAppsElements.length).toBeGreaterThan(0);
  });
});
