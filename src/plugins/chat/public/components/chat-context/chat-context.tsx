/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { createContext, ReactNode, useContext, useMemo } from 'react';
import { i18n } from '@osd/i18n';

export interface ChatLabels {
  initial?: string | string[];
  title?: string;
  placeholder?: string;
  error?: string;
  stopGenerating?: string;
  regenerateResponse?: string;
  copyToClipboard?: string;
  thumbsUp?: string;
  thumbsDown?: string;
  copied?: string;
}

interface ChatContext {
  open: boolean;
  setOpen: (open: boolean) => void;
  labels: ChatLabels;
}

export const ChatContext = createContext<ChatContext | undefined>(undefined);

export const useChatContext = (): ChatContext => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error(
      'Context not found. Did you forget to wrap your app in a <ChatContextProvider> component?'
    );
  }
  return context;
};

interface ChatContextProps {
  children?: ReactNode;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const labels: ChatLabels = {
  initial: '',
  title: i18n.translate('chat.labels.title', {
    defaultMessage: 'AI Chat',
  }),
  placeholder: i18n.translate('chat.labels.placeholder', {
    defaultMessage: 'Type a message...',
  }),
  error: i18n.translate('chat.labels.error', {
    defaultMessage: 'An error occurred. Please try again.',
  }),
  stopGenerating: i18n.translate('chat.labels.stopGenerating', {
    defaultMessage: 'Stop generating',
  }),
  regenerateResponse: i18n.translate('chat.labels.regenerateResponse', {
    defaultMessage: 'Regenerate response',
  }),
  copyToClipboard: i18n.translate('chat.labels.copyToClipboard', {
    defaultMessage: 'Copy to clipboard',
  }),
  thumbsUp: i18n.translate('chat.labels.thumbsUp', {
    defaultMessage: 'Thumbs up',
  }),
  thumbsDown: i18n.translate('chat.labels.thumbsDown', {
    defaultMessage: 'Thumbs down',
  }),
  copied: i18n.translate('chat.labels.copied', {
    defaultMessage: 'Copied',
  }),
};

export const ChatContextProvider = ({ children, open, setOpen }: ChatContextProps) => {
  const context = useMemo(() => ({ labels, open, setOpen }), [open, setOpen]);

  return <ChatContext.Provider value={context}>{children}</ChatContext.Provider>;
};
