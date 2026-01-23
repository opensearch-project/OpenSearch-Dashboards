/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { ChatService } from '../services/chat_service';
import { SuggestedActionsService } from '../services/suggested_action';
import { ConfirmationService } from '../services/confirmation_service';

interface ChatContextType {
  chatService: ChatService;
  suggestedActionsService: SuggestedActionsService;
  confirmationService: ConfirmationService;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
  chatService: ChatService;
  suggestedActionsService: SuggestedActionsService;
  confirmationService: ConfirmationService;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({
  children,
  chatService,
  suggestedActionsService,
  confirmationService,
}) => {
  return (
    <ChatContext.Provider value={{ chatService, suggestedActionsService, confirmationService }}>
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
