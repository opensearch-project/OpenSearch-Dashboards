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
  description: string; // Sent to backend
  value: any; // Sent to backend
  label: string; // UI display only
  categories?: string[]; // Categories for filtering (e.g., ['chat', 'explore'])
  id?: string; // Optional unique ID
}

export interface ContextEntry extends AssistantContextOptions {
  id: string; // Always has ID (generated if not provided)
  timestamp: number; // When context was registered
  source?: string; // Optional source identifier
}

export interface AssistantContextStore {
  addContext(options: AssistantContextOptions): string;
  removeContext(id: string): void;
  getContextsByCategory(category: string): ContextEntry[];
  getAllContexts(): ContextEntry[];
  clearCategory(category: string): void;
  clearAll(): void;
  subscribe(callback: (contexts: ContextEntry[]) => void): () => void;
}

export interface ContextProviderStart {
  executeAction(actionType: string, params: any): Promise<any>;
  getAvailableActions(): string[];
  getAssistantContextStore(): AssistantContextStore;
}
