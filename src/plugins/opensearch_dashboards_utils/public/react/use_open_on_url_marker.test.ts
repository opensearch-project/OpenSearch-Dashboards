/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { useOpenOnUrlMarker } from './use_open_on_url_marker';

/** Set window.location.hash without navigating (jsdom supports assignment). */
function setHash(hash: string) {
  window.history.replaceState(null, '', `${window.location.pathname}${hash}`);
}

describe('useOpenOnUrlMarker', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    setHash('#/');
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    setHash('#/');
  });

  it('calls onOpen on mount when the marker is present', () => {
    setHash('#/?_openSaved=true');
    const onOpen = jest.fn();
    renderHook(() => useOpenOnUrlMarker('_openSaved', onOpen));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('does not call onOpen when the marker is absent', () => {
    setHash('#/?_g=()');
    const onOpen = jest.fn();
    renderHook(() => useOpenOnUrlMarker('_openSaved', onOpen));
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('strips the marker from the hash but preserves the rest of the query', () => {
    setHash('#/?_openSaved=true&_g=(time)');
    renderHook(() => useOpenOnUrlMarker('_openSaved', jest.fn()));
    expect(window.location.hash).toBe('#/?_g=(time)');
    expect(window.location.hash).not.toContain('_openSaved');
  });

  it('leaves a bare hash when the marker was the only query param', () => {
    setHash('#/?_openSaved=true');
    renderHook(() => useOpenOnUrlMarker('_openSaved', jest.fn()));
    expect(window.location.hash).toBe('#/');
  });

  it('does NOT match a loose substring — only the exact param', () => {
    // A value that merely contains the marker string must not trigger.
    setHash("#/?_a=(query:'_openSaved=true')");
    const onOpen = jest.fn();
    renderHook(() => useOpenOnUrlMarker('_openSaved', onOpen));
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('opens again on a window hashchange that re-adds the marker', () => {
    const onOpen = jest.fn();
    renderHook(() => useOpenOnUrlMarker('_openSaved', onOpen));
    expect(onOpen).not.toHaveBeenCalled();

    // Advance past the cooldown window before the second trigger.
    act(() => {
      setHash('#/?_openSaved=true');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('suppresses a re-fire within the cooldown window', () => {
    setHash('#/?_openSaved=true');
    const onOpen = jest.fn();
    renderHook(() => useOpenOnUrlMarker('_openSaved', onOpen, { cooldownMs: 500 }));
    expect(onOpen).toHaveBeenCalledTimes(1);

    // The app re-adds the marker immediately (its own hash re-sync) — must NOT
    // double-open while the cooldown is active.
    act(() => {
      setHash('#/?_openSaved=true');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(onOpen).toHaveBeenCalledTimes(1);

    // After the cooldown elapses, a genuine re-trigger opens again.
    act(() => {
      jest.advanceTimersByTime(600);
    });
    act(() => {
      setHash('#/?_openSaved=true');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(onOpen).toHaveBeenCalledTimes(2);
  });

  it('re-checks when locationKey changes (same-app navigation, no hashchange)', () => {
    const onOpen = jest.fn();
    const { rerender } = renderHook(
      ({ key }) => useOpenOnUrlMarker('_openSaved', onOpen, { locationKey: key }),
      { initialProps: { key: '#/a' } }
    );
    expect(onOpen).not.toHaveBeenCalled();

    // Simulate a scoped-history navigation: hash updates with the marker, no
    // window 'hashchange' fires, but the router location key changes.
    setHash('#/?_openSaved=true');
    rerender({ key: '#/?_openSaved=true' });
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('removes its hashchange listener on unmount', () => {
    const removeSpy = jest.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useOpenOnUrlMarker('_openSaved', jest.fn()));
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('hashchange', expect.any(Function));
    removeSpy.mockRestore();
  });

  it('matches a custom marker name', () => {
    setHash('#/?_apmSettings=true');
    const onOpen = jest.fn();
    renderHook(() => useOpenOnUrlMarker('_apmSettings', onOpen));
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(window.location.hash).toBe('#/');
  });
});
