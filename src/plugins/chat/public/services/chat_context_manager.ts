/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
/* eslint-disable no-console */

import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { CoreStart } from '../../../../core/public';
import { ContextItem, ContextState, ContextType, SINGLETON_CONTEXT_TYPES } from '../types/context';
import { ContextProviderStart } from '../../../context_provider/public';

const PINNED_CONTEXTS_STORAGE_KEY = 'chat.pinnedContexts';

export class ChatContextManager {
  private contextState$ = new BehaviorSubject<ContextState>({
    activeContexts: [],
    pinnedContextIds: new Set(),
  });
  private contextProvider?: ContextProviderStart;
  private subscriptions: Subscription[] = [];

  constructor() {
    this.loadPinnedContexts();
  }

  public start(core: CoreStart, contextProvider?: ContextProviderStart): void {
    console.log('🎯 ChatContextManager: Starting');

    // Use the context provider passed as parameter
    this.contextProvider = contextProvider;

    if (!this.contextProvider) {
      console.warn('⚠️ ChatContextManager: Context provider not available');
      return;
    }

    // Subscribe to static context updates
    const staticSub = this.contextProvider.getStaticContext$().subscribe((staticContext: any) => {
      if (staticContext) {
        console.log('📊 ChatContextManager: Static context received', staticContext);
        this.processStaticContext(staticContext);
      }
    });

    // Subscribe to dynamic context updates
    const dynamicSub = this.contextProvider
      .getDynamicContext$()
      .subscribe((dynamicContext: any) => {
        if (dynamicContext) {
          console.log('⚡ ChatContextManager: Dynamic context received', dynamicContext);
          this.processDynamicContext(dynamicContext);
        }
      });

    this.subscriptions.push(staticSub, dynamicSub);

    // Get initial context
    this.refreshContext();
  }

  private processStaticContext(staticContext: any): void {
    const contextItems: ContextItem[] = [];
    const data = staticContext.data || {};

    // Extract time range
    if (data.dataContext?.timeRange) {
      contextItems.push({
        id: 'time_range',
        type: ContextType.TIME_RANGE,
        label: `${data.dataContext.timeRange.from} to ${data.dataContext.timeRange.to}`,
        data: data.dataContext.timeRange,
        source: 'static',
        timestamp: staticContext.timestamp,
      });
    }

    // Extract filters
    if (data.dataContext?.filters && data.dataContext.filters.length > 0) {
      data.dataContext.filters.forEach((filter: any, index: number) => {
        const label = filter.meta?.alias || filter.meta?.key || `Filter ${index + 1}`;
        contextItems.push({
          id: `filter_${index}_${Date.now()}`,
          type: ContextType.FILTERS,
          label,
          data: filter,
          source: 'static',
          timestamp: staticContext.timestamp,
        });
      });
    }

    // Extract query
    if (data.dataContext?.query) {
      contextItems.push({
        id: 'query',
        type: ContextType.QUERY,
        label: data.dataContext.query.query || 'Empty query',
        data: data.dataContext.query,
        source: 'static',
        timestamp: staticContext.timestamp,
      });
    }

    // Extract dashboard info
    if (data.dashboard) {
      contextItems.push({
        id: `dashboard_${data.dashboardId}`,
        type: ContextType.DASHBOARD,
        label: data.dashboard.title || 'Untitled Dashboard',
        data: data.dashboard,
        source: 'static',
        timestamp: staticContext.timestamp,
      });
    }

    // Extract index pattern
    if (data.indexPatternId) {
      contextItems.push({
        id: `index_${data.indexPatternId}`,
        type: ContextType.INDEX_PATTERN,
        label: data.indexPatternId,
        data: { id: data.indexPatternId },
        source: 'static',
        timestamp: staticContext.timestamp,
      });
    }

    // Extract app state
    if (staticContext.appId) {
      contextItems.push({
        id: 'app_state',
        type: ContextType.APP_STATE,
        label: staticContext.appId,
        data: { appId: staticContext.appId, url: data.url },
        source: 'static',
        timestamp: staticContext.timestamp,
      });
    }

    this.updateContexts(contextItems);
  }

  private processDynamicContext(dynamicContext: any): void {
    const contextItems: ContextItem[] = [];
    const data = dynamicContext.data || {};

    // Process based on trigger type
    switch (dynamicContext.trigger) {
      case 'TABLE_ROW_SELECT_TRIGGER':
        if (data.rowData) {
          contextItems.push({
            id: `document_${Date.now()}`,
            type: ContextType.DOCUMENT,
            label: 'Selected Document',
            data: data.rowData,
            source: 'dynamic',
            timestamp: dynamicContext.timestamp,
          });
        }
        break;

      case 'FIELD_SELECT_TRIGGER':
        if (data.field) {
          contextItems.push({
            id: `field_${data.field}_${Date.now()}`,
            type: ContextType.FIELD,
            label: data.field,
            data,
            source: 'dynamic',
            timestamp: dynamicContext.timestamp,
          });
        }
        break;

      case 'VISUALIZATION_SELECT_TRIGGER':
        if (data.visualizationId) {
          contextItems.push({
            id: `viz_${data.visualizationId}`,
            type: ContextType.VISUALIZATION,
            label: data.title || 'Visualization',
            data,
            source: 'dynamic',
            timestamp: dynamicContext.timestamp,
          });
        }
        break;
    }

    this.updateContexts(contextItems);
  }

  private updateContexts(newContexts: ContextItem[]): void {
    const currentState = this.contextState$.value;
    const updatedContexts = [...currentState.activeContexts];

    newContexts.forEach((newContext) => {
      // Handle singleton contexts
      if (SINGLETON_CONTEXT_TYPES.has(newContext.type)) {
        const existingIndex = updatedContexts.findIndex((ctx) => ctx.type === newContext.type);
        if (existingIndex !== -1) {
          // Replace existing singleton context
          updatedContexts[existingIndex] = {
            ...newContext,
            isPinned: currentState.pinnedContextIds.has(updatedContexts[existingIndex].id),
          };
        } else {
          updatedContexts.push(newContext);
        }
      } else {
        // For non-singleton contexts, check for duplicates by ID
        const existingIndex = updatedContexts.findIndex((ctx) => ctx.id === newContext.id);
        if (existingIndex === -1) {
          updatedContexts.push(newContext);
        }
      }
    });

    // Restore pinned status
    updatedContexts.forEach((ctx) => {
      ctx.isPinned = currentState.pinnedContextIds.has(ctx.id);
    });

    this.contextState$.next({
      activeContexts: updatedContexts,
      pinnedContextIds: currentState.pinnedContextIds,
    });
  }

  public excludeContext(contextId: string): void {
    const currentState = this.contextState$.value;
    const updatedContexts = currentState.activeContexts.filter((ctx) => ctx.id !== contextId);

    // Remove from pinned if it was pinned
    const updatedPinnedIds = new Set(currentState.pinnedContextIds);
    updatedPinnedIds.delete(contextId);

    this.contextState$.next({
      activeContexts: updatedContexts,
      pinnedContextIds: updatedPinnedIds,
    });

    this.savePinnedContexts(updatedPinnedIds);
  }

  public togglePinContext(contextId: string): void {
    const currentState = this.contextState$.value;
    const updatedPinnedIds = new Set(currentState.pinnedContextIds);

    if (updatedPinnedIds.has(contextId)) {
      updatedPinnedIds.delete(contextId);
    } else {
      updatedPinnedIds.add(contextId);
    }

    const updatedContexts = currentState.activeContexts.map((ctx) => ({
      ...ctx,
      isPinned: updatedPinnedIds.has(ctx.id),
    }));

    this.contextState$.next({
      activeContexts: updatedContexts,
      pinnedContextIds: updatedPinnedIds,
    });

    this.savePinnedContexts(updatedPinnedIds);
  }

  public refreshContext(): void {
    console.log('🔄 ChatContextManager: Refreshing context');

    if (this.contextProvider) {
      this.contextProvider.refreshCurrentContext();
    }
  }

  public getActiveContexts(): ContextItem[] {
    return this.contextState$.value.activeContexts;
  }

  public getContextState$(): Observable<ContextState> {
    return this.contextState$.asObservable();
  }

  private loadPinnedContexts(): void {
    try {
      const stored = localStorage.getItem(PINNED_CONTEXTS_STORAGE_KEY);
      if (stored) {
        const pinnedIds = JSON.parse(stored);
        this.contextState$.next({
          ...this.contextState$.value,
          pinnedContextIds: new Set(pinnedIds),
        });
      }
    } catch (error) {
      console.error('Failed to load pinned contexts:', error);
    }
  }

  private savePinnedContexts(pinnedIds: Set<string>): void {
    try {
      localStorage.setItem(PINNED_CONTEXTS_STORAGE_KEY, JSON.stringify(Array.from(pinnedIds)));
    } catch (error) {
      console.error('Failed to save pinned contexts:', error);
    }
  }

  public stop(): void {
    console.log('🛑 ChatContextManager: Stopping');
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions = [];
  }
}
