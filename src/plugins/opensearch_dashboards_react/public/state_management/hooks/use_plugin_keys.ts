/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { useStore } from '../context';

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
