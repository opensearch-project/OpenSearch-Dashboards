/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Observable } from 'rxjs';
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

export interface StaticContext {
  appId: string;
  timestamp: number;
  data: Record<string, any>;
}

export interface DynamicContext {
  appId?: string;
  trigger: string;
  timestamp: number;
  data: Record<string, any>;
}

export interface GlobalInteraction {
  type: string;
  app?: string;
  testSubj?: string;
  className: string;
  tagName: string;
  text?: string;
  timestamp: number;
  url: string;
  interactionType?: string;
  [key: string]: any;
}

export interface ContextContributor {
  appId: string;

  // Option 1: Simple URL-based context (for plugins like Discover, Visualize)
  urlStateKeys?: string[]; // ['_g', '_a', '_q']
  parseUrlState?(urlState: Record<string, any>): Record<string, any>;

  // Option 2: Complex context capture (for plugins like Dashboard with embeddables)
  captureStaticContext?(): Promise<Record<string, any>>;

  // UI Actions that should trigger context refresh
  contextTriggerActions?: string[];

  // Optional methods for dynamic context and actions
  captureDynamicContext?(trigger: string, data: any): Record<string, any>;
  getAvailableActions?(): string[];
  executeAction?(actionType: string, params: any): Promise<any>;

  // NEW: Handle global interactions
  handleGlobalInteraction?(interaction: GlobalInteraction): void;

  // Optional method to check if this contributor can handle a specific app ID
  canHandleApp?(appId: string): boolean;
}

/**
 * Context Capture Patterns supported by the Context Provider
 */
export enum ContextCapturePattern {
  /** URL-only: All context is reflected in URL parameters */
  URL_ONLY = 'url_only',
  /** Hybrid: URL state + transient UI actions not in URL */
  HYBRID = 'hybrid',
  /** Complex: Deep embeddable scanning + container management */
  COMPLEX = 'complex',
}

/**
 * Enhanced Context Contributor with state management capabilities
 * For plugins that need to track transient state not reflected in URLs
 */
export interface StatefulContextContributor extends ContextContributor {
  /** Context capture pattern this contributor uses */
  capturePattern: ContextCapturePattern;

  /** Get current transient state maintained by this contributor */
  getTransientState(): Record<string, any>;

  /** Update transient state based on UI actions */
  updateTransientState(trigger: string, data: any): void;

  /** Clear all transient state */
  clearTransientState(): void;

  /** Get metadata about the current state complexity */
  getStateMetadata(): {
    hasTransientState: boolean;
    stateComplexity: 'simple' | 'moderate' | 'complex';
    lastInteraction: number;
    customProperties: Record<string, any>;
  };

  /** Optional: Initialize any custom state tracking */
  initialize?(): void;

  /** Optional: Cleanup when contributor is unregistered */
  cleanup?(): void;
}

/**
 * Context for document expansion tracking (Explore plugin example)
 */
export interface DocumentExpansionContext {
  documentId: string;
  documentData: Record<string, any>;
  expandedAt: number;
  interactionCount: number;
  fieldSelections?: string[];
}

/**
 * Context for embeddable interactions (Dashboard plugin example)
 */
export interface EmbeddableInteractionContext {
  embeddableId: string;
  embeddableType: string;
  panelTitle: string;
  interactionType: 'hover' | 'click' | 'edit' | 'clone' | 'delete';
  interactionData: Record<string, any>;
  timestamp: number;
}

/**
 * Flexible context data structure that can accommodate different plugin patterns
 */
export interface FlexibleContextData {
  /** Core context information */
  appId: string;
  type: string;
  timestamp: number;

  /** URL-based context (always present) */
  urlContext: {
    pathname: string;
    search: string;
    hash: string;
    parsedParams: Record<string, any>;
  };

  /** Optional: Transient state not reflected in URL */
  transientState?: Record<string, any>;

  /** Optional: Complex embeddable or container state */
  complexState?: Record<string, any>;

  /** Metadata about the context capture */
  metadata: {
    capturePattern: ContextCapturePattern;
    hasCustomState: boolean;
    stateComplexity: 'simple' | 'moderate' | 'complex';
    contributorVersion: string;
  };
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ContextProviderSetup {
  // Setup interface - empty for now
}

export interface ContextProviderStart {
  // Methods that chatbot/OSD agent can call
  getCurrentContext(): Promise<StaticContext | null>;
  refreshCurrentContext(): Promise<StaticContext | null>;
  executeAction(actionType: string, params: any): Promise<any>;
  getAvailableActions(): string[];
  // Plugin registration methods
  registerContextContributor(contributor: ContextContributor): void;
  unregisterContextContributor(appId: string): void;
  // Observable methods for real-time context updates
  getStaticContext$(): Observable<StaticContext | null>;
  getDynamicContext$(): Observable<DynamicContext | null>;
  // NEW: Global interaction capture
  captureGlobalInteraction(interaction: GlobalInteraction): void;
}
