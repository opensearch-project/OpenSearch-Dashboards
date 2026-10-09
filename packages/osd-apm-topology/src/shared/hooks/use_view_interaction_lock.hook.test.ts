/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react';
import { useViewInteractionLock } from './use_view_interaction_lock.hook';

describe('useViewInteractionLock', () => {
  it('keeps the same lock object across renders', () => {
    // Effects depend on the lock; a new object on every render re-ran them (e.g. the map's
    // resize observer, which then refit the whole map on a node click).
    const { result, rerender } = renderHook(() => useViewInteractionLock());
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });

  it('is locked for the given duration after lock()', () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(1000);
    const { result } = renderHook(() => useViewInteractionLock(500));
    expect(result.current.isLocked()).toBe(false);
    result.current.lock();
    now.mockReturnValue(1499);
    expect(result.current.isLocked()).toBe(true);
    now.mockReturnValue(1500);
    expect(result.current.isLocked()).toBe(false);
    now.mockRestore();
  });
});
