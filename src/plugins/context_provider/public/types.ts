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

export interface ContextProviderSetup {
  // Setup interface - empty for now
}

export interface ContextProviderStart {
  // Methods that chatbot/OSD agent can call
  getCurrentContext(): Promise<StaticContext | null>;
  executeAction(actionType: string, params: any): Promise<any>;
  getAvailableActions(): string[];
}