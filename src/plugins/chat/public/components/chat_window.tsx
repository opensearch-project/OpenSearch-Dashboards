/*
* Copyright OpenSearch Contributors
* SPDX-License-Identifier: Apache-2.0
*/

/* eslint-disable no-console */

import React, { useState, useEffect, useMemo } from 'react';
import { CoreStart } from '../../../../core/public';
import { useChatContext } from '../contexts/chat_context';
import { ChatEventHandler } from '../services/chat_event_handler';
import { useOpenSearchDashboards } from '../../../opensearch_dashboards_react/public';
import {
  ContextProviderStart,
  AssistantActionService,
} from '../../../context_provider/public';
import type { ToolDefinition } from '../../../context_provider/public';
import {
  // eslint-disable-next-line prettier/prettier
  type Event as ChatEvent,
} from '../../common/events';
import type {
  Message,
  AssistantMessage,
  UserMessage,
  ToolMessage,
} from '../../common/types';
import { ChatLayoutMode } from './chat_header_button';
import { ChatContainer } from './chat_container';
import { ChatHeader } from './chat_header';
import { ChatMessages } from './chat_messages';
import { ChatInput } from './chat_input';
import { ContextTreeView } from './context_tree_view';
import { useGraphTimeseriesDataAction } from '../actions/graph_timeseries_data_action';

interface ChatWindowProps {
  layoutMode?: ChatLayoutMode;
  onToggleLayout?: () => void;
}

/**
 * ChatWindow with AssistantAction support
 */
export const ChatWindow: React.FC<ChatWindowProps> = (props) => {
  return <ChatWindowContent {...props} />;
};

function ChatWindowContent({
  layoutMode = ChatLayoutMode.SIDECAR,
  onToggleLayout,
}: ChatWindowProps) {
  const service = AssistantActionService.getInstance();
  const [availableTools, setAvailableTools] = useState<ToolDefinition[]>([]);
  const { chatService } = useChatContext();
  const { services } = useOpenSearchDashboards<{
    core: CoreStart;
    contextProvider?: ContextProviderStart;
  }>();
  const [timeline, setTimeline] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState('');
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);

  // Create the event handler using useMemo
  const eventHandler = useMemo(
    () =>
      new ChatEventHandler(
        service,
        chatService,
        setTimeline,
        setCurrentStreamingMessage,
        setIsStreaming,
        () => timeline
      ),
    [service, chatService, timeline] // Only recreate if services change
  );

  // Register actions
  // useGraphTimeseriesDataAction(); // TODO: Fix the data type. lets kep the type limited to one of object, boolean, number or string and their arrays for now.

  // Context is now handled by RFC hooks - no need for context manager
  // The chat service will get context directly from assistantContextStore

  // Subscribe to tool updates from the service
  useEffect(() => {
    const subscription = service.getState$().subscribe((state) => {
      setAvailableTools(state.toolDefinitions);
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

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const messageContent = input.trim();
    setInput('');
    setIsStreaming(true);
    setCurrentStreamingMessage('');

    try {
      const { observable, userMessage } = await chatService.sendMessage(
        messageContent,
        timeline
      );

      // Add user message immediately to timeline
      const timelineUserMessage: UserMessage = {
        id: userMessage.id,
        role: 'user',
        content: userMessage.content,
      };
      setTimeline((prev) => [...prev, timelineUserMessage]);

      // Start a new run group - we'll get the actual runId from the first event
      const timestamp = new Date().toLocaleTimeString();
      console.groupCollapsed(
        `📊 Chat Run [${timestamp}] - "${messageContent.substring(0, 50)}${
          messageContent.length > 50 ? '...' : ''
        }"`
      );

      // Subscribe to streaming response - now much cleaner!
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
          console.groupEnd(); // Close the run group
          setIsStreaming(false);
          setCurrentStreamingMessage('');
        },
        complete: () => {
          console.groupEnd(); // Close the run group
          setIsStreaming(false);
        },
      });

      return () => subscription.unsubscribe();
    } catch (error) {
      console.error('Failed to send message:', error);
      console.groupEnd(); // Close the run group
      setIsStreaming(false);
    }
  };

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

    // Remove this message and everything after it from the timeline
    const truncatedTimeline = timeline.slice(0, messageIndex);
    setTimeline(truncatedTimeline);

    // Clear any streaming state and input
    setCurrentStreamingMessage('');
    setInput('');
    setIsStreaming(true);

    try {
      const { observable, userMessage } = await chatService.sendMessage(
        message.content,
        truncatedTimeline
      );

      // Add user message immediately to timeline
      const timelineUserMessage: UserMessage = {
        id: userMessage.id,
        role: 'user',
        content: userMessage.content,
      };
      setTimeline((prev) => [...prev, timelineUserMessage]);

      // Start a new run group - we'll get the actual runId from the first event
      const timestamp = new Date().toLocaleTimeString();
      console.groupCollapsed(
        `📊 Chat Run [${timestamp}] - "${message.content.substring(0, 50)}${
          message.content.length > 50 ? '...' : ''
        }"`
      );

      // Subscribe to streaming response - now using the event handler!
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
          console.groupEnd(); // Close the run group
          setIsStreaming(false);
          setCurrentStreamingMessage('');
        },
        complete: () => {
          console.groupEnd(); // Close the run group
          setIsStreaming(false);
        },
      });

      return () => subscription.unsubscribe();
    } catch (error) {
      console.error('Failed to resend message:', error);
      console.groupEnd(); // Close the run group
      setIsStreaming(false);
    }
  };

  const handleNewChat = () => {
    chatService.newThread();
    setTimeline([]);
    setCurrentStreamingMessage('');
    setCurrentRunId(null);
    setIsStreaming(false);
  };

  // No cleanup needed - RFC hooks handle their own lifecycle

  // Pass enhanced props to child components
  const currentState = service.getCurrentState();
  const enhancedProps = {
    toolCallStates: currentState.toolCallStates,
    getActionRenderer: service.getActionRenderer,
  };

  return (
    <ChatContainer layoutMode={layoutMode}>
      <ChatHeader
        layoutMode={layoutMode}
        isStreaming={isStreaming}
        onToggleLayout={onToggleLayout}
        onNewChat={handleNewChat}
      />

      {/* Context Tree View at the top - Shows both static and dynamic context */}
      <ContextTreeView staticCategory="static" dynamicCategory="dynamic" />

      <ChatMessages
        layoutMode={layoutMode}
        timeline={timeline}
        currentStreamingMessage={currentStreamingMessage}
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
}