/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { EuiIcon, EuiText } from '@elastic/eui';
import { ChatLayoutMode } from './chat_header_button';
import { MessageRow } from './message_row';
import { ToolCallRow } from './tool_call_row';
import { ContextTreeView } from './context_tree_view';
import { ChatContextManager } from '../services/chat_context_manager';
import { StaticContext, DynamicContext } from '../../../context_provider/public';
import './chat_messages.scss';

interface TimelineMessage {
  type: 'message';
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface TimelineToolCall {
  type: 'tool_call';
  id: string;
  toolName: string;
  status: 'running' | 'completed' | 'error';
  result?: string;
  timestamp: number;
}

type TimelineItem = TimelineMessage | TimelineToolCall;

interface ChatMessagesProps {
  layoutMode: ChatLayoutMode;
  timeline: TimelineItem[];
  currentStreamingMessage: string;
  contextManager: ChatContextManager;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({
  layoutMode,
  timeline,
  currentStreamingMessage,
  contextManager,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [staticContext, setStaticContext] = useState<StaticContext | null>(null);
  const [dynamicContext, setDynamicContext] = useState<DynamicContext | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [timeline, currentStreamingMessage]);

  useEffect(() => {
    if (!contextManager) return;

    const staticSub = contextManager.getRawStaticContext$().subscribe(setStaticContext);
    const dynamicSub = contextManager.getRawDynamicContext$().subscribe(setDynamicContext);

    // Get initial values
    setStaticContext(contextManager.getRawStaticContext());
    setDynamicContext(contextManager.getRawDynamicContext());

    return () => {
      staticSub.unsubscribe();
      dynamicSub.unsubscribe();
    };
  }, [contextManager]);

  return (
    <>
      {/* Context Tree View */}
      <div className="chatMessages__context">
        <ContextTreeView staticContext={staticContext} dynamicContext={dynamicContext} />
      </div>

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

        {timeline
          .sort((a, b) => a.timestamp - b.timestamp)
          .map((item) => {
            if (item.type === 'message') {
              return <MessageRow key={item.id} message={item} />;
            } else {
              return <ToolCallRow key={item.id} toolCall={item} />;
            }
          })}

        {/* Streaming Message */}
        {currentStreamingMessage && (
          <MessageRow
            message={{
              type: 'message',
              id: 'streaming',
              role: 'assistant',
              content: currentStreamingMessage,
              timestamp: Date.now(),
            }}
            isStreaming={true}
          />
        )}

        <div ref={messagesEndRef} />
      </div>
    </>
  );
};
