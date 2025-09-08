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
  EuiAccordion,
  EuiCode,
  EuiButtonIcon,
  EuiFlyout,
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiCodeBlock,
  EuiBadge,
  EuiDescriptionList,
  EuiDescriptionListTitle,
  EuiDescriptionListDescription,
} from '@elastic/eui';
import { CoreStart } from '../../../../core/public';
import { AIChatbotStartDependencies } from '../types';
import { ClaudeOSDAgent } from '../agent/claude_agent';
import { useContextProvider, useContextSummary } from '../hooks/use_context_provider';
import { ContextData } from '../types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatbotFlyoutProps {
  core: CoreStart;
  deps: AIChatbotStartDependencies;
  onClose: () => void;
}

export function ChatbotFlyout({ core, deps, onClose }: ChatbotFlyoutProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agent, setAgent] = useState<ClaudeOSDAgent | null>(null);
  const [agentError, setAgentError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { context, isLoading: contextLoading, error: contextError } = useContextProvider();
  const contextSummary = useContextSummary(context);

  useEffect(() => {
    // Check for stored API key
    const storedKey = sessionStorage.getItem('claude-api-key');
    if (storedKey) {
      setApiKey(storedKey);
      setShowApiKeyInput(false);
    }
  }, []);

  useEffect(() => {
    if (apiKey && !showApiKeyInput) {
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
  }, [apiKey, showApiKeyInput, contextSummary]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleApiKeySubmit = () => {
    if (apiKey.trim()) {
      sessionStorage.setItem('claude-api-key', apiKey);
      setShowApiKeyInput(false);
    }
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

  const renderContextDetails = () => {
    if (!context) return <EuiText size="s" color="subdued">No context available</EuiText>;

    const contextEntries = Object.entries(context).filter(([key, value]) => 
      value !== null && value !== undefined && value !== ''
    );

    if (contextEntries.length === 0) {
      return <EuiText size="s" color="subdued">Basic page context</EuiText>;
    }

    return (
      <EuiDescriptionList compressed>
        {contextEntries.map(([key, value]) => (
          <React.Fragment key={key}>
            <EuiDescriptionListTitle>
              <EuiBadge color="hollow">{key}</EuiBadge>
            </EuiDescriptionListTitle>
            <EuiDescriptionListDescription>
              <EuiCode>
                {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
              </EuiCode>
            </EuiDescriptionListDescription>
          </React.Fragment>
        ))}
      </EuiDescriptionList>
    );
  };

  if (showApiKeyInput) {
    return (
      <EuiFlyout onClose={onClose} size="m">
        <EuiFlyoutHeader hasBorder>
          <EuiTitle size="m">
            <h2>🤖 AI Assistant Setup</h2>
          </EuiTitle>
        </EuiFlyoutHeader>
        <EuiFlyoutBody>
          <EuiCallOut
            title="Claude API Key Required"
            color="primary"
            iconType="iInCircle"
          >
            <p>Please provide your Claude API key to use the AI assistant.</p>
          </EuiCallOut>
          <EuiSpacer />
          <EuiTextArea
            placeholder="Enter your Claude API key..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            rows={3}
          />
        </EuiFlyoutBody>
        <EuiFlyoutFooter>
          <EuiFlexGroup justifyContent="spaceBetween">
            <EuiFlexItem grow={false}>
              <EuiButton onClick={onClose}>Cancel</EuiButton>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButton fill onClick={handleApiKeySubmit} disabled={!apiKey.trim()}>
                Start Assistant
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlyoutFooter>
      </EuiFlyout>
    );
  }

  if (agentError) {
    return (
      <EuiFlyout onClose={onClose} size="m">
        <EuiFlyoutHeader hasBorder>
          <EuiTitle size="m">
            <h2>🤖 AI Assistant Error</h2>
          </EuiTitle>
        </EuiFlyoutHeader>
        <EuiFlyoutBody>
          <EuiCallOut
            title="Agent Error"
            color="danger"
            iconType="alert"
          >
            <p>{agentError}</p>
          </EuiCallOut>
        </EuiFlyoutBody>
      </EuiFlyout>
    );
  }

  return (
    <EuiFlyout onClose={onClose} size="m">
      <EuiFlyoutHeader hasBorder>
        <EuiFlexGroup alignItems="center" justifyContent="spaceBetween">
          <EuiFlexItem>
            <EuiTitle size="m">
              <h2>🤖 AI Assistant</h2>
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
        <EuiAccordion
          id="context-details"
          buttonContent={
            <EuiText size="s">
              <strong>Context Details</strong> ({contextSummary})
            </EuiText>
          }
          paddingSize="s"
          style={{ border: 'none' }}
          buttonProps={{ style: { border: 'none', outline: 'none' } }}
        >
          {renderContextDetails()}
        </EuiAccordion>
      </EuiFlyoutHeader>

      <EuiFlyoutBody>
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Messages */}
          <div style={{ flex: 1, overflow: 'auto', paddingBottom: '16px' }}>
            {messages.map((message) => (
              <div key={message.id} style={{ marginBottom: '16px' }}>
                <EuiPanel
                  paddingSize="m"
                  color={message.role === 'user' ? 'primary' : 'subdued'}
                  style={{
                    marginLeft: message.role === 'user' ? '10%' : '0',
                    marginRight: message.role === 'user' ? '0' : '10%'
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
        </div>
      </EuiFlyoutBody>

      <EuiFlyoutFooter>
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
      </EuiFlyoutFooter>
    </EuiFlyout>
  );
}