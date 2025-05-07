/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { useStore } from '../context';
import { BaseActions } from '../../../../opensearch_dashboards_utils/common/state_management';

export function useAction<T>(pluginKey: string): BaseActions<T> {
  const store = useStore(); // Access the central store
  if (!store) {
    throw new Error('useAction must be used inside PluginStoreContext.Provider');
  }

  const [action, setAction] = useState<BaseActions<T> | null>(null);

  useEffect(() => {
    const currentAction = store.getAction(pluginKey); // Retrieve selector from the store based on pluginKey
    setAction(currentAction);

    // Subscribe to changes in the action and update the state accordingly
    const unsubscribe = store.subscribeToKeysChange(() => {
      const updatedAction = store.getAction(pluginKey);
      setAction(updatedAction);
    });

    return () => unsubscribe(); // Cleanup on component unmount
  }, [store, pluginKey]);

  if (!action) {
    throw new Error(`Action for pluginKey ${pluginKey} not found.`);
  }

  return action;
}
