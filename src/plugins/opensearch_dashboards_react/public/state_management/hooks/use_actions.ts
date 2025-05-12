/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useStore } from '../context';
import { BaseActions } from '../../../../opensearch_dashboards_utils/public';

export function useAction<T>(pluginKey: string): BaseActions<T> {
  const store = useStore(); // Access the central store
  if (!store) {
    throw new Error('useAction must be used inside PluginStoreContext.Provider');
  }

  return store.getAction(pluginKey);
}
