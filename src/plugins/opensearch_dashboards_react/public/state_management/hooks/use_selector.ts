/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';
import { useStore } from '../context';
/**
 * Utility function to obtain the selector correspondin to the plugin Key
 * @param pluginKey - The unique key for the plugin.
 * @param selectorFn - The selector instance for the plugin.
 */
export function useSelector<TState, TResult>(
  pluginKey: string,
  selectorFn: (state: TState) => TResult
): TResult | undefined {
  const store = useStore();
  if (!store) {
    throw new Error('useSelector must be used inside PluginStoreContext.Provider');
  }

  const selector = store.getSelector(pluginKey);

  // Memoize selector function to prevent unnecessary re-renders
  const select = useMemo(() => (state: TState) => selectorFn(state), [selectorFn]);

  return useSyncExternalStore(
    // Subscribe function
    (onStoreChange) => selector?.subscribe(onStoreChange) ?? (() => {}),
    // GetSnapshot function
    () => (selector ? select(selector.getState()) : undefined),
    // Optional getServerSnapshot for SSR - use same as client snapshot
    () => (selector ? select(selector.getState()) : undefined)
  );
}
