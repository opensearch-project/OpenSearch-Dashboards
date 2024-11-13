/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DiscoverCanvas from './index';
import { useDiscoverContext } from '../context';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { setColumns, useDispatch, useSelector } from '../../utils/state_management';
import { ResultStatus } from '../utils/use_search';
import { EuiPanel } from '@elastic/eui';
import { injectI18n, FormattedMessage } from '@osd/i18n/react';
import { DataPublicPluginStart, UI_SETTINGS } from 'src/plugins/data/public';
import { dataPluginMock } from 'src/plugins/data/public/mocks';
import { Query } from '../../../../../../plugins/data/public/index';
import { queryStringManagerMock } from '../../../../../../plugins/data/public/query/query_string/query_string_manager.mock';
import { uiSettingsServiceMock } from '../../../../../../core/public/mocks';
import { setUISettings } from '../../../../../../plugins/vis_augmenter/public';
import { createDataExplorerServicesMock } from '../../../../../../plugins/data_explorer/public/utils/mocks';
import { DiscoverViewServices } from '../../../build_services';
import { discoverPluginMock } from '../../../mocks';

// Mocking required modules
jest.mock('../context', () => ({
  useDiscoverContext: jest.fn(),
}));

jest.mock('../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn(),
  withOpenSearchDashboards: jest.fn(),
}));

jest.mock('@osd/i18n/react', () => ({
  FormattedMessage: ({ defaultMessage }) => <span>{defaultMessage}</span>,
  injectI18n: (Component) => Component, // Mock injectI18n to return the component directly
}));

jest.mock('../../utils/state_management', () => ({
  setColumns: jest.fn(),
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

// Mocking external components
jest.mock('./discover_table', () => ({
  DiscoverTable: () => <div data-testid="discover-table" />,
}));

jest.mock('./discover_chart_container', () => ({
  DiscoverChartContainer: () => <div data-testid="discover-chart-container" />,
}));

jest.mock('../../components/no_results/no_results', () => ({
  DiscoverNoResults: () => <div data-testid="discover-no-results" />,
}));

jest.mock('../../components/uninitialized/uninitialized', () => ({
  DiscoverUninitialized: () => <div data-testid="discover-uninitialized" />,
}));

jest.mock('../../components/loading_spinner/loading_spinner', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner" />,
}));

const mockExtensionMap = {
  extension1: { id: 'ext1', order: 1 },
  extension2: { id: 'ext2', order: 2 },
};

const mockSetHeaderVariant = jest.fn();

const mockGetQueryResultService = () => {
  return jest.fn().mockReturnValue({
    getQueryResultExtensionMap: jest.fn().mockReturnValue(mockExtensionMap),
    __enhance: jest.fn(),
  });
};

const mockGetQuery = () => {
  return jest.fn().mockReturnValue({
    query: '',
    language: 'kuery',
  });
};

queryStringManagerMock.createSetupContract = jest.fn().mockReturnValue({
  getQueryResultService: mockGetQueryResultService(),
  getQuery: mockGetQuery(),
});

const mockUiSettingsGet = uiSettingsServiceMock.createStartContract();
setUISettings(mockUiSettingsGet);
mockUiSettingsGet.get.mockImplementation((key: string) => {
  return key === UI_SETTINGS.QUERY_ENHANCEMENTS_ENABLED;
});

const createMockServices = (): DiscoverViewServices => {
  const dataExplorerServicesMock = createDataExplorerServicesMock();
  const discoverServicesMock = discoverPluginMock.createDiscoverServicesMock();

  const services: DiscoverViewServices = {
    ...dataExplorerServicesMock,
    ...discoverServicesMock,
    uiSettings: mockUiSettingsGet,
    chrome: {
      setHeaderVariant: jest.fn(),
    },
    capabilities: {
      get: jest.fn().mockReturnValueOnce({
        discover: { saveQuery: true },
      }),
    },
    data: {
      query: {
        queryString: queryStringManagerMock.createSetupContract(),
      },
    },
  };
  return services;
};

const mockUseOpenSearchDashboards = () => {
  useOpenSearchDashboards.mockReturnValue({
    services: createMockServices(),
  });
};

// Tests
describe('DiscoverCanvas', () => {
  const mockRefetch = { next: jest.fn() };
  let dataMock: jest.Mocked<DataPublicPluginStart>;

  beforeEach(() => {
    dataMock = dataPluginMock.createStartContract();
    useDiscoverContext.mockReturnValue({
      data$: { getValue: jest.fn().mockReturnValue({ status: ResultStatus.LOADING }) },
      refetch$: mockRefetch,
      indexPattern: {
        timeFieldName: 'timestamp',
        isTimeBased: jest.fn().mockReturnValue(true),
      },
      savedSearch: { id: '123', title: 'Mock Saved Search' },
    });

    mockUseOpenSearchDashboards();

    useDispatch.mockReturnValue(jest.fn());
    useSelector.mockReturnValue({ columns: [] });
  });

  it('renders without index pattern', () => {
    useDiscoverContext.mockReturnValueOnce({
      data$: { getValue: jest.fn().mockReturnValue({ status: ResultStatus.LOADING }) },
      refetch$: mockRefetch,
      indexPattern: null,
    });

    render(<DiscoverCanvas setHeaderActionMenu={jest.fn()} history={[]} optionalRef={null} />);

    expect(screen.getByTestId('discover-no-index-patterns')).toBeInTheDocument();
  });

  it('shows loading spinner when data is loading', () => {
    render(<DiscoverCanvas setHeaderActionMenu={jest.fn()} history={[]} optionalRef={null} />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('shows no results when status is NO_RESULTS', () => {
    useDiscoverContext.mockReturnValueOnce({
      data$: { getValue: jest.fn().mockReturnValue({ status: ResultStatus.NO_RESULTS }) },
      refetch$: mockRefetch,
      indexPattern: { timeFieldName: 'timestamp' },
    });

    render(<DiscoverCanvas setHeaderActionMenu={jest.fn()} history={[]} optionalRef={null} />);

    expect(screen.getByTestId('discover-no-results')).toBeInTheDocument();
  });

  it('shows uninitialized state when status is UNINITIALIZED', () => {
    useDiscoverContext.mockReturnValueOnce({
      data$: { getValue: jest.fn().mockReturnValue({ status: ResultStatus.UNINITIALIZED }) },
      refetch$: mockRefetch,
      indexPattern: { timeFieldName: 'timestamp' },
    });

    render(<DiscoverCanvas setHeaderActionMenu={jest.fn()} history={[]} optionalRef={null} />);

    expect(screen.getByTestId('discover-uninitialized')).toBeInTheDocument();
  });

  it('renders chart and table when status is READY', async () => {
    useDiscoverContext.mockReturnValueOnce({
      data$: { getValue: jest.fn().mockReturnValue({ status: ResultStatus.READY, rows: [] }) },
      refetch$: mockRefetch,
      indexPattern: { timeFieldName: 'timestamp' },
    });

    render(<DiscoverCanvas setHeaderActionMenu={jest.fn()} history={[]} optionalRef={null} />);

    expect(screen.getByTestId('discover-chart-container')).toBeInTheDocument();
    expect(screen.getByTestId('discover-table')).toBeInTheDocument();
  });

  it('calls setColumns when index pattern changes', () => {
    const dispatchMock = jest.fn();
    useDispatch.mockReturnValue(dispatchMock);

    const newIndexPattern = { timeFieldName: 'timestamp' };
    useDiscoverContext.mockReturnValueOnce({
      data$: { getValue: jest.fn().mockReturnValue({ status: ResultStatus.READY }) },
      refetch$: mockRefetch,
      indexPattern: newIndexPattern,
    });

    render(<DiscoverCanvas setHeaderActionMenu={jest.fn()} history={[]} optionalRef={null} />);

    expect(dispatchMock).toHaveBeenCalledWith({ columns: [] });
  });

  it('calls setHeaderVariant on mount and unmount', () => {
    render(<DiscoverCanvas setHeaderActionMenu={jest.fn()} history={[]} optionalRef={null} />);

    expect(mockSetHeaderVariant).toHaveBeenCalledWith('application');

    unmount();

    expect(mockSetHeaderVariant).toHaveBeenCalledWith(undefined);
  });
});
