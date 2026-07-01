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

/** Update the hash and fire a window hashchange, wrapped in act. */
function hashChangeTo(hash: string) {
  act(() => {
    setHash(hash);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
}

describe('useOpenOnUrlMarker', () => {
  beforeEach(() => {
    setHash('#/');
  });

  afterEach(() => {
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

  it('opens on a window hashchange that adds the marker', () => {
    const onOpen = jest.fn();
    renderHook(() => useOpenOnUrlMarker('_openSaved', onOpen));
    expect(onOpen).not.toHaveBeenCalled();

    hashChangeTo('#/?_openSaved=true');
    expect(onOpen).toHaveBeenCalledTimes(1);
    // and it was stripped
    expect(window.location.hash).not.toContain('_openSaved');
  });

  it('opens again on a later hashchange that re-adds the marker (genuine re-click)', () => {
    setHash('#/?_openSaved=true');
    const onOpen = jest.fn();
    renderHook(() => useOpenOnUrlMarker('_openSaved', onOpen));
    expect(onOpen).toHaveBeenCalledTimes(1);

    // A genuine re-click navigates back to the marker and fires a hashchange
    // (core dispatches a synthetic one for same-app popover navigations).
    hashChangeTo('#/?_openSaved=true');
    expect(onOpen).toHaveBeenCalledTimes(2);
  });

  it('does NOT reopen on a silent history.replace that re-adds a stale marker', () => {
    // P0 regression: open + strip, then the app re-serializes the hash via a
    // silent history.replace (no `hashchange`) that re-adds a stale marker
    // (e.g. running a query after closing the flyout). The hook does not key on
    // the router location, so this never re-invokes the check -> no reopen.
    setHash('#/?_openSaved=true');
    const onOpen = jest.fn();
    renderHook(() => useOpenOnUrlMarker('_openSaved', onOpen));
    expect(onOpen).toHaveBeenCalledTimes(1);

    // Silent re-serialization: hash updated WITHOUT a hashchange event.
    act(() => {
      setHash('#/?_openSaved=true&_q=(query:foo)');
    });
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

  it('does not throw when window.location.hash is undefined (partial mock)', () => {
    // Some component tests stub window.location without a `hash` property; the
    // hook must default to '' rather than call .indexOf on undefined.
    const originalDescriptor = Object.getOwnPropertyDescriptor(window, 'location');
    // @ts-expect-error intentionally partial mock, mirroring how apm tests stub it
    delete window.location;
    // @ts-expect-error assign a hash-less location
    window.location = { pathname: '/', search: '' };
    const onOpen = jest.fn();
    expect(() => renderHook(() => useOpenOnUrlMarker('_openSaved', onOpen))).not.toThrow();
    expect(onOpen).not.toHaveBeenCalled();
    if (originalDescriptor) Object.defineProperty(window, 'location', originalDescriptor);
  });
});
