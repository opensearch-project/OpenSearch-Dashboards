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
});
