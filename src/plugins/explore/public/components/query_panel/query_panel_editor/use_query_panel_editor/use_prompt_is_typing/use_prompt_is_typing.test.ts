/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { usePromptIsTyping, PROMPT_IS_TYPING_TIMEOUT } from './use_prompt_is_typing';

// Mock timers
jest.useFakeTimers();

describe('usePromptIsTyping', () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => usePromptIsTyping());

    expect(result.current.promptIsTyping).toBe(false);
    expect(typeof result.current.handleChangeForPromptIsTyping).toBe('function');
  });

  it('should set promptIsTyping to true when handleChangeForPromptIsTyping is called', () => {
    const { result } = renderHook(() => usePromptIsTyping());

    act(() => {
      result.current.handleChangeForPromptIsTyping();
    });

    expect(result.current.promptIsTyping).toBe(true);
  });

  it('should set promptIsTyping to false after timeout', () => {
    const { result } = renderHook(() => usePromptIsTyping());

    act(() => {
      result.current.handleChangeForPromptIsTyping();
    });

    expect(result.current.promptIsTyping).toBe(true);

    act(() => {
      jest.advanceTimersByTime(PROMPT_IS_TYPING_TIMEOUT);
    });

    expect(result.current.promptIsTyping).toBe(false);
  });

  it('should reset timeout when handleChangeForPromptIsTyping is called multiple times', () => {
    const { result } = renderHook(() => usePromptIsTyping());

    // First call
    act(() => {
      result.current.handleChangeForPromptIsTyping();
    });

    expect(result.current.promptIsTyping).toBe(true);

    // Advance time, but not enough to trigger timeout
    act(() => {
      jest.advanceTimersByTime(PROMPT_IS_TYPING_TIMEOUT - 100);
    });

    expect(result.current.promptIsTyping).toBe(true);

    // Second call should reset the timeout
    act(() => {
      result.current.handleChangeForPromptIsTyping();
    });

    expect(result.current.promptIsTyping).toBe(true);

    // Advance time by the original remaining time - should still be true
    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(result.current.promptIsTyping).toBe(true);

    // Advance time by full timeout duration - should now be false
    act(() => {
      jest.advanceTimersByTime(PROMPT_IS_TYPING_TIMEOUT);
    });

    expect(result.current.promptIsTyping).toBe(false);
  });

  it('should clean up timeout on unmount', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    const { result, unmount } = renderHook(() => usePromptIsTyping());

    act(() => {
      result.current.handleChangeForPromptIsTyping();
    });

    expect(result.current.promptIsTyping).toBe(true);

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  it('should handle state changes correctly during continuous typing', () => {
    const { result } = renderHook(() => usePromptIsTyping());

    // Start typing
    act(() => {
      result.current.handleChangeForPromptIsTyping();
    });

    expect(result.current.promptIsTyping).toBe(true);

    // Continue typing before timeout
    act(() => {
      jest.advanceTimersByTime(PROMPT_IS_TYPING_TIMEOUT - 100);
      result.current.handleChangeForPromptIsTyping();
    });

    expect(result.current.promptIsTyping).toBe(true);

    // Continue typing again
    act(() => {
      jest.advanceTimersByTime(PROMPT_IS_TYPING_TIMEOUT - 100);
      result.current.handleChangeForPromptIsTyping();
    });

    expect(result.current.promptIsTyping).toBe(true);

    // Stop typing - should become false after timeout
    act(() => {
      jest.advanceTimersByTime(PROMPT_IS_TYPING_TIMEOUT);
    });

    expect(result.current.promptIsTyping).toBe(false);
  });
});
