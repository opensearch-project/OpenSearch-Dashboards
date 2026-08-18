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
    minStep: '1m',
    legendFormat: '{{job}}',
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

  it('seeds step settings and legend format from the active query', () => {
    const { result } = render();
    expect(result.current.stepSettings).toEqual({ maxDataPoints: 500, minStep: '1m' });
    expect(result.current.legendFormat).toBe('{{job}}');
  });

  it('resolves the step for the current bounds', () => {
    const { result } = render();
    expect(result.current.resolvedStepSec).toBe(200);
    expect(result.current.minStepInvalid).toBe(false);
  });

  it('flags an invalid min step', () => {
    getQuery.mockReturnValue({ ...initialQuery, minStep: 'nonsense' });
    const { result } = render();
    expect(result.current.minStepInvalid).toBe(true);
  });

  it('returns a null resolved step when bounds are empty', () => {
    mockServices.data.query.timefilter.timefilter.getBounds.mockReturnValue({});
    const { result } = render();
    expect(result.current.resolvedStepSec).toBeNull();
  });

  it('persists step changes to the query and marks the editor dirty', () => {
    const { result } = render();
    act(() => {
      result.current.onStepSettingsChange({ maxDataPoints: 200, minStep: '30s' });
    });
    expect(setQuery).toHaveBeenCalledWith(
      expect.objectContaining({ maxDataPoints: 200, minStep: '30s' })
    );
    expect(mockDispatch).toHaveBeenCalledTimes(2);
    expect(result.current.stepSettings).toEqual({ maxDataPoints: 200, minStep: '30s' });
  });

  it('persists legend format changes to the query', () => {
    const { result } = render();
    act(() => {
      result.current.onLegendFormatChange('{{instance}}');
    });
    expect(setQuery).toHaveBeenCalledWith(
      expect.objectContaining({ legendFormat: '{{instance}}' })
    );
    expect(result.current.legendFormat).toBe('{{instance}}');
  });

  it('recomputes the resolved step when the time range updates', () => {
    mockServices.data.query.timefilter.timefilter.getBounds
      .mockReturnValueOnce({ min: { valueOf: () => 0 }, max: { valueOf: () => 86400000 } })
      .mockReturnValue({ min: { valueOf: () => 0 }, max: { valueOf: () => 3600000 } });
    const { result } = render();
    expect(result.current.resolvedStepSec).toBe(200);
    act(() => {
      timeUpdate$.next();
    });
    expect(result.current.resolvedStepSec).toBe(60);
  });
});
