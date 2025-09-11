/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { NavigationPublicPluginStart } from '../../navigation/public';
import { ClientConfig } from '../common/types';
import { ContextProviderStart } from '../../context_provider/public';
import { ContextService } from './services/context_service';
import { ActionExecutor } from './services/action_executor';

export interface AssistantPluginSetup {
  getGreeting: () => string;
  getConfig: () => ClientConfig;
  isEnabled: () => boolean;
}

export interface AssistantPluginStart {
  getConfig: () => ClientConfig;
  isEnabled: () => boolean;
  getContextService: () => ContextService;
  getActionExecutor: () => ActionExecutor;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface AssistantPluginSetupDependencies {}

export interface AppPluginStartDependencies {
  navigation: NavigationPublicPluginStart;
  contextProvider: ContextProviderStart;
}
