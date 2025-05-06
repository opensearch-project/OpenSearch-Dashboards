/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { act, renderHook } from '@testing-library/react-hooks';
import { usePolling, PollingConfigurations } from './use_polling';

describe('usePolling', () => {
  const mockFetchFunction = jest.fn();
  const mockOnPollingSuccess = jest.fn();
  const mockOnPollingError = jest.fn();
  const mockConfigurations: PollingConfigurations = { tabId: 'test-tab' };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns correct initial state', () => {
    const { result } = renderHook(() => usePolling(mockFetchFunction));

    expect(result.current.data).toBe(null);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);
    expect(typeof result.current.startPolling).toBe('function');
    expect(typeof result.current.stopPolling).toBe('function');
  });

  it('fetches data successfully and updates state', async () => {
    const mockData = { result: 'success' };
    mockFetchFunction.mockResolvedValue(mockData);

    const { result, waitForNextUpdate } = renderHook(() => usePolling(mockFetchFunction, 5000));

    await act(async () => {
      result.current.startPolling();
      jest.advanceTimersByTime(5000);
      await waitForNextUpdate();
    });

    expect(mockFetchFunction).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(mockData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('stops polling on successful fetch when onPollingSuccess returns true', async () => {
    const mockData = { result: 'success' };
    mockFetchFunction.mockResolvedValue(mockData);
    mockOnPollingSuccess.mockReturnValue(true);

    const { result, waitForNextUpdate } = renderHook(() =>
      usePolling(mockFetchFunction, 5000, mockOnPollingSuccess, undefined, mockConfigurations)
    );

    await act(async () => {
      result.current.startPolling();
      jest.advanceTimersByTime(5000);
      await waitForNextUpdate();
    });

    expect(mockFetchFunction).toHaveBeenCalledTimes(1);
    expect(mockOnPollingSuccess).toHaveBeenCalledWith(mockData, mockConfigurations);
    expect(result.current.data).toEqual(mockData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);

    // Advance timers to check if polling continues
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    // Should not fetch again
    expect(mockFetchFunction).toHaveBeenCalledTimes(1);
  });

  it('handles fetch error and updates state', async () => {
    const mockError = new Error('Fetch failed');
    mockFetchFunction.mockRejectedValue(mockError);

    const { result, waitForNextUpdate } = renderHook(() => usePolling(mockFetchFunction, 5000));

    await act(async () => {
      result.current.startPolling();
      jest.advanceTimersByTime(5000);
      await waitForNextUpdate();
    });

    expect(mockFetchFunction).toHaveBeenCalledTimes(1);
    expect(result.current.data).toBe(null);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toEqual(mockError);
  });

  it('stops polling on error when onPollingError returns true', async () => {
    const mockError = new Error('Fetch failed');
    mockFetchFunction.mockRejectedValue(mockError);
    mockOnPollingError.mockReturnValue(true);

    const { result, waitForNextUpdate } = renderHook(() =>
      usePolling(mockFetchFunction, 5000, undefined, mockOnPollingError)
    );

    await act(async () => {
      result.current.startPolling();
      jest.advanceTimersByTime(5000);
      await waitForNextUpdate();
    });

    expect(mockFetchFunction).toHaveBeenCalledTimes(1);
    expect(mockOnPollingError).toHaveBeenCalledWith(mockError);
    expect(result.current.data).toBe(null);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toEqual(mockError);

    // Advance timers to check if polling continues
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    expect(mockFetchFunction).toHaveBeenCalledTimes(1); // Should not fetch again
  });

  it('starts and stops polling correctly', async () => {
    const mockData = { result: 'success' };
    mockFetchFunction.mockResolvedValue(mockData);

    const { result, waitForNextUpdate } = renderHook(() => usePolling(mockFetchFunction, 5000));

    await act(async () => {
      result.current.startPolling();
      jest.advanceTimersByTime(5000);
      await waitForNextUpdate();
    });

    expect(mockFetchFunction).toHaveBeenCalledTimes(1);

    await act(async () => {
      result.current.stopPolling();
      jest.advanceTimersByTime(5000);
    });

    expect(mockFetchFunction).toHaveBeenCalledTimes(1); // No additional calls after stopping
  });
});
