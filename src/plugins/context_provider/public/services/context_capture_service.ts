/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreSetup, CoreStart } from '../../../../core/public';
import {
  ContextProviderSetupDeps,
  ContextProviderStartDeps,
  AssistantContextStore,
} from '../types';
import { AssistantContextStoreImpl } from './assistant_context_store';

/**
 * Core service for context capture functionality.
 * Manages the assistant context store and provides it globally for React hooks.
 */
export class ContextCaptureService {
  private assistantContextStore: AssistantContextStore;

  // @ts-expect-error TS6138 TODO(ts-error): fixme
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
  }

  public getAssistantContextStore(): AssistantContextStore {
    return this.assistantContextStore;
  }

  public stop(): void {
    this.assistantContextStore.clearAll();
    delete (window as any).assistantContextStore;
  }
}
