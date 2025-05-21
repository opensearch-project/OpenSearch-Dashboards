/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { useStore } from '../context';
/**
 * @experimental
 * React hook to get all registered plugin keys from the central state store.
 *
 * @returns An array of all currently registered plugin keys.
 *
 * @example
 * const pluginKeys = usePluginKeys();
 * return <ul>{pluginKeys.map(key => <li key={key}>{key}</li>)}</ul>;
 *
 * @throws Error if used outside of PluginStoreContext.Provider
 */
export function usePluginKeys(): string[] {
  const store = useStore();
  if (!store) {
    throw new Error('usePluginKeys must be used inside PluginStoreContext.Provider');
  }

  const [pluginKeys, setPluginKeys] = useState(store.getAllRegisteredPluginKeys());

  useEffect(() => {
    const unsubscribe = store.subscribeToKeysChange(() => {
      setPluginKeys(store.getAllRegisteredPluginKeys());
    });

    return () => unsubscribe();
  }, [store]);

  return pluginKeys;
}
