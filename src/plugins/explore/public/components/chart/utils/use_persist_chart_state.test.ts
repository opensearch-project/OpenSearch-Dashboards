/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook, act } from '@testing-library/react-hooks';
import { usePersistedChartState } from './use_persist_chart_state';

describe('usePersistedChartState', () => {
  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: jest.fn((key: string) => store[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        store[key] = value;
      }),
      clear: () => {
        store = {};
      },
    };
  })();

  // Replace the real localStorage with our mock
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });

  beforeEach(() => {
    // Clear localStorage and reset mocks before each test
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  it('should use default state when no stored value exists', () => {
    const { result } = renderHook(() => usePersistedChartState('histogram'));

    expect(result.current.toggleIdSelected).toBe('histogram');
    // Should not attempt to set localStorage on initial render
    expect(localStorageMock.setItem).not.toHaveBeenCalled();
  });

  it('should load state from localStorage if it exists', () => {
    // Set up localStorage with a value
    localStorageMock.getItem.mockReturnValueOnce('summary');

    const { result } = renderHook(() => usePersistedChartState('histogram'));

    expect(result.current.toggleIdSelected).toBe('summary');
    expect(localStorageMock.getItem).toHaveBeenCalledWith('exploreChartState');
  });

  it('should use default state if stored value is invalid', () => {
    // Set up localStorage with an invalid value
    localStorageMock.getItem.mockReturnValueOnce('invalid');

    const { result } = renderHook(() => usePersistedChartState('histogram'));

    expect(result.current.toggleIdSelected).toBe('histogram');
    // Should set localStorage with the default value
    expect(localStorageMock.setItem).toHaveBeenCalledWith('exploreChartState', 'histogram');
  });

  it('should update state and localStorage when updateToggleId is called', () => {
    const { result } = renderHook(() => usePersistedChartState('histogram'));

    act(() => {
      result.current.updateToggleId('summary');
    });

    expect(result.current.toggleIdSelected).toBe('summary');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('exploreChartState', 'summary');
  });

  it('should use provided default state when no stored value exists', () => {
    const { result } = renderHook(() => usePersistedChartState('summary'));

    expect(result.current.toggleIdSelected).toBe('summary');
  });
});
