/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen } from '@testing-library/react';
import { ActionBar } from './action_bar';

// Mock the child component, capturing props for assertions
const mockDiscoverResultsActionBar = jest.fn((_props: any) => (
  <div data-test-subj="discoverResultsActionBar" />
));

// Mock the hooks and context
jest.mock('../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: () => ({
    services: {
      core: {
        application: {
          navigateToApp: jest.fn(),
        },
      },
      inspector: {
        open: jest.fn(),
      },
      inspectorAdapters: {},
      data: {
        query: {
          queryString: {
            getQuery: () => ({}),
          },
          filterManager: {
            getFilters: () => [],
          },
          timefilter: {
            timefilter: {
              getTime: () => ({}),
            },
          },
          state$: {
            subscribe: () => ({
              unsubscribe: jest.fn(),
            }),
          },
        },
      },
      slotRegistry: {
        getSortedItems$: () => ({
          subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
        }),
      },
    },
  }),
  withOpenSearchDashboards: jest.fn((component: any) => component),
}));

jest.mock('../../../application/legacy/discover/application/utils/state_management', () => ({
  useSelector: () => 'test-saved-search',
}));

jest.mock('../../../application/context', () => ({
  useDatasetContext: () => ({
    dataset: { id: 'test-dataset' },
  }),
}));

jest.mock('../../../application/utils/hooks/use_tab_results', () => ({
  useTabResults: () => ({
    results: {
      hits: {
        hits: [],
        total: 0,
      },
      elapsedMs: 100,
    },
  }),
}));

jest.mock('../../../application/utils/hooks/use_histogram_results', () => ({
  useHistogramResults: () => ({
    results: {
      hits: {
        total: { value: 10, relation: 'eq' },
      },
    },
  }),
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: () => ({ language: 'PPL', query: 'source=logs', dataset: { id: 'test' } }),
}));

jest.mock('../../../application/utils/state_management/actions/query_actions', () => ({
  defaultPrepareQueryString: () => 'source=logs',
  prepareBucketCountCacheKey: () => 'bucketCount:source=logs | stats count()',
}));

let mockQueryHasStats = false;
jest.mock('../../../application/utils/state_management/actions/utils', () => ({
  queryEndsWithHead: () => false,
  queryHasStats: () => mockQueryHasStats,
}));

let mockBucketCount: number | undefined;
jest.mock('../../../application/utils/hooks/use_bucket_count_results', () => ({
  useBucketCountResults: () => ({ bucketCount: mockBucketCount }),
}));

jest.mock('./results_action_bar/results_action_bar', () => ({
  DiscoverResultsActionBar: (props: any) => mockDiscoverResultsActionBar(props),
}));

describe('ActionBar', () => {
  beforeEach(() => {
    mockDiscoverResultsActionBar.mockClear();
  });

  test('should render the action bar component', () => {
    render(<ActionBar />);
    expect(screen.getByTestId('discoverResultsActionBar')).toBeInTheDocument();
  });

  test('should render without crashing when no results', () => {
    render(<ActionBar />);
    expect(screen.getByTestId('discoverResultsActionBar')).toBeInTheDocument();
  });

  test('should pass hits from histogram results for non-aggregation queries', () => {
    render(<ActionBar />);

    expect(mockDiscoverResultsActionBar).toHaveBeenCalledWith(
      expect.objectContaining({
        hits: expect.anything(),
        bucketCount: undefined,
      })
    );
  });
});

describe('ActionBar with aggregation query', () => {
  beforeEach(() => {
    mockDiscoverResultsActionBar.mockClear();
    mockQueryHasStats = false;
    mockBucketCount = undefined;
  });

  test('should pass bucketCount when query has stats', () => {
    mockQueryHasStats = true;
    mockBucketCount = 5050;

    render(<ActionBar />);

    expect(mockDiscoverResultsActionBar).toHaveBeenCalledWith(
      expect.objectContaining({ bucketCount: 5050 })
    );
  });

  test('should not pass bucketCount when query does not have stats', () => {
    render(<ActionBar />);

    expect(mockDiscoverResultsActionBar).toHaveBeenCalledWith(
      expect.objectContaining({ bucketCount: undefined })
    );
  });

  test('should degrade to standard format when bucketCount is unavailable', () => {
    mockQueryHasStats = true;

    render(<ActionBar />);

    // When bucketCount query hasn't returned, degrade to standard format
    expect(mockDiscoverResultsActionBar).toHaveBeenCalledWith(
      expect.objectContaining({ bucketCount: undefined })
    );
  });

  test('should pass both hits and bucketCount when both are available', () => {
    mockQueryHasStats = true;
    mockBucketCount = 5050;

    render(<ActionBar />);

    expect(mockDiscoverResultsActionBar).toHaveBeenCalledWith(
      expect.objectContaining({ hits: expect.anything(), bucketCount: 5050 })
    );
  });
});
