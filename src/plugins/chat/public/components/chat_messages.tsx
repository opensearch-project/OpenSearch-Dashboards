/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect } from 'react';
import { EuiIcon, EuiText } from '@elastic/eui';
import { ChatLayoutMode } from './chat_header_button';
import { MessageRow } from './message_row';
import { ToolCallRow } from './tool_call_row';
import { ErrorRow } from './error_row';
import type { Message, AssistantMessage, ToolMessage, ToolCall } from '../../common/types';
import './chat_messages.scss';

type TimelineItem = Message;

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

interface ChatMessagesProps {
  layoutMode: ChatLayoutMode;
  timeline: Message[];
  currentStreamingMessage: string;
  isStreaming: boolean;
  onResendMessage?: (message: Message) => void;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({
  layoutMode,
  timeline,
  currentStreamingMessage,
  isStreaming,
  onResendMessage,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Context is now handled by RFC hooks and context pills
  // No need for separate context display here

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [timeline, currentStreamingMessage]);

  // Context is now handled by RFC hooks - no subscriptions needed

  return (
    <>
      {/* Context is now displayed via context pills in the chat interface */}
      {/* Timeline Area */}
      <div className={`chatMessages chatMessages--${layoutMode}`}>
        {timeline.length === 0 && !currentStreamingMessage && (
          <div className="chatMessages__emptyState">
            <EuiIcon type="generate" size="xl" />
            <EuiText color="subdued" size="s">
              <p>Start a conversation with your AI assistant</p>
            </EuiText>
          </div>
        )}

        {timeline.map((message) => {
          // Handle different message types
          if (message.role === 'user') {
            return <MessageRow key={message.id} message={message} onResend={onResendMessage} />;
          }

          if (message.role === 'assistant') {
            const assistantMsg = message as AssistantMessage;
            return (
              <div key={message.id}>
                {/* Assistant message content */}
                {assistantMsg.content && <MessageRow message={assistantMsg} />}

                {/* Tool calls below the message */}
                {assistantMsg.toolCalls?.map((toolCall) => {
                  // Find corresponding tool result
                  const toolResult = timeline.find(
                    (m): m is ToolMessage =>
                      m.role === 'tool' && (m as ToolMessage).toolCallId === toolCall.id
                  );

                  return (
                    <ToolCallRow
                      key={toolCall.id}
                      toolCall={{
                        type: 'tool_call',
                        id: toolCall.id,
                        toolName: toolCall.function.name,
                        status: getToolStatus(toolCall, toolResult),
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
        {isStreaming && currentStreamingMessage === '' && (
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

        {/* Streaming Message */}
        {currentStreamingMessage && (
          <MessageRow
            message={{
              id: 'streaming',
              role: 'assistant',
              content: currentStreamingMessage,
            }}
            isStreaming={true}
          />
        )}

        <div ref={messagesEndRef} />
      </div>
    </>
  );
};
