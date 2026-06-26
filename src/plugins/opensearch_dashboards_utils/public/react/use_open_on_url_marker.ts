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
 * - `onOpen` is invoked AFTER the marker is stripped via `replaceState`
 *   (which does not emit `hashchange`, so it can't re-enter this handler).
 * - A short cooldown (default 500ms) absorbs the app's own hash re-sync (which
 *   can re-add the marker within a few ms of the strip) without blocking a
 *   genuine later re-click.
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
 * @param options.cooldownMs how long to suppress re-fires after an open
 *   (default 500)
 */
export function useOpenOnUrlMarker(
  marker: string,
  onOpen: () => void,
  options: { locationKey?: string; cooldownMs?: number } = {}
) {
  const { locationKey, cooldownMs = 500 } = options;
  const cooldownRef = useRef(false);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const openIfMarked = () => {
      if (cooldownRef.current) return;
      const hash = window.location.hash; // e.g. "#/?_openSaved=true&_g=..."
      const qIndex = hash.indexOf('?');
      if (qIndex === -1) return;
      const params = new URLSearchParams(hash.slice(qIndex + 1));
      if (params.get(marker) !== 'true') return;

      cooldownRef.current = true;
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
      cooldownTimerRef.current = setTimeout(() => {
        cooldownRef.current = false;
      }, cooldownMs);

      // Strip ONLY the `marker=...` token from the raw query string, preserving
      // every other param verbatim. We deliberately do NOT rebuild the query via
      // `URLSearchParams.toString()` — that would percent-encode the rison `_g`
      // / `_a` values (e.g. `(time)` -> `%28time%29`) and churn the URL. The
      // replaceState below does NOT fire `hashchange`, so this can't re-enter.
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

      onOpen();
    };

    openIfMarked();
    window.addEventListener('hashchange', openIfMarked);
    return () => {
      window.removeEventListener('hashchange', openIfMarked);
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    };
    // locationKey is intentionally a dep so same-app (scoped-history)
    // navigations that don't emit a window hashchange still re-check.
  }, [marker, onOpen, locationKey, cooldownMs]);
}
