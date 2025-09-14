/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
/* eslint-disable no-console */

import React, { useState, useRef, useEffect } from 'react';
import {
  EuiPanel,
  EuiFieldText,
  EuiButton,
  EuiText,
  EuiIcon,
  EuiButtonIcon,
  EuiBadge,
} from '@elastic/eui';
import { ChatMessage } from '../services/chat_service';
import { useChatContext } from '../contexts/chat_context';

interface ToolCall {
  id: string;
  toolName: string;
  status: 'running' | 'completed' | 'error';
  description?: string;
}

export const ChatWindow: React.FC = () => {
  const { chatService } = useChatContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState('');
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

      // Subscribe to streaming response
      const subscription = observable.subscribe({
        next: (event: any) => {
          console.log('Received event:', event);
          switch (event.type) {
            case 'TEXT_MESSAGE_CONTENT':
              console.log('Adding content:', event.delta);
              setCurrentStreamingMessage((prev) => prev + (event.delta || ''));
              break;
            case 'TEXT_MESSAGE_END':
              console.log('Message ended, finalizing...');
              // Finalize the assistant message using the current streaming content
              setCurrentStreamingMessage((currentContent) => {
                console.log('Final content:', currentContent);
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
                toolName: event.toolName || 'Unknown Tool',
                status: 'running',
                description: event.description || `Calling ${event.toolName}...`,
              };
              setToolCalls((prev) => [...prev, newToolCall]);
              break;
            case 'TOOL_CALL_END':
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
              console.error('Chat error:', event.message);
              setIsStreaming(false);
              setCurrentStreamingMessage('');
              break;
          }
        },
        error: (error: any) => {
          console.error('Chat subscription error:', error);
          setIsStreaming(false);
          setCurrentStreamingMessage('');
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
    setIsStreaming(false);
  };

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
          iconType="generate"
          onClick={handleSend}
          disabled={!input.trim() || isStreaming}
          isLoading={isStreaming}
          aria-label="Send message"
          size="m"
          color="primary"
        />
      </div>

      <style>{`
        .chat-container {
          height: 100%;
          display: grid;
          grid-template-rows: auto 1fr auto;
          grid-template-areas:
            "header"
            "messages"
            "input";
          gap: 16px;
          padding: 16px;
        }

        .chat-header {
          grid-area: header;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #e6e6e6;
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
