/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
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

export interface StaticContext {
  appId: string;
  timestamp: number;
  data: Record<string, any>;
}

export interface DynamicContext {
  trigger: string;
  timestamp: number;
  data: Record<string, any>;
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
}

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
}