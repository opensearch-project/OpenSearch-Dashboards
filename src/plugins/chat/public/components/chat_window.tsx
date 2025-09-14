/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
/* eslint-disable no-console */

import React, { useState, useRef, useEffect } from 'react';
import {
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFieldText,
  EuiButton,
  EuiText,
  EuiSpacer,
  EuiIcon,
} from '@elastic/eui';
import { ChatMessage } from '../services/chat_service';
import { useChatContext } from '../contexts/chat_context';

export const ChatWindow: React.FC = () => {
  const { chatService } = useChatContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState('');
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
    setIsStreaming(false);
  };

  return (
    <EuiPanel
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      hasBorder={false}
      hasShadow={false}
    >
      {/* Chat Header */}
      <EuiFlexGroup justifyContent="spaceBetween" alignItems="center" gutterSize="s">
        <EuiFlexItem>
          <EuiText size="s">
            <h3>Chat Assistant</h3>
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton size="s" onClick={handleNewChat} disabled={isStreaming} iconType="refresh">
            New Chat
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="m" />

      {/* Messages Area */}
      <EuiFlexItem style={{ overflowY: 'auto', padding: '8px 0', flexGrow: 1 }}>
        {messages.length === 0 && !currentStreamingMessage && (
          <EuiPanel color="subdued" style={{ textAlign: 'center', padding: '2rem' }}>
            <EuiIcon type="discuss" size="xl" />
            <EuiSpacer size="m" />
            <EuiText color="subdued">
              <p>Start a conversation with your AI assistant</p>
            </EuiText>
          </EuiPanel>
        )}

        {messages.map((message) => (
          <div key={message.id} style={{ marginBottom: '16px' }}>
            <EuiFlexGroup gutterSize="s" alignItems="flexStart">
              <EuiFlexItem grow={false}>
                <EuiIcon
                  type={message.role === 'user' ? 'user' : 'discuss'}
                  size="m"
                  color={message.role === 'user' ? 'primary' : 'success'}
                />
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiPanel paddingSize="s" color={message.role === 'user' ? 'primary' : 'plain'}>
                  <EuiText size="s" style={{ whiteSpace: 'pre-wrap' }}>
                    {message.content}
                  </EuiText>
                </EuiPanel>
              </EuiFlexItem>
            </EuiFlexGroup>
          </div>
        ))}

        {/* Streaming Message */}
        {currentStreamingMessage && (
          <div style={{ marginBottom: '16px' }}>
            <EuiFlexGroup gutterSize="s" alignItems="flexStart">
              <EuiFlexItem grow={false}>
                <EuiIcon type="discuss" size="m" color="success" />
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiPanel paddingSize="s" color="plain">
                  <EuiText size="s" style={{ whiteSpace: 'pre-wrap' }}>
                    {currentStreamingMessage}
                    <span className="blinking-cursor">|</span>
                  </EuiText>
                </EuiPanel>
              </EuiFlexItem>
            </EuiFlexGroup>
          </div>
        )}

        <div ref={messagesEndRef} />
      </EuiFlexItem>

      {/* Input Area */}
      <EuiSpacer size="m" />
      <EuiFlexGroup gutterSize="s">
        <EuiFlexItem>
          <EuiFieldText
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isStreaming}
            fullWidth
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            isLoading={isStreaming}
            iconType="arrowRight"
          >
            Send
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>

      <style>{`
        .blinking-cursor {
          animation: blink 1s infinite;
        }
        
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </EuiPanel>
  );
};
