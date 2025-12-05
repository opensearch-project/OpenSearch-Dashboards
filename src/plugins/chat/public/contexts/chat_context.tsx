/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { ChatService } from '../services/chat_service';
import { SuggestedActionsService } from '../services/suggested_action';

interface ChatContextType {
  chatService: ChatService;
  suggestedActionsService: SuggestedActionsService;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
  chatService: ChatService;
  suggestedActionsService: SuggestedActionsService;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({
  children,
  chatService,
  suggestedActionsService,
}) => {
  return (
    <ChatContext.Provider value={{ chatService, suggestedActionsService }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};
