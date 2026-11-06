/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  SourceTypeLogsDrilldown,
  SourceTypeLogsDrilldownItem,
  SourceTypeLogsDrilldownScope,
} from '../../../../services/source_type_registry';

interface SourceItemsState {
  items: SourceTypeLogsDrilldownItem[];
  nextToken?: string;
  /** The first page is loading (the list is empty meanwhile). */
  loading: boolean;
  /** A further page is loading (the list so far stays). */
  loadingMore: boolean;
  error?: string;
  /** What the listing rejected with, as is (for the source's empty state). */
  errorCause?: unknown;
}

const EMPTY: SourceItemsState = { items: [], loading: false, loadingMore: false };

const messageOf = (error: unknown) =>
  error instanceof Error && error.message ? error.message : String(error);

/**
 * A registered source's items for the Explore logs page, a page at a time. Lists again from the
 * first page when the source, scope or search changes, and drops any answer for an older one.
 * Listing is free by contract (see `SourceTypeLogsDrilldown.listItems`), so it runs on its own.
 */
export const useSourceItems = (
  drilldown: SourceTypeLogsDrilldown,
  scope: SourceTypeLogsDrilldownScope | undefined,
  search: string,
  /** Changes on the page's Refresh (and time range): lists again, keeping the list meanwhile. */
  refreshKey = ''
) => {
  const [state, setState] = useState<SourceItemsState>(EMPTY);
  const controllerRef = useRef<AbortController>();
  // Bumped by Retry so the listing effect runs again with the same inputs.
  const [attempt, setAttempt] = useState(0);
  const scopeKey = scope ? JSON.stringify(scope) : '';
  // What the shown list was listed for: a new scope or search clears it; a refresh keeps it.
  const listedFor = useRef<string>();

  useEffect(() => {
    controllerRef.current?.abort();
    if (!scope) {
      setState(EMPTY);
      return;
    }
    const controller = new AbortController();
    controllerRef.current = controller;
    const listKey = `${scopeKey}|${search}`;
    const refreshing = listedFor.current === listKey;
    listedFor.current = listKey;
    // A refresh keeps a list it has (no flash of an empty page); with nothing listed, or for a new
    // scope or search, it loads from scratch.
    setState((prev) =>
      refreshing && prev.items.length > 0
        ? { ...prev, error: undefined, errorCause: undefined }
        : { ...EMPTY, loading: true }
    );
    drilldown
      .listItems({ scope, search, signal: controller.signal })
      .then((page) => {
        if (controller.signal.aborted) return;
        setState({
          items: page.items,
          nextToken: page.nextToken,
          loading: false,
          loadingMore: false,
        });
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setState({ ...EMPTY, error: messageOf(error), errorCause: error });
      });
    return () => controller.abort();
    // `scopeKey` stands for `scope`: a new object with the same content must not list again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drilldown, scopeKey, search, attempt, refreshKey]);

  const loadMore = useCallback(() => {
    if (!scope || !state.nextToken || state.loadingMore) return;
    const controller = controllerRef.current;
    if (!controller || controller.signal.aborted) return;
    const nextToken = state.nextToken;
    setState((prev) => ({ ...prev, loadingMore: true, error: undefined }));
    drilldown
      .listItems({ scope, search, nextToken, signal: controller.signal })
      .then((page) => {
        if (controller.signal.aborted) return;
        setState((prev) => {
          const seen = new Set(prev.items.map((item) => item.id));
          return {
            items: [...prev.items, ...page.items.filter((item) => !seen.has(item.id))],
            nextToken: page.nextToken,
            loading: false,
            loadingMore: false,
          };
        });
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setState((prev) => ({
          ...prev,
          loadingMore: false,
          error: messageOf(error),
          errorCause: error,
        }));
      });
  }, [drilldown, scope, search, state.nextToken, state.loadingMore]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { ...state, loadMore, retry };
};
