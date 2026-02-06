/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useMemo } from 'react';
import { EuiIcon, EuiText, EuiFlexGroup, EuiFlexItem, EuiPanel } from '@elastic/eui';
import { ChatLayoutMode } from './chat_header_button';
import { MessageRow } from './message_row';
import { ToolCallRow } from './tool_call_row';
import { ErrorRow } from './error_row';
import type { Message, AssistantMessage, ToolMessage, ToolCall } from '../../common/types';
import './chat_messages.scss';
import { ChatSuggestions } from './chat_suggestions';

/**
 * Determine tool status based on tool call and result
 */
function getToolStatus(
  toolCall: ToolCall,
  toolResult?: ToolMessage
): 'running' | 'completed' | 'error' {
  if (!toolResult) return 'running';
  if (toolResult.error) return 'error';
  return 'completed';
}

interface SuggestionItem {
  icon: string;
  iconColor?: string;
  text: string;
  prompt: string;
}

const STARTER_SUGGESTIONS: SuggestionItem[] = [
  {
    icon: 'search',
    iconColor: 'primary',
    text: 'Ask questions about your data',
    prompt: 'What indices do I have?',
  },
  {
    icon: 'notebookApp',
    iconColor: 'danger',
    text: '/investigate an issue',
    prompt: '/investigate ',
  },
  {
    icon: 'help',
    iconColor: 'warning',
    text: 'Explain a concept',
    prompt: 'Explain [concept or feature] in OpenSearch Dashboards',
  },
];

interface ChatMessagesProps {
  layoutMode: ChatLayoutMode;
  timeline: Message[];
  isStreaming: boolean;
  onResendMessage?: (message: Message) => void;
  onApproveConfirmation?: () => void;
  onRejectConfirmation?: () => void;
  onFillInput?: (content: string) => void;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({
  layoutMode,
  timeline,
  isStreaming,
  onResendMessage,
  onApproveConfirmation,
  onRejectConfirmation,
  onFillInput,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Context is now handled by RFC hooks and context pills
  // No need for separate context display here

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [timeline]);

  // Context is now handled by RFC hooks - no subscriptions needed

  const lastAssistantMessageIndex = useMemo(
    () => timeline.findLastIndex((message) => message.role === 'assistant'),
    [timeline]
  );
  // Only enable suggestion on llm outputs after last user input
  const suggestionsEnabled = useMemo(() => {
    if (isStreaming) {
      return false;
    }
    if (timeline.length === 0) {
      return false;
    }
    const lastUserMessageIndex = timeline.findLastIndex((message) => message.role === 'user');
    return lastAssistantMessageIndex > lastUserMessageIndex;
  }, [timeline, isStreaming, lastAssistantMessageIndex]);

  return (
    <>
      {/* Context Tree View: Hiding this for now. Uncomment for development */}
      {/* <div className="chatMessages__context">
        <ContextTreeView staticContext={staticContext} dynamicContext={dynamicContext} />
      </div> */}

      {/* Timeline Area */}
      <div className={`chatMessages chatMessages--${layoutMode}`}>
        {timeline.length === 0 && !isStreaming && (
          <div className="chatMessages__emptyState">
            <div className="chatMessages__emptyStateHeader">
              <EuiIcon type="generate" size="xxl" />
              <EuiText>
                <h2>Hi, I&apos;m your AI Assistant</h2>
              </EuiText>
              <EuiText color="subdued" size="s">
                <p>I can help you explore data, investigate issue, and more.</p>
                <p>Here are some things I can do:</p>
              </EuiText>
            </div>
            <div className="chatMessages__suggestions">
              {STARTER_SUGGESTIONS.map((suggestion, index) => (
                <EuiPanel
                  key={index}
                  paddingSize="m"
                  hasBorder
                  className="chatMessages__suggestionCard"
                  onClick={() => onFillInput?.(suggestion.prompt)}
                >
                  <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
                    <EuiFlexItem grow={false}>
                      <EuiIcon type={suggestion.icon} color={suggestion.iconColor} />
                    </EuiFlexItem>
                    <EuiFlexItem>
                      <EuiText size="s">
                        <span>{suggestion.text}</span>
                      </EuiText>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiPanel>
              ))}
            </div>
          </div>
        )}

        {timeline.map((message, index) => {
          // Handle different message types
          if (message.role === 'user') {
            return <MessageRow key={message.id} message={message} onResend={onResendMessage} />;
          }

          if (message.role === 'assistant') {
            const assistantMsg = message as AssistantMessage;
            const isLoadingMessage = message.id.startsWith('loading-');
            const isEmptyAndStreaming =
              !assistantMsg.content?.trim() && !assistantMsg.toolCalls?.length && isStreaming;

            return (
              <div key={message.id}>
                {/* Show loading indicator for loading messages or empty streaming messages */}
                {(isLoadingMessage || isEmptyAndStreaming) && (
                  <div className="messageRow">
                    <div className="messageRow__icon">
                      <EuiIcon type="console" size="m" color="success" />
                    </div>
                    <div className="messageRow__content">
                      <div className="chatMessages__thinkingText">Thinking...</div>
                    </div>
                  </div>
                )}

                {/* Assistant message content */}
                {!isLoadingMessage && assistantMsg.content && assistantMsg.content.trim() && (
                  <MessageRow message={assistantMsg} />
                )}

                {!isLoadingMessage && suggestionsEnabled && lastAssistantMessageIndex === index && (
                  <ChatSuggestions messages={timeline} currentMessage={message} />
                )}

                {/* Tool calls below the message */}
                {!isLoadingMessage &&
                  assistantMsg.toolCalls?.map((toolCall) => {
                    // Find corresponding tool result
                    const toolResult = timeline.find(
                      (m): m is ToolMessage =>
                        m.role === 'tool' && (m as ToolMessage).toolCallId === toolCall.id
                    );

                    return (
                      <ToolCallRow
                        key={toolCall.id}
                        onApprove={onApproveConfirmation}
                        onReject={onRejectConfirmation}
                        toolCall={{
                          type: 'tool_call',
                          id: toolCall.id,
                          toolName: toolCall.function.name,
                          status: getToolStatus(toolCall, toolResult),
                          arguments: toolCall.function.arguments,
                          result: toolResult?.content,
                          timestamp: Date.now(), // Not used in display
                        }}
                      />
                    );
                  })}
              </div>
            );
          }

          // Don't render tool messages separately (they're shown in ToolCallRow)
          if (message.role === 'tool') {
            return null;
          }

          // Handle system messages as errors
          if (message.role === 'system') {
            return <ErrorRow key={message.id} error={message} />;
          }

          return null;
        })}

        {/* Loading indicator - waiting for agent response */}
        {isStreaming && timeline.length === 0 && (
          <div className="chatMessages__loadingIndicator">
            <div className="messageRow">
              <div className="messageRow__icon">
                <EuiIcon type="discuss" size="m" color="success" />
              </div>
              <div className="messageRow__content">
                <div className="chatMessages__thinkingText">Thinking...</div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </>
  );
};
