/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook, act, waitFor } from '@testing-library/react';
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
  let find: jest.Mock;
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
    find = jest.fn(() => Promise.resolve({ savedObjects: [] }));
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
      savedObjects: { client: { find, update: jest.fn(() => Promise.resolve({})) } },
      notifications: { toasts: { addWarning: jest.fn(), addDanger: jest.fn() } },
    };
    mockUseDispatch.mockReturnValue(mockDispatch);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const render = (connectionId = 'prom') => {
    const store = configureStore({ reducer: () => ({}) });
    return renderHook(() => useMetricsQuerySettings(mockServices, connectionId), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });
  };

  it('seeds max data points from the active query', () => {
    const { result } = render();
    expect(result.current.maxDataPoints).toBe(500);
  });

  it('resolves the step for the current bounds using the panel resolution', () => {
    const { result } = render();
    expect(result.current.getResolvedStep(undefined)?.stepSec).toBe(200);
  });

  it('floors the resolved step by a per-row min step', () => {
    const { result } = render();
    expect(result.current.getResolvedStep('5m')?.stepSec).toBe(300);
  });

  it('reports the rate window alongside the step', () => {
    const { result } = render();
    expect(result.current.getResolvedStep('1m')).toEqual({
      stepSec: 200,
      scrapeSec: 60,
      rateIntervalSec: 260,
    });
  });

  it('returns a null resolved step when bounds are empty', () => {
    mockServices.data.query.timefilter.timefilter.getBounds.mockReturnValue({});
    const { result } = render();
    expect(result.current.getResolvedStep(undefined)).toBeNull();
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
    expect(result.current.getResolvedStep('1m')?.stepSec).toBe(200);
    act(() => {
      timeUpdate$.next();
    });
    expect(result.current.getResolvedStep('1m')?.stepSec).toBe(60);
  });

  describe('datasource default min step', () => {
    beforeEach(() => {
      find.mockResolvedValue({
        savedObjects: [
          {
            id: 'so-1',
            attributes: { connectionId: 'prom', meta: JSON.stringify({ defaultMinStep: '30s' }) },
          },
        ],
      });
    });

    it('floors the step by the datasource default when a row has none', async () => {
      const { result } = render();
      await waitFor(() => expect(result.current.defaultMinStep).toBe('30s'));
      expect(result.current.getResolvedStep(undefined)?.stepSec).toBe(200);
      expect(result.current.getResolvedStep(undefined)?.scrapeSec).toBe(30);
    });

    it('lets a row min step override the datasource default', async () => {
      const { result } = render();
      await waitFor(() => expect(result.current.defaultMinStep).toBe('30s'));
      expect(result.current.getResolvedStep('5m')?.scrapeSec).toBe(300);
    });

    it('mirrors the loaded default onto the query without marking the editor dirty', async () => {
      render();
      await waitFor(() =>
        expect(setQuery).toHaveBeenCalledWith(expect.objectContaining({ defaultMinStep: '30s' }))
      );
      expect(mockDispatch).toHaveBeenCalledTimes(1);
    });

    it('marks the editor dirty when the user changes the default', async () => {
      const { result } = render();
      await waitFor(() => expect(result.current.defaultMinStep).toBe('30s'));
      mockDispatch.mockClear();
      act(() => {
        result.current.onDefaultMinStepChange('1m');
      });
      await waitFor(() => expect(result.current.defaultMinStep).toBe('1m'));
      expect(mockServices.savedObjects.client.update).toHaveBeenCalledWith(
        'data-connection',
        'so-1',
        { meta: JSON.stringify({ defaultMinStep: '1m' }) }
      );
      expect(mockDispatch).toHaveBeenCalled();
    });
  });
});
