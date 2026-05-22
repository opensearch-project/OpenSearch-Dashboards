/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { AssistantActionService } from '../../../context_provider/public';
import { ChatEventHandler } from '../services/chat_event_handler';
import { ChatService } from '../services/chat_service';
import { ConfirmationService } from '../services/confirmation_service';
import type { PluginTelemetryRecorder } from '../../../../core/public';
import type { Event as ChatEvent } from '../../common/events';
import type { Message, UserMessage } from '../../common/types';

interface UseChatStreamingOptions {
  chatService: ChatService;
  confirmationService: ConfirmationService;
  telemetryRecorder?: PluginTelemetryRecorder;
  onMessageSent?: () => void;
}

export const useChatStreaming = ({
  chatService,
  confirmationService,
  telemetryRecorder,
  onMessageSent,
}: UseChatStreamingOptions) => {
  const service = AssistantActionService.getInstance();

  const [timeline, setTimeline] = useState<Message[]>([]);
  const [isMainStreaming, setIsMainStreaming] = useState(false);
  const [isToolResultStreaming, setIsToolResultStreaming] = useState(false);
  const isStreaming = isMainStreaming || isToolResultStreaming;
  const [mainStartResponse, setMainStartResponse] = useState(false);
  const [toolResultStartResponse, setToolResultStartResponse] = useState(false);
  const startResponse = mainStartResponse || toolResultStartResponse;
  const [isSendingToolResult, setIsSendingToolResult] = useState(false);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);

  // Use ref to track streaming state synchronously for React 18 compatibility
  const isStreamingRef = useRef(false);
  const isSendingToolResultRef = useRef(false);
  const timelineRef = useRef<Message[]>(timeline);
  const currentSubscriptionRef = useRef<any>(null);
  const toolResultSubscriptionRef = useRef<any>(null);

  isSendingToolResultRef.current = isSendingToolResult;

  useEffect(() => {
    timelineRef.current = timeline;
  }, [timeline]);

  // Handle tool result stream subscription (called by ChatEventHandler)
  const toolResultRunIdRef = useRef<string | null>(null);
  const handleToolResultStream = useCallback(
    (observable: any, abortController: AbortController) => {
      setIsToolResultStreaming(true);

      const subscription = observable.subscribe({
        next: (event: ChatEvent) => {
          // Capture the tool result stream's runId
          if ('runId' in event && event.runId) {
            toolResultRunIdRef.current = event.runId;
          }
          eventHandlerRef.current?.handleEvent(event);
        },
        error: (error: Error) => {
          if (error?.name !== 'AbortError') {
            // eslint-disable-next-line no-console
            console.error('Tool result response error:', error);
          }
        },
      });
      subscription.add(() => {
        setIsToolResultStreaming(false);
        setToolResultStartResponse(false);
        toolResultRunIdRef.current = null;
        toolResultSubscriptionRef.current = null;
        if (abortController) {
          eventHandlerRef.current?.releaseToolResultController(abortController);
        }
      });

      toolResultSubscriptionRef.current = subscription;
    },
    []
  );

  // Ref to access eventHandler inside handleToolResultStream without circular dep
  const eventHandlerRef = useRef<ChatEventHandler | null>(null);

  // Create the event handler
  const eventHandler = useMemo(
    () =>
      new ChatEventHandler({
        assistantActionService: service,
        chatService,
        confirmationService,
        telemetryRecorder,
        callbacks: {
          onTimelineUpdate: setTimeline,
          onStartResponse: (runId?: string) => {
            if (runId && runId === toolResultRunIdRef.current) {
              setToolResultStartResponse(true);
            } else {
              setMainStartResponse(true);
            }
          },
          onSendToolResultStateChange: setIsSendingToolResult,
          onSubscribeToToolResultStream: handleToolResultStream,
          getTimeline: () => timelineRef.current,
        },
      }),
    [service, chatService, confirmationService, telemetryRecorder, handleToolResultStream]
  );

  eventHandlerRef.current = eventHandler;

  // Clean up event handler on unmount
  useEffect(() => {
    return () => {
      eventHandler.clearState();
    };
  }, [eventHandler]);

  // Subscribe to message stream and handle events
  const subscribeToMessageStream = useCallback(
    async (messageContent: string, messages: Message[], rawMessage?: string) => {
      isStreamingRef.current = true;
      setIsMainStreaming(true);
      setMainStartResponse(false);

      try {
        const { observable, userMessage } = await chatService.sendMessage(messageContent, messages);

        const timelineUserMessage: UserMessage = {
          id: userMessage.id,
          role: 'user',
          content: userMessage.content,
          rawMessage: Array.isArray(userMessage.content)
            ? undefined
            : rawMessage || messageContent,
        };

        setTimeline((prev) => [...prev, timelineUserMessage]);

        onMessageSent?.();

        const onStreamEnd = () => {
          isStreamingRef.current = false;
          setIsMainStreaming(false);
          setMainStartResponse(false);
          currentSubscriptionRef.current = null;
        };

        const subscription = observable.subscribe({
          next: async (event: ChatEvent) => {
            if ('runId' in event && event.runId && event.runId !== currentRunId) {
              setCurrentRunId(event.runId);
            }
            await eventHandler.handleEvent(event);
          },
          error: (error: any) => {
            // eslint-disable-next-line no-console
            console.error('Subscription error:', error);
            onStreamEnd();
          },
          complete: onStreamEnd,
        });

        currentSubscriptionRef.current = subscription;
        return () => subscription.unsubscribe();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to send message:', error);
        isStreamingRef.current = false;
        setIsMainStreaming(false);
        currentSubscriptionRef.current = null;
      }
    },
    [chatService, currentRunId, eventHandler, onMessageSent]
  );

  // Stop streaming and clean up
  const stopStreaming = useCallback(() => {
    chatService.abort();
    chatService.resetConnection();
    if (currentSubscriptionRef.current) {
      currentSubscriptionRef.current.unsubscribe();
      currentSubscriptionRef.current = null;
    }
    if (toolResultSubscriptionRef.current) {
      toolResultSubscriptionRef.current.unsubscribe();
      toolResultSubscriptionRef.current = null;
    }
    eventHandler.cancelToolResultDispatch();
    isStreamingRef.current = false;
    setIsMainStreaming(false);
    setIsToolResultStreaming(false);
    setMainStartResponse(false);
    setToolResultStartResponse(false);
  }, [chatService, eventHandler]);

  // Resend a tool result to the assistant
  const sendToolResult = useCallback(
    async ({ messageId, toolCallId, toolResult }: { messageId: string; toolCallId: string; toolResult: any }) => {
      if (isStreamingRef.current || isSendingToolResultRef.current) return;
      setTimeline((prev) => prev.filter((msg) => msg.id !== messageId));
      await eventHandler.sendToolResultToAssistant(toolCallId, toolResult);
    },
    [eventHandler]
  );

  return {
    timeline,
    setTimeline,
    isStreaming,
    isStreamingRef,
    isSendingToolResult,
    isSendingToolResultRef,
    startResponse,
    currentRunId,
    setCurrentRunId,
    eventHandler,
    subscribeToMessageStream,
    stopStreaming,
    sendToolResult,
  };
};
