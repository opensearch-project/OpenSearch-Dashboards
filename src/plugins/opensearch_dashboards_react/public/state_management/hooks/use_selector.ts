/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useSyncExternalStore } from 'use-sync-external-store/shim';
import { useStore } from '../context';
/**
 * @experimental
 * React hook to select and subscribe to a portion of a plugin's state.
 *
 * @param pluginKey - The unique key for the plugin whose state you want to select from.
 * @param selectorFn - Function to select a part of the plugin's state.
 * @returns The selected state value, or undefined if not available.
 *
 * @example
 * const value = useSelector('myPlugin', state => state.someValue);
 *
 * @throws Error if used outside of PluginStoreContext.Provider
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

  return useSyncExternalStore(
    // Subscribe function
    (onStoreChange) => selector?.subscribe(onStoreChange) ?? (() => {}),
    // GetSnapshot function
    () => (selector ? selectorFn(selector.getState()) : undefined),
    // Optional getServerSnapshot for SSR - use same as client snapshot
    () => (selector ? selectorFn(selector.getState()) : undefined)
  );
}
