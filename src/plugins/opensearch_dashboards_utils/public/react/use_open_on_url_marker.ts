/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';

/**
 * Reads a transient query-param "command marker" from the URL hash and invokes
 * `onOpen` when it is present, then strips the marker so a refresh / back-nav
 * doesn't replay it.
 *
 * WHY THIS EXISTS: side-nav popover actions can only navigate (they receive
 * `navigateToApp` but not `overlays`), so to drive an in-app overlay (e.g.
 * "Browse saved searches" → saved-search flyout, "APM settings" → settings
 * modal) the action navigates to the app with a marker like
 * `#/?_openSaved=true`. The destination page — which DOES have `overlays` —
 * uses this hook to detect the marker and open the overlay itself.
 *
 * Robustness handled here once, instead of being re-implemented per app:
 * - Marker is matched by EXACT query param (`params.get(marker) === 'true'`),
 *   not a loose substring, so a saved-object title / filter value that merely
 *   contains the marker string never triggers it.
 * - EDGE-TRIGGERED: `onOpen` fires only when the marker TRANSITIONS from absent
 *   to present, never while it merely stays present. This is the key to not
 *   re-opening the overlay when the app re-serializes the URL from a stale
 *   snapshot that still carries the marker (e.g. close the saved-search flyout,
 *   then run a query — the app rewrites the hash and the marker can momentarily
 *   reappear; a level-triggered check would reopen the flyout, an edge-triggered
 *   one does not).
 * - The marker is stripped via `replaceState` (which does not emit
 *   `hashchange`, so it can't re-enter this handler) after opening.
 * - Re-checks on mount, on window `hashchange` (cross-app arrivals), and
 *   whenever `locationKey` changes (same-app navigations via a scoped/hash
 *   router update `window.location.hash` WITHOUT emitting a window
 *   `hashchange`, so pass e.g. react-router's `useLocation()` key here).
 *
 * @param marker the query-param name to look for in the hash (e.g. `_openSaved`)
 * @param onOpen invoked when the marker is present (open the overlay here)
 * @param options.locationKey a value that changes on every in-app navigation
 *   (e.g. ``${pathname}${search}${hash}`` from react-router) so same-app
 *   navigations re-run the check; omit for cross-app-only behavior
 */
export function useOpenOnUrlMarker(
  marker: string,
  onOpen: () => void,
  options: { locationKey?: string } = {}
) {
  const { locationKey } = options;
  // Tracks whether the marker was present on the previous check, so we only act
  // on the absent -> present EDGE (see the "EDGE-TRIGGERED" note above).
  const markerWasPresentRef = useRef(false);

  useEffect(() => {
    const hasMarker = () => {
      const hash = window.location.hash; // e.g. "#/?_openSaved=true&_g=..."
      const qIndex = hash.indexOf('?');
      if (qIndex === -1) return false;
      return new URLSearchParams(hash.slice(qIndex + 1)).get(marker) === 'true';
    };

    const openIfMarked = () => {
      const present = hasMarker();
      // Only open on the rising edge (absent -> present); ignore a marker that
      // was already present on the last check (a stale re-serialization).
      if (!present || markerWasPresentRef.current) {
        markerWasPresentRef.current = present;
        return;
      }
      markerWasPresentRef.current = true;

      // Strip ONLY the `marker=...` token from the raw query string, preserving
      // every other param verbatim. We deliberately do NOT rebuild the query via
      // `URLSearchParams.toString()` — that would percent-encode the rison `_g`
      // / `_a` values (e.g. `(time)` -> `%28time%29`) and churn the URL. The
      // replaceState below does NOT fire `hashchange`, so this can't re-enter.
      const hash = window.location.hash;
      const qIndex = hash.indexOf('?');
      const rawQuery = hash.slice(qIndex + 1);
      const nextQuery = rawQuery
        .split('&')
        .filter((pair) => {
          const eqIndex = pair.indexOf('=');
          const key = eqIndex === -1 ? pair : pair.slice(0, eqIndex);
          return key !== marker;
        })
        .join('&');
      const nextHash = `${hash.slice(0, qIndex)}${nextQuery ? `?${nextQuery}` : ''}`;
      window.history.replaceState(
        window.history.state,
        '',
        `${window.location.pathname}${window.location.search}${nextHash}`
      );
      // Keep `markerWasPresentRef` TRUE after handling. We just stripped the
      // marker, but the app may re-serialize the hash from a stale snapshot that
      // re-adds it (e.g. running a query after closing the flyout). Leaving this
      // true means such a stale reappearance is treated as "still present" and
      // ignored. It is only reset to false once a later check observes the
      // marker genuinely ABSENT (the settled hash), which re-arms the hook for a
      // real future arrival (a fresh "Browse saved" click).

      onOpen();
    };

    openIfMarked();
    window.addEventListener('hashchange', openIfMarked);
    return () => window.removeEventListener('hashchange', openIfMarked);
    // locationKey is intentionally a dep so same-app (scoped-history)
    // navigations that don't emit a window hashchange still re-check.
  }, [marker, onOpen, locationKey]);
}
