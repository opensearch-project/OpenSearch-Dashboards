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
});
