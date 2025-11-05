/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { ChatService } from '../services/chat_service';

interface ChatContextType {
  chatService: ChatService;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
  chatService: ChatService;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children, chatService }) => {
  return <ChatContext.Provider value={{ chatService }}>{children}</ChatContext.Provider>;
};

export const useChatContext = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};
