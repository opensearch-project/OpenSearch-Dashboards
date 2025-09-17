/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
/* eslint-disable no-console */

import React, { useState, useEffect, useMemo } from 'react';
import { CoreStart } from '../../../../core/public';
import { useChatContext } from '../contexts/chat_context';
import { ChatContextManager } from '../services/chat_context_manager';
import { useOpenSearchDashboards } from '../../../opensearch_dashboards_react/public';
import { ContextProviderStart } from '../../../context_provider/public';
import {
  EventType,
  // eslint-disable-next-line prettier/prettier
  type Event as ChatEvent,
} from '../../common/events';
import { ChatLayoutMode } from './chat_header_button';
import { ChatContainer } from './chat_container';
import { ChatHeader } from './chat_header';
import { ChatMessages } from './chat_messages';
import { ChatInput } from './chat_input';

interface TimelineMessage {
  type: 'message';
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface TimelineToolCall {
  type: 'tool_call';
  id: string;
  toolName: string;
  status: 'running' | 'completed' | 'error';
  result?: string;
  timestamp: number;
}

interface TimelineError {
  type: 'error';
  id: string;
  message: string;
  code?: string;
  timestamp: number;
}

type TimelineItem = TimelineMessage | TimelineToolCall | TimelineError;

interface ChatWindowProps {
  layoutMode?: ChatLayoutMode;
  onToggleLayout?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  layoutMode = ChatLayoutMode.SIDECAR,
  onToggleLayout,
}) => {
  const { chatService } = useChatContext();
  const { services } = useOpenSearchDashboards<{
    core: CoreStart;
    contextProvider?: ContextProviderStart;
  }>();
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState('');
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [processedEventIds, setProcessedEventIds] = useState<Set<string>>(new Set());

  // Initialize context manager
  const contextManager = useMemo(() => {
    const manager = new ChatContextManager();
    manager.start(services.contextProvider);
    // Set context manager in chat service
    chatService.setContextManager(manager);
    return manager;
  }, [chatService, services.contextProvider]);


  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const messageContent = input.trim();
    setInput('');
    setIsStreaming(true);
    setCurrentStreamingMessage('');
    setProcessedEventIds(new Set()); // Reset processed events for new message

    try {
      const { observable, userMessage } = await chatService.sendMessage(
        messageContent,
        timeline.filter((item) => item.type === 'message') as any
      );

      // Add user message immediately to timeline
      const timelineUserMessage: TimelineMessage = {
        type: 'message',
        id: userMessage.id,
        role: userMessage.role,
        content: userMessage.content,
        timestamp: userMessage.timestamp,
      };
      setTimeline((prev) => [...prev, timelineUserMessage]);

      // Start a new run group - we'll get the actual runId from the first event
      const timestamp = new Date().toLocaleTimeString();
      console.groupCollapsed(
        `📊 Chat Run [${timestamp}] - "${messageContent.substring(0, 50)}${
          messageContent.length > 50 ? '...' : ''
        }"`
      );
      console.log('📤 User message:', messageContent);

      // Subscribe to streaming response
      const subscription = observable.subscribe({
        next: (event: ChatEvent) => {
          // Log every event with timestamp and full data
          const eventTime = new Date().toLocaleTimeString();
          console.log(`🔄 [${eventTime}] ${event.type}:`, event);

          // Event deduplication - create a unique event identifier
          const eventId = `${event.type}-${event.timestamp || Date.now()}-${JSON.stringify(event).substring(0, 100)}`;
          if (processedEventIds.has(eventId)) {
            console.log(`🔄 [${eventTime}] Skipping duplicate event:`, event.type);
            return; // Skip duplicate event
          }
          setProcessedEventIds(prev => new Set(prev).add(eventId));

          // Update runId if we get it from the event
          if ('runId' in event && event.runId && event.runId !== currentRunId) {
            setCurrentRunId(event.runId);
          }

          switch (event.type) {
            case EventType.TEXT_MESSAGE_CONTENT:
              if ('delta' in event) {
                setCurrentStreamingMessage((prev) => prev + (event.delta || ''));
              }
              break;
            case EventType.TEXT_MESSAGE_END:
              setCurrentStreamingMessage((currentContent) => {
                const assistantMessage: TimelineMessage = {
                  type: 'message',
                  id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  role: 'assistant',
                  content: currentContent,
                  timestamp: event.timestamp || Date.now(),
                };

                // Add deduplication check before adding to timeline
                setTimeline((prev) => {
                  // Check if message with same content already exists recently (within 1 second)
                  const isDuplicate = prev.some(
                    item => item.type === 'message' &&
                    item.role === 'assistant' &&
                    item.content === currentContent &&
                    Math.abs(item.timestamp - (event.timestamp || Date.now())) < 1000
                  );
                  return isDuplicate ? prev : [...prev, assistantMessage];
                });
                return ''; // Clear the streaming message
              });
              setIsStreaming(false);
              break;
            case EventType.TOOL_CALL_START:
              if ('toolCallId' in event && 'toolCallName' in event) {
                const newToolCall: TimelineToolCall = {
                  type: 'tool_call',
                  id: event.toolCallId,
                  toolName: event.toolCallName,
                  status: 'running',
                  timestamp: event.timestamp || Date.now(),
                };
                setTimeline((prev) => [...prev, newToolCall]);
              }
              break;
            case EventType.TOOL_CALL_END:
              if ('toolCallId' in event) {
                setTimeline((prev) =>
                  prev.map((item) =>
                    item.type === 'tool_call' && item.id === event.toolCallId
                      ? {
                          ...item,
                          status: 'completed' as const,
                          timestamp: event.timestamp || item.timestamp,
                        }
                      : item
                  )
                );
              }
              break;
            case EventType.TOOL_CALL_RESULT:
              if ('toolCallId' in event && 'content' in event) {
                setTimeline((prev) =>
                  prev.map((item) => {
                    if (item.type === 'tool_call' && item.id === event.toolCallId) {
                      let resultContent = event.content;
                      // Try to parse the content if it's JSON stringified
                      try {
                        const parsed = JSON.parse(event.content);
                        if (parsed.content && Array.isArray(parsed.content)) {
                          // Extract text from content array
                          resultContent = parsed.content
                            .filter((contentItem: any) => contentItem.type === 'text')
                            .map((contentItem: any) => contentItem.text)
                            .join('\n');
                        }
                      } catch {
                        // If parsing fails, use the raw content
                        resultContent = event.content;
                      }
                      return {
                        ...item,
                        status: 'completed' as const,
                        result: resultContent,
                        timestamp: event.timestamp || item.timestamp,
                      };
                    }
                    return item;
                  })
                );
              }
              break;
            case EventType.RUN_ERROR:
              if ('message' in event) {
                const errorItem: TimelineError = {
                  type: 'error',
                  id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  message: event.message,
                  code: 'code' in event ? event.code : undefined,
                  timestamp: event.timestamp || Date.now(),
                };
                setTimeline((prev) => [...prev, errorItem]);
              }
              setIsStreaming(false);
              setCurrentStreamingMessage('');
              break;
          }
        },
        error: (error: any) => {
          const errorTime = new Date().toLocaleTimeString();
          console.error(`🚨 [${errorTime}] Subscription error:`, error);
          console.groupEnd(); // Close the run group
          setIsStreaming(false);
          setCurrentStreamingMessage('');
        },
        complete: () => {
          const completeTime = new Date().toLocaleTimeString();
          console.log(`🏁 [${completeTime}] Stream complete`);
          console.groupEnd(); // Close the run group
          setIsStreaming(false);
        },
      });

      return () => subscription.unsubscribe();
    } catch (error) {
      const errorTime = new Date().toLocaleTimeString();
      console.error(`❌ [${errorTime}] Failed to send message:`, error);
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

  const handleNewChat = () => {
    chatService.newThread();
    setTimeline([]);
    setCurrentStreamingMessage('');
    setCurrentRunId(null);
    setIsStreaming(false);
    setProcessedEventIds(new Set()); // Reset processed events for new chat
    // Refresh context for new chat
    contextManager.refreshContext();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      contextManager.stop();
    };
  }, [contextManager]);

  return (
    <ChatContainer layoutMode={layoutMode}>
      <ChatHeader
        layoutMode={layoutMode}
        isStreaming={isStreaming}
        onToggleLayout={onToggleLayout}
        onNewChat={handleNewChat}
      />

      <ChatMessages
        layoutMode={layoutMode}
        timeline={timeline}
        currentStreamingMessage={currentStreamingMessage}
        contextManager={contextManager}
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
};
