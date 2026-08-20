/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { PatternsContainer } from './patterns_container';
import { mockPatternItems } from './utils/patterns_table.stubs';
import { QueryExecutionStatus } from '../../application/utils/state_management/types';
import { highlightLogUsingPattern } from './utils/utils';

jest.mock('./patterns_table', () => ({
  PatternsTable: (props: any) => (
    <div
      data-test-subj="mocked-patterns-table"
      data-testid="mocked-patterns-table"
      data-items={JSON.stringify(props.items)}
      data-has-filter-for={typeof props.onFilterForPattern === 'function' ? 'true' : 'false'}
      data-has-filter-out={typeof props.onFilterOutPattern === 'function' ? 'true' : 'false'}
    />
  ),
}));

const mockUseTabResults = jest.fn(() => ({
  results: {
    hits: {
      hits: mockPatternItems.map((item) => ({
        _source: {
          sample_logs: [item.sample],
          pattern_count: item.count,
          patterns_field: 'test pattern',
        },
      })),
      total: 2096,
    },
  },
  status: {
    status: QueryExecutionStatus.READY,
  },
}));

jest.mock('../../application/utils/hooks/use_tab_results', () => ({
  useTabResults: () => mockUseTabResults(),
}));

jest.mock('../../application/utils/hooks/use_histogram_results', () => ({
  useHistogramResults: jest.fn(() => ({
    results: {
      hits: {
        total: 2096,
      },
    },
  })),
}));

jest.mock('../tabs/action_bar/patterns_settings/patterns_settings_popover_content', () => ({
  PatternsSettingsPopoverContent: () => <div data-test-subj="mocked-patterns-settings" />,
}));

// Mutable so a test can switch the active language; the `mock` prefix is what lets
// the hoisted jest.mock factory below close over it.
let mockLanguage = 'PPL';

// Selectors are reselect `createSelector` results, so their source text carries no
// identifying name -- matching on `selector.toString()` never fires and every
// useSelector call falls through. Dispatch on function identity instead.
jest.mock('react-redux', () => {
  const selectors = jest.requireActual('../../application/utils/state_management/selectors');
  return {
    useSelector: jest.fn((selector) => {
      if (selector === selectors.selectQuery) {
        return { query: 'test query', language: mockLanguage };
      }
      if (selector === selectors.selectPatternsField) {
        return 'message';
      }
      if (selector === selectors.selectUsingRegexPatterns) {
        return false;
      }
      return {};
    }),
    useDispatch: jest.fn(() => jest.fn()),
    connect: jest.fn(() => (Component: React.ComponentType<any>) => Component),
  };
});

jest.mock('../../application/utils/state_management/actions/query_actions', () => ({
  defaultPrepareQueryString: jest.fn().mockReturnValue('default-query'),
  prepareHistogramCacheKey: jest.fn().mockReturnValue('histogram:default-query'),
}));

jest.mock('./utils/utils', () => ({
  highlightLogUsingPattern: jest.fn((log) => `<span style="color:#40D">${log}</span>`),
  isValidFiniteNumber: jest.fn((val) => !isNaN(val) && isFinite(val)),
  createSearchPatternQuery: jest.fn(() => 'mock-search-pattern-query'),
  createExcludeSearchPatternQuery: jest.fn(() => 'mock-exclude-pattern-query'),
}));

jest.mock('../../application/utils/state_management/slices', () => ({
  setActiveTab: jest.fn((tab) => ({ type: 'mock/setActiveTab', payload: tab })),
  setQueryStringWithHistory: jest.fn((q) => ({
    type: 'mock/setQueryStringWithHistory',
    payload: q,
  })),
}));

jest.mock('../../application/hooks', () => ({
  useSetEditorText: jest.fn(() => jest.fn()),
}));

jest.mock('../../../../opensearch_dashboards_react/public', () => ({
  ...jest.requireActual('../../../../opensearch_dashboards_react/public'),
  useOpenSearchDashboards: jest.fn(() => ({
    services: {
      uiSettings: {
        get: jest.fn((key: string) => {
          if (key === 'theme:darkMode') return false;
          return undefined;
        }),
      },
    },
  })),
}));

jest.mock('./patterns_table_flyout/patterns_flyout_context', () => ({
  PatternsFlyoutProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  usePatternsFlyoutContext: jest.fn(() => ({
    isFlyoutOpen: false,
  })),
}));

describe('PatternsContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { getByTestId } = render(<PatternsContainer />);

    const patternsTable = getByTestId('mocked-patterns-table');
    expect(patternsTable).toBeInTheDocument();
  });

  it('shows loading UI when status is LOADING', () => {
    mockUseTabResults.mockReturnValueOnce({
      results: null,
      status: {
        status: QueryExecutionStatus.LOADING,
      },
    } as any);

    render(<PatternsContainer />);

    expect(screen.getByTestId('patternsLoading')).toBeInTheDocument();
    expect(screen.getByText('Searching in progress...')).toBeInTheDocument();
  });

  it('does not show loading UI when status is READY', () => {
    mockUseTabResults.mockReturnValueOnce({
      results: {
        hits: {
          hits: mockPatternItems.map((item) => ({
            _source: {
              sample_logs: [item.sample],
              pattern_count: item.count,
              patterns_field: 'test pattern',
            },
          })),
          total: 2096,
        },
      },
      status: {
        status: QueryExecutionStatus.READY,
      },
    });

    render(<PatternsContainer />);

    expect(screen.queryByTestId('patternsLoading')).not.toBeInTheDocument();
    expect(screen.queryByText('Searching in progress...')).not.toBeInTheDocument();
  });

  it('should filter rows appropriately when given raw API response structure', () => {
    // Simulate the raw API response data_frame structure converted to hits format
    const rawApiHits = [
      {
        _source: {
          patterns_field: '', // Empty string - should be filtered out due to null sample
          pattern_count: 6060,
          sample_logs: null, // Null sample - should be filtered out
        },
      },
      {
        _source: {
          patterns_field: 'Linux', // Valid pattern
          pattern_count: 20,
          sample_logs: ['Linux'], // Valid sample array
        },
      },
      {
        _source: {
          patterns_field: 'Debian GNU/Linux', // Valid pattern
          pattern_count: 18,
          sample_logs: ['Debian GNU/Linux'], // Valid sample array
        },
      },
    ];

    mockUseTabResults.mockReturnValueOnce({
      results: {
        hits: {
          // @ts-expect-error TS2322 TODO(ts-error): fixme
          hits: rawApiHits,
          total: 3,
        },
      },
      status: {
        status: QueryExecutionStatus.READY,
      },
    });

    const { getByTestId } = render(<PatternsContainer />);
    const patternsTable = getByTestId('mocked-patterns-table');

    expect(patternsTable).toBeInTheDocument();

    // Parse the items passed to the mocked table
    const itemsAttr = patternsTable.getAttribute('data-items');
    const items = JSON.parse(itemsAttr || '[]');

    // Should have 2 items after filtering (the first row with null sample should be filtered out)
    expect(items).toHaveLength(2);

    // Verify the filtered items contain only valid data
    expect(items[0].pattern).toBe('Linux');
    expect(items[0].count).toBe(20);

    expect(items[1].pattern).toBe('Debian GNU/Linux');
    expect(items[1].count).toBe(18);
  });

  describe('SQL', () => {
    // The names the engine actually returns for `sqlPatternQuery`, verified on both
    // the V2 and analytics-engine paths: the aliased column comes back under its
    // alias, the unaliased ones under their raw SELECT-list text.
    const PATTERN_COL = 'pattern';
    const COUNT_COL = 'COUNT(*)';
    const SAMPLE_COL = "IFNULL(MIN(sample), '')";
    const TOTAL_COL = 'MAX(doc_total)';

    const FULL_SCHEMA = [
      { name: PATTERN_COL },
      { name: COUNT_COL },
      { name: SAMPLE_COL },
      { name: TOTAL_COL },
    ];

    /**
     * @param rows [pattern, count, sample] triples
     * @param docTotal value of the matched-document column, omitted to model a
     *                 response that predates that column
     */
    const sqlResults = (
      rows: Array<[string, number, string]>,
      docTotal?: number,
      schema = docTotal === undefined ? FULL_SCHEMA.slice(0, 3) : FULL_SCHEMA
    ) => ({
      results: {
        fieldSchema: schema,
        hits: {
          hits: rows.map(([pattern, count, sample]) => ({
            _source: {
              [PATTERN_COL]: pattern,
              [COUNT_COL]: count,
              [SAMPLE_COL]: sample,
              ...(docTotal === undefined ? {} : { [TOTAL_COL]: docTotal }),
            },
          })),
          total: rows.length,
        },
      },
      status: { status: QueryExecutionStatus.READY },
    });

    const renderSqlItems = (results: any) => {
      mockUseTabResults.mockReturnValueOnce(results);
      const { getByTestId } = render(<PatternsContainer />);
      return JSON.parse(getByTestId('mocked-patterns-table').getAttribute('data-items') || '[]');
    };

    beforeEach(() => {
      mockLanguage = 'SQL';
    });

    afterEach(() => {
      mockLanguage = 'PPL';
    });

    it('addresses the columns by position rather than by PPL field name', () => {
      const items = renderSqlItems(
        sqlResults([
          ['<*> <*>', 30, 'Calculated quote'],
          ['<*> <*> <*>', 10, 'Ad service starting.'],
        ])
      );

      expect(items).toHaveLength(2);
      expect(items[0].pattern).toBe('<*> <*>');
      expect(items[0].count).toBe(30);
      expect(items[0].sample).toBe('Calculated quote');
    });

    it('keeps the empty-pattern group, whose pattern and sample are both empty strings', () => {
      // Documents missing the patterns field aggregate into this group via IFNULL.
      // Only null/undefined should be dropped, never ''.
      const items = renderSqlItems(
        sqlResults([
          ['<*> <*>', 30, 'Calculated quote'],
          ['', 3, ''],
        ])
      );

      expect(items).toHaveLength(2);
      expect(items[1]).toMatchObject({ pattern: '', count: 3, sample: '' });
    });

    it('reports an unexpected schema rather than rendering a blank table', () => {
      // Rows came back but the schema is short, so no row can be addressed. The
      // container distinguishes this from "no results" and says so.
      mockUseTabResults.mockReturnValueOnce(
        sqlResults([['<*> <*>', 30, 'Calculated quote']], undefined, [{ name: PATTERN_COL }]) as any
      );

      render(<PatternsContainer />);

      expect(screen.getByText('Expected schema not found')).toBeInTheDocument();
      expect(screen.queryByTestId('mocked-patterns-table')).not.toBeInTheDocument();
    });

    // The histogram query is language-gated off for SQL, so its total is 0 and every
    // ratio would come out Infinity, rendering the column as '—' on every row.
    it('takes the ratio denominator from the matched-document column', () => {
      const items = renderSqlItems(
        sqlResults(
          [
            ['<*> <*>', 30, 'Calculated quote'],
            ['<*> <*> <*>', 10, 'Ad service starting.'],
          ],
          40
        )
      );

      // 40 from the column, not the mocked histogram total of 2096.
      expect(items[0].ratio).toBeCloseTo(30 / 40);
      expect(items[1].ratio).toBeCloseTo(10 / 40);
    });

    // The engine caps the response at plugins.query.size_limit, so the returned
    // groups can be a subset of the result. Summing their counts would normalize
    // that subset to 100% and overstate every ratio.
    it('does not renormalize to the returned groups when the response was truncated', () => {
      const items = renderSqlItems(
        sqlResults(
          [
            ['<*> <*>', 30, 'Calculated quote'],
            ['<*> <*> <*>', 10, 'Ad service starting.'],
          ],
          1000
        )
      );

      expect(items[0].ratio).toBeCloseTo(30 / 1000);
      expect(items[0].ratio).not.toBeCloseTo(30 / 40);
    });

    it('falls back to the sum of counts when the column is absent', () => {
      const items = renderSqlItems(
        sqlResults([
          ['<*> <*>', 30, 'Calculated quote'],
          ['<*> <*> <*>', 10, 'Ad service starting.'],
        ])
      );

      expect(items[0].ratio).toBeCloseTo(30 / 40);
    });

    it('leaves the sample unhighlighted, as PPL does on its own simple-pattern path', () => {
      const items = renderSqlItems(sqlResults([['<*> <*>', 30, 'Calculated quote']]));

      expect(items[0].highlightedSample).toBeUndefined();
      expect(highlightLogUsingPattern).not.toHaveBeenCalled();
    });
  });

  it('still highlights the sample for PPL brain patterns', () => {
    render(<PatternsContainer />);

    expect(highlightLogUsingPattern).toHaveBeenCalled();
  });

  // The schema callout is a SQL-only diagnostic. PPL drops rows whose sample or
  // count is null, and when that leaves nothing it renders nothing -- saying the
  // schema was unexpected would be both new and wrong, since the schema is fine.
  it('renders nothing for PPL when every row is dropped', () => {
    mockUseTabResults.mockReturnValueOnce({
      results: {
        hits: {
          hits: [
            { _source: { patterns_field: 'Linux', pattern_count: 20, sample_logs: null } },
            { _source: { patterns_field: 'Debian', pattern_count: 18, sample_logs: [] } },
          ],
          total: 2,
        },
      },
      status: { status: QueryExecutionStatus.READY },
    } as any);

    render(<PatternsContainer />);

    expect(screen.queryByText('Expected schema not found')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mocked-patterns-table')).not.toBeInTheDocument();
  });
});
