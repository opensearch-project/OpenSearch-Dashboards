/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  selectUIState,
  selectTabState,
  selectTabLogsState,
  selectQuery,
  selectQueryString,
  selectQueryLanguage,
  selectDataset,
  selectActiveTabId,
  selectShowHistogram,
  selectPatternsField,
  selectUsingRegexPatterns,
  selectActiveTab,
  selectResults,
  selectVisibleColumnNames,
  selectSavedSearch,
  selectTabLogsExpandedRowsMap,
  selectTabLogsSelectedRowsMap,
} from './index';
import { RootState } from '../store';

describe('selectors/index', () => {
  let mockState: RootState;

  beforeEach(() => {
    mockState = {
      query: {
        query: 'SELECT * FROM test',
        language: 'SQL',
        dataset: {
          id: 'test-dataset',
          type: 'INDEX_PATTERN',
        },
      },
      ui: {
        activeTabId: 'test-tab',
        showHistogram: false,
        isLoading: false,
      },
      results: {
        'SELECT * FROM test': {
          hits: {
            hits: [],
            total: 0,
          },
        },
      },
      tab: {
        logs: {
          expandedRowsMap: {
            row1: true,
            row3: true,
          },
          selectedRowsMap: {
            row2: true,
          },
          visibleColumns: ['field1', 'field2', 'field3'],
        },
        patterns: {
          patternsField: 'message',
          usingRegexPatterns: true,
        },
      },
      legacy: {
        savedSearch: {
          id: 'saved-search-1',
          title: 'Test Search',
        },
        isLegacyMode: false,
      },
      queryEditor: {
        editorMode: 'single-query',
        promptModeIsAvailable: false,
      },
    } as any;
  });

  describe('basic selectors', () => {
    it('should select UI state', () => {
      const result = selectUIState(mockState);
      expect(result).toBe(mockState.ui);
    });

    it('should select tab state', () => {
      const result = selectTabState(mockState);
      expect(result).toBe(mockState.tab);
    });

    it('should select tab logs state', () => {
      const result = selectTabLogsState(mockState);
      expect(result).toBe(mockState.tab.logs);
    });
  });

  describe('tab selectors', () => {
    it('should select patterns field', () => {
      const result = selectPatternsField(mockState);
      expect(result).toBe('message');
    });

    it('should select using regex patterns', () => {
      const result = selectUsingRegexPatterns(mockState);
      expect(result).toBe(true);
    });

    it('should select tab logs expanded rows map', () => {
      const result = selectTabLogsExpandedRowsMap(mockState);
      expect(result).toEqual({
        row1: true,
        row3: true,
      });
    });

    it('should select tab logs selected rows map', () => {
      const result = selectTabLogsSelectedRowsMap(mockState);
      expect(result).toEqual({
        row2: true,
      });
    });

    it('should handle undefined patterns field', () => {
      const stateWithoutPatternsField = {
        ...mockState,
        tab: {
          ...mockState.tab,
          patterns: {
            ...mockState.tab.patterns,
            patternsField: undefined,
          },
        },
      };

      const result = selectPatternsField(stateWithoutPatternsField);
      expect(result).toBeUndefined();
    });

    it('should handle false using regex patterns', () => {
      const stateWithFalseRegex = {
        ...mockState,
        tab: {
          ...mockState.tab,
          patterns: {
            ...mockState.tab.patterns,
            usingRegexPatterns: false,
          },
        },
      };

      const result = selectUsingRegexPatterns(stateWithFalseRegex);
      expect(result).toBe(false);
    });

    it('should handle empty expanded rows map', () => {
      const stateWithEmptyExpandedRows = {
        ...mockState,
        tab: {
          ...mockState.tab,
          logs: {
            ...mockState.tab.logs,
            expandedRowsMap: {},
          },
        },
      };

      const result = selectTabLogsExpandedRowsMap(stateWithEmptyExpandedRows);
      expect(result).toEqual({});
    });

    it('should handle empty selected rows map', () => {
      const stateWithEmptySelectedRows = {
        ...mockState,
        tab: {
          ...mockState.tab,
          logs: {
            ...mockState.tab.logs,
            selectedRowsMap: {},
          },
        },
      };

      const result = selectTabLogsSelectedRowsMap(stateWithEmptySelectedRows);
      expect(result).toEqual({});
    });

    it('should select visible columns', () => {
      const result = selectVisibleColumnNames(mockState);
      expect(result).toEqual(['field1', 'field2', 'field3']);
    });
  });

  describe('query selectors', () => {
    it('should select query state', () => {
      const result = selectQuery(mockState);
      expect(result).toBe(mockState.query);
    });

    it('should select query string', () => {
      const result = selectQueryString(mockState);
      expect(result).toBe('SELECT * FROM test');
    });

    it('should select query language', () => {
      const result = selectQueryLanguage(mockState);
      expect(result).toBe('SQL');
    });

    it('should select dataset', () => {
      const result = selectDataset(mockState);
      expect(result).toEqual({
        id: 'test-dataset',
        type: 'INDEX_PATTERN',
      });
    });

    it('should handle undefined dataset', () => {
      const stateWithoutDataset = {
        ...mockState,
        query: {
          ...mockState.query,
          dataset: undefined,
        },
      };

      const result = selectDataset(stateWithoutDataset);
      expect(result).toBeUndefined();
    });
  });

  describe('UI selectors', () => {
    it('should select active tab ID', () => {
      const result = selectActiveTabId(mockState);
      expect(result).toBe('test-tab');
    });

    it('should select show histogram', () => {
      const result = selectShowHistogram(mockState);
      expect(result).toBe(false);
    });

    it('should handle undefined showHistogram', () => {
      const stateWithoutShowHistogram = {
        ...mockState,
        ui: {
          ...mockState.ui,
          showHistogram: undefined,
        },
      } as any;

      const result = selectShowHistogram(stateWithoutShowHistogram);
      expect(result).toBeUndefined();
    });
  });

  describe('active tab selector', () => {
    it('should select active tab', () => {
      const result = selectActiveTab(mockState);
      expect(result).toBe('test-tab');
    });

    it('should handle undefined active tab ID', () => {
      const stateWithoutActiveTabId = {
        ...mockState,
        ui: {
          ...mockState.ui,
          activeTabId: undefined,
        },
      } as any;

      const result = selectActiveTab(stateWithoutActiveTabId);
      expect(result).toBeUndefined();
    });
  });

  describe('results selectors', () => {
    it('should select results state', () => {
      const result = selectResults(mockState);
      expect(result).toBe(mockState.results);
    });

    it('should handle empty results', () => {
      const stateWithEmptyResults = {
        ...mockState,
        results: {},
      };

      const result = selectResults(stateWithEmptyResults);
      expect(result).toEqual({});
    });
  });

  describe('legacy selectors', () => {
    it('should select saved search', () => {
      const result = selectSavedSearch(mockState);
      expect(result).toEqual({
        id: 'saved-search-1',
        title: 'Test Search',
      });
    });

    it('should handle undefined legacy properties', () => {
      const stateWithoutLegacyProps = {
        ...mockState,
        legacy: {
          ...mockState.legacy,
          columns: undefined,
          sort: undefined,
          savedSearch: undefined,
        },
      } as any;

      expect(selectSavedSearch(stateWithoutLegacyProps)).toBeUndefined();
    });
  });

  describe('selector memoization', () => {
    it('should memoize query selector results', () => {
      const result1 = selectQuery(mockState);
      const result2 = selectQuery(mockState);

      expect(result1).toBe(result2);
    });

    it('should memoize query string selector results', () => {
      const result1 = selectQueryString(mockState);
      const result2 = selectQueryString(mockState);

      expect(result1).toBe(result2);
    });

    it('should recompute when query state changes', () => {
      const result1 = selectQueryString(mockState);

      const modifiedState = {
        ...mockState,
        query: {
          ...mockState.query,
          query: 'SELECT * FROM users',
        },
      };

      const result2 = selectQueryString(modifiedState);

      expect(result1).toBe('SELECT * FROM test');
      expect(result2).toBe('SELECT * FROM users');
      expect(result1).not.toBe(result2);
    });

    it('should not recompute when unrelated state changes', () => {
      const result1 = selectQueryString(mockState);

      const modifiedState = {
        ...mockState,
        ui: {
          ...mockState.ui,
          isLoading: true,
        },
      };

      const result2 = selectQueryString(modifiedState);

      expect(result1).toBe(result2);
    });
  });
});
