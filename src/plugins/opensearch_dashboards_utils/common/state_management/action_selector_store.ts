/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { BaseActions } from './base_action';
import { BaseSelectors } from './base_selector';

export class Store {
  private readonly selectors: Record<string, BaseSelectors<any>> = {};
  private readonly actions: Record<string, BaseActions<any>> = {};
  private readonly pluginKeys$ = new BehaviorSubject<string[]>([]);

  public registerServiceState(
    pluginKey: string,
    selector: BaseSelectors<any>,
    action: BaseActions<any>
  ) {
    this.selectors[pluginKey] = selector;
    this.actions[pluginKey] = action;
    this.pluginKeys$.next(Object.keys(this.selectors));
  }

  public getAllRegisteredPluginKeys(): string[] {
    return this.pluginKeys$.getValue();
  }

  public getSelector<T = any>(pluginKey: string): BaseSelectors<T> {
    return this.selectors[pluginKey];
  }

  public getAction<T = any>(pluginKey: string): BaseActions<T> {
    return this.actions[pluginKey];
  }

  public subscribeToKeysChange(callback: () => void): () => void {
    const subscription = this.pluginKeys$.subscribe(callback);
    return () => subscription.unsubscribe();
  }
}
