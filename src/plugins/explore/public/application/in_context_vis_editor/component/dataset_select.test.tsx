/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
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
const mockGetInitialQueryByDataset = jest.fn();
const mockClearEditor = jest.fn();
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
jest.mock('../query_builder/utils', () => ({
  getRequiredSignalType: jest.fn((lang) => (lang === 'PROMQL' ? 'metrics' : ['logs', 'traces'])),
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

  (useOpenSearchDashboards as jest.Mock).mockReturnValue({ services: buildServices() });
  (useQueryBuilderState as jest.Mock).mockReturnValue({
    queryEditorState: { languageType: 'PPL' },
    queryBuilder: {
      updateQueryState: mockUpdateQueryState,
      updateQueryEditorState: mockUpdateQueryEditorState,
    },
  });
  (useEditorOperations as jest.Mock).mockReturnValue({ clearEditor: mockClearEditor });
});

describe('DatasetSelectWidget', () => {
  it('renders DatasetSelect', () => {
    render(<DatasetSelectWidget />);
    expect(screen.getByTestId('dataset-select')).toBeInTheDocument();
  });

  it('handles dataset selection correctly', async () => {
    render(<DatasetSelectWidget />);

    fireEvent.click(screen.getByTestId('select-btn'));

    await waitFor(() => {
      expect(mockGetInitialQueryByDataset).toHaveBeenCalledWith({
        id: 'ds1',
        type: 'INDEX_PATTERN',
      });
      expect(mockUpdateQueryState).toHaveBeenCalledWith(
        expect.objectContaining({ query: '', dataset: { id: 'ds1', type: 'INDEX_PATTERN' } })
      );
      expect(mockUpdateQueryEditorState).toHaveBeenCalledWith({ isQueryEditorDirty: true });
      expect(mockClearEditor).toHaveBeenCalled();
    });
  });

  it('passes default supportedType array for PPL language', () => {
    render(<DatasetSelectWidget />);
    expect(capturedSupportedTypes).toEqual(['INDEXES', 'INDEX_PATTERN']);
  });

  it('passes PROMETHEUS supportedTypes for promQL language', () => {
    (useQueryBuilderState as jest.Mock).mockReturnValue({
      queryEditorState: { languageType: 'PROMQL' },
      queryBuilder: {
        updateQueryState: mockUpdateQueryState,
        updateQueryEditorState: mockUpdateQueryEditorState,
      },
    });

    render(<DatasetSelectWidget />);
    expect(capturedSupportedTypes).toEqual(['PROMETHEUS']);
  });

  it('passes logs and traces signalTypes from getRequiredSignalType', () => {
    render(<DatasetSelectWidget />);
    expect(capturedSignalType).toEqual(['logs', 'traces']);
  });

  it('passes metric signalType from getRequiredSignalType for promQL', () => {
    (useQueryBuilderState as jest.Mock).mockReturnValue({
      queryEditorState: { languageType: 'PROMQL' },
      queryBuilder: {
        updateQueryState: mockUpdateQueryState,
        updateQueryEditorState: mockUpdateQueryEditorState,
      },
    });

    render(<DatasetSelectWidget />);
    expect(capturedSignalType).toBe('metrics');
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
        expect(mockClearEditor).toHaveBeenCalled();
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

    // Only a dataset type that needs an explicit Run keeps the query.
    const EXPLICIT_RUN = { meta: { requiresExplicitRun: true } };

    it('keeps the query and the editor when the new dataset runs the same language', async () => {
      mockGetType.mockReturnValue({ ...EXPLICIT_RUN, supportedLanguages: () => ['my_language'] });
      mockGetInitialQueryByDataset.mockReturnValue({
        query: '',
        language: 'my_language',
        dataset: OTHER_LOG_GROUPS,
      });
      withQueryState({
        query: 'stats count(*) by bin(5m)',
        language: 'my_language',
        dataset: LOG_GROUPS,
      });

      await pick(OTHER_LOG_GROUPS);

      expect(mockUpdateQueryState).toHaveBeenCalledTimes(1);
      expect(mockUpdateQueryState).toHaveBeenCalledWith({ dataset: OTHER_LOG_GROUPS });
      expect(mockUpdateQueryEditorState).toHaveBeenCalledWith({ isQueryEditorDirty: true });
      expect(mockClearEditor).not.toHaveBeenCalled();
    });

    it('empties the query when the new dataset uses another language', async () => {
      mockGetType.mockReturnValue({ supportedLanguages: () => ['PPL'] });
      mockGetInitialQueryByDataset.mockReturnValue({
        query: '',
        language: 'PPL',
        dataset: { id: 'logs', title: 'logs', type: 'INDEX_PATTERN' },
      });
      withQueryState({
        query: 'stats count(*) by bin(5m)',
        language: 'my_language',
        dataset: LOG_GROUPS,
      });

      await pick({ id: 'logs', title: 'logs', type: 'INDEX_PATTERN' });

      expect(mockUpdateQueryState).toHaveBeenCalledWith(
        expect.objectContaining({ query: '', language: 'PPL' })
      );
      expect(mockClearEditor).toHaveBeenCalled();
    });

    it('empties the query of a dataset type that does not need an explicit Run, as before', async () => {
      mockGetType.mockReturnValue({ supportedLanguages: () => ['my_language'] });
      mockGetInitialQueryByDataset.mockReturnValue({
        query: '',
        language: 'my_language',
        dataset: OTHER_LOG_GROUPS,
      });
      withQueryState({
        query: 'stats count(*) by bin(5m)',
        language: 'my_language',
        dataset: LOG_GROUPS,
      });

      await pick(OTHER_LOG_GROUPS);

      expect(mockUpdateQueryState).toHaveBeenCalledWith(
        expect.objectContaining({ query: '', dataset: OTHER_LOG_GROUPS })
      );
      expect(mockClearEditor).toHaveBeenCalled();
    });

    it('keeps a PPL query that does not name its index', async () => {
      mockGetType.mockReturnValue({ ...EXPLICIT_RUN, supportedLanguages: () => ['PPL', 'SQL'] });
      withQueryState({
        query: '| stats count() by status',
        language: 'PPL',
        dataset: { id: 'logs-a', title: 'logs-a', type: 'INDEX_PATTERN' },
      });

      await pick({ id: 'logs-b', title: 'logs-b', type: 'INDEX_PATTERN' });

      expect(mockUpdateQueryState).toHaveBeenCalledWith({
        dataset: { id: 'logs-b', title: 'logs-b', type: 'INDEX_PATTERN' },
      });
      expect(mockClearEditor).not.toHaveBeenCalled();
    });

    it('empties a PPL query on an OpenSearch index pattern, as before', async () => {
      mockGetType.mockReturnValue({ supportedLanguages: () => ['PPL', 'SQL'] });
      withQueryState({
        query: '| stats count() by status',
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
      expect(mockClearEditor).toHaveBeenCalled();
    });

    it('empties a PPL query that names the previous index, as before', async () => {
      mockGetType.mockReturnValue({ ...EXPLICIT_RUN, supportedLanguages: () => ['PPL', 'SQL'] });
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
      expect(mockClearEditor).toHaveBeenCalled();
    });

    // A query that names its own index runs on it whatever the previous dataset's title was.
    it('empties a PPL query that names its own index, though not by the previous title', async () => {
      mockGetType.mockReturnValue({ ...EXPLICIT_RUN, supportedLanguages: () => ['PPL', 'SQL'] });
      withQueryState({
        query: 'source = logs-2026.01 | stats count() by status',
        language: 'PPL',
        dataset: { id: 'logs-all', title: 'logs-*', type: 'INDEX_PATTERN' },
      });

      await pick({ id: 'logs-b', title: 'logs-b', type: 'INDEX_PATTERN' });

      expect(mockUpdateQueryState).toHaveBeenCalledWith(
        expect.objectContaining({ query: '', dataset: expect.objectContaining({ id: 'logs-b' }) })
      );
      expect(mockClearEditor).toHaveBeenCalled();
    });
  });
});
