/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
/* eslint-disable no-console */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { EuiPanel, EuiFieldText, EuiText, EuiIcon, EuiButtonIcon } from '@elastic/eui';
import { CoreStart } from '../../../../core/public';
import { useChatContext } from '../contexts/chat_context';
import { ChatContextManager } from '../services/chat_context_manager';
import { ContextPills } from './context_pills';
import { MessageRow } from './message_row';
import { ToolCallRow } from './tool_call_row';
import { useOpenSearchDashboards } from '../../../opensearch_dashboards_react/public';
import { ContextProviderStart } from '../../../context_provider/public';
import {
  EventType,
  // eslint-disable-next-line prettier/prettier
  type Event as ChatEvent,
} from '../../common/events';

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

type TimelineItem = TimelineMessage | TimelineToolCall;

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ChatWindowProps {}

export const ChatWindow: React.FC<ChatWindowProps> = () => {
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize context manager
  const contextManager = useMemo(() => {
    const manager = new ChatContextManager();
    if (services.core) {
      manager.start(services.core, services.contextProvider);
    }
    // Set context manager in chat service
    chatService.setContextManager(manager);
    return manager;
  }, [services.core, chatService, services.contextProvider]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [timeline, currentStreamingMessage]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const messageContent = input.trim();
    setInput('');
    setIsStreaming(true);
    setCurrentStreamingMessage('');

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
                  id: `msg-${Date.now()}`,
                  role: 'assistant',
                  content: currentContent,
                  timestamp: event.timestamp || Date.now(),
                };
                setTimeline((prev) => [...prev, assistantMessage]);
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
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
    <div className="chat-container">
      {/* Chat Header */}
      <div className="chat-header">
        <EuiText size="m">
          <h3>Assistant</h3>
        </EuiText>
        <EuiButtonIcon
          iconType="refresh"
          onClick={handleNewChat}
          disabled={isStreaming}
          aria-label="New chat"
          size="m"
        />
      </div>

      {/* Context Pills */}
      <div className="chat-context">
        <ContextPills contextManager={contextManager} />
      </div>

      {/* Timeline Area */}
      <div className="chat-messages">
        {timeline.length === 0 && !currentStreamingMessage && (
          <div className="empty-state">
            <EuiIcon type="generate" size="xl" />
            <EuiText color="subdued" size="s">
              <p>Start a conversation with your AI assistant</p>
            </EuiText>
          </div>
        )}

        {timeline
          .sort((a, b) => a.timestamp - b.timestamp)
          .map((item) => {
            if (item.type === 'message') {
              return <MessageRow key={item.id} message={item} />;
            } else {
              return <ToolCallRow key={item.id} toolCall={item} />;
            }
          })}

        {/* Streaming Message */}
        {currentStreamingMessage && (
          <MessageRow
            message={{
              type: 'message',
              id: 'streaming',
              role: 'assistant',
              content: currentStreamingMessage,
              timestamp: Date.now(),
            }}
            isStreaming={true}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="chat-input">
        <EuiFieldText
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isStreaming}
          fullWidth
        />
        <EuiButtonIcon
          iconType={isStreaming ? 'loading' : 'generate'}
          onClick={handleSend}
          disabled={input.trim().length === 0 || isStreaming}
          aria-label="Send message"
          size="m"
          color="primary"
        />
      </div>

      <style>{`
        .chat-container {
          height: 100%;
          display: grid;
          grid-template-rows: auto auto 1fr auto;
          grid-template-areas:
            "header"
            "context"
            "messages"
            "input";
          gap: 16px;
          padding: 0 8px 8px 0;
        }

        .chat-header {
          grid-area: header;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #e6e6e6;
        }

        .chat-context {
          grid-area: context;
          border-bottom: 1px solid #e6e6e6;
          padding-bottom: 8px;
        }

        .chat-messages {
          grid-area: messages;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 8px 0;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          gap: 16px;
        }

        .chat-input {
          grid-area: input;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 8px;
          align-items: center;
        }
      `}</style>
    </div>
  );
};
