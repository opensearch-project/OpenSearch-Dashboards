/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { LogActionDefinition } from '../types/log_actions';
import { AskAIActionItem } from '../components/ask_ai_action_item';
import { ChatService } from '../../../chat/public';

/**
 * Creates the Ask AI action that uses the AskAIActionItem component
 */
export function createAskAiAction(chatService: ChatService | undefined): LogActionDefinition {
  return {
    id: 'ask_ai',
    displayName: 'Ask AI',
    iconType: 'generate',
    order: 1,

    isCompatible: () => {
      // Only show if chat service is available (chat plugin is enabled)
      return !!chatService;
    },

    component: (props) => {
      // chatService is guaranteed to be defined here because isCompatible checks it
      return AskAIActionItem({ ...props, chatService: chatService! });
    },
  };
}
