/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useStore } from '../context';
import { BaseActions } from '../../../../opensearch_dashboards_utils/public';
/**
 * @experimental
 * React hook to access actions for a specific plugin from the central state store.
 *
 * @param pluginKey - The unique key for the plugin whose actions you want to access.
 * @returns The BaseActions instance for the specified plugin.
 *
 * @example
 * const actions = useAction<MyState>('myPlugin');
 * actions.increment();
 *
 * @throws Error if used outside of PluginStoreContext.Provider
 */
export function useAction<T>(pluginKey: string): BaseActions<T> {
  const store = useStore(); // Access the central store
  if (!store) {
    throw new Error('useAction must be used inside PluginStoreContext.Provider');
  }

  return store.getAction(pluginKey);
}
