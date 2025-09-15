/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
/* eslint-disable no-console */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  EuiPanel,
  EuiFieldText,
  EuiButton,
  EuiText,
  EuiIcon,
  EuiButtonIcon,
  EuiBadge,
  EuiSpacer,
} from '@elastic/eui';
import { CoreStart } from '../../../../core/public';
import { ChatMessage } from '../services/chat_service';
import { useChatContext } from '../contexts/chat_context';
import { ChatContextManager } from '../services/chat_context_manager';
import { ContextPills } from './context_pills';
import { useOpenSearchDashboards } from '../../../opensearch_dashboards_react/public';
import { ContextProviderStart } from '../../../context_provider/public';

interface ToolCall {
  id: string;
  toolName: string;
  status: 'running' | 'completed' | 'error';
  description?: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ChatWindowProps {}

export const ChatWindow: React.FC<ChatWindowProps> = () => {
  const { chatService } = useChatContext();
  const { services } = useOpenSearchDashboards<{
    core: CoreStart;
    contextProvider?: ContextProviderStart;
  }>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState('');
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
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
  }, [messages, currentStreamingMessage]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const messageContent = input.trim();
    setInput('');
    setIsStreaming(true);
    setCurrentStreamingMessage('');

    try {
      const { observable, userMessage } = await chatService.sendMessage(messageContent, messages);

      // Add user message immediately
      setMessages((prev) => [...prev, userMessage]);

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
                const assistantMessage: ChatMessage = {
                  id: `msg-${Date.now()}`,
                  role: 'assistant',
                  content: currentContent,
                  timestamp: Date.now(),
                };
                setMessages((prev) => [...prev, assistantMessage]);
                return ''; // Clear the streaming message
              });
              setIsStreaming(false);
              break;
            case 'TOOL_CALL_START':
              const newToolCall: ToolCall = {
                id: event.toolCallId || `tool-${Date.now()}`,
                toolName: event.toolCallName || 'Unknown Tool',
                status: 'running',
                description: event.description || `Calling ${event.toolCallName}...`,
              };
              setToolCalls((prev) => [...prev, newToolCall]);
              break;
            case 'TOOL_CALL_END':
            case 'TOOL_CALL_RESULT':
              setToolCalls((prev) =>
                prev.map((tool) =>
                  tool.id === event.toolCallId ? { ...tool, status: 'completed' as const } : tool
                )
              );
              break;
            case 'TOOL_CALL_ERROR':
              setToolCalls((prev) =>
                prev.map((tool) =>
                  tool.id === event.toolCallId ? { ...tool, status: 'error' as const } : tool
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
    setMessages([]);
    setCurrentStreamingMessage('');
    setToolCalls([]);
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

      {/* Messages and Tool Calls Area */}
      <div className="chat-messages">
        {messages.length === 0 && !currentStreamingMessage && toolCalls.length === 0 && (
          <div className="empty-state">
            <EuiIcon type="generate" size="xl" />
            <EuiText color="subdued" size="s">
              <p>Start a conversation with your AI assistant</p>
            </EuiText>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className="message-row">
            <div className="message-icon">
              <EuiIcon
                type={message.role === 'user' ? 'user' : 'generate'}
                size="m"
                color={message.role === 'user' ? 'primary' : 'success'}
              />
            </div>
            <div className="message-content">
              <EuiPanel paddingSize="s" color={message.role === 'user' ? 'primary' : 'plain'}>
                <EuiText size="s" style={{ whiteSpace: 'pre-wrap' }}>
                  {message.content}
                </EuiText>
              </EuiPanel>
            </div>
          </div>
        ))}

        {/* Tool Calls */}
        {toolCalls.map((toolCall) => (
          <div key={toolCall.id} className="tool-call-row">
            <div className="tool-call-icon">
              <EuiIcon type="wrench" size="m" color="accent" />
            </div>
            <div className="tool-call-content">
              <div className="tool-call-info">
                <EuiText size="s" style={{ fontWeight: 600 }}>
                  {toolCall.toolName}
                </EuiText>
                <EuiBadge
                  color={
                    toolCall.status === 'running'
                      ? 'warning'
                      : toolCall.status === 'completed'
                      ? 'success'
                      : 'danger'
                  }
                >
                  {toolCall.status === 'running' ? 'Running' : toolCall.status}
                </EuiBadge>
              </div>
              {toolCall.description && (
                <EuiText size="xs" color="subdued">
                  {toolCall.description}
                </EuiText>
              )}
            </div>
          </div>
        ))}

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
