/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useTimeFilter } from './use_time_filter';

// Mock dependencies
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

jest.mock('../../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn(),
}));

jest.mock('../../../../application/utils/state_management/slices', () => ({
  clearResults: jest.fn(),
}));

jest.mock('../../../../application/utils/state_management/actions/query_actions', () => ({
  executeQueries: jest.fn(),
}));

import { useDispatch } from 'react-redux';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { clearResults } from '../../../../application/utils/state_management/slices';
import { executeQueries } from '../../../../application/utils/state_management/actions/query_actions';

const mockUseDispatch = useDispatch as jest.MockedFunction<typeof useDispatch>;
const mockUseOpenSearchDashboards = useOpenSearchDashboards as jest.MockedFunction<
  typeof useOpenSearchDashboards
>;
const mockClearResults = clearResults as jest.MockedFunction<typeof clearResults>;
const mockExecuteQueries = executeQueries as jest.MockedFunction<typeof executeQueries>;

describe('useTimeFilter', () => {
  let mockDispatch: jest.Mock;
  let mockTimeFilter: any;
  let mockServices: any;

  beforeEach(() => {
    mockDispatch = jest.fn();
    mockTimeFilter = {
      setTime: jest.fn(),
      setRefreshInterval: jest.fn(),
    };
    mockServices = {
      data: {
        query: {
          timefilter: {
            timefilter: mockTimeFilter,
          },
        },
      },
    };

    mockUseDispatch.mockReturnValue(mockDispatch);
    mockUseOpenSearchDashboards.mockReturnValue({ services: mockServices } as any);
    mockClearResults.mockReturnValue({ type: 'CLEAR_RESULTS' } as any);
    mockExecuteQueries.mockReturnValue({ type: 'EXECUTE_QUERIES' } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderUseTimeFilter = () => {
    const store = configureStore({
      reducer: () => ({}),
    });

    return renderHook(() => useTimeFilter(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });
  };

  it('should return timeFilter, handleTimeChange, and handleRefreshChange', () => {
    const { result } = renderUseTimeFilter();

    expect(result.current).toEqual({
      timeFilter: mockTimeFilter,
      handleTimeChange: expect.any(Function),
      handleRefreshChange: expect.any(Function),
    });
  });

  it('should return timeFilter from services', () => {
    const { result } = renderUseTimeFilter();

    expect(result.current.timeFilter).toBe(mockTimeFilter);
  });

  describe('handleTimeChange', () => {
    it('should update timeFilter with new time range', () => {
      const { result } = renderUseTimeFilter();
      const timeChangeProps = {
        start: '2023-01-01T00:00:00Z',
        end: '2023-01-02T00:00:00Z',
        isQuickSelection: false,
        isInvalid: false,
      };

      act(() => {
        result.current.handleTimeChange(timeChangeProps);
      });

      expect(mockTimeFilter.setTime).toHaveBeenCalledWith({
        from: '2023-01-01T00:00:00Z',
        to: '2023-01-02T00:00:00Z',
      });
    });

    describe('when isQuickSelection is true', () => {
      it('should clear results and execute queries', () => {
        const { result } = renderUseTimeFilter();
        const timeChangeProps = {
          start: '2023-01-01T00:00:00Z',
          end: '2023-01-02T00:00:00Z',
          isQuickSelection: true,
          isInvalid: false,
        };

        act(() => {
          result.current.handleTimeChange(timeChangeProps);
        });

        expect(mockClearResults).toHaveBeenCalled();
        expect(mockDispatch).toHaveBeenCalledWith({ type: 'CLEAR_RESULTS' });
        expect(mockExecuteQueries).toHaveBeenCalledWith({ services: mockServices });
        expect(mockDispatch).toHaveBeenCalledWith({ type: 'EXECUTE_QUERIES' });
      });

      it('should still update timeFilter when isQuickSelection is true', () => {
        const { result } = renderUseTimeFilter();
        const timeChangeProps = {
          start: '2023-01-01T00:00:00Z',
          end: '2023-01-02T00:00:00Z',
          isQuickSelection: true,
          isInvalid: true,
        };

        act(() => {
          result.current.handleTimeChange(timeChangeProps);
        });

        expect(mockTimeFilter.setTime).toHaveBeenCalledWith({
          from: '2023-01-01T00:00:00Z',
          to: '2023-01-02T00:00:00Z',
        });
      });
    });

    describe('when isQuickSelection is false', () => {
      it('should not clear results or execute queries', () => {
        const { result } = renderUseTimeFilter();
        const timeChangeProps = {
          start: '2023-01-01T00:00:00Z',
          end: '2023-01-02T00:00:00Z',
          isQuickSelection: false,
          isInvalid: false,
        };

        act(() => {
          result.current.handleTimeChange(timeChangeProps);
        });

        expect(mockClearResults).not.toHaveBeenCalled();
        expect(mockExecuteQueries).not.toHaveBeenCalled();
        expect(mockDispatch).toHaveBeenCalledTimes(0);
      });
    });
  });

  describe('handleRefreshChange', () => {
    it('should update timeFilter with new refresh interval', () => {
      const { result } = renderUseTimeFilter();
      const refreshChangeProps = {
        isPaused: false,
        refreshInterval: 5000,
      };

      act(() => {
        result.current.handleRefreshChange(refreshChangeProps);
      });

      expect(mockTimeFilter.setRefreshInterval).toHaveBeenCalledWith({
        pause: false,
        value: 5000,
      });
    });

    it('should handle paused refresh interval', () => {
      const { result } = renderUseTimeFilter();
      const refreshChangeProps = {
        isPaused: true,
        refreshInterval: 10000,
      };

      act(() => {
        result.current.handleRefreshChange(refreshChangeProps);
      });

      expect(mockTimeFilter.setRefreshInterval).toHaveBeenCalledWith({
        pause: true,
        value: 10000,
      });
    });

    it('should not call timeFilter.setRefreshInterval when timeFilter is null', () => {
      mockServices.data.query.timefilter.timefilter = null;
      const { result } = renderUseTimeFilter();
      const refreshChangeProps = {
        isPaused: false,
        refreshInterval: 5000,
      };

      act(() => {
        result.current.handleRefreshChange(refreshChangeProps);
      });

      expect(mockTimeFilter.setRefreshInterval).not.toHaveBeenCalled();
    });
  });
});
