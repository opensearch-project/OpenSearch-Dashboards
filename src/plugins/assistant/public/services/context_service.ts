/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject, Observable } from 'rxjs';
import { ContextProviderStart, StaticContext } from '../../../context_provider/public';

/**
 * Context service wrapper for the assistant plugin
 * Provides a clean interface to the context provider plugin
 */
export class ContextService {
  private contextProvider: ContextProviderStart;
  private currentContext$ = new BehaviorSubject<StaticContext | null>(null);

  constructor(contextProvider: ContextProviderStart) {
    this.contextProvider = contextProvider;
  }

  /**
   * Get the current context from the context provider
   */
  async getCurrentContext(): Promise<StaticContext | null> {
    try {
      const context = await this.contextProvider.getCurrentContext();
      this.currentContext$.next(context);
      return context;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to get current context:', error);
      return null;
    }
  }

  /**
   * Force a fresh context capture
   */
  async refreshCurrentContext(): Promise<StaticContext | null> {
    try {
      const context = await this.contextProvider.refreshCurrentContext();
      this.currentContext$.next(context);
      return context;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to refresh current context:', error);
      return null;
    }
  }

  /**
   * Execute an action through the context provider
   */
  async executeAction(actionType: string, params: any): Promise<any> {
    try {
      return await this.contextProvider.executeAction(actionType, params);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to execute action:', actionType, error);
      throw error;
    }
  }

  /**
   * Get available actions from the context provider
   */
  getAvailableActions(): string[] {
    try {
      return this.contextProvider.getAvailableActions();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to get available actions:', error);
      return [];
    }
  }

  /**
   * Observable stream of context changes
   */
  getContext$(): Observable<StaticContext | null> {
    return this.currentContext$.asObservable();
  }

  /**
   * Register a context contributor
   */
  registerContextContributor(contributor: any): void {
    try {
      this.contextProvider.registerContextContributor(contributor);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to register context contributor:', error);
    }
  }

  /**
   * Unregister a context contributor
   */
  unregisterContextContributor(appId: string): void {
    try {
      this.contextProvider.unregisterContextContributor(appId);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to unregister context contributor:', error);
    }
  }
}
