/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DatasetSelectWidget } from './dataset_select';
import { QueryPanelFullProps } from './query_panel_context';

const mockHandleQueryChange = jest.fn();
const mockHandleEditorChange = jest.fn();
const mockClearEditor = jest.fn();
const mockGetInitialQueryByDataset = jest.fn();
const mockToastAddError = jest.fn();

let capturedSupportedTypes: string[];
let capturedSignalType: string | string[];
let mockQueryEditorState: any;
let mockServices: any;

jest.mock('../../query_builder/query_builder', () => ({
  SupportLanguageType: { ppl: 'PPL', promQL: 'PROMQL', ai: 'AI' },
}));
jest.mock('../../query_builder/utils', () => ({
  getRequiredSignalType: jest.fn((lang) => (lang === 'PROMQL' ? 'metrics' : ['logs', 'traces'])),
}));

jest.mock('./query_panel_context', () => ({
  useQueryPanelContext: (): Partial<QueryPanelFullProps> => ({
    services: mockServices,
    supportedTypes: ['INDEXES', 'INDEX_PATTERN'],
    queryEditorState: mockQueryEditorState,
    handleQueryChange: mockHandleQueryChange,
    handleEditorChange: mockHandleEditorChange,
    editorOperations: {
      clearEditor: mockClearEditor,
    } as any,
  }),
}));

const buildServices = () => ({
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
        getInitialQueryByDataset: mockGetInitialQueryByDataset,
        getDatasetService: () => ({
          cacheDataset: jest.fn(),
        }),
      },
    },
  },
  notifications: {
    toasts: {
      addError: mockToastAddError,
    },
  },
  appName: 'explore',
});

beforeEach(() => {
  jest.clearAllMocks();
  mockGetInitialQueryByDataset.mockReturnValue({ query: '', language: 'PPL', dataset: undefined });
  mockQueryEditorState = { languageType: 'PPL' };
  mockServices = buildServices();
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
      expect(mockHandleQueryChange).toHaveBeenCalledWith(
        expect.objectContaining({ query: '', dataset: { id: 'ds1', type: 'INDEX_PATTERN' } })
      );
      expect(mockHandleEditorChange).toHaveBeenCalledWith({
        isQueryEditorDirty: true,
        editorMode: 'query',
      });
      expect(mockClearEditor).toHaveBeenCalled();
    });
  });

  it('passes default supportedType array for PPL language', () => {
    render(<DatasetSelectWidget />);
    expect(capturedSupportedTypes).toEqual(['INDEXES', 'INDEX_PATTERN']);
  });

  it('passes PROMETHEUS supportedTypes for promQL language', () => {
    mockQueryEditorState = { languageType: 'PROMQL' };
    render(<DatasetSelectWidget />);
    expect(capturedSupportedTypes).toEqual(['PROMETHEUS']);
  });

  it('passes logs and traces signalTypes from getRequiredSignalType', () => {
    render(<DatasetSelectWidget />);
    expect(capturedSignalType).toEqual(['logs', 'traces']);
  });

  it('passes metric signalType from getRequiredSignalType for promQL', () => {
    mockQueryEditorState = { languageType: 'PROMQL' };
    render(<DatasetSelectWidget />);
    expect(capturedSignalType).toBe('metrics');
  });
});
