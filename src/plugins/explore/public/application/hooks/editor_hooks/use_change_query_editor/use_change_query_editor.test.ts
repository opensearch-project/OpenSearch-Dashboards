/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react-hooks';
import { useEditorQueryText } from '../use_editor_query_text';
import { useEditorPromptText } from '../use_editor_prompt_text';
import { useSetEditorText } from '../use_set_editor_text';
import { DataViewField as DatasetField, opensearchFilters } from '../../../../../../data/public';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { useDatasetContext } from '../../../context';
import { useSelector } from '../../../legacy/discover/application/utils/state_management';
import { selectEditorMode, selectQuery } from '../../../utils/state_management/selectors';
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

jest.mock('../../../../../../data/public', () => ({
  opensearchFilters: {
    generateFilters: jest.fn(),
  },
}));

jest.mock('../../../context', () => ({
  useDatasetContext: jest.fn(),
}));

jest.mock('../use_editor_query_text', () => ({
  useEditorQueryText: jest.fn(),
}));

jest.mock('../use_editor_prompt_text', () => ({
  useEditorPromptText: jest.fn(),
}));

jest.mock('../use_set_editor_text', () => ({
  useSetEditorText: jest.fn(),
}));

describe('useChangeQueryEditor', () => {
  const mockFilterManager = { add: jest.fn() };
  const mockLanguageService = { getLanguage: jest.fn() };
  const mockQueryString = { getLanguageService: jest.fn(() => mockLanguageService) };
  const mockIndexPattern = { id: 'test-index-pattern-id' };
  const mockEditorQuery = 'source=logs';
  const mockEditorPrompt = 'Show me logs';
  const mockSetEditorText = jest.fn();
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
    (useEditorQueryText as jest.Mock).mockReturnValue(mockEditorQuery);
    (useEditorPromptText as jest.Mock).mockReturnValue(mockEditorPrompt);
    (useSetEditorText as jest.Mock).mockReturnValue(mockSetEditorText);
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

  it('should not add filters when dataset is undefined', () => {
    (useDatasetContext as jest.Mock).mockReturnValue({ dataset: undefined });

    const { result } = renderHook(() => useChangeQueryEditor());
    result.current.onAddFilter('field', 'value', '+');

    expect(opensearchFilters.generateFilters).not.toHaveBeenCalled();
    expect(mockSetEditorText).not.toHaveBeenCalled();
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

    expect(mockSetEditorText).toHaveBeenCalled();

    const setTextCallback = mockSetEditorText.mock.calls[0][0];
    const callbackResult = setTextCallback(mockEditorQuery);

    expect(mockLanguageConfig.addFiltersToQuery).toHaveBeenCalledWith(mockEditorQuery, [
      { meta: { key: 'field', value: 'value' } },
    ]);

    expect(callbackResult).toBe("source=logs | where `field` = 'value'");
  });

  it('should add filters to query in DualQuery mode', () => {
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector === selectEditorMode) return EditorMode.DualQuery;
      if (selector === selectQuery) return { language: 'ppl' };
      return undefined;
    });

    const { result } = renderHook(() => useChangeQueryEditor());

    result.current.onAddFilter('field', 'value', '+');

    expect(mockSetEditorText).toHaveBeenCalled();

    const setTextCallback = mockSetEditorText.mock.calls[0][0];
    const callbackResult = setTextCallback(mockEditorQuery);

    expect(mockLanguageConfig.addFiltersToQuery).toHaveBeenCalledWith(mockEditorQuery, [
      { meta: { key: 'field', value: 'value' } },
    ]);

    expect(callbackResult).toBe("source=logs | where `field` = 'value'");
  });

  it('should add filters to prompt in SinglePrompt mode', () => {
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector === selectEditorMode) return EditorMode.SinglePrompt;
      if (selector === selectQuery) return { language: 'ppl' };
      return undefined;
    });

    const { result } = renderHook(() => useChangeQueryEditor());

    result.current.onAddFilter('field', 'value', '+');

    expect(mockSetEditorText).toHaveBeenCalled();

    const setTextCallback = mockSetEditorText.mock.calls[0][0];
    const callbackResult = setTextCallback(mockEditorPrompt);

    expect(mockLanguageConfig.addFiltersToPrompt).toHaveBeenCalledWith(mockEditorPrompt, [
      { meta: { key: 'field', value: 'value' } },
    ]);

    expect(callbackResult).toBe("Show me logs, field is 'value'");
  });

  it('should add filters to prompt in DualPrompt mode', () => {
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector === selectEditorMode) return EditorMode.DualPrompt;
      if (selector === selectQuery) return { language: 'ppl' };
      return undefined;
    });

    const { result } = renderHook(() => useChangeQueryEditor());

    result.current.onAddFilter('field', 'value', '+');

    expect(mockSetEditorText).toHaveBeenCalled();

    const setTextCallback = mockSetEditorText.mock.calls[0][0];
    const callbackResult = setTextCallback(mockEditorPrompt);

    expect(mockLanguageConfig.addFiltersToPrompt).toHaveBeenCalledWith(mockEditorPrompt, [
      { meta: { key: 'field', value: 'value' } },
    ]);

    expect(callbackResult).toBe("Show me logs, field is 'value'");
  });

  it('should add filters to query in SingleEmpty mode', () => {
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector === selectEditorMode) return EditorMode.SingleEmpty;
      if (selector === selectQuery) return { language: 'ppl' };
      return undefined;
    });

    const { result } = renderHook(() => useChangeQueryEditor());

    result.current.onAddFilter('field', 'value', '+');

    expect(mockSetEditorText).toHaveBeenCalled();

    const setTextCallback = mockSetEditorText.mock.calls[0][0];
    const callbackResult = setTextCallback(mockEditorQuery);

    expect(mockLanguageConfig.addFiltersToQuery).toHaveBeenCalledWith(mockEditorQuery, [
      { meta: { key: 'field', value: 'value' } },
    ]);

    expect(callbackResult).toBe("source=logs | where `field` = 'value'");
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
    const callbackResult = setTextCallback(mockEditorQuery);

    expect(callbackResult).toBe(mockEditorQuery);
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
