/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { act, renderHook } from '@testing-library/react';
import { LAZY_LOAD_BATCH_SIZE, setTitleIfTruncated, useLazyRows } from './lazy_rows';

describe('useLazyRows', () => {
  let observed: IntersectionObserverCallback | undefined;
  const disconnect = jest.fn();

  beforeEach(() => {
    observed = undefined;
    disconnect.mockClear();
    (global as { IntersectionObserver?: unknown }).IntersectionObserver = jest.fn(
      (callback: IntersectionObserverCallback) => {
        observed = callback;
        return { observe: jest.fn(), disconnect };
      }
    );
  });

  const scrollToEnd = () =>
    act(() => {
      observed?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );
    });

  it('renders the next batch when the sentinel scrolls into view, and resets on new rows', () => {
    const { result, rerender } = renderHook(({ rows }) => useLazyRows(rows), {
      initialProps: { rows: [1] as unknown[] },
    });
    expect(result.current.renderedCount).toBe(LAZY_LOAD_BATCH_SIZE);

    act(() => result.current.sentinelRef(document.createElement('div')));
    scrollToEnd();
    expect(result.current.renderedCount).toBe(2 * LAZY_LOAD_BATCH_SIZE);

    rerender({ rows: [2] });
    expect(result.current.renderedCount).toBe(LAZY_LOAD_BATCH_SIZE);
  });

  it('disconnects the observer when the sentinel goes away', () => {
    const { result } = renderHook(() => useLazyRows([]));
    act(() => result.current.sentinelRef(document.createElement('div')));
    act(() => result.current.sentinelRef(null));
    expect(disconnect).toHaveBeenCalled();
  });
});

describe('setTitleIfTruncated', () => {
  const hover = (scrollWidth: number, clientWidth: number) => {
    const el = document.createElement('span');
    Object.defineProperty(el, 'scrollWidth', { value: scrollWidth });
    Object.defineProperty(el, 'clientWidth', { value: clientWidth });
    setTitleIfTruncated('full text')({ currentTarget: el } as never);
    return el.title;
  };

  it('sets the title only when the text is truncated', () => {
    expect(hover(200, 100)).toBe('full text');
    expect(hover(100, 100)).toBe('');
  });
});
