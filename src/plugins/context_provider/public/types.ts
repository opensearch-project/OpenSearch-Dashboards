/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { UiActionsSetup, UiActionsStart } from '../../../plugins/ui_actions/public';
import { DataPublicPluginSetup, DataPublicPluginStart } from '../../../plugins/data/public';
import { EmbeddableSetup, EmbeddableStart } from '../../../plugins/embeddable/public';

export interface ContextProviderSetupDeps {
  uiActions: UiActionsSetup;
  data: DataPublicPluginSetup;
  embeddable: EmbeddableSetup;
}

export interface ContextProviderStartDeps {
  uiActions: UiActionsStart;
  data: DataPublicPluginStart;
  embeddable: EmbeddableStart;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ContextProviderSetup {
  // Setup interface - empty for now
}

// Assistant Context System Types
export interface AssistantContextOptions {
  id?: string; // Unique identifier for context management
  description: string; // Sent to backend
  value: any; // Sent to backend
  label: string; // UI display only
  categories?: string[]; // Categories for filtering (e.g., ['chat', 'explore'])
}

export interface AssistantContextStore {
  addContext(options: AssistantContextOptions): void;
  removeContextById(id: string): void;
  getContextsByCategory(category: string): AssistantContextOptions[];
  getAllContexts(): AssistantContextOptions[];
  clearCategory(category: string): void;
  clearAll(): void;
  subscribe(callback: (contexts: AssistantContextOptions[]) => void): () => void;
}

export interface ContextProviderStart {
  getAssistantContextStore(): AssistantContextStore;
}
