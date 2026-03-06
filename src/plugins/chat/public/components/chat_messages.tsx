/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { EuiIcon, EuiText, EuiFlexGroup, EuiFlexItem, EuiPanel } from '@elastic/eui';
import { ChatLayoutMode } from './chat_header_button';
import { MessageRow } from './message_row';
import { TimelineToolCall, ToolCallRow } from './tool_call_row';
import { ErrorRow } from './error_row';
import type { Message, AssistantMessage, ToolMessage, ToolCall } from '../../common/types';
import './chat_messages.scss';
import { ChatSuggestions } from './chat_suggestions';
import { ToolCallGroup } from './tool_call_group';
import { AssistantActionService } from '../../../context_provider/public';

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

/**
 * Converts a timeline of messages into display rows, grouping tool calls appropriately.
 *
 * Processing rules:
 * - Non-tool messages (user, assistant, system) are included as-is
 * - Completed tool calls from consecutive assistant messages are grouped together
 * - Running tool calls are displayed individually
 * - Tool calls with custom renderers are displayed individually (not grouped)
 * - Tool result messages are filtered out (they're referenced by tool calls)
 *
 * @param timeline - Array of messages from the conversation
 * @returns Array of message rows ready for display
 */
export const convertTimelineToMessageRows = (timeline: Message[]) => {
  const result: Array<
    | Message
    | { role: 'toolCallGroup'; toolCalls: TimelineToolCall[] }
    | { role: 'toolCall'; toolCall: TimelineToolCall }
  > = [];

  // Remove tool result messages - they're only referenced by tool calls
  const messages = timeline.filter((msg) => msg.role !== 'tool');

  // Helper: Convert ToolCall to TimelineToolCall with status
  const toTimelineToolCall = (toolCall: ToolCall): TimelineToolCall => {
    const toolResult = timeline.find(
      (msg): msg is ToolMessage =>
        msg.role === 'tool' && (msg as ToolMessage).toolCallId === toolCall.id
    );

    return {
      type: 'tool_call' as const,
      id: toolCall.id,
      toolName: toolCall.function.name,
      status: getToolStatus(toolCall, toolResult),
      arguments: toolCall.function.arguments,
      result: toolResult?.content,
      timestamp: Date.now(),
    };
  };

  // Helper: Check if any tool call is running
  const hasRunningTool = (toolCalls?: ToolCall[]): boolean => {
    if (!toolCalls?.length) return false;
    return toolCalls.some((tc) => {
      const toolResult = timeline.find(
        (msg): msg is ToolMessage => msg.role === 'tool' && msg.toolCallId === tc.id
      );
      return !toolResult; // No result means still running
    });
  };

  // Helper: Check if tool has custom renderer
  const hasCustomRenderer = (toolName: string): boolean => {
    const service = AssistantActionService.getInstance();
    return service.shouldUseCustomRenderer(toolName);
  };

  // Helper: Check if any tool call has custom renderer
  const hasCustomRendererTool = (toolCalls?: ToolCall[]): boolean => {
    if (!toolCalls?.length) return false;
    return toolCalls.some((tc) => hasCustomRenderer(tc.function.name));
  };

  // Helper: Find next message that closes a tool call batch
  // (non-assistant message or assistant with content)
  const findBatchEndIndex = (startIndex: number): number => {
    for (let i = startIndex; i < messages.length; i++) {
      const msg = messages[i];
      if (msg.role !== 'assistant' || msg.content) {
        return i;
      }
    }
    return -1; // No closing message found
  };

  // Helper: Add tool calls as individual rows
  const addIndividualToolCalls = (toolCalls?: ToolCall[]) => {
    if (!toolCalls?.length) return;
    toolCalls.forEach((tc) => {
      result.push({ role: 'toolCall', toolCall: toTimelineToolCall(tc) });
    });
  };

  // Helper: Add tool calls as a group
  const addToolCallGroup = (toolCalls: ToolCall[]) => {
    if (!toolCalls.length) return;
    result.push({
      role: 'toolCallGroup',
      toolCalls: toolCalls.map(toTimelineToolCall),
    });
  };

  // Process messages
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    result.push(message);

    // Only assistant messages can have tool calls
    if (message.role !== 'assistant') continue;

    const assistantMsg = message as AssistantMessage;
    const toolCalls = assistantMsg.toolCalls;

    // No tool calls to process
    if (!toolCalls?.length) continue;

    // If any tool is running, show individually and continue processing
    if (hasRunningTool(toolCalls)) {
      addIndividualToolCalls(toolCalls);
      continue;
    }

    // If any tool has custom renderer, show individually (don't group)
    if (hasCustomRendererTool(toolCalls)) {
      addIndividualToolCalls(toolCalls);
      continue;
    }

    // Find where this batch of tool calls ends
    const batchEndIndex = findBatchEndIndex(i + 1);

    // If no closing message, show individually (batch incomplete) and continue
    if (batchEndIndex === -1) {
      addIndividualToolCalls(toolCalls);
      continue;
    }

    // Collect tool calls from continuation messages (empty assistant messages between current and end)
    const continuationToolCalls: ToolCall[] = [];
    for (let j = i + 1; j < batchEndIndex; j++) {
      const continuationMsg = messages[j] as AssistantMessage;
      if (continuationMsg.toolCalls) {
        continuationToolCalls.push(...continuationMsg.toolCalls);
      }
    }

    // If any continuation tool is running, show current individually and continue
    if (hasRunningTool(continuationToolCalls)) {
      addIndividualToolCalls(toolCalls);
      continue;
    }

    // If any continuation tool has custom renderer, show all individually (don't group)
    if (hasCustomRendererTool(continuationToolCalls)) {
      addIndividualToolCalls(toolCalls);
      continue;
    }

    // All tools completed and none have custom renderers - group them together
    addToolCallGroup([...toolCalls, ...continuationToolCalls]);

    // Skip to the message before batch end
    i = batchEndIndex - 1;
  }

  return result;
};

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
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const userHasScrolledUp = useRef<boolean>(false);
  const isAutoScrolling = useRef<boolean>(false);

  // Context is now handled by RFC hooks and context pills
  // No need for separate context display here

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      isAutoScrolling.current = true;
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      // Reset flag after animation completes
      setTimeout(() => {
        isAutoScrolling.current = false;
      }, 500);
    }
  }, []);

  // Check if user is near the bottom of the scroll area
  const isNearBottom = useCallback((container: HTMLElement, threshold: number = 100): boolean => {
    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    return distanceFromBottom < threshold;
  }, []);

  // Handle scroll events to detect if user scrolled up
  const handleScroll = useCallback(() => {
    // Ignore scroll events triggered by auto-scrolling
    if (isAutoScrolling.current) {
      return;
    }

    const container = messagesContainerRef.current;
    if (!container) {
      return;
    }

    const nearBottom = isNearBottom(container);

    // If user is near the bottom, enable auto-scroll
    if (nearBottom) {
      if (userHasScrolledUp.current) {
        userHasScrolledUp.current = false;
      }
    } else {
      // User has scrolled up - disable auto-scroll
      if (!userHasScrolledUp.current) {
        userHasScrolledUp.current = true;
      }
    }
  }, [isNearBottom]);

  // Auto-scroll only if user hasn't scrolled up
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) {
      return;
    }

    const shouldScroll = !userHasScrolledUp.current || isNearBottom(container);

    // Only auto-scroll if:
    // 1. User hasn't manually scrolled up, OR
    // 2. User is already near the bottom
    if (shouldScroll) {
      scrollToBottom();
    }
  }, [timeline, isNearBottom, scrollToBottom]);

  // Attach scroll listener
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) {
      return;
    }

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  // Context is now handled by RFC hooks - no subscriptions needed

  const messageRows = useMemo(() => convertTimelineToMessageRows(timeline), [timeline]);

  const lastAssistantMessageIndex = useMemo(
    () => messageRows.findLastIndex((message) => message.role === 'assistant'),
    [messageRows]
  );
  // Only enable suggestion on llm outputs after last user input
  const suggestionsEnabled = useMemo(() => {
    if (isStreaming) {
      return false;
    }
    if (messageRows.length === 0) {
      return false;
    }
    const lastUserMessageIndex = messageRows.findLastIndex((message) => message.role === 'user');
    return lastAssistantMessageIndex > lastUserMessageIndex;
  }, [messageRows, isStreaming, lastAssistantMessageIndex]);

  return (
    <>
      {/* Context Tree View: Hiding this for now. Uncomment for development */}
      {/* <div className="chatMessages__context">
        <ContextTreeView staticContext={staticContext} dynamicContext={dynamicContext} />
      </div> */}

      {/* Timeline Area */}
      <div className={`chatMessages chatMessages--${layoutMode}`} ref={messagesContainerRef}>
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

        {messageRows.map((message, index) => {
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
              </div>
            );
          }

          if (message.role === 'toolCall') {
            return (
              <ToolCallRow
                key={message.toolCall.id}
                onApprove={onApproveConfirmation}
                onReject={onRejectConfirmation}
                toolCall={message.toolCall}
              />
            );
          }

          if (message.role === 'toolCallGroup') {
            return (
              <ToolCallGroup
                key={message.toolCalls.map((toolCall) => toolCall.id).join('-')}
                toolCalls={message.toolCalls}
              />
            );
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
