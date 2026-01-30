/*
* Copyright OpenSearch Contributors
* SPDX-License-Identifier: Apache-2.0
*/

/* eslint-disable no-console */

import React, { useState, useEffect, useMemo, useImperativeHandle, useCallback, useRef } from 'react';
import { useChatContext } from '../contexts/chat_context';
import { ChatEventHandler } from '../services/chat_event_handler';
import { AssistantActionService } from '../../../context_provider/public';
import { ConfirmationRequest } from '../services/confirmation_service';
import {
  // eslint-disable-next-line prettier/prettier
  type Event as ChatEvent,
  EventType,
} from '../../common/events';
import type {
  Message,
  UserMessage,
} from '../../common/types';
import { ChatLayoutMode } from './chat_header_button';
import { ChatContainer } from './chat_container';
import { ChatHeader } from './chat_header';
import { ChatMessages } from './chat_messages';
import { ChatInput } from './chat_input';
import { ConfirmationMessage } from './confirmation_message';
import { slashCommandRegistry } from '../services/slash_commands';

export interface ChatWindowInstance {
  startNewChat: ()=>void;
  sendMessage: (options:{content: string; messages?: Message[]})=>Promise<unknown>;
}

interface ChatWindowProps {
  layoutMode?: ChatLayoutMode;
  onToggleLayout?: () => void;
  onClose: ()=>void;
}

/**
 * ChatWindow with AssistantAction support
 */
export const ChatWindow = React.forwardRef<ChatWindowInstance, ChatWindowProps>((props, ref) => {
  return <ChatWindowContent ref={ref} {...props} />;
});

const ChatWindowContent = React.forwardRef<ChatWindowInstance, ChatWindowProps>(({
  layoutMode = ChatLayoutMode.SIDECAR,
  onToggleLayout,
  onClose,
}, ref) => {

  const service = AssistantActionService.getInstance();
  const { chatService, confirmationService } = useChatContext();
  const [timeline, setTimeline] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<ConfirmationRequest | null>(null);
  const handleSendRef = useRef<typeof handleSend>();

  // Use ref to track streaming state synchronously for React 18 compatibility
  // React 18 batches state updates, so we need a ref for immediate checks
  const isStreamingRef = useRef(false);

  const timelineRef = React.useRef<Message[]>(timeline);

  React.useEffect(() => {
    timelineRef.current = timeline;
  }, [timeline]);

  // Subscribe to pending confirmations
  useEffect(() => {
    const subscription = confirmationService.getPendingConfirmations$().subscribe((requests) => {
      // Show the first pending confirmation in the timeline
      if (requests.length > 0) {
        setPendingConfirmation(requests[0]);
      } else {
        setPendingConfirmation(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [confirmationService]);

  // Create the event handler using useMemo
  const eventHandler = useMemo(
    () =>
      new ChatEventHandler(
        service,
        chatService,
        setTimeline,
        setIsStreaming,
        () => timelineRef.current,
        confirmationService
      ),
    [service, chatService, confirmationService]
  );

  // Subscribe to tool updates from the service
  useEffect(() => {
    const subscription = service.getState$().subscribe((state) => {
      if (chatService && state.toolDefinitions.length > 0) {
        // Store tools for when we send messages
        (chatService as any).availableTools = state.toolDefinitions;
      }
    });

    return () => subscription.unsubscribe();
  }, [service, chatService]);

  // Clean up event handler on component unmount
  useEffect(() => {
    return () => {
      eventHandler.clearState();
    };
  }, [eventHandler]);

  // Restore timeline from current chat state on component mount
  useEffect(() => {
    const restoreTimeline = async () => {
      const currentMessages = chatService.getCurrentMessages();
      if (currentMessages.length > 0) {
        // load message and query unfinished tool call
        const lastMessage = currentMessages[currentMessages.length - 1];
        if (lastMessage.role === 'assistant' && lastMessage.toolCalls) {
          // restore unfinished tool call by triggering events
          const unfinishedToolCalls = lastMessage.toolCalls.filter(toolCall => {
            // Check if there's no corresponding tool result message
            const hasToolResult = currentMessages.some(msg =>
              msg.role === 'tool' && msg.toolCallId === toolCall.id
            );
            return !hasToolResult;
          });

          // Trigger tool call events for unfinished tool calls
          for (const toolCall of unfinishedToolCalls) {
            try {
              // Trigger TOOL_CALL_START event
              await eventHandler.handleEvent({
                type: EventType.TOOL_CALL_START,
                toolCallId: toolCall.id,
                toolCallName: toolCall.function.name,
                parentMessageId: lastMessage.id,
                timestamp: Date.now(),
              });

              // Trigger TOOL_CALL_ARGS event with full arguments
              await eventHandler.handleEvent({
                type: EventType.TOOL_CALL_ARGS,
                toolCallId: toolCall.id,
                delta: toolCall.function.arguments,
                timestamp: Date.now(),
              });

              // Trigger TOOL_CALL_END event to execute the tool
              await eventHandler.handleEvent({
                type: EventType.TOOL_CALL_END,
                toolCallId: toolCall.id,
                timestamp: Date.now(),
              });

            } catch (error: any) {
              console.error(`Error restoring tool call for ${toolCall.function.name}:`, error);
            }
          }
        }
        setTimeline(currentMessages);
      }
    };

    restoreTimeline();
  }, [chatService, eventHandler]);

  // Sync timeline changes with ChatService for persistence
  useEffect(() => {
    chatService.updateCurrentMessages(timeline);
  }, [timeline, chatService]);

  // Helper function to handle message streaming with observable subscription
  const subscribeToMessageStream = useCallback(async (
    messageContent: string,
    messages: Message[],
    rawMessage?: string
  ) => {
    isStreamingRef.current = true;
    setIsStreaming(true);

    try {
      const { observable, userMessage } = await chatService.sendMessage(
        messageContent,
        messages
      );

      const timelineUserMessage: UserMessage = {
        id: userMessage.id,
        role: 'user',
        content: userMessage.content,
        rawMessage: rawMessage || messageContent,  // For regular messages, raw and content are the same
      };

      // Add loading assistant message
      const loadingMessageId = `loading-${Date.now()}`;
      const loadingMessage: Message = {
        id: loadingMessageId,
        role: 'assistant',
        content: '',
      };

      setTimeline((prev) => [...prev, timelineUserMessage, loadingMessage]);

      let firstResponseReceived = false;

      // Subscribe to streaming response
      const subscription = observable.subscribe({
        next: async (event: ChatEvent) => {
          // Update runId if we get it from the event
          if ('runId' in event && event.runId && event.runId !== currentRunId) {
            setCurrentRunId(event.runId);
          }

          // Remove loading message on first response
          if (!firstResponseReceived) {
            firstResponseReceived = true;
            setTimeline((prev) => prev.filter((msg) => msg.id !== loadingMessageId));
          }

          // Handle all events through the event handler service
          await eventHandler.handleEvent(event);
        },
        error: (error: any) => {
          console.error('Subscription error:', error);
          // Remove loading message on error
          setTimeline((prev) => prev.filter((msg) => msg.id !== loadingMessageId));
          isStreamingRef.current = false;
          setIsStreaming(false);
        },
        complete: () => {
          // Remove loading message if still present
          setTimeline((prev) => prev.filter((msg) => msg.id !== loadingMessageId));
          isStreamingRef.current = false;
          setIsStreaming(false);
        },
      });

      return () => subscription.unsubscribe();
    } catch (error) {
      console.error('Failed to send message:', error);
      isStreamingRef.current = false;
      setIsStreaming(false);
    }
  }, [chatService, currentRunId, eventHandler]);

  const handleSend = async (options?: {input?: string, messages?: Message[]}) => {
    const messageContent = options?.input ?? input.trim();
    // Use ref for immediate check since React 18 batches state updates
    if (!messageContent || isStreamingRef.current) return;

    setInput('');

    // Prepare additional messages for sending (but don't add to timeline yet)
    const additionalMessages = options?.messages ?? [];

    // Merge additional messages with current timeline for sending
    const messagesToSend = [...timeline, ...additionalMessages];

    // Check if this is a slash command
    const commandResult = await slashCommandRegistry.execute(messageContent);
    if (commandResult.handled) {
      // If command was handled and returned a message, send it to the AI
      if (commandResult.message) {
        return subscribeToMessageStream(commandResult.message, messagesToSend, messageContent);
      }
      return;
    }

    // Normal message flow
    return subscribeToMessageStream(messageContent, messagesToSend);
  };

  handleSendRef.current = handleSend;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleResendMessage = async (message: Message) => {
    // Use ref for immediate check since React 18 batches state updates
    if (isStreamingRef.current) return;

    // Only user messages can be resent
    if (message.role !== 'user') return;

    // Find the index of this message in the timeline
    const messageIndex = timeline.findIndex(
      (item) => item.id === message.id
    );

    if (messageIndex === -1) return;

    let textContent = typeof message.content === "string" ? message.content : "";
    const additionalMessages: Message[] = [];

    if (Array.isArray(message.content)) {
      const lastMessageContent =  message.content[message.content.length - 1];
      if (lastMessageContent.type === "text") {
        textContent = lastMessageContent.text;
        additionalMessages.push({
          ...message,
          content: message.content.slice(0, message.content.length - 1),
        });
      }
    }

    if (textContent === "") {
        return;
    }

    // Remove this message and everything after it from the timeline
    const truncatedTimeline = timeline.slice(0, messageIndex);
    setTimeline(truncatedTimeline);

    // Clear any streaming state and input
    setInput('');

    subscribeToMessageStream(textContent, [...truncatedTimeline,...additionalMessages]);
  };

  const handleNewChat = useCallback(() => {
    chatService.newThread();
    setTimeline([]);
    setCurrentRunId(null);
    setIsStreaming(false);
    setPendingConfirmation(null);
  }, [chatService]);

  const handleApproveConfirmation = useCallback(() => {
    if (pendingConfirmation) {
      confirmationService.approve(pendingConfirmation.id);
    }
  }, [pendingConfirmation, confirmationService]);

  const handleRejectConfirmation = useCallback(() => {
    if (pendingConfirmation) {
      confirmationService.reject(pendingConfirmation.id);
    }
  }, [pendingConfirmation, confirmationService]);

  const currentState = service.getCurrentState();
  const enhancedProps = {
    toolCallStates: currentState.toolCallStates,
    getActionRenderer: service.getActionRenderer,
  };

  useImperativeHandle(ref, ()=>({
    startNewChat: ()=>handleNewChat(),
    sendMessage: async ({content, messages})=>(await handleSendRef.current?.({input:content, messages}))
  }), [handleNewChat]);

  return (
    <ChatContainer layoutMode={layoutMode}>
      <ChatHeader
        layoutMode={layoutMode}
        isStreaming={isStreaming}
        onToggleLayout={onToggleLayout}
        onNewChat={handleNewChat}
        onClose={onClose}
      />

      <ChatMessages
        layoutMode={layoutMode}
        timeline={timeline}
        isStreaming={isStreaming}
        onResendMessage={handleResendMessage}
        onApproveConfirmation={handleApproveConfirmation}
        onRejectConfirmation={handleRejectConfirmation}
        onFillInput={setInput}
        {...enhancedProps}
      />

      {/* Sticky confirmation message - positioned above chat input */}
      {pendingConfirmation && (
        <ConfirmationMessage
          request={pendingConfirmation}
          onApprove={handleApproveConfirmation}
          onReject={handleRejectConfirmation}
        />
      )}

      <ChatInput
        layoutMode={layoutMode}
        input={input}
        isStreaming={isStreaming}
        onInputChange={setInput}
        onSend={handleSend}
        onKeyDown={handleKeyDown}
      />
    </ChatContainer>
  );
});
