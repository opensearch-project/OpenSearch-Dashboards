/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

const mockDispatch = jest.fn();
const mockHandleTimeChange = jest.fn();
const mockSetQueryWithHistory = jest.fn();
const mockSelectQuery = jest.fn();
const mockGetDataView = jest.fn();
const mockCacheDataset = jest.fn();
const mockGetInitialQueryByDataset = jest.fn();
const mockSetQuery = jest.fn();
const mockGetQuery = jest.fn();
const mockToastAddError = jest.fn();
const mockToastAddWarning = jest.fn();
const mockUseFlavorId = jest.fn();
const mockClearEditors = jest.fn();

jest.doMock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  return {
    ...actual,
    useDispatch: () => mockDispatch,
    useSelector: (selector: any) => {
      if (selector === mockSelectQuery) {
        return { dataset: { id: 'test-id', type: 'index_pattern' } };
      }
      return {};
    },
  };
});

let capturedSignalType: string | null | undefined;
let capturedSupportedTypes: string[] | undefined;

jest.doMock('../../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: () => ({
    services: {
      data: {
        query: {
          queryString: {
            getQuery: mockGetQuery,
            setQuery: mockSetQuery,
            getInitialQueryByDataset: mockGetInitialQueryByDataset,
            getQueryHistory: jest.fn(() => [
              { query: 'source = table1 | head 10', language: 'PPL' },
              { query: 'source = table2 | head 10', language: 'PPL' },
            ]),
            getDatasetService: () => ({
              cacheDataset: mockCacheDataset,
            }),
          },
        },
        ui: {
          DatasetSelect: ({
            onSelect,
            signalType,
            supportedTypes,
          }: {
            onSelect: (dataset: any) => void;
            signalType: string | null;
            supportedTypes?: string[];
          }) => {
            capturedSignalType = signalType;
            capturedSupportedTypes = supportedTypes;
            return (
              <div data-test-subj="dataset-select">
                <button
                  data-test-subj="dataset-select-button"
                  onClick={() => onSelect({ id: 'test-dataset', type: 'index_pattern' })}
                >
                  Select Dataset
                </button>
                <div data-test-subj="dataset-singaltype-prop">
                  {signalType !== undefined ? `Signal type: ${signalType}` : 'No signal type'}
                </div>
                <div data-test-subj="dataset-supportedtypes-prop">
                  {supportedTypes
                    ? `Supported types: ${supportedTypes.join(',')}`
                    : 'Default types'}
                </div>
              </div>
            );
          },
        },
        dataViews: {
          get: mockGetDataView,
        },
      },
      notifications: {
        toasts: {
          addError: mockToastAddError,
          addWarning: mockToastAddWarning,
        },
      },
      uiSettings: {},
      savedObjects: {},
      http: {},
      isDatasetManagementEnabled: false,
    },
  }),
  withOpenSearchDashboards: (Component: any) => (props: any) => <Component {...props} />,
}));

jest.doMock('../../utils', () => ({
  useTimeFilter: () => ({
    handleTimeChange: mockHandleTimeChange,
  }),
}));

jest.doMock('../../../../application/utils/state_management/slices', () => ({
  setQueryWithHistory: mockSetQueryWithHistory,
}));

jest.doMock('../../../../application/utils/state_management/selectors', () => ({
  selectQuery: mockSelectQuery,
}));

jest.doMock('../../../../../../data/common', () => ({
  Dataset: class {},
  DEFAULT_DATA: {
    SET_TYPES: {
      INDEX: 'INDEX',
      INDEX_PATTERN: 'index_pattern',
    },
  },
  EMPTY_QUERY: {
    QUERY: '',
  },
  CORE_SIGNAL_TYPES: {
    LOGS: 'logs',
    METRICS: 'metrics',
    TRACES: 'traces',
  },
}));

jest.doMock('../../../../helpers/use_flavor_id', () => ({
  useFlavorId: () => mockUseFlavorId(),
}));

jest.doMock('../../../../../common', () => ({
  ExploreFlavor: {
    Logs: 'logs',
    Metrics: 'metrics',
    Traces: 'traces',
  },
}));

jest.doMock('../../../../application/hooks', () => ({
  useClearEditors: () => mockClearEditors,
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { DatasetSelectWidget } = require('./dataset_select');

const createMockStore = () => {
  return configureStore({
    reducer: {
      query: (state = {}) => state,
    },
  });
};

const renderWithStore = () => {
  const mockStore = createMockStore();
  return render(
    <Provider store={mockStore}>
      <DatasetSelectWidget />
    </Provider>
  );
};

describe('DatasetSelectWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetQuery.mockReturnValue({ query: 'test query', language: 'PPL' });
    mockGetInitialQueryByDataset.mockReturnValue({ query: 'initial query', language: 'PPL' });
    mockUseFlavorId.mockReturnValue(null);
  });

  it('renders the dataset select component', () => {
    renderWithStore();
    expect(screen.getByTestId('dataset-select')).toBeInTheDocument();
  });

  it('attempts to get dataView on component mount', async () => {
    mockGetDataView.mockResolvedValue({ id: 'test-id' });

    renderWithStore();

    await waitFor(() => {
      expect(mockGetDataView).toHaveBeenCalledWith('test-id', false);
    });
  });

  it('caches dataset if dataView does not exist', async () => {
    mockGetDataView.mockResolvedValue(null);

    renderWithStore();

    await waitFor(() => {
      expect(mockCacheDataset).toHaveBeenCalledWith(
        { id: 'test-id', type: 'index_pattern' },
        expect.objectContaining({
          uiSettings: {},
          savedObjects: {},
          notifications: expect.anything(),
          http: {},
          data: expect.anything(),
        }),
        false
      );
    });
  });

  it('handles dataset selection correctly', async () => {
    renderWithStore();

    const button = screen.getByTestId('dataset-select-button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockGetInitialQueryByDataset).toHaveBeenCalledWith({
        id: 'test-dataset',
        type: 'index_pattern',
      });
      expect(mockSetQuery).toHaveBeenCalledWith({
        query: '',
        language: 'PPL',
        dataset: { id: 'test-dataset', type: 'index_pattern' },
      });
      expect(mockDispatch).toHaveBeenCalledWith(mockSetQueryWithHistory());
      expect(mockClearEditors).toHaveBeenCalled();
    });
  });

  it('provides signalType prop to DatasetSelect', () => {
    mockUseFlavorId.mockReturnValue('traces');
    renderWithStore();
    expect(screen.getByTestId('dataset-singaltype-prop')).toHaveTextContent('Signal type: traces');
  });

  describe('signalType functionality', () => {
    beforeEach(() => {
      capturedSignalType = undefined;
    });

    it('passes traces signal type for Traces flavor', () => {
      mockUseFlavorId.mockReturnValue('traces');
      renderWithStore();

      expect(capturedSignalType).toBe('traces');
    });

    it('passes logs signal type for Logs flavor', () => {
      mockUseFlavorId.mockReturnValue('logs');
      renderWithStore();

      expect(capturedSignalType).toBe('logs');
    });

    it('passes metrics signal type for Metrics flavor', () => {
      mockUseFlavorId.mockReturnValue('metrics');
      renderWithStore();

      expect(capturedSignalType).toBe('metrics');
    });

    it('passes null when flavor is null', () => {
      mockUseFlavorId.mockReturnValue(null);
      renderWithStore();

      expect(capturedSignalType).toBe(null);
    });
  });

  describe('supportedTypes functionality', () => {
    beforeEach(() => {
      capturedSupportedTypes = undefined;
    });

    it('passes PROMETHEUS as supportedTypes for Metrics flavor', () => {
      mockUseFlavorId.mockReturnValue('metrics');
      renderWithStore();

      expect(capturedSupportedTypes).toEqual(['PROMETHEUS']);
      expect(screen.getByTestId('dataset-supportedtypes-prop')).toHaveTextContent(
        'Supported types: PROMETHEUS'
      );
    });

    it('passes default supportedTypes for Logs flavor', () => {
      mockUseFlavorId.mockReturnValue('logs');
      renderWithStore();

      // When services.supportedTypes is not set, it falls back to default types
      expect(capturedSupportedTypes).toEqual(['INDEX', 'index_pattern']);
    });

    it('passes default supportedTypes for Traces flavor', () => {
      mockUseFlavorId.mockReturnValue('traces');
      renderWithStore();

      expect(capturedSupportedTypes).toEqual(['INDEX', 'index_pattern']);
    });

    it('passes default supportedTypes when flavor is null', () => {
      mockUseFlavorId.mockReturnValue(null);
      renderWithStore();

      expect(capturedSupportedTypes).toEqual(['INDEX', 'index_pattern']);
    });
  });
});
