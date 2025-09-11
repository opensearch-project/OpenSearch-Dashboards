/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

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
  EuiCode,
  EuiButtonIcon,
  EuiCodeBlock,
  EuiBadge,
  EuiDescriptionList,
  EuiDescriptionListTitle,
  EuiDescriptionListDescription,
  EuiIcon,
  EuiResizableContainer,
} from '@elastic/eui';
import { CoreStart } from '../../../../core/public';
import { AIChatbotStartDependencies } from '../types';
import { ClaudeOSDAgent } from '../agent/claude_agent';
import { MemoryEnhancedClaudeAgent } from '../agent/memory_enhanced_claude_agent';
import { useContextProvider, useContextSummary } from '../hooks/use_context_provider';
import { ContextData } from '../types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatbotSidePanelProps {
  core: CoreStart;
  deps: AIChatbotStartDependencies;
  onClose: () => void;
}

export function ChatbotSidePanel({ core, deps, onClose }: ChatbotSidePanelProps) {
  console.log('🚀 ChatbotSidePanel component initialized at', new Date().toISOString());

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agent, setAgent] = useState<MemoryEnhancedClaudeAgent | null>(null);
  const [agentError, setAgentError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(true);
  const [showContextDetails, setShowContextDetails] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { context, isLoading: contextLoading, error: contextError } = useContextProvider();
  const contextSummary = useContextSummary(context);

  // Simplified button click handler
  const handleApiKeySubmitClick = React.useCallback(() => {
    console.log('🚀 Start Assistant button clicked! API Key length:', apiKey.length);

    if (!apiKey.trim()) {
      setAgentError('Please provide a valid Claude API key');
      return;
    }

    if (apiKey.length < 10) {
      setAgentError('API key seems invalid (too short)');
      return;
    }

    try {
      sessionStorage.setItem('claude-api-key', apiKey);
      setShowApiKeyInput(false);
      setAgentError(null);
      console.log('✅ API key saved and transitioning to chat');
    } catch (error: any) {
      console.error('❌ Failed to save API key:', error);
      setAgentError(`Failed to save API key: ${error.message}`);
    }
  }, [apiKey]);

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
        console.log(
          '🤖 Initializing memory-enhanced agent with API key:',
          apiKey.substring(0, 10) + '...'
        );

        const baseAgent = new ClaudeOSDAgent(apiKey);
        const memoryAgent = new MemoryEnhancedClaudeAgent(baseAgent);
        setAgent(memoryAgent);
        setAgentError(null);

        // Add welcome message with memory features
        setMessages([
          {
            id: '1',
            role: 'assistant',
            content: `Hello! I'm your OpenSearch Dashboards AI assistant with memory capabilities!

Current context: ${contextSummary}

💾 Memory Commands:
- "list memories" - See all saved conversations
- "load session_xxx" - Load specific memory session
- "manage memory" - View current session details
- "save" - Save current session
- "delete all memories" - Clear all saved memories, except current one
- Add "list top 5 memories" to any question for related context

🔍 Context Commands:
- "list system context" - View current page/app context
- "list memory context" - View conversation history
- "list full context" - View all 4 context parts (system, memory, history, tools)

💾 Use the save button next to assistant messages to save important conversations to memory!

🔍 **Context Integration**: I can see when you expand documents in the Explore page! Try expanding a document and ask me about it.`,
            timestamp: new Date(),
          },
        ]);

        console.log('✅ Memory-enhanced agent initialized successfully');
      } catch (error: any) {
        console.error('❌ Failed to initialize agent:', error);
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

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !agent || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      console.log('🤖 Processing message with memory-enhanced agent:', inputMessage);
      const response = await agent.processRequest(inputMessage, context || {});

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('❌ Agent processing error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToMemory = async () => {
    if (!agent) return;

    try {
      console.log('💾 Save button clicked - saving current chat to memory');
      const response = await agent.processRequest('save', context || {});

      const saveMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, saveMessage]);
    } catch (error: any) {
      console.error('❌ Save to memory error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error saving to memory: ${error.message}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderContextDetails = () => {
    if (!context)
      return (
        <EuiText size="s" color="subdued">
          No context available
        </EuiText>
      );

    const contextEntries = Object.entries(context).filter(
      ([key, value]) => value !== null && value !== undefined && value !== ''
    );

    if (contextEntries.length === 0) {
      return (
        <EuiText size="s" color="subdued">
          Basic page context
        </EuiText>
      );
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

  // Side panel styles
  const sidePanelStyle: React.CSSProperties = {
    position: 'fixed',
    top: '0',
    right: '0',
    width: isMinimized ? '60px' : '400px',
    height: '100vh',
    backgroundColor: '#f7f9fc',
    borderLeft: '1px solid #d3dae6',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    transition: 'width 0.3s ease',
    boxShadow: '-2px 0 8px rgba(0, 0, 0, 0.1)',
  };

  const headerStyle: React.CSSProperties = {
    padding: '16px',
    borderBottom: '1px solid #d3dae6',
    backgroundColor: '#ffffff',
    flexShrink: 0,
  };

  const bodyStyle: React.CSSProperties = {
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  };

  const messagesStyle: React.CSSProperties = {
    flex: 1,
    overflow: 'auto',
    padding: '16px',
  };

  const footerStyle: React.CSSProperties = {
    padding: '16px',
    borderTop: '1px solid #d3dae6',
    backgroundColor: '#ffffff',
    flexShrink: 0,
  };

  if (isMinimized) {
    return (
      <div style={sidePanelStyle}>
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <EuiButtonIcon
            iconType="menuRight"
            onClick={() => setIsMinimized(false)}
            aria-label="Expand AI Assistant"
            size="m"
            color="primary"
          />
          <EuiSpacer size="s" />
          <EuiButtonIcon
            iconType="cross"
            onClick={onClose}
            aria-label="Close AI Assistant"
            size="s"
            color="danger"
          />
        </div>
      </div>
    );
  }

  if (showApiKeyInput) {
    return (
      <div style={sidePanelStyle}>
        <div style={headerStyle}>
          <EuiFlexGroup alignItems="center" justifyContent="spaceBetween">
            <EuiFlexItem>
              <EuiTitle size="s">
                <h3>🤖 AI Assistant Setup</h3>
              </EuiTitle>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiFlexGroup gutterSize="xs">
                <EuiFlexItem grow={false}>
                  <EuiButtonIcon
                    iconType="menuLeft"
                    onClick={() => setIsMinimized(true)}
                    aria-label="Minimize"
                    size="s"
                  />
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiButtonIcon
                    iconType="cross"
                    onClick={onClose}
                    aria-label="Close"
                    size="s"
                    color="danger"
                  />
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
          </EuiFlexGroup>
        </div>
        <div style={bodyStyle}>
          <div style={{ padding: '16px' }}>
            <EuiCallOut title="API Key Required" color="primary" iconType="lock" size="s">
              <p>Please provide your Claude API key to use the AI assistant.</p>
            </EuiCallOut>
            <EuiSpacer />
            <EuiTextArea
              placeholder="Enter your Claude API key (sk-ant-...)..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              rows={3}
            />
            {agentError && (
              <>
                <EuiSpacer size="s" />
                <EuiCallOut title="Error" color="danger" iconType="alert" size="s">
                  <p>{agentError}</p>
                </EuiCallOut>
              </>
            )}
            <EuiSpacer />
            <EuiButton
              fill
              onClick={handleApiKeySubmitClick}
              disabled={!apiKey.trim()}
              isLoading={isLoading}
              size="s"
            >
              Start Assistant
            </EuiButton>
          </div>
        </div>
      </div>
    );
  }

  if (agentError) {
    return (
      <div style={sidePanelStyle}>
        <div style={headerStyle}>
          <EuiFlexGroup alignItems="center" justifyContent="spaceBetween">
            <EuiFlexItem>
              <EuiTitle size="s">
                <h3>🤖 AI Assistant Error</h3>
              </EuiTitle>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonIcon
                iconType="cross"
                onClick={onClose}
                aria-label="Close"
                size="s"
                color="danger"
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </div>
        <div style={bodyStyle}>
          <div style={{ padding: '16px' }}>
            <EuiCallOut title="Agent Error" color="danger" iconType="alert" size="s">
              <p>{agentError}</p>
            </EuiCallOut>
            <EuiSpacer />
            <EuiButton
              onClick={() => {
                setAgentError(null);
                setShowApiKeyInput(true);
                setApiKey('');
                sessionStorage.removeItem('claude-api-key');
              }}
              size="s"
            >
              Try Again
            </EuiButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={sidePanelStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <EuiFlexGroup alignItems="center" justifyContent="spaceBetween">
          <EuiFlexItem>
            <EuiTitle size="s">
              <h3>
                <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
                  <EuiFlexItem grow={false}>
                    <EuiIcon type="discuss" size="m" color="primary" />
                  </EuiFlexItem>
                  <EuiFlexItem>AI Assistant</EuiFlexItem>
                </EuiFlexGroup>
              </h3>
            </EuiTitle>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiFlexGroup gutterSize="xs">
              {contextLoading && (
                <EuiFlexItem grow={false}>
                  <EuiLoadingSpinner size="s" />
                </EuiFlexItem>
              )}
              <EuiFlexItem grow={false}>
                <EuiButtonIcon
                  iconType="menuLeft"
                  onClick={() => setIsMinimized(true)}
                  aria-label="Minimize"
                  size="s"
                />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButtonIcon
                  iconType="cross"
                  onClick={onClose}
                  aria-label="Close"
                  size="s"
                  color="danger"
                />
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>

        {contextError && (
          <>
            <EuiSpacer size="s" />
            <EuiCallOut title="Context Warning" color="warning" iconType="alert" size="s">
              <p>{contextError}</p>
            </EuiCallOut>
          </>
        )}

        <EuiSpacer size="s" />
        <EuiFlexGroup alignItems="center" justifyContent="spaceBetween">
          <EuiFlexItem>
            <EuiText size="s" color="subdued">
              Context: {contextSummary}
            </EuiText>
            {agent && (
              <>
                <EuiSpacer size="xs" />
                <EuiText size="xs" color="subdued">
                  <EuiFlexGroup alignItems="center" gutterSize="xs" responsive={false}>
                    <EuiFlexItem grow={false}>
                      <EuiIcon type="storage" size="s" />
                    </EuiFlexItem>
                    <EuiFlexItem>
                      Memory: {agent.getMemoryService().getSessionSummary()}
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiText>
              </>
            )}
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButtonIcon
              iconType={showContextDetails ? 'arrowUp' : 'arrowDown'}
              onClick={() => setShowContextDetails(!showContextDetails)}
              aria-label="Toggle context details"
              size="s"
            />
          </EuiFlexItem>
        </EuiFlexGroup>

        {showContextDetails && (
          <>
            <EuiSpacer size="s" />
            <EuiPanel paddingSize="s" color="subdued">
              {renderContextDetails()}
            </EuiPanel>
          </>
        )}
      </div>

      {/* Body */}
      <div style={bodyStyle}>
        <div style={messagesStyle}>
          {messages.map((message) => (
            <div key={message.id} style={{ marginBottom: '12px' }}>
              <EuiPanel
                paddingSize="s"
                color={message.role === 'user' ? 'primary' : 'subdued'}
                style={{
                  marginLeft: message.role === 'user' ? '20px' : '0',
                  marginRight: message.role === 'user' ? '0' : '20px',
                }}
              >
                <EuiFlexGroup alignItems="flexStart" gutterSize="s">
                  <EuiFlexItem grow={false}>
                    <EuiIcon
                      type={message.role === 'user' ? 'user' : 'discuss'}
                      size="s"
                      color={message.role === 'user' ? 'subdued' : 'primary'}
                    />
                  </EuiFlexItem>
                  <EuiFlexItem>
                    <EuiText size="s">
                      <pre
                        style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '12px' }}
                      >
                        {message.content}
                      </pre>
                    </EuiText>
                    <EuiSpacer size="xs" />
                    <EuiFlexGroup alignItems="center" justifyContent="spaceBetween">
                      <EuiFlexItem>
                        <EuiText size="xs" color="subdued">
                          {message.timestamp.toLocaleTimeString()}
                        </EuiText>
                      </EuiFlexItem>
                      {message.role === 'assistant' && (
                        <EuiFlexItem grow={false}>
                          <EuiButtonIcon
                            iconType="save"
                            size="s"
                            color="primary"
                            aria-label="Save to memory"
                            title="💾 Save to memory"
                            onClick={handleSaveToMemory}
                          />
                        </EuiFlexItem>
                      )}
                    </EuiFlexGroup>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiPanel>
            </div>
          ))}

          {isLoading && (
            <div style={{ textAlign: 'center', padding: '12px' }}>
              <EuiLoadingSpinner size="m" />
              <EuiSpacer size="s" />
              <EuiText size="s" color="subdued">
                AI is thinking...
              </EuiText>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Footer */}
      <div style={footerStyle}>
        <EuiFlexGroup gutterSize="s">
          <EuiFlexItem>
            <EuiTextArea
              placeholder="Ask me about your dashboard, try memory commands, or expand documents to see context updates..."
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
              size="s"
            >
              Send
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>

        {/* Memory Commands Hint */}
        <EuiSpacer size="xs" />
        <EuiText size="xs" color="subdued" textAlign="center">
          💡 Try: "list memories" | "What documents did I expand?" | "list full context"
        </EuiText>
      </div>
    </div>
  );
}
