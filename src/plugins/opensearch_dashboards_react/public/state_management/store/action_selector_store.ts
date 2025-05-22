/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { BaseActions } from '../../../../opensearch_dashboards_utils/public';
import { BaseSelectors } from '../../../../opensearch_dashboards_utils/public';

/**
 * @experimental
 * Store is a central registry for plugin state management.
 * It allows registration and retrieval of selectors and actions for each plugin,
 * and provides a way to subscribe to changes in the set of registered plugins.
 */
export class Store {
  /**
   * Holds selectors for each registered plugin, keyed by pluginKey.
   */
  private readonly selectors: Record<string, BaseSelectors<any>> = {};
  /**
   * Holds actions for each registered plugin, keyed by pluginKey.
   */
  private readonly actions: Record<string, BaseActions<any>> = {};
  /**
   * Emits the list of all registered plugin keys whenever it changes.
   */
  private readonly pluginKeys$ = new BehaviorSubject<string[]>([]);

  /**
   * Creates a new Store instance.
   */
  constructor() {}

  /**
   * Registers selectors and actions for a plugin.
   * @param pluginKey - Unique key for the plugin
   * @param selector - Selector instance for the plugin
   * @param action - Action instance for the plugin
   */
  public registerService(
    pluginKey: string,
    selector: BaseSelectors<any>,
    action: BaseActions<any>
  ) {
    this.selectors[pluginKey] = selector;
    this.actions[pluginKey] = action;
    this.pluginKeys$.next(Object.keys(this.selectors));
  }

  /**
   * Returns all currently registered plugin keys.
   */
  public getAllRegisteredPluginKeys(): string[] {
    return this.pluginKeys$.getValue();
  }

  /**
   * Retrieves the selector instance for a given plugin key.
   * @param pluginKey - The plugin key
   */
  public getSelector<T = any>(pluginKey: string): BaseSelectors<T> {
    return this.selectors[pluginKey];
  }

  /**
   * Retrieves the action instance for a given plugin key.
   * @param pluginKey - The plugin key
   */
  public getAction<T = any>(pluginKey: string): BaseActions<T> {
    return this.actions[pluginKey];
  }

  /**
   * Subscribes to changes in the set of registered plugin keys.
   * @param callback - Function to call when plugin keys change
   * @returns Unsubscribe function
   */
  public subscribeToKeysChange(callback: () => void): () => void {
    const subscription = this.pluginKeys$.subscribe(callback);
    return () => subscription.unsubscribe();
  }
}
