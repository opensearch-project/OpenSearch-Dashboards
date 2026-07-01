/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';

/**
 * Reads a transient query-param "command marker" from the URL hash and invokes
 * `onOpen` when it is present, then strips the marker so it isn't replayed.
 *
 * WHY THIS EXISTS: side-nav popover actions can only navigate (they receive
 * `navigateToApp` but not `overlays`), so to drive an in-app overlay (e.g.
 * "Browse saved searches" → saved-search flyout, "APM settings" → settings
 * modal) the action navigates to the app with a marker like
 * `#/?_openSaved=true`. The destination page — which DOES have `overlays` —
 * uses this hook to detect the marker and open the overlay itself.
 *
 * Behavior / robustness handled here once, instead of per app:
 * - Matched by EXACT query param (`params.get(marker) === 'true'`), not a loose
 *   substring, so a saved-object title / filter value that merely contains the
 *   marker string never triggers it.
 * - The check runs on mount and on window `hashchange` only. It deliberately
 *   does NOT key on the react-router location: apps re-serialize the hash via
 *   silent `history.replace` on ordinary actions (e.g. running a query), which
 *   updates `window.location` WITHOUT a `hashchange`. If we re-checked on those,
 *   a stale marker re-serialized into the rewritten hash would reopen the
 *   overlay (the bug this avoids). Genuine same-app re-clicks of the popover
 *   action still work because core dispatches a synthetic window `hashchange`
 *   for same-app popover navigations.
 * - On open the marker is stripped via `replaceState` (which does not emit
 *   `hashchange`, so it can't re-enter this handler), preserving every other
 *   query param verbatim.
 *
 * @param marker the query-param name to look for in the hash (e.g. `_openSaved`)
 * @param onOpen invoked when the marker is present (open the overlay here)
 */
export function useOpenOnUrlMarker(marker: string, onOpen: () => void) {
  useEffect(() => {
    const openIfMarked = () => {
      // Default to '' so the hook is safe under partial `window.location` mocks
      // (some component tests stub `window.location` without a `hash`).
      const hash = window.location.hash || ''; // e.g. "#/?_openSaved=true&_g=..."
      const qIndex = hash.indexOf('?');
      if (qIndex === -1) return;
      if (new URLSearchParams(hash.slice(qIndex + 1)).get(marker) !== 'true') return;

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
    return () => window.removeEventListener('hashchange', openIfMarked);
  }, [marker, onOpen]);
}
