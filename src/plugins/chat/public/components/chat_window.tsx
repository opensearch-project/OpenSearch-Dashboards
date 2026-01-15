/*
* Copyright OpenSearch Contributors
* SPDX-License-Identifier: Apache-2.0
*/

/* eslint-disable no-console */

import React, { useState, useEffect, useMemo, useImperativeHandle, useCallback, useRef } from 'react';
import { useChatContext } from '../contexts/chat_context';
import { ChatEventHandler } from '../services/chat_event_handler';
import { AssistantActionService } from '../../../context_provider/public';
import { ConfirmationService, ConfirmationRequest } from '../services/confirmation_service';
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
import { slashCommandRegistry } from '../services/slash_commands';

export interface ChatWindowInstance{
  startNewChat: ()=>void;
  sendMessage: (options:{content: string})=>Promise<unknown>;
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
  const { chatService } = useChatContext();
  const [timeline, setTimeline] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<ConfirmationRequest | null>(null);
  const handleSendRef = useRef<typeof handleSend>();
  
  const timelineRef = React.useRef<Message[]>(timeline);
  
  React.useEffect(() => {
    timelineRef.current = timeline;
  }, [timeline]);

  // Create confirmation service
  const confirmationService = useMemo(() => new ConfirmationService(), []);

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
        unfinishedToolCalls.forEach(async (toolCall) => {
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
        });
      }
      setTimeline(currentMessages);
    }
  }, [chatService, eventHandler]);

  // Sync timeline changes with ChatService for persistence
  useEffect(() => {
    chatService.updateCurrentMessages(timeline);
  }, [timeline, chatService]);

  const handleSend = async (options?: {input?: string}) => {
    const messageContent = options?.input ?? input.trim();
    if (!messageContent || isStreaming) return;

    setInput('');

    // Check if this is a slash command
    const commandResult = await slashCommandRegistry.execute(messageContent);
    if (commandResult.handled) {
      // If command was handled and returned a message, send it to the AI
      if (commandResult.message) {
        setIsStreaming(true);
        try {
          const { observable, userMessage } = await chatService.sendMessage(
            commandResult.message,
            timeline
          );

          // Add user message immediately to timeline with raw message for UI display
          const timelineUserMessage: UserMessage = {
            id: userMessage.id,
            role: 'user',
            content: userMessage.content,  // Processed message (sent to LLM)
            rawMessage: messageContent,    // Original user input (shown in UI)
          };
          setTimeline((prev) => [...prev, timelineUserMessage]);

          // Subscribe to streaming response
          const subscription = observable.subscribe({
            next: async (event: ChatEvent) => {
              // Update runId if we get it from the event
              if ('runId' in event && event.runId && event.runId !== currentRunId) {
                setCurrentRunId(event.runId);
              }

              // Handle all events through the event handler service
              await eventHandler.handleEvent(event);
            },
            error: (error: any) => {
              console.error('Subscription error:', error);
              setIsStreaming(false);
            },
            complete: () => {
              setIsStreaming(false);
            },
          });

          return () => subscription.unsubscribe();
        } catch (error) {
          console.error('Failed to send message:', error);
          setIsStreaming(false);
        }
      }
      return;
    }

    // Normal message flow
    setIsStreaming(true);

    try {
      const { observable, userMessage } = await chatService.sendMessage(
        messageContent,
        timeline
      );

      // Add user message immediately to timeline
      const timelineUserMessage: UserMessage = {
        id: userMessage.id,
        role: 'user',
        content: userMessage.content,
        rawMessage: messageContent,  // For regular messages, raw and content are the same
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
          setIsStreaming(false);
        },
        complete: () => {
          // Remove loading message if still present
          setTimeline((prev) => prev.filter((msg) => msg.id !== loadingMessageId));
          setIsStreaming(false);
        },
      });

      return () => subscription.unsubscribe();
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsStreaming(false);
    }
  };

  handleSendRef.current = handleSend;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleResendMessage = async (message: Message) => {
    if (isStreaming) return;

    // Only user messages can be resent
    if (message.role !== 'user') return;

    // Find the index of this message in the timeline
    const messageIndex = timeline.findIndex(
      (item) => item.id === message.id
    );

    if (messageIndex === -1) return;

    // Remove this message and everything after it from the timeline
    const truncatedTimeline = timeline.slice(0, messageIndex);
    setTimeline(truncatedTimeline);

    // Clear any streaming state and input
    setInput('');
    setIsStreaming(true);

    try {
      const { observable, userMessage } = await chatService.sendMessage(
        message.content,
        truncatedTimeline
      );

      // Add user message immediately to timeline
      const timelineUserMessage: UserMessage = {
        id: userMessage.id,
        role: 'user',
        content: userMessage.content,
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
          setIsStreaming(false);
        },
        complete: () => {
          // Remove loading message if still present
          setTimeline((prev) => prev.filter((msg) => msg.id !== loadingMessageId));
          setIsStreaming(false);
        },
      });

      return () => subscription.unsubscribe();
    } catch (error) {
      console.error('Failed to resend message:', error);
      setIsStreaming(false);
    }
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
    sendMessage: async ({content})=>(await handleSendRef.current?.({input:content}))
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
        confirmationService={confirmationService}
        pendingConfirmation={pendingConfirmation}
        onApproveConfirmation={handleApproveConfirmation}
        onRejectConfirmation={handleRejectConfirmation}
        {...enhancedProps}
      />

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
