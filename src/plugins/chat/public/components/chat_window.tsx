/*
* Copyright OpenSearch Contributors
* SPDX-License-Identifier: Apache-2.0
*/

/* eslint-disable no-console */

import React, { useState, useEffect, useMemo, useImperativeHandle, useCallback, useRef } from 'react';
import { CoreStart } from '../../../../core/public';
import { useChatContext } from '../contexts/chat_context';
import { ChatEventHandler } from '../services/chat_event_handler';
import { useOpenSearchDashboards } from '../../../opensearch_dashboards_react/public';
import {
  ContextProviderStart,
  AssistantActionService,
} from '../../../context_provider/public';
import {
  // eslint-disable-next-line prettier/prettier
  type Event as ChatEvent,
} from '../../common/events';
import type {
  Message,
  UserMessage,
} from '../../common/types';
import { ChatLayoutMode } from './chat_header_button';
import { ChatContainer } from './chat_container';
import { ChatHeader } from './chat_header';
import { ChatMessages } from './chat_messages';
import { ChatInput } from './chat_input';

export interface ChatWindowInstance{
  startNewChat: ()=>void;
  sendMessage: (options:{content: string; messages?: Message[]})=>Promise<unknown>;
}

interface ChatWindowProps {
  layoutMode?: ChatLayoutMode;
  onToggleLayout?: () => void;
  onClose: ()=>void;
}

/**
 * ChatWindow with AssistantAction support
 */
export const ChatWindow = React.forwardRef<ChatWindowInstance, ChatWindowProps>((props, ref) => {
  return <ChatWindowContent ref={ref} {...props} />;
});

const ChatWindowContent = React.forwardRef<ChatWindowInstance, ChatWindowProps>(({
  layoutMode = ChatLayoutMode.SIDECAR,
  onToggleLayout,
  onClose,
}, ref) => {

  const service = AssistantActionService.getInstance();
  const { chatService } = useChatContext();
  const { services } = useOpenSearchDashboards<{
    core: CoreStart;
    contextProvider?: ContextProviderStart;
  }>();
  const [timeline, setTimeline] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const handleSendRef = useRef<typeof handleSend>();

  const timelineRef = React.useRef<Message[]>(timeline);

  React.useEffect(() => {
    timelineRef.current = timeline;
  }, [timeline]);

  // Create the event handler using useMemo
  const eventHandler = useMemo(
    () =>
      new ChatEventHandler(
        service,
        chatService,
        setTimeline,
        setIsStreaming,
        () => timelineRef.current
      ),
    [service, chatService]
  );

  // Subscribe to tool updates from the service
  useEffect(() => {
    const subscription = service.getState$().subscribe((state) => {
      if (chatService && state.toolDefinitions.length > 0) {
        // Store tools for when we send messages
        (chatService as any).availableTools = state.toolDefinitions;
      }
    });

    return () => subscription.unsubscribe();
  }, [service, chatService]);

  // Clean up event handler on component unmount
  useEffect(() => {
    return () => {
      eventHandler.clearState();
    };
  }, [eventHandler]);

  // Restore timeline from current chat state on component mount
  useEffect(() => {
    const currentMessages = chatService.getCurrentMessages();
    if (currentMessages.length > 0) {
      setTimeline(currentMessages);
    }
  }, [chatService]);

  // Sync timeline changes with ChatService for persistence
  useEffect(() => {
    chatService.updateCurrentMessages(timeline);
  }, [timeline, chatService]);

  const handleSend = async (options?: {input?: string; messages?: Message[]}) => {
    const messageContent = options?.input ?? input.trim();
    if (!messageContent || isStreaming) return;

    setInput('');
    setIsStreaming(true);

    try {
      // Prepare additional messages for sending (but don't add to timeline yet)
      const additionalMessages = options?.messages ?? [];

      // Merge additional messages with current timeline for sending
      const messagesToSend = [...timeline, ...additionalMessages];

      const { observable, userMessage } = await chatService.sendMessage(
        messageContent,
        messagesToSend
      );

      // Add the final merged user message to timeline
      // (chat_service already merged any additional messages with the text)
      const timelineUserMessage: UserMessage = {
        id: userMessage.id,
        role: 'user',
        content: userMessage.content,
      };
      setTimeline((prev) => [...prev, timelineUserMessage]);

      // Subscribe to streaming response
      const subscription = observable.subscribe({
        next: async (event: ChatEvent) => {
          // Update runId if we get it from the event
          if ('runId' in event && event.runId && event.runId !== currentRunId) {
            setCurrentRunId(event.runId);
          }

          // Handle all events through the event handler service
          await eventHandler.handleEvent(event);
        },
        error: (error: any) => {
          console.error('Subscription error:', error);
          setIsStreaming(false);
        },
        complete: () => {
          setIsStreaming(false);
        },
      });

      return () => subscription.unsubscribe();
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsStreaming(false);
    }
  };

  handleSendRef.current = handleSend;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleResendMessage = async (message: Message) => {
    if (isStreaming) return;

    // Only user messages can be resent
    if (message.role !== 'user') return;

    // Find the index of this message in the timeline
    const messageIndex = timeline.findIndex(
      (item) => item.id === message.id
    );

    if (messageIndex === -1) return;

    let textContent = typeof message.content === "string" ? message.content : "";
    const additionalMessages: Message[] = [];

    if (Array.isArray(message.content)) {
      const lastMessageContent =  message.content[message.content.length - 1];
      if (lastMessageContent.type === "text") {
        textContent = lastMessageContent.text;
        additionalMessages.push({
          ...message,
          content: message.content.slice(0, message.content.length - 1),
        });
      }
    }

    if (textContent === "") {
        return;
    }

    // Remove this message and everything after it from the timeline
    const truncatedTimeline = timeline.slice(0, messageIndex);
    setTimeline(truncatedTimeline);

    // Clear any streaming state and input
    setInput('');
    setIsStreaming(true);

    try {
      const { observable, userMessage } = await chatService.sendMessage(
        textContent,
        [...truncatedTimeline,...additionalMessages]
      );

      // Add user message immediately to timeline
      const timelineUserMessage: UserMessage = {
        id: userMessage.id,
        role: 'user',
        content: userMessage.content,
      };
      setTimeline((prev) => [...prev, timelineUserMessage]);

      // Subscribe to streaming response
      const subscription = observable.subscribe({
        next: async (event: ChatEvent) => {
          // Update runId if we get it from the event
          if ('runId' in event && event.runId && event.runId !== currentRunId) {
            setCurrentRunId(event.runId);
          }

          // Handle all events through the event handler service
          await eventHandler.handleEvent(event);
        },
        error: (error: any) => {
          console.error('Subscription error:', error);
          setIsStreaming(false);
        },
        complete: () => {
          setIsStreaming(false);
        },
      });

      return () => subscription.unsubscribe();
    } catch (error) {
      console.error('Failed to resend message:', error);
      setIsStreaming(false);
    }
  };

  const handleNewChat = useCallback(() => {
    chatService.newThread();
    setTimeline([]);
    setCurrentRunId(null);
    setIsStreaming(false);
  }, [chatService]);

  const currentState = service.getCurrentState();
  const enhancedProps = {
    toolCallStates: currentState.toolCallStates,
    getActionRenderer: service.getActionRenderer,
  };

  useImperativeHandle(ref, ()=>({
    startNewChat: ()=>handleNewChat(),
    sendMessage: async ({content, messages})=>(await handleSendRef.current?.({input:content, messages}))
  }), [handleNewChat]);

  return (
    <ChatContainer layoutMode={layoutMode}>
      <ChatHeader
        layoutMode={layoutMode}
        isStreaming={isStreaming}
        onToggleLayout={onToggleLayout}
        onNewChat={handleNewChat}
        onClose={onClose}
      />

      <ChatMessages
        layoutMode={layoutMode}
        timeline={timeline}
        isStreaming={isStreaming}
        onResendMessage={handleResendMessage}
        {...enhancedProps}
      />

      <ChatInput
        layoutMode={layoutMode}
        input={input}
        isStreaming={isStreaming}
        onInputChange={setInput}
        onSend={handleSend}
        onKeyDown={handleKeyDown}
      />
    </ChatContainer>
  );
});
