/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

const mockDispatch = jest.fn();
const mockHandleTimeChange = jest.fn();
const mockSetQueryWithHistory = jest.fn();
const mockSelectQuery = jest.fn();
const mockSelectDataset = jest.fn();
const mockGetDataView = jest.fn();
const mockCacheDataset = jest.fn();
// Dataset-type lookup used to guard the language on select. Default: no registered type
// (getType -> undefined), so the language passes through unchanged (existing behavior).
let mockGetType: jest.Mock = jest.fn((_type?: string) => undefined);
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
      if (selector === mockSelectDataset) {
        return mockGetQuery()?.dataset;
      }
      return {};
    },
  };
});

let capturedSignalType: string | null | undefined;
let capturedSupportedTypes: string[] | undefined;
// What the mocked picker hands to onSelect when its button is clicked.
let mockPickedDataset: { id: string; type: string } = { id: 'test-dataset', type: 'index_pattern' };

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
              getType: (t: string) => mockGetType(t),
            }),
            // The widget subscribes to source-type changes to scope the picker.
            getUpdates$: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
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
                  onClick={() => onSelect(mockPickedDataset)}
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
  selectDataset: mockSelectDataset,
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
  EXPLORE_DEFAULT_LANGUAGE: 'PPL',
}));

jest.doMock('../../../../application/hooks', () => ({
  useClearEditors: () => mockClearEditors,
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { DatasetSelectWidget } = require('./dataset_select');
const {
  SourceTypeRegistryService,
  setSourceTypeRegistry,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
} = require('../../../../services/source_type_registry');

// A registered async source, as an external plugin would add it.
const registerFakeSource = (DatasetSelector?: any) => {
  const registry = new SourceTypeRegistryService();
  registry.register({
    id: 'fake',
    label: 'Fake',
    datasetTypes: ['FAKE'],
    datasetSelector: DatasetSelector,
    resolveDefaultDataset: async () => undefined,
    languageSettings: { FakeQL: {} },
  });
  setSourceTypeRegistry(registry);
};

// A source's own selector: shows what it was given and picks a fixed dataset.
const mockSelectorProps = jest.fn();
const FakeSelector = (props: any) => {
  mockSelectorProps(props);
  return (
    <button
      data-test-subj="fake-selector"
      onClick={() => props.onSelect({ id: 'fake-2', type: 'FAKE' })}
    >
      {props.dataset?.id}
    </button>
  );
};

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
    mockGetType = jest.fn((_type?: string) => undefined);
    mockUseFlavorId.mockReturnValue(null);
    mockPickedDataset = { id: 'test-dataset', type: 'index_pattern' };
    setSourceTypeRegistry(new SourceTypeRegistryService());
  });

  it('renders the dataset select component', () => {
    renderWithStore();
    expect(screen.getByTestId('dataset-select')).toBeInTheDocument();
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

  it('falls back to the Explore default language when the current one is unsupported by the target', async () => {
    // Editor is on another source's language; getInitialQueryByDataset carries it forward, but the
    // target index-pattern type only supports kuery/lucene/PPL/SQL. Without the guard the framework
    // would coerce to the type's first language (kuery), which Explore can't prepare. Expect PPL.
    mockGetQuery.mockReturnValue({ query: 'fields @timestamp', language: 'FakeQL' });
    mockGetInitialQueryByDataset.mockReturnValue({
      query: 'initial query',
      language: 'FakeQL',
    });
    mockGetType = jest.fn(() => ({
      supportedLanguages: () => ['kuery', 'lucene', 'PPL', 'SQL'],
    }));

    renderWithStore();
    fireEvent.click(screen.getByTestId('dataset-select-button'));

    await waitFor(() => {
      expect(mockSetQuery).toHaveBeenCalledWith({
        query: '',
        language: 'PPL',
        dataset: { id: 'test-dataset', type: 'index_pattern' },
      });
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

  describe('registered source types', () => {
    it("passes the active source's dataset types to the generic picker", () => {
      registerFakeSource();
      mockUseFlavorId.mockReturnValue('logs');
      mockGetQuery.mockReturnValue({ query: '', language: 'FakeQL', dataset: { type: 'FAKE' } });

      renderWithStore();

      expect(capturedSupportedTypes).toEqual(['FAKE']);
    });

    it('keeps the default types while OpenSearch is active', () => {
      registerFakeSource();
      mockUseFlavorId.mockReturnValue('logs');

      renderWithStore();

      expect(capturedSupportedTypes).toEqual(['INDEX', 'index_pattern']);
    });

    it('starts a switch to a registered source from an empty editor', async () => {
      registerFakeSource();
      mockGetQuery.mockReturnValue({
        query: 'source = logs | where status = 500',
        language: 'PPL',
        dataset: { id: 'logs', type: 'index_pattern' },
      });
      mockPickedDataset = { id: 'fake-1', type: 'FAKE' };
      mockGetInitialQueryByDataset.mockReturnValue({ query: 'fake default', language: 'FakeQL' });

      renderWithStore();
      fireEvent.click(screen.getByTestId('dataset-select-button'));

      await waitFor(() => {
        expect(mockSetQuery).toHaveBeenCalledWith({
          query: '',
          language: 'FakeQL',
          dataset: { id: 'fake-1', type: 'FAKE' },
        });
      });
      expect(mockClearEditors).toHaveBeenCalled();
    });

    it('still clears the editor when OpenSearch switches between index patterns', async () => {
      mockGetQuery.mockReturnValue({
        query: 'where status = 500',
        language: 'PPL',
        dataset: { id: 'logs', type: 'index_pattern' },
      });

      renderWithStore();
      fireEvent.click(screen.getByTestId('dataset-select-button'));

      await waitFor(() => {
        expect(mockSetQuery).toHaveBeenCalledWith(expect.objectContaining({ query: '' }));
      });
      expect(mockClearEditors).toHaveBeenCalled();
    });
  });

  describe('source type dataset selector', () => {
    it('renders the source type selector instead of the generic picker', () => {
      registerFakeSource(FakeSelector);
      mockUseFlavorId.mockReturnValue('logs');
      mockGetQuery.mockReturnValue({
        query: '',
        language: 'FakeQL',
        dataset: { id: 'fake-1', type: 'FAKE' },
      });

      renderWithStore();

      expect(screen.getByTestId('fake-selector')).toHaveTextContent('fake-1');
      expect(screen.queryByTestId('dataset-select')).not.toBeInTheDocument();
      expect(mockSelectorProps).toHaveBeenLastCalledWith(
        expect.objectContaining({
          dataset: { id: 'fake-1', type: 'FAKE' },
          flavor: 'logs',
          data: expect.anything(),
          onSelect: expect.any(Function),
        })
      );
    });

    it('keeps the generic picker while OpenSearch is active', () => {
      registerFakeSource(FakeSelector);

      renderWithStore();

      expect(screen.getByTestId('dataset-select')).toBeInTheDocument();
      expect(screen.queryByTestId('fake-selector')).not.toBeInTheDocument();
    });

    it("applies the selector's choice like a picker selection", async () => {
      registerFakeSource(FakeSelector);
      mockGetQuery.mockReturnValue({
        query: 'fields @message | limit 7',
        language: 'FakeQL',
        dataset: { id: 'fake-1', type: 'FAKE' },
      });
      mockGetInitialQueryByDataset.mockReturnValue({ query: 'fake default', language: 'FakeQL' });
      mockGetType = jest.fn(() => ({ supportedLanguages: () => ['FakeQL'] }));

      renderWithStore();
      fireEvent.click(screen.getByTestId('fake-selector'));

      await waitFor(() => {
        expect(mockSetQuery).toHaveBeenCalledWith({
          query: '',
          language: 'FakeQL',
          dataset: { id: 'fake-2', type: 'FAKE' },
        });
        expect(mockDispatch).toHaveBeenCalledWith(mockSetQueryWithHistory());
      });
      expect(mockClearEditors).toHaveBeenCalled();
    });

    it("falls back to the picked type's own language when it can't run PPL", async () => {
      registerFakeSource(FakeSelector);
      mockGetQuery.mockReturnValue({
        query: '',
        language: 'FakeQL',
        dataset: { id: 'fake-1', type: 'FAKE' },
      });
      mockGetInitialQueryByDataset.mockReturnValue({ query: 'x', language: 'OtherQL' });
      mockGetType = jest.fn(() => ({ supportedLanguages: () => ['FakeQL'] }));

      renderWithStore();
      fireEvent.click(screen.getByTestId('fake-selector'));

      await waitFor(() => {
        expect(mockSetQuery).toHaveBeenCalledWith({
          query: '',
          language: 'FakeQL',
          dataset: { id: 'fake-2', type: 'FAKE' },
        });
      });
    });

    it('falls back to PPL when the picked type offers no language Explore can run', async () => {
      registerFakeSource(FakeSelector);
      mockGetQuery.mockReturnValue({
        query: '',
        language: 'PPL',
        dataset: { id: 'fake-1', type: 'FAKE' },
      });
      mockGetInitialQueryByDataset.mockReturnValue({ query: 'x', language: 'OtherQL' });
      mockGetType = jest.fn(() => ({ supportedLanguages: () => ['kuery'] }));

      renderWithStore();
      fireEvent.click(screen.getByTestId('fake-selector'));

      await waitFor(() => {
        expect(mockSetQuery).toHaveBeenCalledWith({
          query: '',
          language: 'PPL',
          dataset: { id: 'fake-2', type: 'FAKE' },
        });
      });
    });
  });
});
