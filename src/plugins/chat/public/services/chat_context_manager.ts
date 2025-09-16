/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
/* eslint-disable no-console */

import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import {
  ContextProviderStart,
  StaticContext,
  DynamicContext,
} from '../../../context_provider/public';

export class ChatContextManager {
  private rawStaticContext$ = new BehaviorSubject<StaticContext | null>(null);
  private rawDynamicContext$ = new BehaviorSubject<DynamicContext | null>(null);
  private contextProvider?: ContextProviderStart;
  private subscriptions: Subscription[] = [];

  constructor() {
    // No initialization needed for raw context storage
  }

  public start(contextProvider?: ContextProviderStart): void {
    console.log('🎯 ChatContextManager: Starting');

    // Use the context provider passed as parameter
    this.contextProvider = contextProvider;

    if (!this.contextProvider) {
      console.warn('⚠️ ChatContextManager: Context provider not available');
      return;
    }

    // Subscribe to static context updates
    const staticSub = this.contextProvider
      .getStaticContext$()
      .subscribe((staticContext: StaticContext | null) => {
        console.log('📊 ChatContextManager: Static context received', staticContext);
        this.rawStaticContext$.next(staticContext);
      });

    // Subscribe to dynamic context updates
    const dynamicSub = this.contextProvider
      .getDynamicContext$()
      .subscribe((dynamicContext: DynamicContext | null) => {
        console.log('⚡ ChatContextManager: Dynamic context received', dynamicContext);
        this.rawDynamicContext$.next(dynamicContext);
      });

    this.subscriptions.push(staticSub, dynamicSub);

    // Get initial context
    this.refreshContext();
  }

  public getRawStaticContext(): StaticContext | null {
    return this.rawStaticContext$.value;
  }

  public getRawDynamicContext(): DynamicContext | null {
    return this.rawDynamicContext$.value;
  }

  public getRawStaticContext$(): Observable<StaticContext | null> {
    return this.rawStaticContext$.asObservable();
  }

  public getRawDynamicContext$(): Observable<DynamicContext | null> {
    return this.rawDynamicContext$.asObservable();
  }

  public refreshContext(): void {
    console.log('🔄 ChatContextManager: Refreshing context');

    if (this.contextProvider) {
      this.contextProvider.refreshCurrentContext();
    }
  }

  public stop(): void {
    console.log('🛑 ChatContextManager: Stopping');
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions = [];
  }
}
