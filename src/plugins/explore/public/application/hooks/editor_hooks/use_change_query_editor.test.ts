/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react-hooks';
import { IndexPatternField, opensearchFilters } from '../../../../../data/public';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { useIndexPatternContext } from '../../components/index_pattern_context';
import { useEditorContext } from '../../context';
import { useSelector } from '../../legacy/discover/application/utils/state_management';
import { selectEditorMode, selectQuery } from '../../utils/state_management/selectors';
import { EditorMode } from '../../utils/state_management/types';
import { useChangeQueryEditor } from './use_change_query_editor';

jest.mock('../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn(),
}));

jest.mock('../../legacy/discover/application/utils/state_management', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../../utils/state_management/selectors', () => ({
  selectEditorMode: jest.fn(),
  selectQuery: jest.fn(),
}));

jest.mock('../../../../../data/public', () => ({
  opensearchFilters: {
    generateFilters: jest.fn(),
  },
}));

jest.mock('../../components/index_pattern_context', () => ({
  useIndexPatternContext: jest.fn(),
}));

jest.mock('../../context', () => ({
  useEditorContext: jest.fn(),
}));

describe('useChangeQueryEditor', () => {
  const mockFilterManager = { add: jest.fn() };
  const mockLanguageService = { getLanguage: jest.fn() };
  const mockQueryString = { getLanguageService: jest.fn(() => mockLanguageService) };
  const mockIndexPattern = { id: 'test-index-pattern-id' };
  const mockEditorContext = {
    query: 'source=logs',
    prompt: 'Show me logs',
    setEditorText: jest.fn(),
  };
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

    (useIndexPatternContext as jest.Mock).mockReturnValue({ indexPattern: mockIndexPattern });
    (useEditorContext as jest.Mock).mockReturnValue(mockEditorContext);
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector === selectEditorMode) return EditorMode.SingleQuery;
      if (selector === selectQuery) return { language: 'PPL' };
      return undefined;
    });

    mockLanguageService.getLanguage.mockReturnValue(mockLanguageConfig);
    mockLanguageConfig.addFiltersToQuery = jest.fn().mockImplementation((query, filters) => {
      return `${query} | where \`field\` = 'value'`;
    });
    mockLanguageConfig.addFiltersToPrompt = jest.fn().mockImplementation((prompt, filters) => {
      return `${prompt}, field is 'value'`;
    });

    (opensearchFilters.generateFilters as jest.Mock).mockReturnValue([
      { meta: { key: 'field', value: 'value' } },
    ]);
  });

  it('should correctly initialize the hook', () => {
    const { result } = renderHook(() => useChangeQueryEditor());
    expect(result.current.onAddFilter).toBeDefined();
    expect(typeof result.current.onAddFilter).toBe('function');
  });

  it('should not add filters when indexPattern is undefined', () => {
    (useIndexPatternContext as jest.Mock).mockReturnValue({ indexPattern: undefined });

    const { result } = renderHook(() => useChangeQueryEditor());
    result.current.onAddFilter('field', 'value', '+');

    expect(opensearchFilters.generateFilters).not.toHaveBeenCalled();
    expect(mockEditorContext.setEditorText).not.toHaveBeenCalled();
  });

  it('should add filters to query in SingleQuery mode', () => {
    const { result } = renderHook(() => useChangeQueryEditor());

    result.current.onAddFilter('field', 'value', '+');

    expect(opensearchFilters.generateFilters).toHaveBeenCalledWith(
      mockFilterManager,
      'field',
      'value',
      '+',
      'test-index-pattern-id'
    );
    expect(mockLanguageConfig.addFiltersToQuery).toHaveBeenCalledWith('source=logs', [
      { meta: { key: 'field', value: 'value' } },
    ]);
    expect(mockEditorContext.setEditorText).toHaveBeenCalledWith(
      "source=logs | where `field` = 'value'"
    );
  });

  it('should add filters to query in DualQuery mode', () => {
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector === selectEditorMode) return EditorMode.DualQuery;
      if (selector === selectQuery) return { language: 'ppl' };
      return undefined;
    });

    const { result } = renderHook(() => useChangeQueryEditor());

    result.current.onAddFilter('field', 'value', '+');

    expect(mockLanguageConfig.addFiltersToQuery).toHaveBeenCalledWith('source=logs', [
      { meta: { key: 'field', value: 'value' } },
    ]);
    expect(mockEditorContext.setEditorText).toHaveBeenCalledWith(
      "source=logs | where `field` = 'value'"
    );
  });

  it('should add filters to prompt in SinglePrompt mode', () => {
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector === selectEditorMode) return EditorMode.SinglePrompt;
      if (selector === selectQuery) return { language: 'ppl' };
      return undefined;
    });

    const { result } = renderHook(() => useChangeQueryEditor());

    result.current.onAddFilter('field', 'value', '+');

    expect(mockLanguageConfig.addFiltersToPrompt).toHaveBeenCalledWith('Show me logs', [
      { meta: { key: 'field', value: 'value' } },
    ]);
    expect(mockEditorContext.setEditorText).toHaveBeenCalledWith("Show me logs, field is 'value'");
  });

  it('should add filters to prompt in DualPrompt mode', () => {
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector === selectEditorMode) return EditorMode.DualPrompt;
      if (selector === selectQuery) return { language: 'ppl' };
      return undefined;
    });

    const { result } = renderHook(() => useChangeQueryEditor());

    result.current.onAddFilter('field', 'value', '+');

    expect(mockLanguageConfig.addFiltersToPrompt).toHaveBeenCalledWith('Show me logs', [
      { meta: { key: 'field', value: 'value' } },
    ]);
    expect(mockEditorContext.setEditorText).toHaveBeenCalledWith("Show me logs, field is 'value'");
  });

  it('should not update editor text if language config does not provide filter methods', () => {
    // @ts-expect-error
    mockLanguageConfig.addFiltersToQuery = undefined;
    // @ts-expect-error
    mockLanguageConfig.addFiltersToPrompt = undefined;

    const { result } = renderHook(() => useChangeQueryEditor());

    result.current.onAddFilter('field', 'value', '+');

    expect(mockEditorContext.setEditorText).not.toHaveBeenCalled();
  });

  it('should accept IndexPatternField object as field parameter', () => {
    const mockField = {
      name: 'fieldName',
      type: 'string',
      aggregatable: true,
      searchable: true,
    } as IndexPatternField;

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
