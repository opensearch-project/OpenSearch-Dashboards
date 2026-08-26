/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { coreMock } from '../../../../../core/public/mocks';
import { DataPublicPluginStart, IDataPluginServices } from '../..';
import {
  CORE_SIGNAL_TYPES,
  DataStorage,
  DataStructure,
  DATA_STRUCTURE_META_TYPES,
  DEFAULT_DATA,
} from '../../../common';
import { dataPluginMock } from '../../mocks';
import { queryServiceMock } from '../../query/mocks';
import { getQueryService } from '../../services';
import DatasetSelect, { DatasetSelectProps } from './dataset_select';
import { OpenSearchDashboardsContextProvider } from '../../../../opensearch_dashboards_react/public';
import { I18nProvider } from '@osd/i18n/react';

jest.mock('../../services', () => ({
  getQueryService: jest.fn(),
}));

const INDEX_PATTERN = DEFAULT_DATA.SET_TYPES.INDEX_PATTERN;

interface ChildOverrides {
  id: string;
  title: string;
  displayName?: string;
  description?: string;
  timeFieldName?: string;
  signalType?: string;
  dataSource?: { id: string; title: string };
}

// Build an index-pattern DataStructure with lightweight CUSTOM meta, matching what the
// INDEX_PATTERN type config's fetch() returns (title/displayName/timeFieldName/signalType/
// description carried in meta; data source in parent) — i.e. no heavy field list.
const makeChild = (over: ChildOverrides): DataStructure => ({
  id: over.id,
  title: over.title,
  type: INDEX_PATTERN,
  meta: {
    type: DATA_STRUCTURE_META_TYPES.CUSTOM,
    timeFieldName: over.timeFieldName,
    displayName: over.displayName,
    signalType: over.signalType,
    description: over.description,
  },
  ...(over.dataSource
    ? {
        parent: {
          id: over.dataSource.id,
          title: over.dataSource.title,
          type: 'DATA_SOURCE',
          meta: { type: DATA_STRUCTURE_META_TYPES.CUSTOM },
        },
      }
    : {}),
});

// Mirrors indexPatternTypeConfig.toDataset: type/displayName/signalType/description come from
// the child's CUSTOM meta (with datasetType overriding the default INDEX_PATTERN type).
const indexPatternToDataset = (path: DataStructure[]) => {
  const child = path[path.length - 1];
  const meta = (child.meta ?? {}) as {
    timeFieldName?: string;
    displayName?: string;
    signalType?: string;
    description?: string;
    datasetType?: string;
  };
  return {
    id: child.id,
    title: child.title,
    type: meta.datasetType || INDEX_PATTERN,
    timeFieldName: meta.timeFieldName,
    displayName: meta.displayName,
    signalType: meta.signalType,
    description: meta.description,
    ...(child.parent
      ? { dataSource: { id: child.parent.id, title: child.parent.title, type: child.parent.type } }
      : {}),
  };
};

const makeIndexPatternType = (
  children: DataStructure[],
  metaOverride: Record<string, unknown> = {}
) => ({
  id: 'index-pattern',
  title: 'Index Pattern',
  meta: { icon: { type: 'database' }, supportedAppNames: undefined, ...metaOverride },
  fetch: jest.fn().mockResolvedValue({ children }),
  toDataset: jest.fn(indexPatternToDataset),
});

const makeDatasetService = (typeConfig: ReturnType<typeof makeIndexPatternType>) => ({
  getType: jest.fn().mockReturnValue(typeConfig),
  cacheDataset: jest.fn(),
  isDatasetAllowed: jest.fn().mockReturnValue(true),
});

describe('DatasetSelect', () => {
  const mockOnSelect = jest.fn();
  const mockQuery = {
    dataset: {
      id: 'index-pattern-id',
      title: 'Test Index Pattern',
      type: INDEX_PATTERN,
    },
  };

  const defaultChild = makeChild({
    id: 'index-pattern-id',
    title: 'Test Index Pattern',
    displayName: 'Test Index Pattern Display Name',
    description: 'Test Index Pattern Description',
    timeFieldName: '@timestamp',
  });

  const mockDataViewData = {
    id: 'index-pattern-id',
    title: 'Test Index Pattern',
    displayName: 'Test Index Pattern Display Name',
    description: 'Test Index Pattern Description',
    timeFieldName: '@timestamp',
  };

  const mockCore = coreMock.createStart();
  const mockDataStartContract = dataPluginMock.createStartContract();
  const mockQueryService = queryServiceMock.createSetupContract();

  // Only lazily-invoked methods remain used by the component: get (fallback enrichment for a
  // selected dataset not in the list), convertToDataset and clearCache (advanced-selector save
  // path). The default dataset id now comes from uiSettings, not getDefault. Reset per-test.
  const mockDataViews = {
    get: jest.fn(),
    convertToDataset: jest.fn(),
    clearCache: jest.fn(),
  };

  const mockServices: IDataPluginServices = {
    appName: 'testApp',
    uiSettings: mockCore.uiSettings,
    savedObjects: mockCore.savedObjects,
    notifications: mockCore.notifications,
    http: mockCore.http,
    storage: {} as DataStorage,
    data: {
      ...mockDataStartContract,
      dataViews: mockDataViews,
      query: {
        queryString: mockQueryService.queryString,
      },
    } as unknown as DataPublicPluginStart,
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

  // Wait for the initial dataset fetch to finish (button leaves the loading/disabled state)
  // before opening the popover, otherwise the click lands on a disabled button.
  const openPopover = async () => {
    await waitFor(() =>
      expect(screen.getByTestId('datasetSelectButton')).not.toHaveClass('euiButtonEmpty-isDisabled')
    );
    fireEvent.click(screen.getByTestId('datasetSelectButton'));
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getQueryService as jest.Mock).mockReturnValue(mockQueryService);

    // Reset to a single default index pattern selected via the query.
    mockQueryService.queryString.getQuery = jest.fn().mockReturnValue(mockQuery);
    mockQueryService.queryString.getDatasetService = jest
      .fn()
      .mockReturnValue(makeDatasetService(makeIndexPatternType([defaultChild])));

    mockDataViews.get = jest.fn((id: string) => Promise.resolve({ ...mockDataViewData, id }));
    mockDataViews.convertToDataset = jest.fn((dataView: any) =>
      Promise.resolve({ id: dataView.id, title: dataView.title, type: INDEX_PATTERN })
    );
    mockDataViews.clearCache = jest.fn();
  });

  it('renders the DatasetSelect component', async () => {
    renderWithContext();

    await waitFor(() => {
      expect(screen.getByTestId('datasetSelectButton')).toBeInTheDocument();
    });
  });

  it('shows the selected dataset title', async () => {
    renderWithContext();

    await waitFor(() => {
      expect(screen.getByText('Test Index Pattern Display Name')).toBeInTheDocument();
    });
  });

  it('opens the popover when clicked', async () => {
    renderWithContext();

    await waitFor(() => {
      expect(screen.getByTestId('datasetSelectButton')).toBeInTheDocument();
    });

    const button = screen.getByTestId('datasetSelectButton');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
    });
  });

  it('opens advanced selector when create dataset button is clicked', async () => {
    renderWithContext();

    await waitFor(() => {
      expect(screen.getByTestId('datasetSelectButton')).toBeInTheDocument();
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

  it('selects the default dataset from settings when none is current', async () => {
    mockQueryService.queryString.getQuery = jest.fn().mockReturnValue({ dataset: null });
    // The default dataset id is read from uiSettings (defaultIndex), not a full DataView fetch.
    const localServices = {
      ...mockServices,
      uiSettings: {
        ...mockServices.uiSettings,
        get: jest.fn((key: string) => (key === 'defaultIndex' ? 'index-pattern-id' : undefined)),
      },
    } as IDataPluginServices;

    render(
      <I18nProvider>
        <OpenSearchDashboardsContextProvider services={localServices}>
          <DatasetSelect {...defaultProps} signalType={CORE_SIGNAL_TYPES.LOGS} />
        </OpenSearchDashboardsContextProvider>
      </I18nProvider>
    );

    await waitFor(() => {
      expect(mockOnSelect).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'index-pattern-id' })
      );
    });
  });

  it('filters datasets by supportedAppNames', async () => {
    const restrictedChild = makeChild({
      id: 'restricted-id',
      title: 'Restricted Dataset',
      displayName: 'Restricted Dataset',
    });
    // Type only supports 'otherApp', not the current 'testApp'.
    mockQueryService.queryString.getDatasetService = jest
      .fn()
      .mockReturnValue(
        makeDatasetService(
          makeIndexPatternType([restrictedChild], { supportedAppNames: ['otherApp'] })
        )
      );

    renderWithContext();

    await openPopover();

    expect(screen.queryByText('Restricted Dataset')).not.toBeInTheDocument();
  });

  it('includes datasets when supportedAppNames is undefined', async () => {
    const allAppsChild = makeChild({
      id: 'all-apps-id',
      title: 'all-apps-dataset',
      displayName: 'All Apps Dataset',
    });
    mockQueryService.queryString.getDatasetService = jest
      .fn()
      .mockReturnValue(makeDatasetService(makeIndexPatternType([allAppsChild])));
    mockQueryService.queryString.getQuery = jest.fn().mockReturnValue({
      dataset: { id: 'all-apps-id', title: 'all-apps-dataset', type: INDEX_PATTERN },
    });

    renderWithContext();

    await openPopover();

    expect(screen.getAllByText('All Apps Dataset').length).toBeGreaterThan(0);
  });

  it('filters datasets by METRICS signal type', async () => {
    const metricsChild = makeChild({
      id: 'metrics-id',
      title: 'metrics-dataset',
      displayName: 'Metrics Dataset',
      signalType: CORE_SIGNAL_TYPES.METRICS,
    });
    const logsChild = makeChild({
      id: 'logs-id',
      title: 'logs-dataset',
      displayName: 'Logs Dataset',
      signalType: CORE_SIGNAL_TYPES.LOGS,
    });
    mockQueryService.queryString.getDatasetService = jest
      .fn()
      .mockReturnValue(makeDatasetService(makeIndexPatternType([metricsChild, logsChild])));
    mockQueryService.queryString.getQuery = jest.fn().mockReturnValue({
      dataset: { id: 'metrics-id', title: 'metrics-dataset', type: INDEX_PATTERN },
    });

    renderWithContext({
      ...defaultProps,
      signalType: CORE_SIGNAL_TYPES.METRICS,
    });

    await openPopover();

    expect(screen.queryAllByText('Metrics Dataset').length).toBeGreaterThan(0);
    expect(screen.queryByText('Logs Dataset')).not.toBeInTheDocument();
  });

  it('ignores incompatible dataset changes and preserves selection', async () => {
    const traceDataset = {
      id: 'trace-id',
      title: 'trace-dataset',
      type: INDEX_PATTERN,
      signalType: CORE_SIGNAL_TYPES.TRACES,
    };
    const logDataset = {
      id: 'log-id',
      title: 'log-dataset',
      type: INDEX_PATTERN,
      signalType: CORE_SIGNAL_TYPES.LOGS,
    };

    // Only the trace dataset is in the list; the log dataset arrives via a query change and is
    // resolved through the lazy get() fallback.
    const traceChild = makeChild({
      id: 'trace-id',
      title: 'trace-dataset',
      displayName: 'Trace Dataset',
      signalType: CORE_SIGNAL_TYPES.TRACES,
    });
    mockQueryService.queryString.getDatasetService = jest
      .fn()
      .mockReturnValue(makeDatasetService(makeIndexPatternType([traceChild])));
    mockDataViews.get = jest.fn((id: string) =>
      id === 'log-id'
        ? Promise.resolve({ ...logDataset, displayName: 'Log Dataset' })
        : Promise.resolve({ ...traceDataset, displayName: 'Trace Dataset' })
    );

    mockQueryService.queryString.getQuery = jest.fn().mockReturnValue({ dataset: traceDataset });

    const { rerender } = renderWithContext({
      ...defaultProps,
      signalType: CORE_SIGNAL_TYPES.TRACES,
    });

    await waitFor(() => {
      expect(screen.getByText('Trace Dataset')).toBeInTheDocument();
    });

    // Simulate a flyout changing the query to a log dataset (querying related logs).
    mockQueryService.queryString.getQuery = jest.fn().mockReturnValue({ dataset: logDataset });

    rerender(
      <I18nProvider>
        <OpenSearchDashboardsContextProvider services={mockServices}>
          <DatasetSelect {...defaultProps} signalType={CORE_SIGNAL_TYPES.TRACES} />
        </OpenSearchDashboardsContextProvider>
      </I18nProvider>
    );

    await waitFor(() => {
      expect(mockDataViews.get).toHaveBeenCalledWith('log-id', false);
    });

    // Should keep the trace dataset, not switch to the incompatible log dataset.
    expect(screen.getByText('Trace Dataset')).toBeInTheDocument();
    expect(screen.queryByText('Log Dataset')).not.toBeInTheDocument();
    expect(screen.queryByText('Select dataset')).not.toBeInTheDocument();
  });

  it('handles errors when fetching datasets gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const failingType = makeIndexPatternType([]);
    failingType.fetch = jest.fn().mockRejectedValue(new Error('Failed to fetch'));
    mockQueryService.queryString.getQuery = jest
      .fn()
      .mockReturnValue({ dataset: null, language: 'kuery' });
    mockQueryService.queryString.getDatasetService = jest
      .fn()
      .mockReturnValue(makeDatasetService(failingType));

    renderWithContext();

    await waitFor(
      () => {
        const button = screen.getByTestId('datasetSelectButton');
        expect(button).not.toHaveClass('euiButtonEmpty-isDisabled');
      },
      { timeout: 3000 }
    );

    expect(screen.getByTestId('datasetSelectButton')).toBeInTheDocument();
    expect(screen.getByText('Select dataset')).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  it('shows loading state initially', () => {
    renderWithContext();
    const button = screen.getByTestId('datasetSelectButton');
    expect(button).toHaveClass('euiButtonEmpty-isDisabled');
  });

  it('displays "Select dataset" when no dataset is selected', async () => {
    mockQueryService.queryString.getQuery = jest.fn().mockReturnValue({ dataset: null });

    renderWithContext();

    await waitFor(() => {
      expect(screen.getByText('Select dataset')).toBeInTheDocument();
    });
  });

  it('renders dataset information with time field', async () => {
    const { getByTestId } = renderWithContext();

    await waitFor(() => {
      expect(getByTestId('datasetSelectButton')).toBeInTheDocument();
    });
  });

  it('renders dataset with data source information', async () => {
    const child = makeChild({
      id: 'index-pattern-id',
      title: 'Test Index Pattern',
      displayName: 'Test Index Pattern Display Name',
      timeFieldName: '@timestamp',
      dataSource: { id: 'ds-id', title: 'Test Data Source' },
    });
    mockQueryService.queryString.getDatasetService = jest
      .fn()
      .mockReturnValue(makeDatasetService(makeIndexPatternType([child])));

    renderWithContext();

    await waitFor(() => {
      expect(screen.getByTestId('datasetSelectButton')).toBeInTheDocument();
    });

    const button = screen.getByTestId('datasetSelectButton');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
    });

    // The data source title appears in the row subtitle.
    expect(screen.getAllByText(/Test Data Source/).length).toBeGreaterThan(0);
  });

  it('opens dataset selector popover', async () => {
    const { getByTestId } = renderWithContext();

    await waitFor(() => {
      expect(getByTestId('datasetSelectButton')).toBeInTheDocument();
    });

    const button = getByTestId('datasetSelectButton');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
    });

    expect(screen.getByTestId('datasetSelectSelectable')).toBeInTheDocument();
  });

  it('handles empty datasets list', async () => {
    mockQueryService.queryString.getQuery = jest.fn().mockReturnValue({ dataset: null });
    mockQueryService.queryString.getDatasetService = jest
      .fn()
      .mockReturnValue(makeDatasetService(makeIndexPatternType([])));

    renderWithContext();

    await openPopover();

    expect(screen.getByTestId('datasetSelectButton')).toBeInTheDocument();
  });

  it('searches datasets by title', async () => {
    renderWithContext();

    await waitFor(() => {
      expect(screen.getByTestId('datasetSelectButton')).toBeInTheDocument();
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

  it('closes the popover when the trigger is clicked again', async () => {
    renderWithContext();

    await openPopover();
    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();

    // Toggling the trigger closes the popover (the path a selection also takes via closePopover).
    fireEvent.click(screen.getByTestId('datasetSelectButton'));

    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Search')).not.toBeInTheDocument();
    });
  });

  it('handles a dataset that carries a description', async () => {
    const child = makeChild({
      id: 'described-id',
      title: 'described-dataset',
      displayName: 'Described Dataset',
      description: 'A dataset with a description',
      timeFieldName: '@timestamp',
    });
    const type = makeIndexPatternType([child]);
    mockQueryService.queryString.getQuery = jest.fn().mockReturnValue({
      dataset: { id: 'described-id', title: 'described-dataset', type: INDEX_PATTERN },
    });
    mockQueryService.queryString.getDatasetService = jest
      .fn()
      .mockReturnValue(makeDatasetService(type));

    renderWithContext();

    await openPopover();

    // The list is populated from a single lightweight fetch (no per-pattern DataView build), and
    // the dataset carries the description read from the pattern meta.
    expect(type.fetch).toHaveBeenCalledTimes(1);
    expect((mockDataViews as { getMultiple?: unknown }).getMultiple).toBeUndefined();
    expect(type.toDataset).toHaveReturnedWith(
      expect.objectContaining({ description: 'A dataset with a description' })
    );
    expect(screen.getAllByText('Described Dataset').length).toBeGreaterThan(0);
  });

  describe('footer content', () => {
    it('shows "Manage data sources" button for METRICS signal type', async () => {
      renderWithContext({
        ...defaultProps,
        signalType: CORE_SIGNAL_TYPES.METRICS,
      });

      await openPopover();

      expect(screen.getByTestId('datasetSelectorAssociateDataSourcesButton')).toBeInTheDocument();
      expect(screen.getByText('Manage data sources')).toBeInTheDocument();

      expect(screen.queryByTestId('datasetSelectorAdvancedButton')).not.toBeInTheDocument();
      expect(screen.queryByTestId('datasetSelectViewDatasetsButton')).not.toBeInTheDocument();
    });

    it('shows default footer content for non-METRICS', async () => {
      renderWithContext({
        ...defaultProps,
        signalType: null,
      });

      await openPopover();

      expect(screen.getByTestId('datasetSelectorAdvancedButton')).toBeInTheDocument();
      expect(screen.getByTestId('datasetSelectViewDatasetsButton')).toBeInTheDocument();

      expect(
        screen.queryByTestId('datasetSelectorAssociateDataSourcesButton')
      ).not.toBeInTheDocument();
    });
  });

  describe('showNonTimeFieldDatasets filtering', () => {
    const withTimeChild = makeChild({
      id: 'with-time-id',
      title: 'with-time-dataset',
      displayName: 'Dataset With Time Field',
      timeFieldName: '@timestamp',
    });
    const withoutTimeChild = makeChild({
      id: 'no-time-id',
      title: 'no-time-dataset',
      displayName: 'Dataset Without Time Field',
    });

    it('filters out datasets without time fields when showNonTimeFieldDatasets is false', async () => {
      mockQueryService.queryString.getQuery = jest.fn().mockReturnValue({ dataset: null });
      // Time-less dataset listed first; if the filter drops it, the auto-selected default
      // becomes the time-based one instead.
      mockQueryService.queryString.getDatasetService = jest
        .fn()
        .mockReturnValue(
          makeDatasetService(makeIndexPatternType([withoutTimeChild, withTimeChild]))
        );

      renderWithContext({
        ...defaultProps,
        signalType: CORE_SIGNAL_TYPES.LOGS,
        showNonTimeFieldDatasets: false,
      });

      await waitFor(() => {
        expect(mockOnSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'with-time-id' }));
      });
    });

    it('includes datasets without time fields when showNonTimeFieldDatasets is true', async () => {
      mockQueryService.queryString.getQuery = jest.fn().mockReturnValue({ dataset: null });
      // Time-less dataset listed first and retained, so it stays the auto-selected default.
      mockQueryService.queryString.getDatasetService = jest
        .fn()
        .mockReturnValue(
          makeDatasetService(makeIndexPatternType([withoutTimeChild, withTimeChild]))
        );

      renderWithContext({
        ...defaultProps,
        signalType: CORE_SIGNAL_TYPES.LOGS,
        showNonTimeFieldDatasets: true,
      });

      await waitFor(() => {
        expect(mockOnSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'no-time-id' }));
      });
    });

    it('defaults showNonTimeFieldDatasets to true when not specified', async () => {
      mockQueryService.queryString.getQuery = jest.fn().mockReturnValue({
        dataset: { id: 'no-time-id', title: 'no-time-dataset', type: INDEX_PATTERN },
      });
      mockQueryService.queryString.getDatasetService = jest
        .fn()
        .mockReturnValue(makeDatasetService(makeIndexPatternType([withoutTimeChild])));

      renderWithContext({
        onSelect: mockOnSelect,
        signalType: null,
      });

      await openPopover();

      expect(screen.getAllByText('Dataset Without Time Field').length).toBeGreaterThan(0);
    });
  });

  describe('TimeBasedDatasetDisclaimer', () => {
    it('opens ViewDatasetsModal when "View datasets" button is clicked', async () => {
      renderWithContext();

      await openPopover();

      const viewDatasetsButton = screen.getByTestId('datasetSelectViewDatasetsButton');
      fireEvent.click(viewDatasetsButton);

      expect(mockCore.overlays.openModal).toHaveBeenCalled();
    });
  });
});
