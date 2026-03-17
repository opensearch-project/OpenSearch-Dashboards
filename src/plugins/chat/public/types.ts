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
import { StarterSuggestionItem } from './services/starter_suggestions_registry';

export type { StarterSuggestionItem };

export interface ChatPluginSetup {
  suggestedActionsService: SuggestedActionsServiceSetupContract;
  commandRegistry: CommandRegistrySetup;
  registerStarterSuggestions: (appId: string, suggestions: StarterSuggestionItem[]) => void;
}

export interface ChatPluginStart {
  chatService: ChatService | undefined;
}

export interface AppPluginStartDependencies {
  navigation: NavigationPublicPluginStart;
  contextProvider: ContextProviderStart;
  charts: ChartsPluginStart;
}
