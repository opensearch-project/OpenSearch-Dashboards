/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook, act } from '@testing-library/react-hooks';
import { useSearchContext } from './use_search_context';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { BehaviorSubject } from 'rxjs';

// Mock OpenSearch Dashboards service
jest.mock('../../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn(),
}));

describe('useSearchContext', () => {
  const mockQuery = { language: 'kuery', query: 'status:200' };
  const mockFilters = [{ meta: { disabled: false }, query: {} }];
  const mockTimeRange = { from: 'now-15m', to: 'now' };

  const state$ = new BehaviorSubject({
    state: {
      query: mockQuery,
      filters: mockFilters,
      time: mockTimeRange,
    },
  });

  const mockServices = {
    data: {
      query: {
        queryString: {
          getQuery: jest.fn(() => mockQuery),
        },
        filterManager: {
          getFilters: jest.fn(() => mockFilters),
        },
        timefilter: {
          timefilter: {
            getTime: jest.fn(() => mockTimeRange),
          },
        },
        state$,
      },
    },
  };

  beforeEach(() => {
    (useOpenSearchDashboards as jest.Mock).mockReturnValue({ services: mockServices });
  });

  it('should initialize with the current query, filters, and time range', () => {
    const { result } = renderHook(() => useSearchContext());

    expect(result.current).toEqual({
      query: mockQuery,
      filters: mockFilters,
      timeRange: mockTimeRange,
    });
  });

  it('should update when state$ emits a new value', () => {
    const { result } = renderHook(() => useSearchContext());

    const newQuery = { language: 'lucene', query: 'type:error' };
    const newFilters = [{ meta: { disabled: false }, query: { match: { type: 'error' } } }];
    const newTimeRange = { from: 'now-30m', to: 'now' };

    act(() => {
      state$.next({
        state: {
          query: newQuery,
          filters: newFilters,
          time: newTimeRange,
        },
      });
    });

    expect(result.current).toEqual({
      query: newQuery,
      filters: newFilters,
      timeRange: newTimeRange,
    });
  });
});
