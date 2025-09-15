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
  EuiIcon,
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

interface ChatbotFlyoutProps {
  core: CoreStart;
  deps: AIChatbotStartDependencies;
  onClose: () => void;
}

export function ChatbotFlyout({ core, deps, onClose }: ChatbotFlyoutProps) {
  console.log('🚀 ChatbotFlyout component initialized at', new Date().toISOString());

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agent, setAgent] = useState<MemoryEnhancedClaudeAgent | null>(null);
  const [agentError, setAgentError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(true);
  const [showContextDetails, setShowContextDetails] = useState(false);
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

💾 Use the save button next to assistant messages to save important conversations to memory!`,
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

  // Removed duplicate handleApiKeySubmit - using memoized version above

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

  const handleGenerateSOP = async () => {
    if (!agent || isLoading) return;

    setIsLoading(true);

    try {
      console.log('📋 Generate SOP button clicked - building investigation workflow prompt');

      // Get interaction history from Global Interaction Capture
      const interactionHistory = (window as any).getInteractionHistory?.() || [];
      console.log('🔍 Retrieved interaction history:', interactionHistory.length, 'interactions');

      // Get current context from Context Provider
      const currentContext = (await (window as any).contextProvider?.getCurrentContext?.()) || {};
      console.log('🔍 Retrieved current context:', currentContext);

      // Build SOP generation prompt
      const sopPrompt = buildSOPPrompt(interactionHistory, currentContext);
      console.log('📋 Built SOP prompt, length:', sopPrompt.length);

      // Send to LLM
      const response = await agent.processRequest(sopPrompt, context || {});

      const sopMessage: ChatMessage = {
        id: (Date.now() + 3).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, sopMessage]);
    } catch (error: any) {
      console.error('❌ SOP generation error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 3).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error generating the SOP: ${error.message}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const buildSOPPrompt = (interactions: any[], context: any): string => {
    const prompt = `You are an expert at analyzing user investigation workflows and generating Standard Operating Procedures (SOPs).

TASK: Generate a structured SOP based on the user's investigation pattern captured through their interactions with OpenSearch Dashboards.

OUTPUT FORMAT:
1. **Investigation Summary** - Brief overview of what was investigated
2. **Step-by-Step Procedure** - Exact queries and actions to reproduce the investigation
3. **Key Findings** - Important discoveries from the investigation
4. **Evidence Analysis** - What to look for in expanded documents
5. **Root Cause Conclusion** - Analysis based on the evidence
6. **Recommended Actions** - Next steps and preventive measures
7. **Reproducible Queries** - Copy-paste ready queries for future use

GUIDELINES:
- Include EXACT queries used (copy-paste ready)
- Reference specific field names and values found
- Provide clear step-by-step reproduction steps
- Make the SOP reusable for similar incidents
- Focus on actionable insights

---

## USER INVESTIGATION WORKFLOW ANALYSIS

### Investigation Timeline:
${interactions
  .map(
    (interaction: any, index: number) => `
${index + 1}. [${interaction.timestamp}] ${interaction.type?.toUpperCase() || 'INTERACTION'}
   - Element: ${interaction.testSubj || interaction.tagName || 'unknown'}
   - Action: ${interaction.interactionType || interaction.type || 'click'}
   ${interaction.text ? `- Text: "${interaction.text}"` : ''}
   ${interaction.buttonText ? `- Button: "${interaction.buttonText}"` : ''}
   ${interaction.context ? `- Context: ${JSON.stringify(interaction.context, null, 2)}` : ''}
`
  )
  .join('\n')}

### Current Context:
- App: ${context?.appId || 'unknown'}
- Index Pattern: ${context?.data?.indexPattern || 'unknown'}
- Time Range: ${context?.data?.timeRange ? JSON.stringify(context.data.timeRange) : 'unknown'}
- Active Filters: ${context?.data?.filters ? JSON.stringify(context.data.filters) : 'none'}
- Query: ${context?.data?.query ? JSON.stringify(context.data.query) : 'none'}

### Expanded Documents:
${
  context?.data?.expandedDocuments
    ?.map(
      (doc: any, index: number) => `
Document ${index + 1}:
- ID: ${doc.documentId || 'unknown'}
- Error Code: ${doc.error_code || 'N/A'}
- Response Time: ${doc.response_time_ms || 'N/A'}ms
- Status: ${doc.status || 'N/A'}
- Key Fields: ${Object.keys(doc).slice(0, 10).join(', ')}
`
    )
    .join('\n') || 'None expanded'
}

### Investigation Pattern Recognition:
Based on the interaction sequence, identify:
1. What type of investigation was performed?
2. What was the user trying to discover?
3. What evidence did they gather?
4. What conclusions can be drawn?

Generate a comprehensive SOP following the specified format that includes EXACT queries and findings for future reproduction.`;

    return prompt;
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

  if (showApiKeyInput) {
    return (
      <EuiFlyout onClose={onClose} size="m">
        <EuiFlyoutHeader hasBorder>
          <EuiTitle size="m">
            <h2>🤖 AI Assistant Setup</h2>
          </EuiTitle>
        </EuiFlyoutHeader>
        <EuiFlyoutBody>
          <EuiCallOut title="API Key Required" color="primary" iconType="lock">
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
        </EuiFlyoutBody>
        <EuiFlyoutFooter>
          <EuiFlexGroup justifyContent="spaceBetween">
            <EuiFlexItem grow={false}>
              <EuiButton onClick={onClose}>Cancel</EuiButton>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButton
                fill
                onClick={handleApiKeySubmitClick}
                disabled={!apiKey.trim()}
                isLoading={isLoading}
              >
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
          <EuiCallOut title="Agent Error" color="danger" iconType="alert">
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
          >
            Try Again
          </EuiButton>
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
              <h2>
                <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
                  <EuiFlexItem grow={false}>
                    <EuiIcon type="discuss" size="l" color="primary" />
                  </EuiFlexItem>
                  <EuiFlexItem>AI Assistant</EuiFlexItem>
                </EuiFlexGroup>
              </h2>
            </EuiTitle>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>{contextLoading && <EuiLoadingSpinner size="m" />}</EuiFlexItem>
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
                    marginRight: message.role === 'user' ? '0' : '10%',
                  }}
                >
                  <EuiFlexGroup alignItems="flexStart" gutterSize="s">
                    <EuiFlexItem grow={false}>
                      <EuiIcon
                        type={message.role === 'user' ? 'user' : 'discuss'}
                        size="m"
                        color={message.role === 'user' ? 'subdued' : 'primary'}
                      />
                    </EuiFlexItem>
                    <EuiFlexItem>
                      <EuiText size="s">
                        <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
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
              placeholder="Ask me about your dashboard, try memory commands like 'list memories', or request actions..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              rows={2}
              disabled={isLoading}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiFlexGroup gutterSize="s" responsive={false}>
              <EuiFlexItem grow={false}>
                <EuiButton
                  fill
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  style={{ height: '100%' }}
                  data-test-subj="aiAssistantSendButton"
                >
                  Send
                </EuiButton>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButton
                  color="success"
                  iconType="documentEdit"
                  onClick={handleGenerateSOP}
                  disabled={isLoading}
                  style={{ height: '100%' }}
                  data-test-subj="aiAssistantGenerateSOPButton"
                  title="Generate SOP from your investigation workflow"
                >
                  Generate SOP
                </EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>

        {/* Memory Commands Hint */}
        <EuiSpacer size="xs" />
        <EuiText size="xs" color="subdued" textAlign="center">
          💡 Try: "list memories" | "manage memory" | 📋 Click "Generate SOP" to create
          investigation procedures
        </EuiText>
      </EuiFlyoutFooter>
    </EuiFlyout>
  );
}
