/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react';
import { useEditorFocus } from '../use_editor_focus';
import { useSetEditorText } from '../use_set_editor_text';
import { DataViewField as DatasetField, opensearchFilters } from '../../../../../../data/public';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { useDatasetContext } from '../../../context';
import { useSelector } from '../../../legacy/discover/application/utils/state_management';
import { useDispatch } from 'react-redux';
import { selectEditorMode, selectQuery } from '../../../utils/state_management/selectors';
import { onEditorRunActionCreator } from '../../../utils/state_management/actions/query_editor';
import { setIsQueryEditorDirty } from '../../../utils/state_management/slices/query_editor';
import { EditorMode } from '../../../utils/state_management/types';
import { useChangeQueryEditor } from './use_change_query_editor';

jest.mock('../../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn(),
}));

jest.mock('../../../legacy/discover/application/utils/state_management', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../../../utils/state_management/selectors', () => ({
  selectEditorMode: jest.fn(),
  selectQuery: jest.fn(),
}));

jest.mock('../../../utils/state_management/actions/query_editor', () => ({
  onEditorRunActionCreator: jest.fn(() => ({ type: 'run' })),
}));

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
}));

jest.mock('../../../../../../data/public', () => ({
  opensearchFilters: {
    generateFilters: jest.fn(),
  },
  ResultStatus: {
    UNINITIALIZED: 'uninitialized',
    LOADING: 'loading',
    READY: 'ready',
    NO_RESULTS: 'none',
    ERROR: 'error',
  },
}));

jest.mock('../../../context', () => ({
  useDatasetContext: jest.fn(),
}));

jest.mock('../use_editor_focus', () => ({
  useEditorFocus: jest.fn(),
}));

jest.mock('../use_set_editor_text', () => ({
  useSetEditorText: jest.fn(),
}));

describe('useChangeQueryEditor', () => {
  const mockFilterManager = { add: jest.fn() };
  const mockLanguageService = { getLanguage: jest.fn() };
  const mockSetQuery = jest.fn();
  const mockGetQuery = jest.fn();
  const mockQueryString = {
    getLanguageService: jest.fn(() => mockLanguageService),
    getQuery: mockGetQuery,
    setQuery: mockSetQuery,
  };
  const mockIndexPattern = { id: 'test-index-pattern-id' };
  const mockSetEditorText = jest.fn();
  const mockFocusOnEditor = jest.fn();
  const mockDispatch = jest.fn();
  const mockServices = {
    data: {
      query: {
        filterManager: mockFilterManager,
        queryString: mockQueryString,
      },
    },
  };
  const mockLanguageConfig = {
    getQueryString: jest.fn(() => 'source = logs'),
    addFiltersToQuery: jest.fn(),
    addFiltersToPrompt: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (useOpenSearchDashboards as jest.Mock).mockReturnValue({ services: mockServices });

    (useDatasetContext as jest.Mock).mockReturnValue({ dataset: mockIndexPattern });
    (useSetEditorText as jest.Mock).mockReturnValue(mockSetEditorText);
    (useEditorFocus as jest.Mock).mockReturnValue(mockFocusOnEditor);
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector === selectEditorMode) return EditorMode.Query;
      if (selector === selectQuery) return { language: 'PPL' };
      return undefined;
    });

    mockGetQuery.mockReturnValue({ query: 'source = logs', language: 'PPL' });
    mockLanguageService.getLanguage.mockReturnValue(mockLanguageConfig);
    mockLanguageConfig.getQueryString = jest.fn(() => 'source = logs');
    mockLanguageConfig.addFiltersToPrompt = jest.fn().mockReturnValue('modified prompt');

    (opensearchFilters.generateFilters as jest.Mock).mockReturnValue([
      { meta: { key: 'field', value: 'value' } },
    ]);
  });

  it('should correctly initialize the hook', () => {
    const { result } = renderHook(() => useChangeQueryEditor());
    expect(result.current.onAddFilter).toBeDefined();
    expect(typeof result.current.onAddFilter).toBe('function');
  });

  it('should not add filters when dataset is undefined', () => {
    (useDatasetContext as jest.Mock).mockReturnValue({ dataset: undefined });

    const { result } = renderHook(() => useChangeQueryEditor());
    result.current.onAddFilter('service', 'web', '+');

    expect(mockSetQuery).not.toHaveBeenCalled();
    expect(mockSetEditorText).not.toHaveBeenCalled();
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('serializes via the language config, commits to the draft, and runs the query', () => {
    mockLanguageConfig.addFiltersToQuery = jest.fn().mockReturnValue("source = logs service='web'");

    const { result } = renderHook(() => useChangeQueryEditor());
    result.current.onAddFilter('service', 'web', '+');

    expect(mockLanguageConfig.addFiltersToQuery).toHaveBeenCalledWith('source = logs', [
      { meta: { key: 'field', value: 'value' } },
    ]);
    expect(mockSetQuery).toHaveBeenCalledWith({
      query: "source = logs service='web'",
      language: 'PPL',
    });
    expect(mockSetEditorText).toHaveBeenCalledWith("source = logs service='web'");
    expect(onEditorRunActionCreator).toHaveBeenCalledWith(
      mockServices,
      "source = logs service='web'"
    );
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'run' });
    expect(mockFocusOnEditor).toHaveBeenCalled();
  });

  it('falls back to the language default query string when the draft is empty', () => {
    mockGetQuery.mockReturnValue({ query: '', language: 'PPL' });
    mockLanguageConfig.addFiltersToQuery = jest.fn().mockReturnValue('serialized');

    const { result } = renderHook(() => useChangeQueryEditor());
    result.current.onAddFilter('service', 'web', '+');

    expect(mockLanguageConfig.getQueryString).toHaveBeenCalled();
    expect(mockLanguageConfig.addFiltersToQuery).toHaveBeenCalledWith('source = logs', [
      { meta: { key: 'field', value: 'value' } },
    ]);
  });

  it('should use addFiltersToPrompt and stage (not run) in Prompt mode', () => {
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector === selectEditorMode) return EditorMode.Prompt;
      if (selector === selectQuery) return { language: 'PPL' };
      return undefined;
    });

    const { result } = renderHook(() => useChangeQueryEditor());
    result.current.onAddFilter('service', 'web', '+');

    expect(opensearchFilters.generateFilters).toHaveBeenCalledWith(
      mockFilterManager,
      'service',
      'web',
      '+',
      'test-index-pattern-id'
    );
    expect(mockLanguageConfig.addFiltersToPrompt).toHaveBeenCalledWith('source = logs', [
      { meta: { key: 'field', value: 'value' } },
    ]);
    expect(mockSetEditorText).toHaveBeenCalledWith('modified prompt');
    // Prompt mode stages only; it does not commit to the draft or run.
    expect(mockSetQuery).not.toHaveBeenCalled();
    expect(onEditorRunActionCreator).not.toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith(setIsQueryEditorDirty(true));
    expect(mockFocusOnEditor).toHaveBeenCalled();
  });

  it('should use addFiltersToQuery for non-PPL languages', () => {
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector === selectEditorMode) return EditorMode.Query;
      if (selector === selectQuery) return { language: 'SQL' };
      return undefined;
    });
    mockGetQuery.mockReturnValue({ query: 'SELECT * FROM t', language: 'SQL' });
    mockLanguageConfig.addFiltersToQuery = jest.fn().mockReturnValue('SELECT * FROM t WHERE x=1');

    const { result } = renderHook(() => useChangeQueryEditor());
    result.current.onAddFilter('x', '1', '+');

    expect(mockLanguageConfig.addFiltersToQuery).toHaveBeenCalledWith('SELECT * FROM t', [
      { meta: { key: 'field', value: 'value' } },
    ]);
    expect(mockSetQuery).toHaveBeenCalledWith({
      query: 'SELECT * FROM t WHERE x=1',
      language: 'SQL',
    });
    expect(onEditorRunActionCreator).toHaveBeenCalledWith(
      mockServices,
      'SELECT * FROM t WHERE x=1'
    );
  });

  it('should accept a DatasetField object as the field parameter', () => {
    const mockField = {
      name: 'service',
      type: 'string',
      aggregatable: true,
      searchable: true,
    } as DatasetField;

    const { result } = renderHook(() => useChangeQueryEditor());
    result.current.onAddFilter(mockField, 'web', '+');

    expect(opensearchFilters.generateFilters).toHaveBeenCalledWith(
      mockFilterManager,
      mockField,
      'web',
      '+',
      'test-index-pattern-id'
    );
  });
});
