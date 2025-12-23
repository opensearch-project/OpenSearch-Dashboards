/*
* Copyright OpenSearch Contributors
* SPDX-License-Identifier: Apache-2.0
*/

/* eslint-disable no-console */

import React, { useState, useEffect, useMemo, useImperativeHandle, useCallback, useRef } from 'react';
import { useChatContext } from '../contexts/chat_context';
import { ChatEventHandler } from '../services/chat_event_handler';
import {
  AssistantActionService,
} from '../../../context_provider/public';
import {
  // eslint-disable-next-line prettier/prettier
  type Event as ChatEvent,
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

export interface ChatWindowInstance{
  startNewChat: ()=>void;
  sendMessage: (options:{content: string; imageData?: string})=>Promise<unknown>;
  setPendingImage: (imageData: string | undefined) => void;
  setCapturingImage: (isCapturing: boolean) => void;
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
  const [pendingImage, setPendingImage] = useState<string | undefined>(undefined);
  const [isCapturingImage, setIsCapturingImage] = useState(false);
  const handleSendRef = useRef<typeof handleSend>();
  
  const timelineRef = React.useRef<Message[]>(timeline);
  
  React.useEffect(() => {
    timelineRef.current = timeline;
  }, [timeline]);

  // Create the event handler using useMemo
  const eventHandler = useMemo(
    () =>
      new ChatEventHandler(
        service,
        chatService,
        setTimeline,
        setIsStreaming,
        () => timelineRef.current
      ),
    [service, chatService]
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
      setTimeline(currentMessages);
    }
  }, [chatService]);

  // Sync timeline changes with ChatService for persistence
  useEffect(() => {
    chatService.updateCurrentMessages(timeline);
  }, [timeline, chatService]);

  const handleSend = async (options?: {input?: string; imageData?: string}) => {
    const messageContent = options?.input ?? input.trim();
    
    // Debug: Log image data flow
    const imageToSend = options?.imageData ?? pendingImage;
    
    // Allow sending if there's either text content or an image
    if ((!messageContent && !imageToSend) || isStreaming) return;

    // If no text content but there's an image, use a default message
    const finalMessageContent = messageContent || 'Can you analyze this visualization?';

    setInput('');
    setPendingImage(undefined); // Clear pending image after sending
    setIsStreaming(true);

    try {
      const { observable, userMessage } = await chatService.sendMessage(
        finalMessageContent,
        timeline,
        imageToSend || undefined
      );

      // Add user message immediately to timeline
      const timelineUserMessage: UserMessage = {
        id: userMessage.id,
        role: 'user',
        content: userMessage.content,
        imageData: userMessage.imageData, // Include image data in timeline
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
    setPendingImage(undefined); // Clear pending image on new chat
    setIsCapturingImage(false); // Clear capturing state on new chat
  }, [chatService]);

  const handleRemoveImage = () => {
    setPendingImage(undefined);
  };



  const currentState = service.getCurrentState();
  const enhancedProps = {
    toolCallStates: currentState.toolCallStates,
    getActionRenderer: service.getActionRenderer,
  };

  useImperativeHandle(ref, ()=>({
    startNewChat: ()=>handleNewChat(),
    sendMessage: async ({content, imageData})=>(await handleSendRef.current?.({input:content, imageData})),
    setPendingImage: (imageData: string | undefined) => setPendingImage(imageData),
    setCapturingImage: (isCapturing: boolean) => setIsCapturingImage(isCapturing)
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
        {...enhancedProps}
      />



      <ChatInput
        layoutMode={layoutMode}
        input={input}
        isStreaming={isStreaming}
        pendingImage={pendingImage}
        isCapturingImage={isCapturingImage}
        onInputChange={setInput}
        onSend={handleSend}
        onKeyDown={handleKeyDown}
        onRemoveImage={handleRemoveImage}
      />
    </ChatContainer>
  );
});
