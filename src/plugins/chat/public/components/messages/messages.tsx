/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ComponentType, ReactNode, useEffect, useMemo, useRef } from 'react';
import { ComponentsMap, Message } from '../../../common/types';
import { AssistantMessageProps } from './assistant-message';
import { UserMessageProps } from './user-message';
import { ImageRendererProps } from './image-renderer';
import { RenderMessageProps } from './render-message';
import { useChatContext } from '../chat-context';
import { useAIChat } from '../../hooks';

export interface MessagesProps {
  messages: Message[];
  inProgress: boolean;
  children?: ReactNode;
  AssistantMessage: ComponentType<AssistantMessageProps>;
  UserMessage: ComponentType<UserMessageProps>;
  RenderMessage: ComponentType<RenderMessageProps>;
  ImageRenderer: ComponentType<ImageRendererProps>;
  /**
   * Callback function to regenerate the assistant's response
   */
  onRegenerate?: (messageId: string) => void;

  /**
   * Callback function when the message is copied
   */
  onCopy?: (message: string) => void;

  /**
   * Callback function for thumbs up feedback
   */
  onThumbsUp?: (message: Message) => void;

  /**
   * Callback function for thumbs down feedback
   */
  onThumbsDown?: (message: Message) => void;

  /**
   * A list of markdown components to render in assistant message.
   * Useful when you want to render custom elements in the message (e.g a reference tag element)
   */
  markdownTagRenderers?: ComponentsMap;
}

export const Messages = ({
  inProgress,
  children,
  RenderMessage,
  AssistantMessage,
  UserMessage,
  ImageRenderer,
  onRegenerate,
  onCopy,
  onThumbsUp,
  onThumbsDown,
  markdownTagRenderers,
}: MessagesProps) => {
  const { labels } = useChatContext();
  const { messages: visibleMessages, interrupt } = useAIChat();

  const initialMessages = useMemo(() => makeInitialMessages(labels.initial), [labels.initial]);
  const messages = [...initialMessages, ...visibleMessages];
  const { messagesContainerRef, messagesEndRef } = useScrollToBottom(messages);

  return (
    <div className="chatMessages" ref={messagesContainerRef}>
      <div className="chatMessages__container">
        {messages.map((message, index) => {
          const isCurrentMessage = index === messages.length - 1;
          return (
            <RenderMessage
              key={index}
              message={message}
              inProgress={inProgress}
              index={index}
              isCurrentMessage={isCurrentMessage}
              AssistantMessage={AssistantMessage}
              UserMessage={UserMessage}
              ImageRenderer={ImageRenderer}
              onRegenerate={onRegenerate}
              onCopy={onCopy}
              onThumbsUp={onThumbsUp}
              onThumbsDown={onThumbsDown}
              markdownTagRenderers={markdownTagRenderers}
            />
          );
        })}
        {interrupt}
      </div>
      <footer className="chatMessages__footer" ref={messagesEndRef}>
        {children}
      </footer>
    </div>
  );
};

export const makeInitialMessages = (initial: string | string[] | undefined): Message[] => {
  if (!initial) return [];

  if (Array.isArray(initial)) {
    return initial.map((message) => {
      return {
        id: message,
        role: 'assistant',
        content: message,
      };
    });
  }

  return [
    {
      id: initial,
      role: 'assistant',
      content: initial,
    },
  ];
};

export function useScrollToBottom(messages: Message[]) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const isProgrammaticScrollRef = useRef(false);
  const isUserScrollUpRef = useRef(false);

  const scrollToBottom = () => {
    if (messagesContainerRef.current && messagesEndRef.current) {
      isProgrammaticScrollRef.current = true;
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  const handleScroll = () => {
    if (isProgrammaticScrollRef.current) {
      isProgrammaticScrollRef.current = false;
      return;
    }

    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      isUserScrollUpRef.current = scrollTop + clientHeight < scrollHeight;
    }
  };

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) {
      return;
    }

    const mutationObserver = new MutationObserver(() => {
      if (!isUserScrollUpRef.current) {
        scrollToBottom();
      }
    });

    mutationObserver.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      mutationObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    isUserScrollUpRef.current = false;
    scrollToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.filter((m) => m.role === 'user').length]);

  return { messagesEndRef, messagesContainerRef };
}
