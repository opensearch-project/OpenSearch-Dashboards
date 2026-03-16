/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Subscription, combineLatest } from 'rxjs';
import { CoreSetup, CoreStart } from '../../../../core/public';
import {
  ContextProviderSetupDeps,
  ContextProviderStartDeps,
  AssistantContextStore,
} from '../types';
import { AssistantContextStoreImpl } from './assistant_context_store';

const DEFAULT_PAGE_CONTEXT_ID = 'default-page-context';

export interface DefaultPageContextControl {
  suppress: () => void;
  unsuppress: () => void;
}

/**
 * Core service for context capture functionality.
 * Manages the assistant context store and provides it globally for React hooks.
 */
export class ContextCaptureService {
  private assistantContextStore: AssistantContextStore;
  private defaultContextSubscription?: Subscription;
  private defaultContextSuppressed = false;
  private cachedAppId?: string;
  private cachedAppTitle?: string;
  private cachedBreadcrumbs: string[] = [];

  constructor(private coreSetup: CoreSetup, private pluginsSetup: ContextProviderSetupDeps) {
    this.assistantContextStore = new AssistantContextStoreImpl();
  }

  public setup(): void {
    // Initialize assistant context store - already done in constructor
    // This method is kept for plugin lifecycle compatibility
  }

  public start(core: CoreStart, plugins: ContextProviderStartDeps): void {
    // Make assistant context store globally available for hooks
    (window as any).assistantContextStore = this.assistantContextStore;

    // Subscribe to app navigation and breadcrumbs for default page context
    this.defaultContextSubscription = combineLatest([
      core.application.currentAppId$,
      core.application.applications$,
      core.chrome.getBreadcrumbs$(),
    ]).subscribe(([appId, applications, breadcrumbs]) => {
      this.cachedAppId = appId;
      this.cachedAppTitle = appId ? applications.get(appId)?.title : undefined;
      this.cachedBreadcrumbs = breadcrumbs.map((b) => b.text as string).filter(Boolean);

      if (!this.defaultContextSuppressed && appId) {
        this.registerDefaultPageContext();
      }
    });

    // Expose suppress/unsuppress control globally for usePageContext
    (window as any).__defaultPageContextControl = {
      suppress: () => this.suppressDefaultPageContext(),
      unsuppress: () => this.unsuppressDefaultPageContext(),
    } as DefaultPageContextControl;
  }

  public getAssistantContextStore(): AssistantContextStore {
    return this.assistantContextStore;
  }

  public stop(): void {
    this.defaultContextSubscription?.unsubscribe();
    this.defaultContextSubscription = undefined;
    this.defaultContextSuppressed = false;
    this.assistantContextStore.clearAll();
    delete (window as any).assistantContextStore;
    delete (window as any).__defaultPageContextControl;
  }

  private registerDefaultPageContext(): void {
    this.assistantContextStore.addContext({
      id: DEFAULT_PAGE_CONTEXT_ID,
      description: `Page context for ${new URL(window.location.href).pathname}`,
      value: {
        appId: this.cachedAppId,
        breadcrumbs: this.cachedBreadcrumbs,
      },
      label: `Page: ${this.cachedAppTitle || this.cachedAppId}`,
      categories: ['page', 'static'],
    });
  }

  private suppressDefaultPageContext(): void {
    this.defaultContextSuppressed = true;
    this.assistantContextStore.removeContextById(DEFAULT_PAGE_CONTEXT_ID);
  }

  private unsuppressDefaultPageContext(): void {
    this.defaultContextSuppressed = false;
    if (this.cachedAppId) {
      this.registerDefaultPageContext();
    }
  }
}
