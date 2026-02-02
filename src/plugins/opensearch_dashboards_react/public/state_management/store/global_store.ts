/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Store } from './action_selector_store';

/**
 * @experimental
 * Provides the global store that we can use to register the selector and action
 */
export const globalStore = new Store();

/**
 * @experimental
 * Utility function to register a service in the global store.
 * @param pluginKey - The unique key for the plugin.
 * @param selector - The selector instance for the plugin.
 * @param action - The action instance for the plugin.
 */
export const globalStoreServiceRegister = <T>(
  pluginKey: string,
  selector: Store['selectors'][string],
  action: Store['actions'][string]
): void => {
  globalStore.registerService(pluginKey, selector, action);
};
