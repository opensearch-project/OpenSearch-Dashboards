/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DatasetSelectWidget } from './dataset_select';
import { useQueryBuilderState } from '../hooks/use_query_builder_state';
import { useEditorOperations } from '../hooks/use_editor_operations';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import {
  SourceTypeDatasetSelectorProps,
  SourceTypeRegistryService,
  setSourceTypeRegistry,
} from '../../../services/source_type_registry';

const mockUpdateQueryState = jest.fn();
const mockUpdateQueryEditorState = jest.fn();
const mockMarkStale = jest.fn();
const mockGetInitialQueryByDataset = jest.fn();
const mockClearEditor = jest.fn();
const mockSetEditorText = jest.fn();
const mockResetEditorMode = jest.fn();
const mockGetInitialQueryString = jest.fn();
const mockSetQuery = jest.fn();
const mockGetQuery = jest.fn();
const mockCacheDataset = jest.fn();
const mockToastAddError = jest.fn();
const mockToastAddWarning = jest.fn();
const mockGetType = jest.fn();

let capturedSupportedTypes: string[];
let capturedSignalType: string | string[];

jest.mock('../hooks/use_query_builder_state', () => ({
  useQueryBuilderState: jest.fn(),
}));
jest.mock('../hooks/use_editor_operations', () => ({
  useEditorOperations: jest.fn(),
}));
jest.mock('../query_builder/query_builder', () => ({
  SupportLanguageType: { ppl: 'PPL', promQL: 'PROMQL', ai: 'AI' },
}));
const mockResolveDatasetLanguage = jest.fn();
jest.mock('../query_builder/utils', () => ({
  getRequiredSignalType: jest.fn((lang) => (lang === 'PROMQL' ? 'metrics' : ['logs', 'traces'])),
  resolveDatasetLanguage: (...args: unknown[]) => mockResolveDatasetLanguage(...args),
  getInitialQueryString: (...args: unknown[]) => mockGetInitialQueryString(...args),
}));
jest.mock('../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn(),
}));
jest.mock('../visualization_editor.scss', () => ({}), { virtual: true });

const buildServices = (overrides: Record<string, any> = {}) => ({
  data: {
    ui: {
      DatasetSelect: ({ onSelect, supportedTypes, signalType }: any) => {
        capturedSupportedTypes = supportedTypes;
        capturedSignalType = signalType;
        return (
          <div data-test-subj="dataset-select">
            <button
              data-test-subj="select-btn"
              onClick={() => onSelect({ id: 'ds1', type: 'INDEX_PATTERN' })}
            >
              Select
            </button>
            <button data-test-subj="clear-btn" onClick={() => onSelect(undefined)}>
              Clear
            </button>
          </div>
        );
      },
    },
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
          getType: mockGetType,
        }),
      },
    },
  },
  notifications: {
    toasts: {
      addError: mockToastAddError,
      addWarning: mockToastAddWarning,
    },
  },
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  setSourceTypeRegistry(new SourceTypeRegistryService());
  mockGetInitialQueryByDataset.mockReturnValue({ query: '', language: 'PPL', dataset: undefined });
  mockResolveDatasetLanguage.mockReturnValue('PPL');
  mockGetInitialQueryString.mockReturnValue('');
  // Prometheus is a registered dataset type in these tests.
  mockGetType.mockReturnValue({ id: 'PROMETHEUS' });

  (useOpenSearchDashboards as jest.Mock).mockReturnValue({ services: buildServices() });

  (useQueryBuilderState as jest.Mock).mockReturnValue({
    queryState: { query: '', language: 'PPL', dataset: undefined },
    queryEditorState: {},
    queryBuilder: {
      updateQueryState: mockUpdateQueryState,
      updateQueryEditorState: mockUpdateQueryEditorState,
    },
    container: { markStale: mockMarkStale },
  });
  (useEditorOperations as jest.Mock).mockReturnValue({
    clearEditor: mockClearEditor,
    setEditorText: mockSetEditorText,
    resetEditorMode: mockResetEditorMode,
  });
});

describe('DatasetSelectWidget', () => {
  it('renders DatasetSelect', () => {
    render(<DatasetSelectWidget />);
    expect(screen.getByTestId('dataset-select')).toBeInTheDocument();
  });

  it('handles dataset selection correctly', async () => {
    render(<DatasetSelectWidget />);

    mockGetInitialQueryString.mockReturnValue('SELECT * FROM ds1');
    fireEvent.click(screen.getByTestId('select-btn'));
    await waitFor(() => {
      expect(mockGetInitialQueryString).toHaveBeenCalledWith(
        expect.anything(),
        { id: 'ds1', type: 'INDEX_PATTERN' },
        'PPL'
      );
      expect(mockUpdateQueryState).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'SELECT * FROM ds1',
          dataset: { id: 'ds1', type: 'INDEX_PATTERN' },
        })
      );
      // Picking a dataset is an edit: the button offers Update.
      expect(mockMarkStale).toHaveBeenCalled();
      // The new query is written into the editor even when the string didn't change.
      expect(mockSetEditorText).toHaveBeenCalledWith('SELECT * FROM ds1');
      expect(mockResetEditorMode).toHaveBeenCalled();
    });
  });

  // The dataset decides the language, so the picker offers every type whatever the language.
  it('passes all dataset types, including PROMETHEUS, for PPL', () => {
    render(<DatasetSelectWidget />);
    expect(capturedSupportedTypes).toEqual(['INDEXES', 'INDEX_PATTERN', 'PROMETHEUS']);
  });

  it('passes the same dataset types for PromQL', () => {
    (useQueryBuilderState as jest.Mock).mockReturnValue({
      queryState: { query: '', language: 'PROMQL', dataset: undefined },
      queryEditorState: {},
      queryBuilder: {
        updateQueryState: mockUpdateQueryState,
        updateQueryEditorState: mockUpdateQueryEditorState,
      },
    });

    render(<DatasetSelectWidget />);
    expect(capturedSupportedTypes).toEqual(['INDEXES', 'INDEX_PATTERN', 'PROMETHEUS']);
  });

  it('passes logs, traces and metrics signal types', () => {
    render(<DatasetSelectWidget />);
    expect(capturedSignalType).toEqual(['logs', 'traces', 'metrics']);
  });

  it('switches to a language the dataset can run when it carries none', async () => {
    // getInitialQueryByDataset kept the current language (PPL) for a dataset without one.
    mockResolveDatasetLanguage.mockReturnValue('PROMQL');
    render(<DatasetSelectWidget />);
    fireEvent.click(screen.getByTestId('select-btn'));
    await waitFor(() => {
      // The current language is preferred; the dataset decides when it can't run it.
      expect(mockResolveDatasetLanguage).toHaveBeenCalledWith(
        expect.anything(),
        { id: 'ds1', type: 'INDEX_PATTERN' },
        'PPL'
      );
      expect(mockUpdateQueryState).toHaveBeenCalledWith(
        expect.objectContaining({ language: 'PROMQL' })
      );
    });
  });

  it('clears the previous language query options on dataset selection', async () => {
    render(<DatasetSelectWidget />);
    fireEvent.click(screen.getByTestId('select-btn'));
    await waitFor(() => {
      expect(mockUpdateQueryState).toHaveBeenCalledWith(
        expect.objectContaining({ queryOptions: undefined })
      );
    });
  });

  describe('on a registered source type dataset', () => {
    const SOURCE_DATASET = { id: 'my-dataset', title: 'my-dataset', type: 'MY_SOURCE_TYPE' };
    let selectorProps: SourceTypeDatasetSelectorProps | undefined;
    const MySourceSelector = (props: SourceTypeDatasetSelectorProps) => {
      selectorProps = props;
      return (
        <button
          data-test-subj="my-source-select"
          onClick={() => props.onSelect({ ...SOURCE_DATASET, id: 'my-other-dataset' })}
        >
          Pick
        </button>
      );
    };

    const registerSource = (datasetSelector?: typeof MySourceSelector) => {
      const registry = new SourceTypeRegistryService();
      registry.register({
        id: 'my-source',
        label: 'My source',
        datasetTypes: ['MY_SOURCE_TYPE', 'MY_OTHER_SOURCE_TYPE'],
        resolveDefaultDataset: async () => undefined,
        datasetSelector,
      });
      setSourceTypeRegistry(registry);
      (useQueryBuilderState as jest.Mock).mockReturnValue({
        queryState: { query: '', language: 'my_language', dataset: SOURCE_DATASET },
        queryEditorState: { languageType: 'my_language' },
        queryBuilder: {
          updateQueryState: mockUpdateQueryState,
          updateQueryEditorState: mockUpdateQueryEditorState,
        },
        container: { markStale: mockMarkStale },
      });
    };

    beforeEach(() => {
      selectorProps = undefined;
    });

    it("renders the source's own selector in place of the generic picker", () => {
      registerSource(MySourceSelector);
      render(<DatasetSelectWidget />);
      expect(screen.getByTestId('my-source-select')).toBeInTheDocument();
      expect(screen.queryByTestId('dataset-select')).not.toBeInTheDocument();
      expect(selectorProps?.dataset).toEqual(SOURCE_DATASET);
      expect(selectorProps?.flavor).toBeNull();
    });

    it("applies the selector's choice like a pick from the generic picker", async () => {
      registerSource(MySourceSelector);
      render(<DatasetSelectWidget />);
      fireEvent.click(screen.getByTestId('my-source-select'));
      await waitFor(() => {
        expect(mockUpdateQueryState).toHaveBeenCalledWith(
          expect.objectContaining({
            query: '',
            dataset: { ...SOURCE_DATASET, id: 'my-other-dataset' },
          })
        );
        expect(mockMarkStale).toHaveBeenCalled();
        expect(mockSetEditorText).toHaveBeenCalledWith('');
        expect(mockResetEditorMode).toHaveBeenCalled();
      });
    });

    it("limits the generic picker to the source's dataset types without a selector", () => {
      registerSource();
      render(<DatasetSelectWidget />);
      expect(screen.getByTestId('dataset-select')).toBeInTheDocument();
      expect(capturedSupportedTypes).toEqual(['MY_SOURCE_TYPE', 'MY_OTHER_SOURCE_TYPE']);
    });
  });

  describe('keeping the query on a dataset pick', () => {
    const LOG_GROUPS = { id: 'groups-a', title: 'group-a', type: 'MY_LOGS_TYPE' };
    const OTHER_LOG_GROUPS = { id: 'groups-b', title: 'group-b', type: 'MY_LOGS_TYPE' };

    const withQueryState = (queryState: Record<string, any>) =>
      (useQueryBuilderState as jest.Mock).mockReturnValue({
        queryState,
        queryEditorState: { languageType: queryState.language },
        queryBuilder: {
          updateQueryState: mockUpdateQueryState,
          updateQueryEditorState: mockUpdateQueryEditorState,
        },
        container: { markStale: mockMarkStale },
      });

    const pick = async (dataset: Record<string, any>) => {
      (useOpenSearchDashboards as jest.Mock).mockReturnValue({
        services: buildServices({
          data: {
            ...buildServices().data,
            ui: {
              DatasetSelect: ({ onSelect }: any) => (
                <button data-test-subj="pick-btn" onClick={() => onSelect(dataset)}>
                  Pick
                </button>
              ),
            },
          },
        }),
      });
      render(<DatasetSelectWidget />);
      fireEvent.click(screen.getByTestId('pick-btn'));
      await waitFor(() => expect(mockUpdateQueryState).toHaveBeenCalled());
    };

    it('keeps the query and the editor when the new dataset runs the same language', async () => {
      mockResolveDatasetLanguage.mockReturnValue('my_language');
      withQueryState({
        query: 'stats count(*) by bin(5m)',
        language: 'my_language',
        dataset: LOG_GROUPS,
      });

      await pick(OTHER_LOG_GROUPS);

      expect(mockUpdateQueryState).toHaveBeenCalledTimes(1);
      expect(mockUpdateQueryState).toHaveBeenCalledWith({ dataset: OTHER_LOG_GROUPS });
      // expect(mockUpdateQueryEditorState).toHaveBeenCalledWith({ isQueryEditorDirty: true });
      expect(mockMarkStale).toHaveBeenCalled();
      expect(mockClearEditor).not.toHaveBeenCalled();
      expect(mockSetEditorText).not.toHaveBeenCalled();
    });

    it('empties the query when the new dataset uses another language', async () => {
      // The dataset can't run my_language: resolveDatasetLanguage falls back to its own (PPL).
      mockResolveDatasetLanguage.mockReturnValue('PPL');
      withQueryState({
        query: 'stats count(*) by bin(5m)',
        language: 'my_language',
        dataset: LOG_GROUPS,
      });

      await pick({ id: 'logs', title: 'logs', type: 'INDEX_PATTERN' });

      expect(mockUpdateQueryState).toHaveBeenCalledWith(
        expect.objectContaining({ query: '', language: 'PPL' })
      );

      // The editor takes the new dataset's initial query.
      expect(mockSetEditorText).toHaveBeenCalledWith('');
    });

    it('keeps a PPL query that does not name its index', async () => {
      // mockGetType.mockReturnValue({ supportedLanguages: () => ['PPL', 'SQL'] });
      withQueryState({
        query: '| stats count() by status',
        language: 'PPL',
        dataset: { id: 'logs-a', title: 'logs-a', type: 'INDEX_PATTERN' },
      });

      await pick({ id: 'logs-b', title: 'logs-b', type: 'INDEX_PATTERN' });

      expect(mockUpdateQueryState).toHaveBeenCalledWith({
        dataset: { id: 'logs-b', title: 'logs-b', type: 'INDEX_PATTERN' },
      });
      expect(mockMarkStale).toHaveBeenCalled();
      expect(mockClearEditor).not.toHaveBeenCalled();
    });

    it('empties a PPL query that names the previous index, as before', async () => {
      withQueryState({
        query: 'source = `logs-a` | stats count() by status',
        language: 'PPL',
        dataset: { id: 'logs-a', title: 'logs-a', type: 'INDEX_PATTERN' },
      });

      await pick({ id: 'logs-b', title: 'logs-b', type: 'INDEX_PATTERN' });

      expect(mockUpdateQueryState).toHaveBeenCalledWith(
        expect.objectContaining({
          query: '',
          dataset: { id: 'logs-b', title: 'logs-b', type: 'INDEX_PATTERN' },
        })
      );
      // expect(mockClearEditor).toHaveBeenCalled();
      expect(mockSetEditorText).toHaveBeenCalledWith('');
    });

    // A query that names its own index runs on it whatever the previous dataset's title was.
    it('empties a PPL query that names its own index, though not by the previous title', async () => {
      // mockGetType.mockReturnValue({ supportedLanguages: () => ['PPL', 'SQL'] });
      withQueryState({
        query: 'source = logs-2026.01 | stats count() by status',
        language: 'PPL',
        dataset: { id: 'logs-all', title: 'logs-*', type: 'INDEX_PATTERN' },
      });

      await pick({ id: 'logs-b', title: 'logs-b', type: 'INDEX_PATTERN' });

      expect(mockUpdateQueryState).toHaveBeenCalledWith(
        expect.objectContaining({ query: '', dataset: expect.objectContaining({ id: 'logs-b' }) })
      );
      expect(mockSetEditorText).toHaveBeenCalledWith('');
    });

    // A row without a query (a new row, or one whose dataset was cleared) has nothing to keep.
    it('gives a row without a query the new dataset initial query', async () => {
      mockGetInitialQueryString.mockReturnValue('source = logs-b | head 10');
      withQueryState({ query: '', language: 'PPL', dataset: undefined });

      await pick({ id: 'logs-b', title: 'logs-b', type: 'INDEX_PATTERN' });

      expect(mockGetInitialQueryString).toHaveBeenCalled();
      expect(mockUpdateQueryState).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'source = logs-b | head 10',
          language: 'PPL',
          dataset: { id: 'logs-b', title: 'logs-b', type: 'INDEX_PATTERN' },
        })
      );
      expect(mockSetEditorText).toHaveBeenCalledWith('source = logs-b | head 10');
      expect(mockResetEditorMode).toHaveBeenCalled();
    });
  });
});
