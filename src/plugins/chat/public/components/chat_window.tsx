/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
/* eslint-disable no-console */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { EuiPanel, EuiFieldText, EuiText, EuiIcon, EuiButtonIcon, EuiBadge } from '@elastic/eui';
import { CoreStart } from '../../../../core/public';
import { useChatContext } from '../contexts/chat_context';
import { ChatContextManager } from '../services/chat_context_manager';
import { ContextPills } from './context_pills';
import { useOpenSearchDashboards } from '../../../opensearch_dashboards_react/public';
import { ContextProviderStart } from '../../../context_provider/public';

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
  description?: string;
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
        next: (event: any) => {
          // Log every event with timestamp and full data
          const eventTime = new Date().toLocaleTimeString();
          console.log(`🔄 [${eventTime}] ${event.type}:`, event);

          // Update runId if we get it from the event
          if (event.runId && event.runId !== currentRunId) {
            setCurrentRunId(event.runId);
          }

          switch (event.type) {
            case 'TEXT_MESSAGE_CONTENT':
              setCurrentStreamingMessage((prev) => prev + (event.delta || ''));
              break;
            case 'TEXT_MESSAGE_END':
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
            case 'TOOL_CALL_START':
              const newToolCall: TimelineToolCall = {
                type: 'tool_call',
                id: event.toolCallId || `tool-${Date.now()}`,
                toolName: event.toolCallName || 'Unknown Tool',
                status: 'running',
                description: event.description || `Calling ${event.toolCallName}...`,
                timestamp: event.timestamp || Date.now(),
              };
              setTimeline((prev) => [...prev, newToolCall]);
              break;
            case 'TOOL_CALL_END':
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
              break;
            case 'TOOL_CALL_RESULT':
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
              break;
            case 'TOOL_CALL_ERROR':
              setTimeline((prev) =>
                prev.map((item) =>
                  item.type === 'tool_call' && item.id === event.toolCallId
                    ? {
                        ...item,
                        status: 'error' as const,
                        timestamp: event.timestamp || item.timestamp,
                      }
                    : item
                )
              );
              break;
            case 'RUN_ERROR':
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
              return (
                <div key={item.id} className="message-row">
                  <div className="message-icon">
                    <EuiIcon
                      type={item.role === 'user' ? 'user' : 'generate'}
                      size="m"
                      color={item.role === 'user' ? 'primary' : 'success'}
                    />
                  </div>
                  <div className="message-content">
                    <EuiPanel paddingSize="s" color={item.role === 'user' ? 'primary' : 'plain'}>
                      <EuiText size="s" style={{ whiteSpace: 'pre-wrap' }}>
                        {item.content}
                      </EuiText>
                    </EuiPanel>
                  </div>
                </div>
              );
            } else {
              return (
                <div key={item.id} className="tool-call-row">
                  <div className="tool-call-icon">
                    <EuiIcon type="wrench" size="m" color="accent" />
                  </div>
                  <div className="tool-call-content">
                    <div className="tool-call-info">
                      <EuiText size="s" style={{ fontWeight: 600 }}>
                        {item.toolName}
                      </EuiText>
                      <EuiBadge
                        color={
                          item.status === 'running'
                            ? 'warning'
                            : item.status === 'completed'
                            ? 'success'
                            : 'danger'
                        }
                      >
                        {item.status === 'running' ? 'Running' : item.status}
                      </EuiBadge>
                    </div>
                    {item.description && (
                      <EuiText size="xs" color="subdued">
                        {item.description}
                      </EuiText>
                    )}
                    {item.result && item.status === 'completed' && (
                      <div style={{ marginTop: '8px' }}>
                        <EuiText size="xs" style={{ fontWeight: 600, marginBottom: '4px' }}>
                          Result:
                        </EuiText>
                        <EuiPanel paddingSize="s" color="subdued">
                          <EuiText
                            size="xs"
                            style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}
                          >
                            {item.result}
                          </EuiText>
                        </EuiPanel>
                      </div>
                    )}
                  </div>
                </div>
              );
            }
          })}

        {/* Streaming Message */}
        {currentStreamingMessage && (
          <div className="message-row">
            <div className="message-icon">
              <EuiIcon type="discuss" size="m" color="success" />
            </div>
            <div className="message-content">
              <EuiPanel paddingSize="s" color="plain">
                <EuiText size="s" style={{ whiteSpace: 'pre-wrap' }}>
                  {currentStreamingMessage}
                  <span className="blinking-cursor">|</span>
                </EuiText>
              </EuiPanel>
            </div>
          </div>
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

        .message-row,
        .tool-call-row {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 12px;
          align-items: start;
        }

        .message-icon,
        .tool-call-icon {
          margin-top: 4px;
        }

        .message-content {
          min-width: 0;
        }

        .tool-call-content {
          background: #f7f9fc;
          border: 1px solid #d3dae6;
          border-radius: 6px;
          padding: 8px 12px;
        }

        .tool-call-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .chat-input {
          grid-area: input;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 8px;
          align-items: center;
        }

        .blinking-cursor {
          animation: blink 1s infinite;
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};
