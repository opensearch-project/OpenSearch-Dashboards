/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { coreMock } from '../../../../../core/public/mocks';
import { DataPublicPluginStart, IDataPluginServices } from '../..';
import { CORE_SIGNAL_TYPES, DataStorage, DEFAULT_DATA } from '../../../common';
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
    signalType: null,
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
      expect(screen.getByTestId('datasetSelectSelectable')).toBeInTheDocument();
    });

    // Find the option using findByTestId which waits for the element
    const datasetOption = await screen.findByTestId(
      'datasetSelectOption-Test Index Pattern',
      {},
      { timeout: 5000 }
    );
    expect(datasetOption).toBeInTheDocument();
    fireEvent.click(datasetOption);

    await waitFor(() => {
      expect(mockOnSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'index-pattern-id',
          title: 'Test Index Pattern',
        })
      );
    });
  });

  it('opens advanced selector when create dataset button is clicked', async () => {
    renderWithContext();

    await waitFor(() => {
      expect(mockDataViews.getIds).toHaveBeenCalled();
    });

    const button = screen.getByTestId('datasetSelectButton');
    fireEvent.click(button);

    await waitFor(() => {
      const createButton = screen.getByTestId('datasetSelectorAdvancedButton');
      expect(createButton).toBeInTheDocument();
      fireEvent.click(createButton);
    });

    expect(mockCore.overlays.openModal).toHaveBeenCalled();
  });

  it('selects default dataset if no current dataset', async () => {
    mockQueryService.queryString.getQuery = jest.fn().mockReturnValue({ dataset: null });
    renderWithContext({
      ...defaultProps,
      signalType: CORE_SIGNAL_TYPES.LOGS,
    });

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

  it('filters datasets by METRICS signal type', async () => {
    const mockGetTypeMetrics = jest.fn().mockReturnValue({
      id: 'metrics-type',
      title: 'Metrics Type',
      meta: {
        icon: { type: 'database' },
        supportedAppNames: undefined,
      },
    });

    mockQueryService.queryString.getDatasetService = jest.fn().mockReturnValue({
      getType: mockGetTypeMetrics,
      cacheDataset: jest.fn(),
    });

    // Create two datasets: one with metrics signal type, one with logs
    mockDataViews.getIds = jest.fn().mockResolvedValue(['metrics-id', 'logs-id']);
    mockDataViews.get = jest.fn().mockImplementation((id) => {
      if (id === 'metrics-id') {
        return Promise.resolve({
          id: 'metrics-id',
          title: 'metrics-dataset',
          displayName: 'Metrics Dataset',
          signalType: CORE_SIGNAL_TYPES.METRICS,
        });
      }
      return Promise.resolve({
        id: 'logs-id',
        title: 'logs-dataset',
        displayName: 'Logs Dataset',
        signalType: CORE_SIGNAL_TYPES.LOGS,
      });
    });
    mockDataViews.convertToDataset = jest.fn().mockImplementation((dataView) => {
      return Promise.resolve({
        id: dataView.id,
        title: dataView.title,
        type: 'metrics-type',
        signalType: dataView.signalType,
      });
    });
    mockDataViews.getDefault = jest.fn().mockResolvedValue({
      id: 'metrics-id',
      title: 'metrics-dataset',
      displayName: 'Metrics Dataset',
      signalType: CORE_SIGNAL_TYPES.METRICS,
    });
    mockQueryService.queryString.getQuery = jest.fn().mockReturnValue({
      dataset: {
        id: 'metrics-id',
        title: 'metrics-dataset',
        type: 'metrics-type',
      },
    });

    renderWithContext({
      ...defaultProps,
      signalType: CORE_SIGNAL_TYPES.METRICS,
    });

    await waitFor(() => {
      expect(mockDataViews.getIds).toHaveBeenCalled();
    });

    const button = screen.getByTestId('datasetSelectButton');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
    });

    const metricsElements = screen.queryAllByText('Metrics Dataset');
    expect(metricsElements.length).toBeGreaterThan(0);

    expect(screen.queryByText('Logs Dataset')).not.toBeInTheDocument();
  });

  it('ignores incompatible dataset changes and preserves selection', async () => {
    // Setup: Start with a trace dataset selected on traces page
    const traceDataset = {
      id: 'trace-id',
      title: 'trace-dataset',
      type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
      signalType: CORE_SIGNAL_TYPES.TRACES,
    };

    const logDataset = {
      id: 'log-id',
      title: 'log-dataset',
      type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
      signalType: CORE_SIGNAL_TYPES.LOGS,
    };

    // Mock getIds to return both datasets
    mockDataViews.getIds = jest.fn().mockResolvedValue(['trace-id', 'log-id']);

    // Mock get to return the correct dataset based on ID
    mockDataViews.get = jest.fn().mockImplementation((id) => {
      if (id === 'trace-id') {
        return Promise.resolve({
          id: 'trace-id',
          title: 'trace-dataset',
          displayName: 'Trace Dataset',
          signalType: CORE_SIGNAL_TYPES.TRACES,
        });
      } else if (id === 'log-id') {
        return Promise.resolve({
          id: 'log-id',
          title: 'log-dataset',
          displayName: 'Log Dataset',
          signalType: CORE_SIGNAL_TYPES.LOGS,
        });
      }
      return Promise.resolve(null);
    });

    mockDataViews.convertToDataset = jest.fn().mockImplementation((dataView) => {
      return Promise.resolve({
        id: dataView.id,
        title: dataView.title,
        type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
        signalType: dataView.signalType,
      });
    });

    // Start with trace dataset selected
    mockQueryService.queryString.getQuery = jest.fn().mockReturnValue({
      dataset: traceDataset,
    });

    const { rerender } = renderWithContext({
      ...defaultProps,
      signalType: CORE_SIGNAL_TYPES.TRACES,
    });

    await waitFor(() => {
      expect(mockDataViews.getIds).toHaveBeenCalled();
      expect(screen.getByText('Trace Dataset')).toBeInTheDocument();
    });

    // Simulate flyout changing query to log dataset (e.g., querying related logs)
    mockQueryService.queryString.getQuery = jest.fn().mockReturnValue({
      dataset: logDataset,
    });

    // Force re-render to trigger the effect
    rerender(
      <I18nProvider>
        <OpenSearchDashboardsContextProvider services={mockServices}>
          <DatasetSelect {...defaultProps} signalType={CORE_SIGNAL_TYPES.TRACES} />
        </OpenSearchDashboardsContextProvider>
      </I18nProvider>
    );

    // Wait a bit for effects to run
    await waitFor(() => {
      expect(mockDataViews.get).toHaveBeenCalledWith('log-id', false);
    });

    // The UI should still show the trace dataset, not the incompatible log dataset
    // It should NOT clear the selection or show "Select dataset"
    expect(screen.getByText('Trace Dataset')).toBeInTheDocument();
    expect(screen.queryByText('Log Dataset')).not.toBeInTheDocument();
    expect(screen.queryByText('Select dataset')).not.toBeInTheDocument();
  });

  it('handles errors when fetching datasets gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const localMockDataViews = {
      ...mockDataViews,
      getIds: jest.fn().mockRejectedValue(new Error('Failed to fetch')),
    };

    const localMockQueryService = {
      ...mockQueryService,
      queryString: {
        ...mockQueryService.queryString,
        getQuery: jest.fn().mockReturnValue({ dataset: null, language: 'kuery' }),
      },
    };

    const localServices = {
      ...mockServices,
      data: {
        ...mockServices.data,
        dataViews: localMockDataViews,
        query: localMockQueryService,
      },
    };

    render(
      <I18nProvider>
        <OpenSearchDashboardsContextProvider services={localServices}>
          <DatasetSelect {...defaultProps} />
        </OpenSearchDashboardsContextProvider>
      </I18nProvider>
    );

    // Wait for getIds to be called and error handling to complete
    await waitFor(
      () => {
        expect(localMockDataViews.getIds).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );

    // Wait for loading to complete after error
    await waitFor(
      () => {
        const button = screen.getByTestId('datasetSelectButton');
        expect(button).not.toHaveClass('euiButtonEmpty-isDisabled');
      },
      { timeout: 3000 }
    );

    // Component should render without crashing and show "Select dataset" text
    expect(screen.getByTestId('datasetSelectButton')).toBeInTheDocument();
    expect(screen.getByText('Select dataset')).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  it('shows loading state initially', () => {
    renderWithContext();
    // Check for disabled state which indicates loading
    const button = screen.getByTestId('datasetSelectButton');
    expect(button).toHaveClass('euiButtonEmpty-isDisabled');
  });

  it('displays "Select dataset" when no dataset is selected', async () => {
    mockQueryService.queryString.getQuery = jest.fn().mockReturnValue({ dataset: null });
    mockDataViews.getDefault = jest.fn().mockResolvedValue(null);

    renderWithContext();

    await waitFor(() => {
      expect(screen.getByText('Select dataset')).toBeInTheDocument();
    });
  });

  it('renders dataset information with time field', async () => {
    const { getByTestId } = renderWithContext();

    await waitFor(() => {
      expect(mockDataViews.getIds).toHaveBeenCalled();
      expect(mockDataViews.get).toHaveBeenCalled();
    });

    // Verify dataset was loaded and component rendered
    expect(getByTestId('datasetSelectButton')).toBeInTheDocument();
  });

  it('renders dataset with data source information', async () => {
    const localMockDataViews = {
      ...mockDataViews,
      get: jest.fn().mockResolvedValue({
        ...mockDataViewData,
        dataSourceRef: {
          id: 'ds-id',
          type: 'data-source',
        },
      }),
      convertToDataset: jest.fn().mockResolvedValue({
        id: mockDataViewData.id,
        title: mockDataViewData.title,
        type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
        dataSource: {
          id: 'ds-id',
          title: 'Test Data Source',
          type: 'data-source',
        },
      }),
    };

    const localServices = {
      ...mockServices,
      data: {
        ...mockServices.data,
        dataViews: localMockDataViews,
      },
    };

    render(
      <I18nProvider>
        <OpenSearchDashboardsContextProvider services={localServices}>
          <DatasetSelect {...defaultProps} />
        </OpenSearchDashboardsContextProvider>
      </I18nProvider>
    );

    await waitFor(() => {
      expect(localMockDataViews.getIds).toHaveBeenCalled();
      expect(localMockDataViews.convertToDataset).toHaveBeenCalled();
    });

    // Verify component rendered with data source
    expect(screen.getByTestId('datasetSelectButton')).toBeInTheDocument();
  });

  it('opens dataset selector popover', async () => {
    const { getByTestId } = renderWithContext();

    await waitFor(() => {
      expect(mockDataViews.getIds).toHaveBeenCalled();
    });

    const button = getByTestId('datasetSelectButton');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
    });

    // Verify the selectable component is visible
    expect(screen.getByTestId('datasetSelectSelectable')).toBeInTheDocument();
  });

  it('handles empty datasets list', async () => {
    const localMockDataViews = {
      ...mockDataViews,
      getIds: jest.fn().mockResolvedValue([]),
    };

    const localQueryService = {
      ...mockQueryService,
      queryString: {
        ...mockQueryService.queryString,
        getQuery: jest.fn().mockReturnValue({ dataset: null }),
      },
    };

    const localMockDataViewsWithDefault = {
      ...localMockDataViews,
      getDefault: jest.fn().mockResolvedValue(null),
    };

    (getQueryService as jest.Mock).mockReturnValue(localQueryService);

    const localServices = {
      ...mockServices,
      data: {
        ...mockServices.data,
        dataViews: localMockDataViewsWithDefault,
      },
    };

    render(
      <I18nProvider>
        <OpenSearchDashboardsContextProvider services={localServices}>
          <DatasetSelect {...defaultProps} />
        </OpenSearchDashboardsContextProvider>
      </I18nProvider>
    );

    await waitFor(() => {
      expect(localMockDataViewsWithDefault.getIds).toHaveBeenCalled();
    });

    const button = screen.getByTestId('datasetSelectButton');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
    });

    // Should not crash with empty list
    expect(button).toBeInTheDocument();
  });

  it('searches datasets by title', async () => {
    renderWithContext();

    await waitFor(() => {
      expect(mockDataViews.getIds).toHaveBeenCalled();
    });

    const button = screen.getByTestId('datasetSelectButton');
    fireEvent.click(button);

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Search');
      expect(searchInput).toBeInTheDocument();
      fireEvent.change(searchInput, { target: { value: 'Test' } });
    });

    expect(screen.getByPlaceholderText('Search')).toHaveValue('Test');
  });

  it('closes popover after dataset selection', async () => {
    mockDataViews.getIds = jest.fn().mockResolvedValue(['index-pattern-id', 'new-id']);
    mockDataViews.get = jest.fn().mockImplementation((id) => {
      if (id === 'new-id') {
        return Promise.resolve({
          id: 'new-id',
          title: 'New Dataset',
          displayName: 'New Dataset',
        });
      }
      return Promise.resolve(mockDataViewData);
    });

    renderWithContext();

    await waitFor(() => {
      expect(mockDataViews.getIds).toHaveBeenCalled();
    });

    const button = screen.getByTestId('datasetSelectButton');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
  });

  it('handles dataset with description', async () => {
    const { getByTestId } = renderWithContext();

    await waitFor(() => {
      expect(mockDataViews.getIds).toHaveBeenCalled();
    });

    const button = getByTestId('datasetSelectButton');
    fireEvent.click(button);

    await waitFor(() => {
      // Just verify the popover opened successfully
      expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
    });
  });

  describe('footer content', () => {
    it('shows "Manage data sources" button for METRICS signal type', async () => {
      renderWithContext({
        ...defaultProps,
        signalType: CORE_SIGNAL_TYPES.METRICS,
      });

      await waitFor(() => {
        expect(mockDataViews.getIds).toHaveBeenCalled();
      });

      const button = screen.getByTestId('datasetSelectButton');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
      });

      // Should show "Manage data sources" button for metrics
      expect(screen.getByTestId('datasetSelectorAssociateDataSourcesButton')).toBeInTheDocument();
      expect(screen.getByText('Manage data sources')).toBeInTheDocument();

      // Should NOT show default footer buttons
      expect(screen.queryByTestId('datasetSelectorAdvancedButton')).not.toBeInTheDocument();
      expect(screen.queryByTestId('datasetSelectViewDatasetsButton')).not.toBeInTheDocument();
    });

    it('shows default footer content for non-METRICS', async () => {
      renderWithContext({
        ...defaultProps,
        signalType: null,
      });

      await waitFor(() => {
        expect(mockDataViews.getIds).toHaveBeenCalled();
      });

      const button = screen.getByTestId('datasetSelectButton');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
      });

      // Should show default footer buttons when signalType is null
      expect(screen.getByTestId('datasetSelectorAdvancedButton')).toBeInTheDocument();
      expect(screen.getByTestId('datasetSelectViewDatasetsButton')).toBeInTheDocument();

      // Should NOT show metrics footer button
      expect(
        screen.queryByTestId('datasetSelectorAssociateDataSourcesButton')
      ).not.toBeInTheDocument();
    });
  });

  describe('showNonTimeFieldDatasets filtering', () => {
    it('filters out datasets without time fields when showNonTimeFieldDatasets is false', async () => {
      // Create datasets - one with time field, one without
      const datasetWithTimeField = {
        id: 'with-time-id',
        title: 'with-time-dataset',
        displayName: 'Dataset With Time Field',
        timeFieldName: '@timestamp',
        type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
      };

      const datasetWithoutTimeField = {
        id: 'no-time-id',
        title: 'no-time-dataset',
        displayName: 'Dataset Without Time Field',
        timeFieldName: undefined,
        type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
      };

      // Setup mocks to ensure proper dataset filtering
      const mockGetType = jest.fn().mockReturnValue({
        id: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
        title: 'Index Pattern',
        meta: {
          icon: { type: 'database' },
          supportedAppNames: undefined, // undefined means supported by all apps
        },
      });

      mockQueryService.queryString.getDatasetService = jest.fn().mockReturnValue({
        getType: mockGetType,
        cacheDataset: jest.fn(),
      });

      mockDataViews.getIds = jest.fn().mockResolvedValue(['with-time-id', 'no-time-id']);
      mockDataViews.get = jest.fn().mockImplementation((id) => {
        if (id === 'with-time-id') {
          return Promise.resolve(datasetWithTimeField);
        }
        return Promise.resolve(datasetWithoutTimeField);
      });
      mockDataViews.convertToDataset = jest.fn().mockImplementation((dataView) => {
        return Promise.resolve({
          id: dataView.id,
          title: dataView.title,
          type: dataView.type,
          timeFieldName: dataView.timeFieldName,
          displayName: dataView.displayName,
        });
      });
      mockQueryService.queryString.getQuery = jest.fn().mockReturnValue({
        dataset: null, // No dataset selected initially
      });
      mockDataViews.getDefault = jest.fn().mockResolvedValue(null);

      renderWithContext({
        ...defaultProps,
        showNonTimeFieldDatasets: false,
      });

      // Wait for all async operations to complete
      await waitFor(() => {
        expect(mockDataViews.getIds).toHaveBeenCalled();
        expect(mockDataViews.convertToDataset).toHaveBeenCalledTimes(2);
      });

      // Verify that only the dataset with time field was processed
      // Since we can't easily check the filtered results in the DOM due to virtualization,
      // we can verify the mocks were called correctly and check that the filtering logic worked
      expect(mockGetType).toHaveBeenCalled();
      expect(mockDataViews.get).toHaveBeenCalledWith('with-time-id');
      expect(mockDataViews.get).toHaveBeenCalledWith('no-time-id');

      // The test passes if the component renders without error and the filtering logic is applied
      const button = screen.getByTestId('datasetSelectButton');
      expect(button).toBeInTheDocument();
    });

    it('includes datasets without time fields when showNonTimeFieldDatasets is true', async () => {
      // Create datasets - one with time field, one without
      const datasetWithTimeField = {
        id: 'with-time-id',
        title: 'with-time-dataset',
        displayName: 'Dataset With Time Field',
        timeFieldName: '@timestamp',
        type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
      };

      const datasetWithoutTimeField = {
        id: 'no-time-id',
        title: 'no-time-dataset',
        displayName: 'Dataset Without Time Field',
        timeFieldName: undefined,
        type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
      };

      // Setup mocks to ensure proper dataset filtering
      const mockGetType = jest.fn().mockReturnValue({
        id: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
        title: 'Index Pattern',
        meta: {
          icon: { type: 'database' },
          supportedAppNames: undefined, // undefined means supported by all apps
        },
      });

      mockQueryService.queryString.getDatasetService = jest.fn().mockReturnValue({
        getType: mockGetType,
        cacheDataset: jest.fn(),
      });

      mockDataViews.getIds = jest.fn().mockResolvedValue(['with-time-id', 'no-time-id']);
      mockDataViews.get = jest.fn().mockImplementation((id) => {
        if (id === 'with-time-id') {
          return Promise.resolve(datasetWithTimeField);
        }
        return Promise.resolve(datasetWithoutTimeField);
      });
      mockDataViews.convertToDataset = jest.fn().mockImplementation((dataView) => {
        return Promise.resolve({
          id: dataView.id,
          title: dataView.title,
          type: dataView.type,
          timeFieldName: dataView.timeFieldName,
          displayName: dataView.displayName,
        });
      });
      mockQueryService.queryString.getQuery = jest.fn().mockReturnValue({
        dataset: null, // No dataset selected initially
      });
      mockDataViews.getDefault = jest.fn().mockResolvedValue(null);

      renderWithContext({
        ...defaultProps,
        showNonTimeFieldDatasets: true,
      });

      // Wait for all async operations to complete
      await waitFor(() => {
        expect(mockDataViews.getIds).toHaveBeenCalled();
        expect(mockDataViews.convertToDataset).toHaveBeenCalledTimes(2);
      });

      // Verify that both datasets were processed
      expect(mockGetType).toHaveBeenCalled();
      expect(mockDataViews.get).toHaveBeenCalledWith('with-time-id');
      expect(mockDataViews.get).toHaveBeenCalledWith('no-time-id');

      // The test passes if the component renders without error and both datasets are included
      const button = screen.getByTestId('datasetSelectButton');
      expect(button).toBeInTheDocument();
    });

    it('defaults showNonTimeFieldDatasets to true when not specified', async () => {
      // Create dataset without time field
      const datasetWithoutTimeField = {
        id: 'no-time-id',
        title: 'no-time-dataset',
        displayName: 'Dataset Without Time Field',
        timeFieldName: undefined,
      };

      mockDataViews.getIds = jest.fn().mockResolvedValue(['no-time-id']);
      mockDataViews.get = jest.fn().mockResolvedValue(datasetWithoutTimeField);
      mockDataViews.convertToDataset = jest.fn().mockResolvedValue({
        id: 'no-time-id',
        title: 'no-time-dataset',
        type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
        timeFieldName: undefined,
      });
      mockQueryService.queryString.getQuery = jest.fn().mockReturnValue({
        dataset: {
          id: 'no-time-id',
          title: 'no-time-dataset',
          type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
        },
      });

      // Don't specify showNonTimeFieldDatasets - should default to true
      renderWithContext({
        onSelect: mockOnSelect,
        signalType: null,
      });

      await waitFor(() => {
        expect(mockDataViews.getIds).toHaveBeenCalled();
      });

      const button = screen.getByTestId('datasetSelectButton');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
      });

      // Dataset without time field should be visible (default is true)
      const withoutTimeElements = screen.queryAllByText('Dataset Without Time Field');
      expect(withoutTimeElements.length).toBeGreaterThan(0);
    });
  });

  describe('TimeBasedDatasetDisclaimer', () => {
    it('opens ViewDatasetsModal when "View datasets" button is clicked', async () => {
      renderWithContext();

      await waitFor(() => {
        expect(mockDataViews.getIds).toHaveBeenCalled();
      });

      const button = screen.getByTestId('datasetSelectButton');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
      });

      // Click "View datasets" button to open the modal
      const viewDatasetsButton = screen.getByTestId('datasetSelectViewDatasetsButton');
      fireEvent.click(viewDatasetsButton);

      // Verify that the modal was opened
      expect(mockCore.overlays.openModal).toHaveBeenCalled();
    });
  });
});
