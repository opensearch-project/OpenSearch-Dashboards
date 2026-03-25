/*
* Copyright OpenSearch Contributors
* SPDX-License-Identifier: Apache-2.0
*/

/* eslint-disable no-console */

import React, { useState, useEffect, useMemo, useImperativeHandle, useCallback, useRef } from 'react';
import { useUnmount } from 'react-use';
import moment from "moment";
import { i18n } from '@osd/i18n';
import { EuiButton, EuiButtonIcon, EuiLoadingSpinner, EuiText } from '@elastic/eui';
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
import { ChatLayoutMode } from '../types';
import { ChatContainer } from './chat_container';
import { ChatHeader } from './chat_header';
import { ChatMessages } from './chat_messages';
import { ChatInput } from './chat_input';
import { slashCommandRegistry } from '../services/slash_commands';
import { usePageContainerCapture, PageContainerImageData } from '../hooks/use_page_container_capture';
import { ConversationHistoryPanel } from './conversation_history_panel';
import type { SavedConversation } from '../services/conversation_history_service';
import { useOpenSearchDashboards } from '../../../opensearch_dashboards_react/public';
import { CoreStart } from '../../../../core/public';
import { ChatSessionErrorBoundary } from './chat_session_error_boundary';
import "./chat_window.scss"

export interface ChatWindowInstance {
  startNewChat: ()=>void;
  sendMessage: (options:{content: string; messages?: Message[]})=>Promise<unknown>;
}

interface ChatWindowProps {
  layoutMode?: ChatLayoutMode;
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
  onClose,
}, ref) => {

  const service = AssistantActionService.getInstance();
  const { chatService, confirmationService } = useChatContext();
  const { services } = useOpenSearchDashboards<{ core: CoreStart }>();
  const toasts = services.core?.notifications?.toasts;
  const [timeline, setTimeline] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<ConfirmationRequest | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const handleSendRef = useRef<typeof handleSend>();
  const currentSubscriptionRef = useRef<any>(null);
  const loadingAbortControllerRef = useRef<AbortController | null>(null);
  const {screenshotFeatureEnabled,isCapturing, capturePageContainer} = usePageContainerCapture();
  const [screenshotData, setScreenshotData] = useState<{pageTitle: string, createdAt: moment.Moment} & PageContainerImageData>();
  const [toolCallStates, setToolCallStates] = useState<Record<string, any>>({});
  const resendAvailable = !!chatService.conversationHistoryService.getMemoryProvider().includeFullHistory;
  const [startResponse, setStartResponse] = useState(false);
  const [isSendingToolResult, setIsSendingToolResult] = useState(false);

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

  // Get telemetry recorder from core services
  const telemetryRecorder = useMemo(
    () => services.core?.telemetry?.getPluginRecorder('chat'),
    [services.core?.telemetry]
  );

  // Create the event handler using useMemo
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

  // Subscribe to tool updates from the service
  useEffect(() => {
    const subscription = service.getState$().subscribe((state) => {
      if (chatService && state.toolDefinitions.length > 0) {
        // Store tools for when we send messages
        (chatService as any).availableTools = state.toolDefinitions;
      }
      // Update tool call states
      setToolCallStates(state.toolCallStates);
    });

    return () => subscription.unsubscribe();
  }, [service, chatService]);

  // Clean up event handler on component unmount
  useEffect(() => {
    return () => {
      eventHandler.clearState();
    };
  }, [eventHandler]);

  // Restore unfinished tool calls by re-triggering their events
  const restoreUnfinishedToolCalls = useCallback(async (
    messages: Message[],
    abortController: AbortController
  ): Promise<boolean> => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'assistant' || !lastMessage.toolCalls) {
      return false;
    }

    // Find tool calls without corresponding tool result messages
    const unfinishedToolCalls = lastMessage.toolCalls.filter(toolCall => {
      const hasToolResult = messages.some(msg =>
        msg.role === 'tool' && msg.toolCallId === toolCall.id
      );
      return !hasToolResult;
    });

    if (unfinishedToolCalls.length === 0) {
      return false;
    }

    // Remove unfinished tool calls from the last message to show a clean timeline.
    // The unfinished tools will be re-triggered below and may require user confirmation
    // (e.g., clicking approve/reject buttons), so we need to show the UI early.
    const lastMessageWithoutUnfinishedTools = {
      ...lastMessage,
      toolCalls: lastMessage.toolCalls.filter((toolCall) => !unfinishedToolCalls.includes(toolCall))
    };

    // Set loading to false early so users can see and interact with confirmation dialogs
    setIsLoading(false);
    setTimeline([...messages.slice(0, -1), lastMessageWithoutUnfinishedTools]);

    // Helper to apply event only if not aborted
    const applyEventHandler = async (event: ChatEvent): Promise<void> => {
      if (abortController.signal.aborted) {
        return;
      }
      await eventHandler.handleEvent(event);
    };

    // Trigger tool call events for unfinished tool calls
    for (const toolCall of unfinishedToolCalls) {
      if (abortController.signal.aborted) {
        return true;
      }

      try {
        await applyEventHandler({
          type: EventType.TOOL_CALL_START,
          toolCallId: toolCall.id,
          toolCallName: toolCall.function.name,
          parentMessageId: lastMessage.id,
          timestamp: Date.now(),
        });

        await applyEventHandler({
          type: EventType.TOOL_CALL_ARGS,
          toolCallId: toolCall.id,
          delta: toolCall.function.arguments,
          timestamp: Date.now(),
        });

        await applyEventHandler({
          type: EventType.TOOL_CALL_END,
          toolCallId: toolCall.id,
          timestamp: Date.now(),
        });
      } catch (error: any) {
        console.error(`Error restoring tool call for ${toolCall.function.name}:`, error);
      }
    }

    return true;
  }, [eventHandler]);

  // Extracted restoration logic to avoid duplication
  const restoreConversationTimeline = useCallback(async () => {
    // Create abort controller for this loading operation
    const abortController = new AbortController();
    loadingAbortControllerRef.current = abortController;

    setIsLoading(true);
    setRestoreError(null);

    try {
      // Check if aborted before starting
      if (abortController.signal.aborted) {
        return;
      }

      const result = await chatService.restoreLatestConversation();

      // Check if aborted after async operation
      if (abortController.signal.aborted) {
        return;
      }

      if (result && result.messages.length > 0) {
        const { messages } = result;

        // Restore unfinished tool calls if any exist
        const timelineUpdated = await restoreUnfinishedToolCalls(messages, abortController);

        // Check if aborted before setting timeline
        if (abortController.signal.aborted) {
          return;
        }

        if (!timelineUpdated) {
          setTimeline(messages);
        }
      }
    } catch (error: any) {
      // Don't show error if aborted
      if (!abortController.signal.aborted) {
        console.error('Error restoring conversation:', error);
        setRestoreError(error.message || 'Failed to restore conversation');
      }
    } finally {
      // Only update loading state if not aborted
      if (!abortController.signal.aborted) {
        setIsLoading(false);
      }
      // Clear the abort controller reference
      if (loadingAbortControllerRef.current === abortController) {
        loadingAbortControllerRef.current = null;
      }
    }
  }, [chatService, restoreUnfinishedToolCalls]);

  // Restore timeline from latest conversation on component mount
  useEffect(() => {
    restoreConversationTimeline();
  }, [restoreConversationTimeline]);

  // Save conversation to history whenever timeline changes
  useEffect(() => {
    if (timeline.length > 0 && !isLoading) {
      chatService.saveConversation(timeline);
    }
  }, [timeline, chatService, isLoading]);

  // Clear thread ID so next mount can restore the latest conversation
  useUnmount(() => {
    services.core.chat.resetThreadId()
  });

  // Helper function to handle message streaming with observable subscription
  const subscribeToMessageStream = useCallback(async (
    messageContent: string,
    messages: Message[],
    rawMessage?: string
  ) => {
    isStreamingRef.current = true;
    setIsStreaming(true);
    setStartResponse(false);

    try {
      const { observable, userMessage } = await chatService.sendMessage(
        messageContent,
        messages
      );

      const timelineUserMessage: UserMessage = {
        id: userMessage.id,
        role: 'user',
        content: userMessage.content,
        rawMessage: Array.isArray(userMessage.content) ? undefined : rawMessage || messageContent,  // For regular messages, raw and content are the same
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
          setScreenshotData(undefined);
        },
      });

      // Store subscription for potential cancellation
      currentSubscriptionRef.current = subscription;

      return () => subscription.unsubscribe();
    } catch (error) {
      console.error('Failed to send message:', error);
      isStreamingRef.current = false;
      setIsStreaming(false);
      currentSubscriptionRef.current = null;
    }
  }, [chatService, currentRunId, eventHandler]);

  const handleSend = async (options?: {input?: string, messages?: Message[]}) => {
    const messageContent = options?.input ?? input.trim();
    // Use ref for immediate check since React 18 batches state updates
    if (!messageContent || isStreamingRef.current) return;

    // Prepare additional messages for sending (but don't add to timeline yet)
    let additionalMessages = options?.messages ?? [];

    // Only add screenshot data if messages not provided
    if (!options?.messages && screenshotData) {
        additionalMessages = [
          {
            role: 'user' as const,
            id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            content: [
              {
                type: 'binary' as const,
                mimeType: screenshotData.mimeType,
                data: screenshotData.base64,
              },
            ],
        }]
    }

    setInput('');

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

  const handleResendMessage = useCallback(async (message: Message) => {
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
  }, [timeline, subscribeToMessageStream, setInput, setTimeline]);

  const handleNewChat = useCallback(() => {
    chatService.newThread();
    setTimeline([]);
    setCurrentRunId(null);
    setIsStreaming(false);
    setPendingConfirmation(null);
    setShowHistory(false);
    setRestoreError(null);
  }, [chatService]);

  const handleStop = useCallback(() => {
    // Abort the current streaming request
    chatService.abort();
    // Unsubscribe from current observable if exists
    if (currentSubscriptionRef.current) {
      currentSubscriptionRef.current.unsubscribe();
      currentSubscriptionRef.current = null;
    }

    // Update streaming state (both ref and state for React 18 compatibility)
    isStreamingRef.current = false;
    setIsStreaming(false);
    setStartResponse(false);
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

  const handleCaptureScreenshot = useCallback(async ()=>{
    setScreenshotData(undefined);
    const imageData = await capturePageContainer();
    if(imageData){
      setScreenshotData({...imageData, pageTitle: document.title, createdAt: moment()});
    }

  }, [capturePageContainer]);

  const enhancedProps = useMemo(() => {
    return {
      toolCallStates,
      getActionRenderer: service.getActionRenderer,
    };
  }, [toolCallStates, service.getActionRenderer]);

  // Get conversation name from first user message with text content
  const conversationName = useMemo(() => {
    // Find first user message that has text content
    for (const msg of timeline) {
      if (msg.role !== 'user') continue;

      // Handle string content
      if (typeof msg.content === 'string' && msg.content.trim()) {
        return msg.content;
      }

      // Handle array content - look for text content
      if (Array.isArray(msg.content)) {
        const textContent = msg.content.find((item) => item.type === 'text');
        if (textContent?.text && textContent.text.trim()) {
          return textContent.text;
        }
      }
    }

    return '';
  }, [timeline]);

  const handleShowHistory = useCallback(() => {
    loadingAbortControllerRef.current?.abort();
    setIsLoading(false);
    setShowHistory(true);
    setRestoreError(null);
  }, []);

  const handleCloseHistory = useCallback(() => {
    // Abort any ongoing loading operation
    if (loadingAbortControllerRef.current) {
      loadingAbortControllerRef.current.abort();
      loadingAbortControllerRef.current = null;
    }

    // Reset loading state and show history panel
    setIsLoading(false);
    setShowHistory(false);
  }, []);

  const handleSelectConversation = useCallback(async (conversation: SavedConversation) => {
    // Create abort controller for this loading operation
    const abortController = new AbortController();
    loadingAbortControllerRef.current = abortController;

    setIsLoading(true);

    try {
      // Check if aborted before starting
      if (abortController.signal.aborted) {
        return;
      }

      // Load the conversation and get AG-UI event array
      const events = await chatService.loadConversation(conversation.threadId);

      // Check if aborted after async operation
      if (abortController.signal.aborted) {
        return;
      }

      if (events) {
        // Process each event through the event handler for proper state restoration
        for (const event of events) {
          await eventHandler.handleEvent(event);
        }

        // Reset UI state
        setCurrentRunId(null);
        setIsStreaming(false);
        setPendingConfirmation(null);
        setShowHistory(false);
      }
    } catch (error: any) {
      // Don't show error if aborted
      if (!abortController.signal.aborted) {
        toasts?.addWarning({
          title: i18n.translate('chat.window.loadConversationErrorTitle', {
            defaultMessage: 'Failed to load conversation',
          }),
          text:
            error instanceof Error
              ? error.message
              : i18n.translate('chat.window.loadConversationErrorMessage', {
                  defaultMessage: 'An unexpected error occurred while loading the conversation.',
                }),
        });
      }
    } finally {
      // Only update loading state if not aborted
      if (!abortController.signal.aborted) {
        setIsLoading(false);
      }
      // Clear the abort controller reference
      if (loadingAbortControllerRef.current === abortController) {
        loadingAbortControllerRef.current = null;
      }
    }
  }, [chatService, eventHandler, toasts]);

  const handleRetryRestore = useCallback(() => {
    restoreConversationTimeline();
  }, [restoreConversationTimeline]);

  // Build window instance object
  const windowInstance = useMemo<ChatWindowInstance>(() => ({
    startNewChat: () => handleNewChat(),
    sendMessage: async ({content, messages}) => (await handleSendRef.current?.({input:content, messages}))
  }), [handleNewChat]);

  // Expose instance methods via ref
  useImperativeHandle(ref, () => windowInstance, [windowInstance]);

  // Register with chatService and clean up on unmount
  useEffect(() => {
    chatService.setChatWindowInstance(windowInstance);

    return () => {
      chatService.clearChatWindowInstance();
    };
  }, [chatService, windowInstance]);

  return (
    <ChatContainer layoutMode={layoutMode}>
      <ChatHeader
        conversationName={conversationName}
        isStreaming={isStreaming}
        onNewChat={handleNewChat}
        onClose={onClose}
        onShowHistory={showHistory ? undefined : handleShowHistory}
        showBackButton={showHistory}
        onBack={showHistory ? handleCloseHistory : undefined}
        title={showHistory ? 'All conversations' : undefined}
      />

      {isLoading ? (
        <div className="chatWindow__loadingContainer">
          <EuiLoadingSpinner size="xl" />
          <EuiText color="subdued">
            {i18n.translate('chat.window.loadingMessage', {
              defaultMessage: 'Loading conversation...',
            })}
          </EuiText>
        </div>
      ) : restoreError ? (
        <div className="chatWindow__errorContainer">
          <EuiText color="danger" textAlign="center">
            <h3>
              {i18n.translate('chat.window.restoreErrorTitle', {
                defaultMessage: 'Failed to restore conversation',
              })}
            </h3>
            <p>{restoreError}</p>
          </EuiText>
          <EuiButton
            onClick={handleRetryRestore}
            iconType="refresh"
          >
            {i18n.translate('chat.window.retryButton', {
              defaultMessage: 'Retry',
            })}
          </EuiButton>
        </div>
      ) : showHistory ? (
        <ConversationHistoryPanel
          conversationHistoryService={chatService.conversationHistoryService}
          onSelectConversation={handleSelectConversation}
        />
      ) : (
        <ChatSessionErrorBoundary onStartNewSession={handleNewChat}>
          <ChatMessages
            layoutMode={layoutMode}
            timeline={timeline}
            isStreaming={isStreaming}
            onResendMessage={resendAvailable ? handleResendMessage : undefined}
            onApproveConfirmation={handleApproveConfirmation}
            onRejectConfirmation={handleRejectConfirmation}
            onFillInput={setInput}
            {...enhancedProps}
            startResponse={startResponse}
          />

          {
            (isCapturing || screenshotData) && (
              <div className={`chatWindow__screenshotRow ${!screenshotData && isCapturing ? 'capturing' : ''}`}>
                {
                  screenshotData && (
                    <>
                      <img src={`data:${screenshotData.mimeType || 'image/jpeg'};base64,${screenshotData.base64}`} alt={`Screenshot of ${screenshotData.pageTitle}`} />
                      <div className='chatWindow__screenshotRow__right'>
                        <div className='chatWindow__screenshotRow__right__pageTitle'>
                          <EuiText size='xs'>{screenshotData.pageTitle}</EuiText>
                        </div>
                        <div className='chatWindow__screenshotRow__right__timeAndButtons'>
                          <div />
                          <div>
                            <EuiButtonIcon disabled={isStreaming} color='text' onClick={handleCaptureScreenshot} iconType="refresh" size='xs' aria-label='Recapture' />
                            <EuiButtonIcon disabled={isStreaming} color='text' onClick={()=>{setScreenshotData(undefined)}} iconType="cross" size='xs' aria-label='Remove screenshot' />
                          </div>
                        </div>
                      </div>
                    </>
                  )
                }
                {
                  isCapturing && !screenshotData && (
                    <EuiLoadingSpinner size='m' />
                  )
                }
              </div>
            )
          }

          <ChatInput
            layoutMode={layoutMode}
            input={input}
            isCapturing={isCapturing}
            isStreaming={isStreaming}
            isSendingToolResult={isSendingToolResult}
            onInputChange={setInput}
            onSend={handleSend}
            onStop={handleStop}
            onKeyDown={handleKeyDown}
            includeScreenShotEnabled={screenshotFeatureEnabled}
            onCaptureScreenshot={handleCaptureScreenshot}
          />
        </ChatSessionErrorBoundary>
      )}
    </ChatContainer>
  );
});
