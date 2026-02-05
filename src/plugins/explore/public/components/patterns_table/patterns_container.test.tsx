/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { PatternsContainer } from './patterns_container';
import { mockPatternItems } from './utils/patterns_table.stubs';
import { QueryExecutionStatus } from '../../application/utils/state_management/types';

jest.mock('./patterns_table', () => ({
  PatternsTable: (props: any) => (
    <div
      data-test-subj="mocked-patterns-table"
      data-testid="mocked-patterns-table"
      data-items={JSON.stringify(props.items)}
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

jest.mock('react-redux', () => ({
  useSelector: jest.fn((selector) => {
    if (selector.toString().includes('selectQuery')) {
      return { query: 'test query', language: 'PPL' };
    }
    if (selector.toString().includes('selectResults')) {
      return {
        'default-query': {
          hits: {
            hits: mockPatternItems.map((item) => ({
              _source: {
                // using string literals instead of constants to avoid jest errors
                sample_logs: [item.sample],
                pattern_count: item.count,
                patterns_field: 'test pattern',
              },
            })),
            total: 2096,
          },
        },
      };
    }
    if (selector.toString().includes('state.ui.activeTabId')) {
      return 'patterns';
    }
    return {};
  }),
  useDispatch: jest.fn(() => jest.fn()),
  connect: jest.fn(() => (Component: React.ComponentType<any>) => Component),
}));

jest.mock('../../application/utils/state_management/actions/query_actions', () => ({
  defaultPrepareQueryString: jest.fn().mockReturnValue('default-query'),
  prepareHistogramCacheKey: jest.fn().mockReturnValue('histogram:default-query'),
}));

jest.mock('./utils/utils', () => ({
  highlightLogUsingPattern: jest.fn((log) => `<mark>${log}</mark>`),
  isValidFiniteNumber: jest.fn((val) => !isNaN(val) && isFinite(val)),
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
    expect(items[0].flyout.pattern).toBe('Linux');
    expect(items[0].count).toBe(20);
    expect(items[0].flyout.sample).toEqual(['Linux']);

    expect(items[1].flyout.pattern).toBe('Debian GNU/Linux');
    expect(items[1].count).toBe(18);
    expect(items[1].flyout.sample).toEqual(['Debian GNU/Linux']);
  });
});
