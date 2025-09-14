/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { NavigationPublicPluginStart } from '../../navigation/public';
import { ChatService } from './services/chat_service';

export interface ChatPluginSetup {
  getGreeting: () => string;
}

export interface ChatPluginStart {
  chatService: ChatService;
}

export interface AppPluginStartDependencies {
  navigation: NavigationPublicPluginStart;
}
