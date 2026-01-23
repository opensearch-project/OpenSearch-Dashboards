/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { NavigationPublicPluginStart } from '../../navigation/public';
import { ContextProviderStart } from '../../context_provider/public';
import { ChartsPluginStart } from '../../charts/public';
import { ChatService } from './services/chat_service';
import { SuggestedActionsServiceSetupContract } from './services/suggested_action';
import { CommandRegistrySetup } from './services/command_registry_service';

export interface ChatPluginSetup {
  suggestedActionsService: SuggestedActionsServiceSetupContract;
  commandRegistry: CommandRegistrySetup;
}

export interface ChatPluginStart {
  chatService: ChatService | undefined;
}

export interface AppPluginStartDependencies {
  navigation: NavigationPublicPluginStart;
  contextProvider: ContextProviderStart;
  charts: ChartsPluginStart;
}
