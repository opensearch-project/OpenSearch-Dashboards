/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { LogActionDefinition } from '../types/log_actions';
import { AskAIActionItem } from '../components/ask_ai_action_item';
import { ChatServiceStart } from '../../../../core/public';

/**
 * Creates the Ask AI action that uses the AskAIActionItem component
 */
export function createAskAiAction(chatService: ChatServiceStart): LogActionDefinition {
  return {
    id: 'ask_ai',
    displayName: 'Ask AI',
    iconType: 'generate',
    order: 1,

    isCompatible: () => {
      return chatService.isAvailable();
    },

    component: (props) => {
      // chatService is always defined since we're using core service
      return AskAIActionItem({ ...props, chatService });
    },
  };
}
