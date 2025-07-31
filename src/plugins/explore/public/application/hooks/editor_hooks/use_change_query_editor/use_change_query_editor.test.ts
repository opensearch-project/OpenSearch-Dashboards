/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react-hooks';
import { useEditorFocus } from '../use_editor_focus';
import { useSetEditorText } from '../use_set_editor_text';
import { DataViewField as DatasetField, opensearchFilters } from '../../../../../../data/public';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { useDatasetContext } from '../../../context';
import { useSelector } from '../../../legacy/discover/application/utils/state_management';
import { useDispatch } from 'react-redux';
import {
  selectEditorMode,
  selectQuery,
  selectIsQueryEditorDirty,
} from '../../../utils/state_management/selectors';
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
  selectIsQueryEditorDirty: jest.fn(),
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
  const mockQueryString = { getLanguageService: jest.fn(() => mockLanguageService) };
  const mockIndexPattern = { id: 'test-index-pattern-id' };
  const mockSetEditorText = jest.fn();
  const mockFocusOnEditor = jest.fn();
  const mockLanguageConfig = {
    addFiltersToQuery: jest.fn(),
    addFiltersToPrompt: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (useOpenSearchDashboards as jest.Mock).mockReturnValue({
      services: {
        data: {
          query: {
            filterManager: mockFilterManager,
            queryString: mockQueryString,
          },
        },
      },
    });

    (useDatasetContext as jest.Mock).mockReturnValue({ dataset: mockIndexPattern });
    (useSetEditorText as jest.Mock).mockReturnValue(mockSetEditorText);
    (useEditorFocus as jest.Mock).mockReturnValue(mockFocusOnEditor);
    (useDispatch as jest.Mock).mockReturnValue(jest.fn());
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector === selectEditorMode) return EditorMode.Query;
      if (selector === selectQuery) return { language: 'PPL' };
      if (selector === selectIsQueryEditorDirty) return false;
      return undefined;
    });

    mockLanguageService.getLanguage.mockReturnValue(mockLanguageConfig);
    mockLanguageConfig.addFiltersToQuery = jest.fn().mockReturnValue('modified query');
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
    result.current.onAddFilter('field', 'value', '+');

    expect(opensearchFilters.generateFilters).not.toHaveBeenCalled();
    expect(mockSetEditorText).not.toHaveBeenCalled();
  });

  it('should add filters to query in Query mode', () => {
    const { result } = renderHook(() => useChangeQueryEditor());

    result.current.onAddFilter('field', 'value', '+');

    expect(opensearchFilters.generateFilters).toHaveBeenCalledWith(
      mockFilterManager,
      'field',
      'value',
      '+',
      'test-index-pattern-id'
    );

    expect(mockSetEditorText).toHaveBeenCalled();
    expect(mockFocusOnEditor).toHaveBeenCalled();

    const setTextCallback = mockSetEditorText.mock.calls[0][0];
    const callbackResult = setTextCallback('original text');

    expect(mockLanguageConfig.addFiltersToQuery).toHaveBeenCalledWith('original text', [
      { meta: { key: 'field', value: 'value' } },
    ]);

    expect(callbackResult).toBe('modified query');
  });

  it('should add filters to prompt in Prompt mode', () => {
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector === selectEditorMode) return EditorMode.Prompt;
      if (selector === selectQuery) return { language: 'PPL' };
      return undefined;
    });

    const { result } = renderHook(() => useChangeQueryEditor());

    result.current.onAddFilter('field', 'value', '+');

    expect(mockSetEditorText).toHaveBeenCalled();
    expect(mockFocusOnEditor).toHaveBeenCalled();

    const setTextCallback = mockSetEditorText.mock.calls[0][0];
    const callbackResult = setTextCallback('original prompt');

    expect(mockLanguageConfig.addFiltersToPrompt).toHaveBeenCalledWith('original prompt', [
      { meta: { key: 'field', value: 'value' } },
    ]);

    expect(callbackResult).toBe('modified prompt');
  });

  it('should not update editor text if language config does not provide filter methods', () => {
    // @ts-expect-error
    mockLanguageConfig.addFiltersToQuery = undefined;
    // @ts-expect-error
    mockLanguageConfig.addFiltersToPrompt = undefined;

    const { result } = renderHook(() => useChangeQueryEditor());

    result.current.onAddFilter('field', 'value', '+');

    expect(mockSetEditorText).toHaveBeenCalled();

    const setTextCallback = mockSetEditorText.mock.calls[0][0];
    const callbackResult = setTextCallback('original text');

    expect(callbackResult).toBe('original text');
  });

  it('should accept DatasetField object as field parameter', () => {
    const mockField = {
      name: 'fieldName',
      type: 'string',
      aggregatable: true,
      searchable: true,
    } as DatasetField;

    const { result } = renderHook(() => useChangeQueryEditor());

    result.current.onAddFilter(mockField, 'value', '+');

    expect(opensearchFilters.generateFilters).toHaveBeenCalledWith(
      mockFilterManager,
      mockField,
      'value',
      '+',
      'test-index-pattern-id'
    );
  });
});
