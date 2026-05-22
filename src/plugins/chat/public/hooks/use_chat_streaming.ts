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
  const [isStreaming, setIsStreaming] = useState(false);
  const [startResponse, setStartResponse] = useState(false);
  const [isSendingToolResult, setIsSendingToolResult] = useState(false);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);

  // Use ref to track streaming state synchronously for React 18 compatibility
  const isStreamingRef = useRef(false);
  const isSendingToolResultRef = useRef(false);
  const timelineRef = useRef<Message[]>(timeline);
  const currentSubscriptionRef = useRef<any>(null);

  isSendingToolResultRef.current = isSendingToolResult;

  useEffect(() => {
    timelineRef.current = timeline;
  }, [timeline]);

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
          onStreamingStateChange: setIsStreaming,
          onStartResponse: setStartResponse,
          onSendToolResultStateChange: setIsSendingToolResult,
          getTimeline: () => timelineRef.current,
        },
      }),
    [service, chatService, confirmationService, telemetryRecorder]
  );

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
      setIsStreaming(true);
      setStartResponse(false);

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
            isStreamingRef.current = false;
            setStartResponse(false);
            setIsStreaming(false);
            currentSubscriptionRef.current = null;
          },
          complete: () => {
            isStreamingRef.current = false;
            setStartResponse(false);
            setIsStreaming(false);
            currentSubscriptionRef.current = null;
          },
        });

        currentSubscriptionRef.current = subscription;
        return () => subscription.unsubscribe();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to send message:', error);
        isStreamingRef.current = false;
        setIsStreaming(false);
        currentSubscriptionRef.current = null;
      }
    },
    [chatService, currentRunId, eventHandler, onMessageSent]
  );

  // Stop streaming and clean up
  const stopStreaming = useCallback(() => {
    chatService.abort();
    if (currentSubscriptionRef.current) {
      currentSubscriptionRef.current.unsubscribe();
      currentSubscriptionRef.current = null;
    }
    eventHandler.cancelToolResultDispatch();
    isStreamingRef.current = false;
    setIsStreaming(false);
    setStartResponse(false);
  }, [chatService, eventHandler]);

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
  };
};
