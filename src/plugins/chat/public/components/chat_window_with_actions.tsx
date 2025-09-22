/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useContext, useCallback, useState, useEffect, useRef } from 'react';
import { AssistantActionProvider, AssistantActionContext } from '../../../context_provider/public';
import type { ToolDefinition } from '../../../context_provider/public';
import { ChatWindow } from './chat_window';
import { usePPLQueryAction } from '../actions/ppl_query_action';
import { useUserConfirmationAction } from '../actions/user_confirmation_action';
import type { Event as ChatEvent } from '../../common/events';
import { EventType } from '../../common/events';
import { useChatContext } from '../contexts/chat_context';

interface PendingToolCall {
  id: string;
  name: string;
  args: string;
}

/**
 * Enhanced ChatWindow with AssistantAction support
 */
export function ChatWindowWithActions(props: any) {
  const [availableTools, setAvailableTools] = useState<ToolDefinition[]>([]);

  const handleToolsUpdated = useCallback((tools: ToolDefinition[]) => {
    // eslint-disable-next-line no-console
    console.log('Available tools for assistant:', tools);
    setAvailableTools(tools);
  }, []);

  return (
    <AssistantActionProvider onToolsUpdated={handleToolsUpdated}>
      <ChatWindowContent {...props} availableTools={availableTools} />
    </AssistantActionProvider>
  );
}

function ChatWindowContent(props: any & { availableTools: ToolDefinition[] }) {
  const context = useContext(AssistantActionContext);
  const { chatService } = useChatContext();
  const { availableTools } = props;
  const [pendingToolCalls] = useState<Map<string, PendingToolCall>>(new Map());
  const eventSubscriptionRef = useRef<any>(null);

  // Register actions
  usePPLQueryAction();
  useUserConfirmationAction();

  // Pass available tools to chat service
  useEffect(() => {
    if (chatService && availableTools.length > 0) {
      // Store tools for when we send messages
      (chatService as any).availableTools = availableTools;
    }
  }, [chatService, availableTools]);

  // Handle tool call events
  useEffect(() => {
    if (!context || !chatService) return;

    const { updateToolCallState, executeAction } = context;

    // Subscribe to chat events for tool calls
    const handleToolCallEvent = async (event: ChatEvent) => {
      switch (event.type) {
        case EventType.TOOL_CALL_START:
          if ('toolCallId' in event && 'toolCallName' in event) {
            updateToolCallState(event.toolCallId, {
              id: event.toolCallId,
              name: event.toolCallName,
              status: 'pending',
              timestamp: Date.now(),
            });

            pendingToolCalls.set(event.toolCallId, {
              id: event.toolCallId,
              name: event.toolCallName,
              args: '',
            });
          }
          break;

        case EventType.TOOL_CALL_ARGS:
          if ('toolCallId' in event && 'delta' in event) {
            const toolCall = pendingToolCalls.get(event.toolCallId);
            if (toolCall) {
              toolCall.args += event.delta;
            }
          }
          break;

        case EventType.TOOL_CALL_END:
          if ('toolCallId' in event) {
            const toolCall = pendingToolCalls.get(event.toolCallId);
            if (toolCall) {
              try {
                const args = JSON.parse(toolCall.args);

                updateToolCallState(toolCall.id, {
                  status: 'executing',
                  args,
                });

                const result = await executeAction(toolCall.name, args);

                updateToolCallState(toolCall.id, {
                  status: 'complete',
                  result,
                });

                // Send tool result back to assistant
                if ((chatService as any).sendToolResult) {
                  await (chatService as any).sendToolResult(toolCall.id, result);
                }
              } catch (error: any) {
                updateToolCallState(toolCall.id, {
                  status: 'failed',
                  error,
                });

                // Send error back to assistant
                if ((chatService as any).sendToolResult) {
                  await (chatService as any).sendToolResult(toolCall.id, {
                    error: error.message,
                  });
                }
              }

              pendingToolCalls.delete(event.toolCallId);
            }
          }
          break;
      }
    };

    // Subscribe to the chat service's event stream if available
    if ((chatService as any).events$) {
      eventSubscriptionRef.current = (chatService as any).events$.subscribe(handleToolCallEvent);
    }

    return () => {
      if (eventSubscriptionRef.current) {
        eventSubscriptionRef.current.unsubscribe();
      }
    };
  }, [context, chatService, pendingToolCalls]);

  // Pass the available tools as a prop to ChatWindow
  const enhancedProps = {
    ...props,
    availableTools,
    toolCallStates: context?.toolCallStates,
    getActionRenderer: context?.getActionRenderer,
  };

  return <ChatWindow {...enhancedProps} />;
}
