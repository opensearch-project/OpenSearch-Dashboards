/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  EuiPanel,
  EuiTitle,
  EuiSpacer,
  EuiTextArea,
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiCallOut,
  EuiLoadingSpinner,
  EuiCollapsibleNav,
  EuiAccordion,
  EuiCode,
} from '@elastic/eui';
import { ClaudeOSDAgent } from '../agent/claude_agent';
import { useContextProvider, useContextSummary } from '../hooks/use_context_provider';
import { ContextData } from '../types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatbotProps {
  apiKey?: string;
}

export function Chatbot({ apiKey }: ChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agent, setAgent] = useState<ClaudeOSDAgent | null>(null);
  const [agentError, setAgentError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { context, isLoading: contextLoading, error: contextError } = useContextProvider();
  const contextSummary = useContextSummary(context);

  useEffect(() => {
    if (apiKey) {
      try {
        const newAgent = new ClaudeOSDAgent(apiKey);
        setAgent(newAgent);
        setAgentError(null);
        
        // Add welcome message
        setMessages([{
          id: '1',
          role: 'assistant',
          content: `Hello! I'm your OpenSearch Dashboards AI assistant. I can help you understand your data and interact with your dashboards.

Current context: ${contextSummary}

Try asking me to:
- "Add a filter for level ERROR"
- "What am I looking at?"
- "Expand panel-123"
- "Show me document doc-456"`,
          timestamp: new Date()
        }]);
      } catch (error) {
        setAgentError(`Failed to initialize agent: ${error.message}`);
      }
    }
  }, [apiKey, contextSummary]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !agent || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await agent.processRequest(inputMessage, context || {});
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!apiKey) {
    return (
      <EuiPanel paddingSize="l">
        <EuiCallOut
          title="API Key Required"
          color="warning"
          iconType="alert"
        >
          <p>Please provide a Claude API key to use the AI assistant.</p>
        </EuiCallOut>
      </EuiPanel>
    );
  }

  if (agentError) {
    return (
      <EuiPanel paddingSize="l">
        <EuiCallOut
          title="Agent Error"
          color="danger"
          iconType="alert"
        >
          <p>{agentError}</p>
        </EuiCallOut>
      </EuiPanel>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <EuiPanel paddingSize="m" style={{ flexShrink: 0 }}>
        <EuiFlexGroup alignItems="center" justifyContent="spaceBetween">
          <EuiFlexItem grow={false}>
            <EuiTitle size="s">
              <h2>🤖 OpenSearch Dashboards AI Assistant</h2>
            </EuiTitle>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            {contextLoading && <EuiLoadingSpinner size="m" />}
          </EuiFlexItem>
        </EuiFlexGroup>
        
        {contextError && (
          <>
            <EuiSpacer size="s" />
            <EuiCallOut
              title="Context Warning"
              color="warning"
              iconType="alert"
              size="s"
            >
              <p>{contextError}</p>
            </EuiCallOut>
          </>
        )}
        
        <EuiSpacer size="s" />
        <EuiText size="s" color="subdued">
          Context: {contextSummary}
        </EuiText>
      </EuiPanel>

      {/* Messages */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {messages.map((message) => (
          <div key={message.id} style={{ marginBottom: '16px' }}>
            <EuiPanel
              paddingSize="m"
              color={message.role === 'user' ? 'primary' : 'subdued'}
              style={{
                marginLeft: message.role === 'user' ? '20%' : '0',
                marginRight: message.role === 'user' ? '0' : '20%'
              }}
            >
              <EuiFlexGroup alignItems="flexStart" gutterSize="s">
                <EuiFlexItem grow={false}>
                  <strong>{message.role === 'user' ? '👤' : '🤖'}</strong>
                </EuiFlexItem>
                <EuiFlexItem>
                  <EuiText size="s">
                    <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                      {message.content}
                    </pre>
                  </EuiText>
                  <EuiSpacer size="xs" />
                  <EuiText size="xs" color="subdued">
                    {message.timestamp.toLocaleTimeString()}
                  </EuiText>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiPanel>
          </div>
        ))}
        
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '16px' }}>
            <EuiLoadingSpinner size="l" />
            <EuiSpacer size="s" />
            <EuiText size="s" color="subdued">
              AI is thinking...
            </EuiText>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <EuiPanel paddingSize="m" style={{ flexShrink: 0 }}>
        <EuiFlexGroup gutterSize="s">
          <EuiFlexItem>
            <EuiTextArea
              placeholder="Ask me about your dashboard or request actions..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              rows={2}
              disabled={isLoading}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton
              fill
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              style={{ height: '100%' }}
            >
              Send
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>

      {/* Debug Panel */}
      <EuiCollapsibleNav
        isOpen={false}
        button={
          <EuiButton size="s" color="text">
            Debug Context
          </EuiButton>
        }
        onClose={() => {}}
        style={{ position: 'fixed', bottom: '100px', right: '20px', width: '300px' }}
      >
        <EuiAccordion id="context-debug" buttonContent="Current Context">
          <EuiCode>
            <pre>{JSON.stringify(context, null, 2)}</pre>
          </EuiCode>
        </EuiAccordion>
      </EuiCollapsibleNav>
    </div>
  );
}