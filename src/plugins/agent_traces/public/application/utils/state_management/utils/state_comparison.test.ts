/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  normalizeQueryState,
  normalizeUIState,
  normalizeTabState,
  normalizeLegacyState,
  normalizeStateForComparison,
} from './state_comparison';
import { UIState, TabState, LegacyState, QueryState } from '../slices';

describe('State Comparison Utilities', () => {
  describe('normalizeQueryState', () => {
    it('should remove undefined properties from query state', () => {
      const queryState: QueryState = {
        query: 'test query',
        language: 'PPL',
        dataset: {
          id: 'test-dataset',
          title: 'Test Dataset',
          type: 'INDEX_PATTERN',
          timeFieldName: '@timestamp',
        },
      };

      const queryStateWithUndefined = {
        ...queryState,
        undefinedProp: undefined,
      } as any;

      const normalized = normalizeQueryState(queryStateWithUndefined);

      expect(normalized).toEqual({
        query: 'test query',
        language: 'PPL',
        dataset: {
          id: 'test-dataset',
          title: 'Test Dataset',
          type: 'INDEX_PATTERN',
          timeFieldName: '@timestamp',
        },
      });
      expect(normalized).not.toHaveProperty('undefinedProp');
    });
  });

  describe('normalizeUIState', () => {
    it('should remove undefined properties from UI state', () => {
      const uiState: UIState = {
        activeTabId: 'table',
        showHistogram: true,
      };

      const uiStateWithUndefined = {
        ...uiState,
        undefinedProp: undefined,
      } as any;

      const normalized = normalizeUIState(uiStateWithUndefined);

      expect(normalized).toEqual({
        activeTabId: 'table',
        showHistogram: true,
      });
      expect(normalized).not.toHaveProperty('undefinedProp');
    });
  });

  describe('normalizeTabState', () => {
    it('should remove undefined properties from tab state', () => {
      const tabState: TabState = {
        logs: {},
        patterns: { usingRegexPatterns: false },
      };

      const tabStateWithUndefined = {
        ...tabState,
        logs: {},
        undefinedProp: undefined,
      } as any;

      const normalized = normalizeTabState(tabStateWithUndefined);

      expect(normalized).toEqual({
        logs: {},
        patterns: { usingRegexPatterns: false },
      });
      expect(normalized).not.toHaveProperty('undefinedProp');
    });
  });

  describe('normalizeLegacyState', () => {
    it('should remove undefined properties from legacy state', () => {
      const legacyState: LegacyState = {
        columns: ['_source'],
        interval: 'auto',
        isDirty: false,
        sort: [],
      };

      const legacyStateWithUndefined = {
        ...legacyState,
        lineCount: undefined,
        savedQuery: undefined,
        savedSearch: undefined,
      } as any;

      const normalized = normalizeLegacyState(legacyStateWithUndefined);

      expect(normalized).toEqual({
        columns: ['_source'],
        interval: 'auto',
        isDirty: false,
        sort: [],
      });
      expect(normalized).not.toHaveProperty('lineCount');
      expect(normalized).not.toHaveProperty('savedQuery');
      expect(normalized).not.toHaveProperty('savedSearch');
    });
  });

  describe('normalizeStateForComparison', () => {
    it('should normalize all state slices for comparison', () => {
      const mockState = {
        query: {
          query: 'test',
          language: 'PPL',
          dataset: undefined,
        },
        ui: {
          activeTabId: 'table',
          showHistogram: true,
          undefinedProp: undefined,
        },
        tab: {
          logs: {},
        },
        legacy: {
          columns: ['_source'],
          interval: 'auto',
          isDirty: false,
          sort: [],
          lineCount: undefined,
        },
        // Other state slices that shouldn't be included
        results: { data: 'test' },
        meta: { isInitialized: true },
        queryEditor: { dateRange: { from: 'now-15m', to: 'now' } },
      } as any;

      const normalized = normalizeStateForComparison(mockState);

      expect(normalized).toEqual({
        query: {
          query: 'test',
          language: 'PPL',
        },
        ui: {
          activeTabId: 'table',
          showHistogram: true,
        },
        tab: {
          logs: {},
        },
        legacy: {
          columns: ['_source'],
          interval: 'auto',
          isDirty: false,
          sort: [],
        },
      });

      // Should not include non-persistable state
      expect(normalized).not.toHaveProperty('results');
      expect(normalized).not.toHaveProperty('meta');
      expect(normalized).not.toHaveProperty('queryEditor');

      // Should not have undefined properties
      expect(normalized.query).not.toHaveProperty('dataset');
      expect(normalized.ui).not.toHaveProperty('undefinedProp');
      expect(normalized.legacy).not.toHaveProperty('lineCount');
    });
  });

  describe('normalizeState (internal function behavior)', () => {
    it('should handle arrays correctly', () => {
      const stateWithArray = {
        activeTabId: 'test',
        showHistogram: true,
        items: [
          { name: 'item1', value: undefined },
          { name: 'item2', value: 'valid' },
        ],
      };

      const normalized = normalizeUIState(stateWithArray as any);

      expect((normalized as any).items).toEqual([
        { name: 'item1' },
        { name: 'item2', value: 'valid' },
      ]);
    });

    it('should handle null and undefined values', () => {
      const stateWithNulls = {
        nullValue: null,
        undefinedValue: undefined,
        validValue: 'test',
      };

      const normalized = normalizeUIState(stateWithNulls as any);

      expect(normalized).toEqual({
        nullValue: null,
        validValue: 'test',
      });
      expect(normalized).not.toHaveProperty('undefinedValue');
    });

    it('should handle deeply nested objects', () => {
      const deepState = {
        level1: {
          level2: {
            level3: {
              validProp: 'value',
              undefinedProp: undefined,
            },
            undefinedProp: undefined,
          },
        },
      };

      const normalized = normalizeUIState(deepState as any);

      expect(normalized).toEqual({
        level1: {
          level2: {
            level3: {
              validProp: 'value',
            },
          },
        },
      });
    });
  });
});
