/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ReactNode, createContext, useContext } from 'react';
import { Store, globalStore } from '../store';

/**
 * @experimental
 */
// Create a React context for the Store instance
const StoreContext = createContext<Store | null>(null);

interface PluginStoreProviderProps {
  children: ReactNode;
  store?: Store; // Optional store
}

/**
 * @experimental
 * React context provider for the plugin state Store.
 *
 * Wrap your application (or subtree) with this provider to make the Store instance
 * available to all child components via React context. If no store is provided, it
 * falls back to the globalStore singleton.
 *
 * @param children - The React children that will have access to the store
 * @param store - (Optional) A custom Store instance to provide will default to use the global store in case it is not provided
 *
 * @example
 * <PluginStoreProvider>
 *   <MyApp />
 * </PluginStoreProvider>
 */
export const PluginStoreProvider = ({ children, store }: PluginStoreProviderProps) => {
  const activeStore = store ?? globalStore; // Fallback to globalStore

  return <StoreContext.Provider value={activeStore}>{children}</StoreContext.Provider>;
};

/**
 * @experimental
 * React hook to access the current Store instance from context.
 *
 * Must be used within a PluginStoreProvider. Throws an error if used outside.
 *
 * @returns The current Store instance
 *
 * @example
 * const store = useStore();
 * store.registerService('myPlugin', selectors, actions);
 */
export const useStore = (): Store => {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used within PluginStoreProvider');
  return store;
};
