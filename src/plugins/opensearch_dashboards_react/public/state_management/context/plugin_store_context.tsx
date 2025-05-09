/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ReactNode, createContext, useContext } from 'react';
import { Store } from '../../../../opensearch_dashboards_utils/common/state_management';
import { globalStore } from '../store';

const StoreContext = createContext<Store | null>(null);

interface PluginStoreProviderProps {
  children: ReactNode;
  store?: Store; // Optional store
}

export const PluginStoreProvider = ({ children, store }: PluginStoreProviderProps) => {
  const activeStore = store ?? globalStore; // Fallback to globalStore

  return <StoreContext.Provider value={activeStore}>{children}</StoreContext.Provider>;
};

// Hook to access store
export const useStore = (): Store => {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used within PluginStoreProvider');
  return store;
};
