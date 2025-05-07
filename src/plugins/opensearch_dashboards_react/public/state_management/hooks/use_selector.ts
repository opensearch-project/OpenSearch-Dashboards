/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { useStore } from '../context';
import { BaseSelectors } from '../../../../opensearch_dashboards_utils/common/state_management';

export function useSelector<T>(pluginKey: string): T {
  const store = useStore(); // Access the central store
  if (!store) {
    throw new Error('useSelector must be used inside PluginStoreContext.Provider');
  }

  const [selector, setSelector] = useState<BaseSelectors<any> | null>(null);

  useEffect(() => {
    const currentSelector = store.getSelector(pluginKey); // Retrieve selector from the store based on pluginKey
    setSelector(currentSelector);

    // Subscribe to changes in the selector and update the state accordingly
    const unsubscribe = store.subscribeToKeysChange(() => {
      const updatedSelector = store.getSelector(pluginKey);
      setSelector(updatedSelector);
    });

    return () => unsubscribe(); // Cleanup on component unmount
  }, [store, pluginKey]);

  if (!selector) {
    throw new Error(`Selector for pluginKey ${pluginKey} not found.`);
  }

  return selector.getState();
}
