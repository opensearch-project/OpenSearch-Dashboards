/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {
  useState,
  useEffect,
  useMemo,
  useImperativeHandle,
  useCallback,
  useRef,
} from 'react';
import { useUnmount, useMount } from 'react-use';
import moment from 'moment';
import { i18n } from '@osd/i18n';
import { EuiButton, EuiButtonIcon, EuiLoadingSpinner, EuiText } from '@elastic/eui';
import { useChatContext } from '../contexts/chat_context';
import { AssistantActionService } from '../../../context_provider/public';
import { ConfirmationRequest } from '../services/confirmation_service';
import type {
  Message,
  SystemMessage,
  UserMessage,
} from '../../common/types';
import { ChatLayoutMode } from '../types';
import { ChatContainer } from './chat_container';
import { ChatHeader } from './chat_header';
import { ChatMessages } from './chat_messages';
import { ChatInput } from './chat_input';
import { slashCommandRegistry } from '../services/slash_commands';
import {
  usePageContainerCapture,
  PageContainerImageData,
} from '../hooks/use_page_container_capture';
import { useChatStreaming } from '../hooks/use_chat_streaming';
import { ConversationHistoryPanel } from './conversation_history_panel';
import type { SavedConversation } from '../services/conversation_history_service';
import { useOpenSearchDashboards } from '../../../opensearch_dashboards_react/public';
import { CoreStart } from '../../../../core/public';
import { ChatSessionErrorBoundary } from './chat_session_error_boundary';
import './chat_window.scss';

export interface ChatWindowInstance {
  startNewChat: () => void;
  sendMessage: (options: { content: string; messages?: Message[] }) => Promise<unknown>;
}

interface ChatWindowProps {
  layoutMode?: ChatLayoutMode;
  onClose: () => void;
}

/**
 * ChatWindow with AssistantAction support
 */
export const ChatWindow = React.forwardRef<ChatWindowInstance, ChatWindowProps>((props, ref) => {
  return <ChatWindowContent ref={ref} {...props} />;
});

const ChatWindowContent = React.forwardRef<ChatWindowInstance, ChatWindowProps>(
  ({ layoutMode = ChatLayoutMode.SIDECAR, onClose }, ref) => {
    const service = AssistantActionService.getInstance();
    const { chatService, confirmationService } = useChatContext();
    const { services } = useOpenSearchDashboards<{ core: CoreStart }>();
    const toasts = services.core?.notifications?.toasts;
    const [input, setInput] = useState('');
    const [pendingConfirmation, setPendingConfirmation] = useState<ConfirmationRequest | null>(
      null
    );
    const [showHistory, setShowHistory] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const handleSendRef = useRef<typeof handleSend>();
    const conversationLoadAbortControllerRef = useRef<AbortController | null>(null);
    const {
      screenshotFeatureEnabled,
      isCapturing,
      capturePageContainer,
    } = usePageContainerCapture();
    const [screenshotData, setScreenshotData] = useState<
      { pageTitle: string; createdAt: moment.Moment } & PageContainerImageData
    >();
    const [toolCallStates, setToolCallStates] = useState<Map<string, any>>(new Map());
    const resendAvailable = !!chatService.conversationHistoryService.getMemoryProvider()
      .includeFullHistory;
    const hasActiveToolCalls = useMemo(() => {
      if (toolCallStates instanceof Map) {
        for (const state of toolCallStates.values()) {
          if (state.status === 'pending' || state.status === 'executing') return true;
        }
      }
      return false;
    }, [toolCallStates]);
    const hasActiveToolCallsRef = useRef(false);
    hasActiveToolCallsRef.current = hasActiveToolCalls;

    // Get telemetry recorder from core services
    const telemetryRecorder = useMemo(() => services.core?.telemetry?.getPluginRecorder('chat'), [
      services.core?.telemetry,
    ]);

    // Use the streaming hook
    const {
      timeline,
      setTimeline,
      isStreaming,
      isStreamingRef,
      startResponse,
      setCurrentRunId,
      eventHandler,
      subscribeToMessageStream,
      stopStreaming,
      sendToolResult,
    } = useChatStreaming({
      chatService,
      confirmationService,
      telemetryRecorder,
      onMessageSent: () => setScreenshotData(undefined),
    });

    const hasPendingResend = useMemo(
      () => timeline.some((msg) => msg.role === 'system' && (msg as SystemMessage).canResend),
      [timeline]
    );

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

    // Initialize with fresh conversation on mount
    useMount(() => {
      chatService.newThread();
    });

    // Save conversation to history whenever timeline changes
    useEffect(() => {
      if (timeline.length > 0 && !isLoading) {
        chatService.saveConversation(timeline);
      }
    }, [timeline, chatService, isLoading]);

    // Clear thread ID on unmount to start fresh next time
    useUnmount(() => {
      services.core.chat.resetThreadId();
    });

    // Cache data source compatibility check to avoid network call on every message
    const unsupportedDataSourceRef = useRef<{
      dataSourceId: string | undefined;
      result: boolean;
    } | null>(null);

    const isUnsupportedDataSource = useCallback(async (): Promise<boolean> => {
      try {
        const dataSourceId = await chatService.getCurrentDataSourceId();
        if (!dataSourceId) return false;
        // Return cached result if data source hasn't changed
        if (unsupportedDataSourceRef.current?.dataSourceId === dataSourceId) {
          return unsupportedDataSourceRef.current.result;
        }
        const savedObjectsClient = services.core?.savedObjects?.client;
        if (!savedObjectsClient) return false;
        const ds = await savedObjectsClient.get<{ dataSourceEngineType?: string }>(
          'data-source',
          dataSourceId
        );
        const result = ds?.attributes?.dataSourceEngineType === 'AnalyticEngine';
        unsupportedDataSourceRef.current = { dataSourceId, result };
        return result;
      } catch {
        // Fail-open: transient errors should not block AI features
        return false;
      }
    }, [chatService, services.core?.savedObjects?.client]);

    const handleSend = async (options?: { input?: string; messages?: Message[] }) => {
      const messageContent = options?.input ?? input.trim();
      // Use ref for immediate check since React 18 batches state updates
      if (!messageContent || isStreamingRef.current || hasPendingResend) return;

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
          },
        ];
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

      // Block AI features for unsupported data sources
      if (await isUnsupportedDataSource()) {
        const userMsg: UserMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          role: 'user',
          content: messageContent,
          rawMessage: messageContent,
        };
        const systemMsg: SystemMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          role: 'system',
          content: i18n.translate('chat.dataSourceUnsupported', {
            defaultMessage: 'The current data source does not support AI features.',
          }),
        };
        setTimeline((prev) => [...prev, userMsg, systemMsg]);
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

    const handleResendMessage = useCallback(
      async (message: Message) => {
        // Use ref for immediate check since React 18 batches state updates
        if (isStreamingRef.current) return;

        // Only user messages can be resent
        if (message.role !== 'user') return;

        // Find the index of this message in the timeline
        const messageIndex = timeline.findIndex((item) => item.id === message.id);

        if (messageIndex === -1) return;

        let textContent = typeof message.content === 'string' ? message.content : '';
        const additionalMessages: Message[] = [];

        if (Array.isArray(message.content)) {
          const lastMessageContent = message.content[message.content.length - 1];
          if (lastMessageContent.type === 'text') {
            textContent = lastMessageContent.text;
            additionalMessages.push({
              ...message,
              content: message.content.slice(0, message.content.length - 1),
            });
          }
        }

        if (textContent === '') {
          return;
        }

        // Remove this message and everything after it from the timeline
        const truncatedTimeline = timeline.slice(0, messageIndex);
        setTimeline(truncatedTimeline);

        // Clear any streaming state and input
        setInput('');

        subscribeToMessageStream(textContent, [...truncatedTimeline, ...additionalMessages]);
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [timeline, subscribeToMessageStream, setInput, setTimeline]
    );

    const handleNewChat = useCallback(() => {
      // Stop any ongoing streaming before starting a new chat
      stopStreaming();

      chatService.newThread();
      setTimeline([]);
      setCurrentRunId(null);
      setPendingConfirmation(null);
      confirmationService.cleanAll();
      setShowHistory(false);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chatService, confirmationService, stopStreaming]);

    const handleStop = useCallback(() => {
      stopStreaming();
    }, [stopStreaming]);

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

    const handleCaptureScreenshot = useCallback(async () => {
      setScreenshotData(undefined);
      const imageData = await capturePageContainer();
      if (imageData) {
        setScreenshotData({ ...imageData, pageTitle: document.title, createdAt: moment() });
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
      setShowHistory(true);
    }, []);

    const handleCloseHistory = useCallback(() => {
      setShowHistory(false);
    }, []);

    const handleSelectConversation = useCallback(
      async (conversation: SavedConversation) => {
        // Stop any ongoing streaming before switching conversations
        stopStreaming();

        // Abort any ongoing conversation loading
        if (conversationLoadAbortControllerRef.current) {
          conversationLoadAbortControllerRef.current.abort();
        }

        // Create new abort controller for this load operation
        const abortController = new AbortController();
        conversationLoadAbortControllerRef.current = abortController;

        setIsLoading(true);

        try {
          // Load the conversation and get AG-UI event array
          const events = await chatService.loadConversation(conversation.threadId);

          // Check if this load was aborted (user switched to another conversation)
          if (abortController.signal.aborted) {
            return;
          }

          if (events) {
            // Reset UI state
            eventHandler.clearState();
            setCurrentRunId(null);
            setPendingConfirmation(null);
            confirmationService.cleanAll();
            setShowHistory(false);
            setIsLoading(false);

            // Replay all events to reconstruct the conversation
            for (const event of events) {
              // Check abort signal during replay
              if (abortController.signal.aborted) {
                return;
              }
              await eventHandler.handleEvent(event);
            }
          }
        } catch (error: any) {
          if (!abortController.signal.aborted) {
            toasts?.addWarning({
              title: i18n.translate('chat.window.loadConversationErrorTitle', {
                defaultMessage: 'Failed to load conversation',
              }),
              text:
                error instanceof Error
                  ? error.message
                  : i18n.translate('chat.window.loadConversationErrorMessage', {
                      defaultMessage:
                        'An unexpected error occurred while loading the conversation.',
                    }),
            });
          }
        } finally {
          if (!abortController.signal.aborted) {
            setIsLoading(false);
          }
          // Clear abort controller reference
          if (conversationLoadAbortControllerRef.current === abortController) {
            conversationLoadAbortControllerRef.current = null;
          }
        }
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [chatService, eventHandler, confirmationService, toasts, stopStreaming]
    );

    const windowInstance = useMemo<ChatWindowInstance>(
      () => ({
        startNewChat: () => handleNewChat(),
        sendMessage: async ({ content, messages }) =>
          await handleSendRef.current?.({ input: content, messages }),
      }),
      [handleNewChat]
    );

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
              onResendToolResult={sendToolResult}
              onApproveConfirmation={handleApproveConfirmation}
              onRejectConfirmation={handleRejectConfirmation}
              onFillInput={setInput}
              threadId={chatService.getThreadId()}
              onShowHistory={handleShowHistory}
              conversationHistoryService={chatService.conversationHistoryService}
              onSelectConversation={handleSelectConversation}
              {...enhancedProps}
              startResponse={startResponse}
            />

            {(isCapturing || screenshotData) && (
              <div
                className={`chatWindow__screenshotRow ${
                  !screenshotData && isCapturing ? 'capturing' : ''
                }`}
              >
                {screenshotData && (
                  <>
                    <img
                      src={`data:${screenshotData.mimeType || 'image/jpeg'};base64,${
                        screenshotData.base64
                      }`}
                      alt={`Screenshot of ${screenshotData.pageTitle}`}
                    />
                    <div className="chatWindow__screenshotRow__right">
                      <div className="chatWindow__screenshotRow__right__pageTitle">
                        <EuiText size="xs">{screenshotData.pageTitle}</EuiText>
                      </div>
                      <div className="chatWindow__screenshotRow__right__timeAndButtons">
                        <div />
                        <div>
                          <EuiButtonIcon
                            disabled={isStreaming}
                            color="text"
                            onClick={handleCaptureScreenshot}
                            iconType="refresh"
                            size="xs"
                            aria-label="Recapture"
                          />
                          <EuiButtonIcon
                            disabled={isStreaming}
                            color="text"
                            onClick={() => {
                              setScreenshotData(undefined);
                            }}
                            iconType="cross"
                            size="xs"
                            aria-label="Remove screenshot"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
                {isCapturing && !screenshotData && <EuiLoadingSpinner size="m" />}
              </div>
            )}

            <ChatInput
              layoutMode={layoutMode}
              input={input}
              isCapturing={isCapturing}
              isStreaming={isStreaming}
              disabled={hasActiveToolCalls || hasPendingResend || !!pendingConfirmation}
              placeholder={
                pendingConfirmation
                  ? i18n.translate('chat.input.waitingForConfirmation', {
                      defaultMessage: 'Waiting for confirmation...',
                    })
                  : hasPendingResend
                  ? i18n.translate('chat.input.pendingResend', {
                      defaultMessage: 'Resend the tool result to continue...',
                    })
                  : hasActiveToolCalls
                  ? i18n.translate('chat.input.waitingForToolExecution', {
                      defaultMessage: 'Waiting for tool execution...',
                    })
                  : undefined
              }
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
  }
);
