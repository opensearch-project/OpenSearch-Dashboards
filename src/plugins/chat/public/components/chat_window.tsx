/*
* Copyright OpenSearch Contributors
* SPDX-License-Identifier: Apache-2.0
*/
/* eslint-disable no-shadow */
/* eslint-disable no-console */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { CoreStart } from '../../../../core/public';
import { useChatContext } from '../contexts/chat_context';
import { ChatContextManager } from '../services/chat_context_manager';
import { useOpenSearchDashboards } from '../../../opensearch_dashboards_react/public';
import {
  ContextProviderStart,
  AssistantActionService,
} from '../../../context_provider/public';
import type { ToolDefinition } from '../../../context_provider/public';
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
import { useUserConfirmationAction } from '../actions/user_confirmation_action';

interface TimelineMessage {
  type: 'message';
  id: string;
  role: 'user' | 'assistant' | 'tool';
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

interface PendingToolCall {
  id: string;
  name: string;
  args: string;
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
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState('');
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [processedEventIds, setProcessedEventIds] = useState<Set<string>>(new Set());
  const [processedMessageEnds, setProcessedMessageEnds] = useState<Set<string>>(new Set());
  const [pendingToolCalls] = useState<Map<string, PendingToolCall>>(new Map());

  // Register actions
  useUserConfirmationAction();

  // Initialize context manager
  const contextManager = useMemo(() => {
    const manager = new ChatContextManager();
    manager.start(services.contextProvider);
    // Set context manager in chat service
    chatService.setContextManager(manager);
    return manager;
  }, [chatService, services.contextProvider]);

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

  // Helper function to convert timeline messages to ChatMessage format
  const timelineToMessages = useCallback((timelineItems: TimelineItem[]) => {
    return timelineItems
      .filter((item) => item.type === 'message')
      .map((item) => {
        const msg = item as TimelineMessage;
        const baseMessage = {
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
        };

        // Add toolCallId for tool messages if it exists
        if (msg.role === 'tool' && (msg as any).toolCallId) {
          return {
            ...baseMessage,
            toolCallId: (msg as any).toolCallId,
          };
        }

        return baseMessage;
      });
  }, []);

  // Extract common tool call handler to avoid duplication
  const handleToolCallEvent = useCallback(async (event: ChatEvent) => {
    switch (event.type) {
      case EventType.TOOL_CALL_START:
        if ('toolCallId' in event && 'toolCallName' in event) {
          service.updateToolCallState(event.toolCallId, {
            id: event.toolCallId,
            name: event.toolCallName,
            status: 'pending',
            timestamp: Date.now(),
          });

          pendingToolCalls.set(event.toolCallId, {
            id: event.toolCallId,
            name: event.toolCallName,
            args: '',
          });
        }
        break;

      case EventType.TOOL_CALL_ARGS:
        if ('toolCallId' in event && 'delta' in event) {
          const toolCall = pendingToolCalls.get(event.toolCallId);
          if (toolCall) {
            toolCall.args += event.delta;
          }
        }
        break;

      case EventType.TOOL_CALL_END:
        if ('toolCallId' in event) {
          const toolCall = pendingToolCalls.get(event.toolCallId);
          if (toolCall) {
            try {
              const args = JSON.parse(toolCall.args);

              service.updateToolCallState(toolCall.id, {
                status: 'executing',
                args,
              });

              const result = await service.executeAction(toolCall.name, args);

              service.updateToolCallState(toolCall.id, {
                status: 'complete',
                result,
              });

              // Send tool result back to assistant
              if ((chatService as any).sendToolResult) {
                const messages = timelineToMessages(timeline);
                const { observable, toolMessage } = await (chatService as any).sendToolResult(toolCall.id, result, messages);

                // Add tool message to timeline for conversation history
                if (toolMessage) {
                  const timelineToolMessage: TimelineMessage = {
                    type: 'message',
                    id: toolMessage.id,
                    role: 'user', // Use user role for AG-UI compatibility
                    content: toolMessage.content,
                    timestamp: toolMessage.timestamp,
                  };
                  // Add toolCallId to the timeline message for proper tracking
                  (timelineToolMessage as any).toolCallId = toolMessage.toolCallId;
                  setTimeline((prev) => [...prev, timelineToolMessage]);
                }

                // Set streaming state and subscribe to the response stream to handle assistant's response
                setIsStreaming(true);
                const subscription = observable.subscribe({
                  next: (event: ChatEvent) => {
                    switch (event.type) {
                      case EventType.TEXT_MESSAGE_CONTENT:
                        if ('delta' in event) {
                          setCurrentStreamingMessage((prev) => prev + (event.delta || ''));
                        }
                        break;
                      case EventType.TEXT_MESSAGE_END:
                        // Skip if we've already processed this message end event
                        const messageId = 'messageId' in event ? event.messageId : null;
                        if (messageId && processedMessageEnds.has(messageId)) {
                          break;
                        }
                        if (messageId) {
                          setProcessedMessageEnds(prev => new Set(prev).add(messageId));
                        }

                        setCurrentStreamingMessage((currentContent) => {
                          // Only add assistant message if there's actual content
                          if (currentContent.trim()) {
                            const assistantMessage: TimelineMessage = {
                              type: 'message',
                              id:
                                'messageId' in event && event.messageId
                                  ? event.messageId
                                  : `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                              role: 'assistant',
                              content: currentContent,
                              timestamp: event.timestamp || Date.now(),
                            };

                            setTimeline((prev) => [...prev, assistantMessage]);
                          }
                          return ''; // Clear the streaming message
                        });
                        setIsStreaming(false);
                        break;
                    }
                  },
                  error: (error: any) => {
                    console.error('Tool result response error:', error);
                    setIsStreaming(false);
                  },
                  complete: () => {
                    setIsStreaming(false);
                  },
                });
              }
            } catch (error: any) {
              service.updateToolCallState(toolCall.id, {
                status: 'failed',
                error,
              });

              // Send error back to assistant
              if ((chatService as any).sendToolResult) {
                const messages = timelineToMessages(timeline);
                const { observable, toolMessage } = await (chatService as any).sendToolResult(toolCall.id, {
                  error: error.message,
                }, messages);

                // Add tool message to timeline for conversation history
                if (toolMessage) {
                  const timelineToolMessage: TimelineMessage = {
                    type: 'message',
                    id: toolMessage.id,
                    role: 'user', // Use user role for AG-UI compatibility
                    content: toolMessage.content,
                    timestamp: toolMessage.timestamp,
                  };
                  // Add toolCallId to the timeline message for proper tracking
                  (timelineToolMessage as any).toolCallId = toolMessage.toolCallId;
                  setTimeline((prev) => [...prev, timelineToolMessage]);
                }

                // Set streaming state and subscribe to the response stream to handle assistant's response
                setIsStreaming(true);
                const subscription = observable.subscribe({
                  next: (event: ChatEvent) => {
                    switch (event.type) {
                      case EventType.TEXT_MESSAGE_CONTENT:
                        if ('delta' in event) {
                          setCurrentStreamingMessage((prev) => prev + (event.delta || ''));
                        }
                        break;
                      case EventType.TEXT_MESSAGE_END:
                        // Skip if we've already processed this message end event
                        const messageId2 = 'messageId' in event ? event.messageId : null;
                        if (messageId2 && processedMessageEnds.has(messageId2)) {
                          break;
                        }
                        if (messageId2) {
                          setProcessedMessageEnds(prev => new Set(prev).add(messageId2));
                        }

                        setCurrentStreamingMessage((currentContent) => {
                          // Only add assistant message if there's actual content
                          if (currentContent.trim()) {
                            const assistantMessage: TimelineMessage = {
                              type: 'message',
                              id:
                                'messageId' in event && event.messageId
                                  ? event.messageId
                                  : `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                              role: 'assistant',
                              content: currentContent,
                              timestamp: event.timestamp || Date.now(),
                            };

                            setTimeline((prev) => [...prev, assistantMessage]);
                          }
                          return ''; // Clear the streaming message
                        });
                        setIsStreaming(false);
                        break;
                    }
                  },
                  error: (error: any) => {
                    console.error('Tool error response error:', error);
                    setIsStreaming(false);
                  },
                  complete: () => {
                    setIsStreaming(false);
                  },
                });
              }
            }

            pendingToolCalls.delete(event.toolCallId);
          }
        }
        break;
    }
  }, [service, pendingToolCalls, chatService, timeline, timelineToMessages, processedMessageEnds]);

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

      // Subscribe to streaming response
      const subscription = observable.subscribe({
        next: (event: ChatEvent) => {
          // Event deduplication - create a unique event identifier
          const eventId = `${event.type}-${event.timestamp || Date.now()}-${JSON.stringify(
            event
          ).substring(0, 100)}`;
          if (processedEventIds.has(eventId)) {
            return; // Skip duplicate event
          }
          setProcessedEventIds((prev) => new Set(prev).add(eventId));

          // Update runId if we get it from the event
          if ('runId' in event && event.runId && event.runId !== currentRunId) {
            setCurrentRunId(event.runId);
          }

          // Handle tool call events
          handleToolCallEvent(event);

          switch (event.type) {
            case EventType.TEXT_MESSAGE_CONTENT:
              if ('delta' in event) {
                setCurrentStreamingMessage((prev) => prev + (event.delta || ''));
              }
              break;
            case EventType.TEXT_MESSAGE_END:
              // Skip if we've already processed this message end event
              const messageId = 'messageId' in event ? event.messageId : null;
              if (messageId && processedMessageEnds.has(messageId)) {
                break;
              }
              if (messageId) {
                setProcessedMessageEnds(prev => new Set(prev).add(messageId));
              }

              setCurrentStreamingMessage((currentContent) => {
                // Only add assistant message if there's actual content
                if (currentContent.trim()) {
                  const assistantMessage: TimelineMessage = {
                    type: 'message',
                    id:
                      'messageId' in event && event.messageId
                        ? event.messageId
                        : `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    role: 'assistant',
                    content: currentContent,
                    timestamp: event.timestamp || Date.now(),
                  };

                  setTimeline((prev) => [...prev, assistantMessage]);
                }
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
                setTimeline((prev) => {
                  // Check if tool call with this ID already exists
                  const existingIndex = prev.findIndex((item) => item.id === newToolCall.id);
                  if (existingIndex !== -1) {
                    // Update existing tool call instead of adding duplicate
                    const updated = [...prev];
                    updated[existingIndex] = newToolCall;
                    return updated;
                  }
                  // Add new tool call
                  return [...prev, newToolCall];
                });
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

  const handleResendMessage = async (message: TimelineMessage) => {
    if (isStreaming) return;

    // Find the index of this message in the timeline
    const messageIndex = timeline.findIndex(
      (item) => item.type === 'message' && item.id === message.id
    );

    if (messageIndex === -1) return;

    // Remove this message and everything after it from the timeline
    const truncatedTimeline = timeline.slice(0, messageIndex);
    setTimeline(truncatedTimeline);

    // Clear any streaming state and input
    setCurrentStreamingMessage('');
    setInput('');
    setIsStreaming(true);
    setProcessedEventIds(new Set()); // Reset processed events for new message

    try {
      const { observable, userMessage } = await chatService.sendMessage(
        message.content,
        truncatedTimeline.filter((item) => item.type === 'message') as any
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
        `📊 Chat Run [${timestamp}] - "${message.content.substring(0, 50)}${
          message.content.length > 50 ? '...' : ''
        }"`
      );

      // Subscribe to streaming response (same logic as handleSend)
      const subscription = observable.subscribe({
        next: (event: ChatEvent) => {
          // Event deduplication - create a unique event identifier
          const eventId = `${event.type}-${event.timestamp || Date.now()}-${JSON.stringify(
            event
          ).substring(0, 100)}`;
          if (processedEventIds.has(eventId)) {
            return; // Skip duplicate event
          }
          setProcessedEventIds((prev) => new Set(prev).add(eventId));

          // Update runId if we get it from the event
          if ('runId' in event && event.runId && event.runId !== currentRunId) {
            setCurrentRunId(event.runId);
          }

          // Handle tool call events
          handleToolCallEvent(event);

          switch (event.type) {
            case EventType.TEXT_MESSAGE_CONTENT:
              if ('delta' in event) {
                setCurrentStreamingMessage((prev) => prev + (event.delta || ''));
              }
              break;
            case EventType.TEXT_MESSAGE_END:
              // Skip if we've already processed this message end event
              const messageId = 'messageId' in event ? event.messageId : null;
              if (messageId && processedMessageEnds.has(messageId)) {
                break;
              }
              if (messageId) {
                setProcessedMessageEnds(prev => new Set(prev).add(messageId));
              }

              setCurrentStreamingMessage((currentContent) => {
                // Only add assistant message if there's actual content
                if (currentContent.trim()) {
                  const assistantMessage: TimelineMessage = {
                    type: 'message',
                    id:
                      'messageId' in event && event.messageId
                        ? event.messageId
                        : `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    role: 'assistant',
                    content: currentContent,
                    timestamp: event.timestamp || Date.now(),
                  };

                  setTimeline((prev) => [...prev, assistantMessage]);
                }
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
                setTimeline((prev) => {
                  // Check if tool call with this ID already exists
                  const existingIndex = prev.findIndex((item) => item.id === newToolCall.id);
                  if (existingIndex !== -1) {
                    // Update existing tool call instead of adding duplicate
                    const updated = [...prev];
                    updated[existingIndex] = newToolCall;
                    return updated;
                  }
                  // Add new tool call
                  return [...prev, newToolCall];
                });
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

      <ChatMessages
        layoutMode={layoutMode}
        timeline={timeline}
        currentStreamingMessage={currentStreamingMessage}
        isStreaming={isStreaming}
        contextManager={contextManager}
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