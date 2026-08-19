/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';
import { Subject } from 'rxjs';
import { useMetricsQuerySettings } from './use_metrics_query_settings';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

import { useDispatch } from 'react-redux';

const mockUseDispatch = useDispatch as jest.MockedFunction<typeof useDispatch>;

describe('useMetricsQuerySettings', () => {
  let mockDispatch: jest.Mock;
  let getQuery: jest.Mock;
  let setQuery: jest.Mock;
  let timeUpdate$: Subject<void>;
  let mockServices: any;

  const initialQuery = {
    query: 'up',
    language: 'PROMQL',
    maxDataPoints: 500,
  };

  beforeEach(() => {
    mockDispatch = jest.fn();
    getQuery = jest.fn(() => ({ ...initialQuery }));
    setQuery = jest.fn();
    timeUpdate$ = new Subject();
    mockServices = {
      data: {
        query: {
          queryString: { getQuery, setQuery },
          timefilter: {
            timefilter: {
              getBounds: jest.fn(() => ({
                min: { valueOf: () => 0 },
                max: { valueOf: () => 86400000 },
              })),
              getTimeUpdate$: jest.fn(() => timeUpdate$),
            },
          },
        },
      },
    };
    mockUseDispatch.mockReturnValue(mockDispatch);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const render = () => {
    const store = configureStore({ reducer: () => ({}) });
    return renderHook(() => useMetricsQuerySettings(mockServices), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });
  };

  it('seeds max data points from the active query', () => {
    const { result } = render();
    expect(result.current.maxDataPoints).toBe(500);
  });

  it('resolves the step for the current bounds using the panel resolution', () => {
    const { result } = render();
    expect(result.current.getResolvedStepSec(undefined)).toBe(200);
  });

  it('floors the resolved step by a per-row min step', () => {
    const { result } = render();
    expect(result.current.getResolvedStepSec('5m')).toBe(300);
  });

  it('returns a null resolved step when bounds are empty', () => {
    mockServices.data.query.timefilter.timefilter.getBounds.mockReturnValue({});
    const { result } = render();
    expect(result.current.getResolvedStepSec(undefined)).toBeNull();
  });

  it('persists max data points changes to the query and marks the editor dirty', () => {
    const { result } = render();
    act(() => {
      result.current.onMaxDataPointsChange(200);
    });
    expect(setQuery).toHaveBeenCalledWith(expect.objectContaining({ maxDataPoints: 200 }));
    expect(mockDispatch).toHaveBeenCalledTimes(2);
    expect(result.current.maxDataPoints).toBe(200);
  });

  it('recomputes the resolved step when the time range updates', () => {
    mockServices.data.query.timefilter.timefilter.getBounds
      .mockReturnValueOnce({ min: { valueOf: () => 0 }, max: { valueOf: () => 86400000 } })
      .mockReturnValue({ min: { valueOf: () => 0 }, max: { valueOf: () => 3600000 } });
    const { result } = render();
    expect(result.current.getResolvedStepSec('1m')).toBe(200);
    act(() => {
      timeUpdate$.next();
    });
    expect(result.current.getResolvedStepSec('1m')).toBe(60);
  });
});
