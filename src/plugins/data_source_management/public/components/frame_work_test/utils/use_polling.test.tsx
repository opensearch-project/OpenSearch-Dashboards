/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook, act } from '@testing-library/react-hooks';
import { usePolling } from '../../../../framework/utils/use_polling';

describe('usePolling', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should start polling and update data', async () => {
    const mockFetch = jest.fn().mockResolvedValue({ data: 'test' });
    const { result } = renderHook(() => usePolling(mockFetch, 1000));

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();

    act(() => {
      result.current.startPolling();
    });

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual({ data: 'test' });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should stop polling when stopPolling is called', async () => {
    const mockFetch = jest.fn().mockResolvedValue({ data: 'test' });
    const { result } = renderHook(() => usePolling(mockFetch, 1000));

    act(() => {
      result.current.startPolling();
    });

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.stopPolling();
    });

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    expect(mockFetch).toHaveBeenCalledTimes(1); // Should not have been called again
  });

  it('should handle errors', async () => {
    const mockError = new Error('Test error');
    const mockFetch = jest.fn().mockRejectedValue(mockError);
    const { result } = renderHook(() => usePolling(mockFetch, 1000));

    act(() => {
      result.current.startPolling();
    });

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.error).toBe(mockError);
    expect(result.current.loading).toBe(false);
  });

  it('should stop polling when onPollingSuccess returns true', async () => {
    const mockFetch = jest.fn().mockResolvedValue({ data: 'test' });
    const onPollingSuccess = jest.fn().mockReturnValue(true);
    const { result } = renderHook(() => usePolling(mockFetch, 1000, onPollingSuccess));

    act(() => {
      result.current.startPolling();
    });

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(onPollingSuccess).toHaveBeenCalledWith({ data: 'test' }, undefined);

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    expect(mockFetch).toHaveBeenCalledTimes(1); // Should not have been called again
  });

  it('should stop polling when onPollingError returns true', async () => {
    const mockError = new Error('Test error');
    const mockFetch = jest.fn().mockRejectedValue(mockError);
    const onPollingError = jest.fn().mockReturnValue(true);
    const { result } = renderHook(() => usePolling(mockFetch, 1000, undefined, onPollingError));

    act(() => {
      result.current.startPolling();
    });

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(onPollingError).toHaveBeenCalledWith(mockError);

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    expect(mockFetch).toHaveBeenCalledTimes(1); // Should not have been called again
  });
});
