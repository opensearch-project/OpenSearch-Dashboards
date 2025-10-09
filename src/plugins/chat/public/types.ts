/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { NavigationPublicPluginStart } from '../../navigation/public';
import { ContextProviderStart } from '../../context_provider/public';
import { ChartsPluginStart } from '../../charts/public';
import { ExpressionsStart, ExpressionsSetup } from '../../expressions/public';
import { DashboardStart } from '../../dashboard/public';
import { EmbeddableStart, EmbeddableSetup } from '../../embeddable/public';
import { UiActionsStart, UiActionsSetup } from '../../ui_actions/public';
import { ChatService } from './services/chat_service';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ChatPluginSetup {
  // This interface is intentionally empty for now
}

export interface ChatPluginSetupDependencies {
  expressions: ExpressionsSetup;
  embeddable?: EmbeddableSetup;
  uiActions?: UiActionsSetup;
}

export interface ChatPluginStart {
  chatService: ChatService | undefined;
}

export interface AppPluginStartDependencies {
  navigation: NavigationPublicPluginStart;
  contextProvider: ContextProviderStart;
  charts: ChartsPluginStart;
  expressions: ExpressionsStart;
  dashboard: DashboardStart;
  embeddable: EmbeddableStart;
  uiActions: UiActionsStart;
}
