/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  SourceTypeLogsDrilldown,
  SourceTypeLogsDrilldownItem,
  SourceTypeLogsDrilldownItemPage,
  SourceTypeLogsDrilldownScope,
} from '../../../../services/source_type_registry';
import { SOURCE_LIST_MAX_ITEMS, SOURCE_LIST_PAGE_SIZE } from '../constants';
import { stableKey } from '../stable_key';

interface SourceItemsState {
  items: SourceTypeLogsDrilldownItem[];
  nextToken?: string;
  /** The first page is loading (the list is empty meanwhile). */
  loading: boolean;
  /** A further page is loading (the list so far stays). */
  loadingMore: boolean;
  /** The list reached SOURCE_LIST_MAX_ITEMS: "Load more" stops, and the page asks to narrow it. */
  capped: boolean;
  error?: string;
  /** What the listing rejected with, as is (for the source's empty state). */
  errorCause?: unknown;
  /** Which call failed: the listing (or its refresh) or a "Load more". */
  errorFrom?: 'list' | 'more';
}

const EMPTY: SourceItemsState = { items: [], loading: false, loadingMore: false, capped: false };

const messageOf = (error: unknown) =>
  error instanceof Error && error.message ? error.message : String(error);

/** Calls the source's `listItems`, turning a synchronous throw into a rejection. */
const listSafely = (
  drilldown: SourceTypeLogsDrilldown,
  args: Parameters<SourceTypeLogsDrilldown['listItems']>[0]
): Promise<SourceTypeLogsDrilldownItemPage> =>
  Promise.resolve().then(() => drilldown.listItems(args));

/** Appends a page, without repeats, up to the total cap. */
const merge = (
  items: SourceTypeLogsDrilldownItem[],
  page: SourceTypeLogsDrilldownItemPage
): Pick<SourceItemsState, 'items' | 'nextToken' | 'capped'> => {
  const seen = new Set(items.map((item) => item.id));
  const added = (page.items ?? [])
    .slice(0, SOURCE_LIST_PAGE_SIZE)
    .filter((item) => item && !seen.has(item.id) && seen.add(item.id));
  const merged = [...items, ...added];
  const capped = merged.length >= SOURCE_LIST_MAX_ITEMS;
  return {
    items: merged.slice(0, SOURCE_LIST_MAX_ITEMS),
    nextToken: capped ? undefined : page.nextToken,
    capped: capped && (!!page.nextToken || merged.length > SOURCE_LIST_MAX_ITEMS),
  };
};

/**
 * A registered source's items for the Explore logs page, a page at a time (SOURCE_LIST_PAGE_SIZE,
 * up to SOURCE_LIST_MAX_ITEMS in all). Lists again from the first page when the source, scope or
 * search changes, on Retry, and when `refreshKey` changes (the page's Refresh); answers for an
 * older listing are dropped, a "Load more" one included. Listing is free by contract (see
 * `SourceTypeLogsDrilldown.listItems`), so it runs on its own.
 */
export const useSourceItems = (
  drilldown: SourceTypeLogsDrilldown,
  scope: SourceTypeLogsDrilldownScope | undefined,
  search: string,
  /**
   * Changes on the page's Refresh button only (not on a time range change: listing doesn't depend
   * on time). Lists again from the first page, keeping the shown list until the answer.
   */
  refreshKey: string | number = ''
) => {
  const [state, setState] = useState<SourceItemsState>(EMPTY);
  // Every listing (a new scope or search, Retry, a refresh) gets the next generation, and its
  // controller; an answer from an older generation, a "Load more" one included, is dropped.
  const generation = useRef(0);
  const controllerRef = useRef<AbortController>();
  // Bumped by Retry so the listing effect runs again with the same inputs.
  const [attempt, setAttempt] = useState(0);
  const scopeKey = scope ? stableKey(scope) : '';
  // What the shown list was listed for: a new scope or search clears it; a refresh keeps it.
  const listedFor = useRef<string>();

  useEffect(() => {
    controllerRef.current?.abort();
    const current = ++generation.current;
    if (!scope) {
      listedFor.current = undefined;
      setState(EMPTY);
      return;
    }
    const controller = new AbortController();
    controllerRef.current = controller;
    const listKey = `${scopeKey}|${search}`;
    const refreshing = listedFor.current === listKey;
    listedFor.current = listKey;
    // A refresh keeps a list it has (no flash of an empty page), but not its "Load more": the next
    // page comes from the new listing. With nothing listed, or a new scope or search, start over.
    setState((prev) =>
      refreshing && prev.items.length > 0
        ? {
            ...prev,
            nextToken: undefined,
            loadingMore: false,
            error: undefined,
            errorCause: undefined,
            errorFrom: undefined,
          }
        : { ...EMPTY, loading: true }
    );
    listSafely(drilldown, {
      scope,
      search,
      pageSize: SOURCE_LIST_PAGE_SIZE,
      signal: controller.signal,
    })
      .then((page) => {
        if (generation.current !== current) return;
        setState({ ...EMPTY, ...merge([], page) });
      })
      .catch((error) => {
        if (generation.current !== current) return;
        // A failed refresh keeps the list it had, with the error under it (and a Retry).
        setState((prev) =>
          refreshing && prev.items.length > 0
            ? {
                ...prev,
                loading: false,
                error: messageOf(error),
                errorCause: error,
                errorFrom: 'list',
              }
            : { ...EMPTY, error: messageOf(error), errorCause: error, errorFrom: 'list' }
        );
      });
    return () => controller.abort();
    // `scopeKey` stands for `scope`: a new object with the same content must not list again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drilldown, scopeKey, search, attempt, refreshKey]);

  const loadMore = useCallback(() => {
    if (!scope || !state.nextToken || state.loadingMore) return;
    const controller = controllerRef.current;
    if (!controller || controller.signal.aborted) return;
    const current = generation.current;
    const nextToken = state.nextToken;
    setState((prev) => ({ ...prev, loadingMore: true, error: undefined, errorFrom: undefined }));
    listSafely(drilldown, {
      scope,
      search,
      nextToken,
      pageSize: SOURCE_LIST_PAGE_SIZE,
      signal: controller.signal,
    })
      .then((page) => {
        if (generation.current !== current) return;
        setState((prev) => ({
          ...prev,
          ...merge(prev.items, page),
          loading: false,
          loadingMore: false,
        }));
      })
      .catch((error) => {
        if (generation.current !== current) return;
        setState((prev) => ({
          ...prev,
          loadingMore: false,
          error: messageOf(error),
          errorCause: error,
          errorFrom: 'more',
        }));
      });
  }, [drilldown, scope, search, state.nextToken, state.loadingMore]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { ...state, loadMore, retry };
};
