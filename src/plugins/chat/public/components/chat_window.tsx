/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable no-console */

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
import { EuiButtonIcon, EuiLoadingSpinner, EuiText } from '@elastic/eui';
import { useChatContext } from '../contexts/chat_context';
import { ChatEventHandler } from '../services/chat_event_handler';
import { AssistantActionService } from '../../../context_provider/public';
import { ConfirmationRequest } from '../services/confirmation_service';
import { AskUserRequest } from '../services/human_input_service';
import { type Event as ChatEvent, EventType } from '../../common/events';
import type { InputContent, Message, SystemMessage, UserMessage } from '../../common/types';
import { ChatLayoutMode } from '../types';
import { ChatContainer } from './chat_container';
import { ChatHeader } from './chat_header';
import { ChatMessages } from './chat_messages';
import { ChatInput } from './chat_input';
import { slashCommandRegistry } from '../services/slash_commands';
import type { DataSourceInfo, SendDataSourceResolution } from '../services/chat_service';
import {
  usePageContainerCapture,
  PageContainerImageData,
} from '../hooks/use_page_container_capture';
import { ConversationHistoryPanel } from './conversation_history_panel';
import type { SavedConversation } from '../services/conversation_history_service';
import { useOpenSearchDashboards } from '../../../opensearch_dashboards_react/public';
import { CoreStart } from '../../../../core/public';
import { ChatSessionErrorBoundary } from './chat_session_error_boundary';

import { flattenContentText } from '../utils/user_message_input';
import { useSwitchDataSourceAction } from '../actions/switch_data_source_action';
import { isImeComposing } from '../../../../core/public/utils';
import './chat_window.scss';

export interface ChatWindowInstance {
  startNewChat: () => void;
  sendMessage: (options: {
    content: string | InputContent[];
    messages?: Message[];
  }) => Promise<unknown>;
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
    const { chatService, confirmationService, humanInputService } = useChatContext();
    const { services } = useOpenSearchDashboards<{ core: CoreStart }>();
    const toasts = services.core?.notifications?.toasts;

    // Register the switch_data_source tool so the LLM can request a data source switch mid-conversation
    useSwitchDataSourceAction(chatService);
    const [timeline, setTimeline] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [currentRunId, setCurrentRunId] = useState<string | null>(null);
    const [pendingConfirmation, setPendingConfirmation] = useState<ConfirmationRequest | null>(
      null
    );
    const [pendingAskUser, setPendingAskUser] = useState<AskUserRequest | null>(null);
    const [showHistory, setShowHistory] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const handleSendRef = useRef<typeof handleSend>();
    const currentSubscriptionRef = useRef<any>(null);
    const chatInputRef = useRef<HTMLTextAreaElement>(null);
    const { screenshotFeatureEnabled, isCapturing, capturePageContainer } =
      usePageContainerCapture();
    const [screenshotData, setScreenshotData] = useState<
      { pageTitle: string; createdAt: moment.Moment } & PageContainerImageData
    >();
    const [toolCallStates, setToolCallStates] = useState<Map<string, any>>(new Map());
    const resendAvailable =
      !!chatService.conversationHistoryService.getMemoryProvider().includeFullHistory;
    const [startResponse, setStartResponse] = useState(false);
    // The data source picker shown for a send whose data source must be chosen first: the
    // pending user message (already in the timeline) and the options to pick from.
    const [dataSourcePrompt, setDataSourcePrompt] = useState<{
      message: UserMessage;
      options: DataSourceInfo[];
    } | null>(null);
    const [isValidating, setIsValidating] = useState(false);
    // Explicit conversation title: the agent-generated title from the
    // conversation_title CUSTOM event, or the saved name restored from history
    // (which may itself be the first-user-message fallback). Empty means "derive
    // the name from the timeline".
    const [conversationTitle, setConversationTitle] = useState<string>('');

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

    const hasPendingResend = useMemo(
      () => timeline.some((msg) => msg.role === 'system' && (msg as SystemMessage).canResend),
      [timeline]
    );

    // Use ref to track streaming state synchronously for React 18 compatibility
    // React 18 batches state updates, so we need a ref for immediate checks
    const isStreamingRef = useRef(false);
    const isValidatingRef = useRef(false);
    const isLoadingRef = useRef(false);
    const setLoading = useCallback((loading: boolean) => {
      isLoadingRef.current = loading;
      setIsLoading(loading);
    }, []);

    const timelineRef = React.useRef<Message[]>(timeline);

    // Wrap setTimeline so timelineRef updates synchronously within the updater, before React renders.
    const setTimelineSynced = useCallback(
      (updater: Message[] | ((prev: Message[]) => Message[])) => {
        // A replacement value is known now: update the ref right away, so a send in the same
        // tick (e.g. New chat followed by a window-instance send) does not read the old one.
        if (typeof updater !== 'function') timelineRef.current = updater;
        setTimeline((prev) => {
          const next = typeof updater === 'function' ? updater(prev) : updater;
          timelineRef.current = next;
          return next;
        });
      },
      []
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

    // Track a pending ask_user question only to lock the composer; the question
    // UI is rendered inline at its tool-call position by InlineAskUser, not here.
    useEffect(() => {
      const subscription = humanInputService.getPending$().subscribe((requests) => {
        setPendingAskUser(requests.length > 0 ? requests[0] : null);
      });

      return () => subscription.unsubscribe();
    }, [humanInputService]);

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
            onTimelineUpdate: setTimelineSynced,
            onStreamingStateChange: setIsStreaming,
            onStartResponse: setStartResponse,
            getTimeline: () => timelineRef.current,
            onConversationTitle: setConversationTitle,
          },
        }),
      [service, chatService, confirmationService, telemetryRecorder, setTimelineSynced]
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

    // Clean up event handler and human input service on component unmount
    useEffect(() => {
      return () => {
        humanInputService.cleanAll();
        eventHandler.clearState();
      };
    }, [eventHandler, humanInputService]);

    // Initialize with fresh conversation on mount
    useMount(() => {
      chatService.newThread();

      // Record window show telemetry
      if (telemetryRecorder) {
        telemetryRecorder.recordEvent({
          name: 'chat_window_show',
          data: {},
        });
      }
    });

    // Save conversation to history whenever timeline changes
    useEffect(() => {
      if (timeline.length > 0 && !isLoading) {
        chatService.saveConversation(timeline, conversationTitle || undefined);
      }
    }, [timeline, chatService, isLoading, conversationTitle]);

    // Clear thread ID and pending data source selection on unmount
    useUnmount(() => {
      chatService.closeConversation();
      setDataSourcePrompt(null);

      // Record window hide telemetry
      if (telemetryRecorder) {
        telemetryRecorder.recordEvent({
          name: 'chat_window_hide',
          data: {},
        });
      }
    });

    // Helper function to handle message streaming with observable subscription
    const subscribeToMessageStream = useCallback(
      async (messages: Message[], userMessage: UserMessage, signal: AbortSignal) => {
        // Drop a send whose conversation the user has left. This must run before
        // chatService.sendMessage(), which registers the request as active.
        if (signal.aborted) return;
        isStreamingRef.current = true;
        setIsStreaming(true);
        setStartResponse(false);

        const content = flattenContentText(userMessage.content);

        try {
          const { observable, dropped } = await chatService.sendMessage(
            content,
            messages,
            userMessage,
            signal
          );
          // The user left this conversation while sendMessage() resolved the data source.
          // Leaving the conversation already reset the streaming state.
          if (dropped) return;

          setScreenshotData(undefined);

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
              eventHandler.handleStreamTermination();
              isStreamingRef.current = false;
              setStartResponse(false);
              setIsStreaming(false);
              currentSubscriptionRef.current = null;
            },
            complete: () => {
              eventHandler.handleStreamTermination();
              isStreamingRef.current = false;
              setStartResponse(false);
              setIsStreaming(false);
              currentSubscriptionRef.current = null;
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
      },
      [chatService, currentRunId, eventHandler]
    );

    /**
     * Execute a slash command and update the timeline accordingly.
     * @param messageContent - The raw user input (e.g. "/search-relevance query")
     * @param messagesToSend - The message history (excluding the user message) to pass to subscribeToMessageStream
     * @param userMessage - The user message already in the timeline. It is replaced (by id) with
     *   the resolved command message.
     * @param signal - The conversation this send belongs to
     * @returns true if the command was handled, false otherwise
     */
    const executeSlashCommand = useCallback(
      async (
        messageContent: string,
        messagesToSend: Message[],
        userMessage: UserMessage,
        signal: AbortSignal
      ): Promise<boolean> => {
        const commandResult = await slashCommandRegistry.execute(messageContent);
        // The command handler has already run; only its follow-up (timeline update and
        // stream) is dropped. Report a stale send as handled so the caller stops too.
        if (signal.aborted) return true;
        if (!commandResult.handled) return false;

        if (commandResult.localMessage) {
          const role = commandResult.role ?? 'system';
          const responseMsg: Message = {
            id: chatService.generateMessageId(),
            role,
            content: commandResult.localMessage,
            ...(role === 'system' && commandResult.title && { title: commandResult.title }),
          };
          setTimelineSynced((prev) => [...prev, responseMsg]);
          setScreenshotData(undefined);
          return true;
        }
        if (commandResult.message) {
          const commandMsg = chatService.getUserMessage(commandResult.message, messageContent);
          // Replace the user message (by id) with the resolved command message
          setTimelineSynced((prev) =>
            prev.map((msg) => (msg.id === userMessage.id ? commandMsg : msg))
          );
          subscribeToMessageStream(messagesToSend, commandMsg, signal);
          return true;
        }
        return true;
      },
      [chatService, subscribeToMessageStream, setTimelineSynced]
    );

    /**
     * Show the outcome of a data source resolution that stops the send: a notice in the
     * timeline, or the data source picker (handleDataSourceSelect continues the send).
     */
    const showDataSourceResolution = useCallback(
      (resolution: SendDataSourceResolution, userMsg: UserMessage) => {
        if (resolution.status === 'unsupported') {
          const systemMsg: SystemMessage = {
            id: chatService.generateMessageId(),
            role: 'system',
            content: i18n.translate('chat.dataSourceUnsupported', {
              defaultMessage: 'The current data source does not support AI features.',
            }),
          };
          setTimelineSynced((prev) => [...prev, systemMsg]);
        } else if (resolution.status === 'needs_selection') {
          // The user message is already in the timeline; handleDataSourceSelect continues.
          setDataSourcePrompt({ message: userMsg, options: resolution.options });
        } else if (resolution.status === 'none') {
          const infoMsg: Message = {
            id: chatService.generateMessageId(),
            role: 'assistant',
            content: i18n.translate('chat.noDataSourceMessage', {
              defaultMessage:
                'There are no data sources associated with this workspace. Please ask your workspace admin to associate data sources to this workspace.',
            }),
          };
          setTimelineSynced((prev) => [...prev, infoMsg]);
        }
      },
      [chatService, setTimelineSynced]
    );

    /**
     * Send a user message that is already in the timeline: resolve its data source (when
     * `validate`), run it as a slash command if it is one, otherwise stream it.
     *
     * `signal` is the conversation the send belongs to, taken by the caller before any await.
     * Once it is aborted (the user left the conversation) the send stops, and it does not
     * touch state the next conversation now owns, such as the validating flag.
     */
    const runSend = useCallback(
      async ({
        userMsg,
        history,
        signal,
        validate,
      }: {
        userMsg: UserMessage;
        history: Message[];
        signal: AbortSignal;
        validate: boolean;
      }) => {
        if (validate) {
          isValidatingRef.current = true;
          setIsValidating(true);
        }
        try {
          if (validate) {
            const resolution = await chatService.resolveSendDataSource(signal);
            if (signal.aborted) return;
            if (resolution.status !== 'ok') {
              showDataSourceResolution(resolution, userMsg);
              return;
            }
          }

          // Only plain-text input can be a slash command (a multimodal message carries an
          // image block).
          if (typeof userMsg.content === 'string') {
            const handled = await executeSlashCommand(userMsg.content, history, userMsg, signal);
            if (handled) return;
          }

          // Not awaited: streaming starts synchronously, which ends the validating phase in
          // the finally block below, so "Connecting..." and "Thinking..." never show together.
          return subscribeToMessageStream(history, userMsg, signal);
        } finally {
          if (validate && !signal.aborted) {
            isValidatingRef.current = false;
            setIsValidating(false);
          }
        }
      },
      [chatService, executeSlashCommand, showDataSourceResolution, subscribeToMessageStream]
    );

    // A new send or resend can start only when the conversation is idle.
    const canStartSend = useCallback(
      () => !isStreamingRef.current && !isValidatingRef.current && !isLoadingRef.current,
      []
    );

    // Handler for when user selects a data source from the prompt
    const handleDataSourceSelect = useCallback(
      async (id: string) => {
        const signal = chatService.getConversationSignal();
        chatService.setDataSourceId(id);
        const prompt = dataSourcePrompt;
        setDataSourcePrompt(null);
        if (!prompt) return;

        // The pending user message is already the last timeline item
        await runSend({
          userMsg: prompt.message,
          history: timeline.slice(0, -1),
          signal,
          validate: false,
        });
      },
      [chatService, dataSourcePrompt, runSend, timeline]
    );

    const handleSend = async (options?: {
      input?: string | InputContent[];
      messages?: Message[];
    }) => {
      let messageContent: string | InputContent[] = options?.input ?? input.trim();

      const isEmpty = Array.isArray(messageContent) ? messageContent.length === 0 : !messageContent;
      // Refs give an immediate check since React 18 batches state updates. The loading check
      // also drops a window-instance send that arrives while a history conversation loads.
      if (isEmpty || !canStartSend() || hasPendingResend) return;

      // Pin this send to the current conversation before the first await below.
      const signal = chatService.getConversationSignal();

      // Prepare additional messages for sending (but don't add to timeline yet)
      const additionalMessages = options?.messages ?? [];

      // Merge the screenshot INTO the user message content rather than sending it as a separate
      // message. A separate message is dropped on the delta-only send path (only the single user
      // message is transmitted when full history is off), so the agent would never see the image.
      if (!options?.input && typeof messageContent === 'string' && screenshotData) {
        messageContent = [
          // binary is deprecated on the wire; the agent server upgrades it to an image block.
          {
            type: 'binary' as const,
            mimeType: screenshotData.mimeType,
            data: screenshotData.base64,
          },
          { type: 'text' as const, text: messageContent },
        ];
      }

      setInput('');

      // Read the history from the ref, not this render's `timeline`: a window-instance send can
      // run in the same tick as the New chat that cleared it.
      const history = [...timelineRef.current, ...additionalMessages];

      // Show user message immediately (optimistic rendering)
      const userMsg = chatService.getUserMessage(messageContent);
      setTimelineSynced((prev) => [...prev, userMsg]);

      return runSend({
        userMsg,
        history,
        signal,
        validate: true,
      });
    };

    handleSendRef.current = handleSend;

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && !isImeComposing(e)) {
        e.preventDefault();
        handleSend();
      }
    };

    const handleResendMessage = useCallback(
      async (message: Message) => {
        if (!canStartSend()) return;

        // Pin the resend to the current conversation, like a normal send.
        const signal = chatService.getConversationSignal();

        // Only user messages can be resent
        if (message.role !== 'user') return;

        // Find the index of this message in the timeline
        const messageIndex = timeline.findIndex((item) => item.id === message.id);

        if (messageIndex === -1) return;

        const content = message.content;
        const isEmpty = Array.isArray(content) ? content.length === 0 : !content;
        if (isEmpty) {
          return;
        }

        // Remove this message and everything after it from the timeline
        const truncatedTimeline = timeline.slice(0, messageIndex);

        // Clear any streaming state and input
        setInput('');

        // Add user message back and stream
        const userMsg = chatService.getUserMessage(content);
        setTimelineSynced([...truncatedTimeline, userMsg]);
        await subscribeToMessageStream(truncatedTimeline, userMsg, signal);
      },
      [canStartSend, timeline, subscribeToMessageStream, setInput, setTimelineSynced, chatService]
    );

    const handleResendToolResult = useCallback(
      async ({
        messageId,
        toolCallId,
        toolResult,
      }: {
        messageId: string;
        toolCallId: string;
        toolResult: any;
      }) => {
        // Avoid concurrent resends while streaming or already sending a tool result
        if (isStreamingRef.current || hasActiveToolCallsRef.current) return;
        // Remove the error message from timeline
        setTimelineSynced((prev) => prev.filter((msg) => msg.id !== messageId));
        // If toolResult is a batch array (from sendToolResultsToAssistant's sync_timeout),
        // dispatch it through the batched path so each item's toolCallId is preserved.
        if (Array.isArray(toolResult)) {
          await eventHandler.sendToolResultsToAssistant(toolResult);
        } else {
          await eventHandler.sendToolResultToAssistant(toolCallId, toolResult);
        }
      },
      [eventHandler, setTimelineSynced]
    );

    // Helper function to stop streaming and clean up subscriptions
    const stopStreaming = useCallback(() => {
      // Mark the streaming message as halted before tearing down, so the user immediately sees
      // "partial answer + stop line" — matching what the agent server persists for the reload.
      eventHandler.markStreamingMessageHalted();
      // Abort the current streaming request
      chatService.abort();
      // Unsubscribe from current observable if exists
      if (currentSubscriptionRef.current) {
        currentSubscriptionRef.current.unsubscribe();
        currentSubscriptionRef.current = null;
      }

      // Cancel any in-flight tool result dispatch
      eventHandler.cancelToolResultDispatch();

      // Update streaming state (both ref and state for React 18 compatibility)
      isStreamingRef.current = false;
      setIsStreaming(false);
      setStartResponse(false);
    }, [chatService, eventHandler]);

    // Reset the UI state of the conversation being left. The service abandons that
    // conversation's async work when the chat enters the next one (newThread /
    // openConversation), and every send checks its signal, so nothing here needs to
    // remember which send or load is still in flight.
    const leaveConversation = useCallback(() => {
      stopStreaming();
      // Clear all event handler state (pending tool calls, assistant messages,
      // and toolCallStates) so stale pending/executing entries from the previous
      // run do not keep the input disabled in the next conversation.
      eventHandler.clearState();
      setCurrentRunId(null);
      setPendingConfirmation(null);
      setPendingAskUser(null);
      confirmationService.cleanAll();
      humanInputService.cleanAll();
      setDataSourcePrompt(null);
      isValidatingRef.current = false;
      setIsValidating(false);
    }, [confirmationService, eventHandler, humanInputService, stopStreaming]);

    const handleNewChat = useCallback(() => {
      leaveConversation();
      chatService.newThread();
      setTimelineSynced([]);
      setConversationTitle('');
      // A history load that was in flight is abandoned by newThread()
      setLoading(false);
      setShowHistory(false);
    }, [chatService, leaveConversation, setLoading, setTimelineSynced]);

    const handleStop = useCallback(() => {
      stopStreaming();
    }, [stopStreaming]);

    const handleApproveConfirmation = useCallback(
      (modifiedArgs?: any) => {
        if (pendingConfirmation) {
          confirmationService.approve(pendingConfirmation.id, modifiedArgs);
        }
      },
      [pendingConfirmation, confirmationService]
    );

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

    const handleAttachScreenshot = useCallback(
      (attach: boolean) => {
        if (attach && screenshotFeatureEnabled) {
          handleCaptureScreenshot();
          return;
        }
        setScreenshotData(undefined);
      },
      [handleCaptureScreenshot, screenshotFeatureEnabled]
    );

    const enhancedProps = useMemo(() => {
      return {
        toolCallStates,
        getActionRenderer: service.getActionRenderer,
      };
    }, [toolCallStates, service.getActionRenderer]);

    // Get conversation name: prefer the explicit conversationTitle (the agent's
    // conversation_title CUSTOM event, or the name restored from history);
    // otherwise fall back to the first user message text content. The inline
    // CONVERSATION_TITLE: line is only stripped from displayed content, never
    // parsed as a title source here.
    const conversationName = useMemo(() => {
      if (conversationTitle) {
        return conversationTitle;
      }

      // Fallback: find first user message that has text content
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
    }, [timeline, conversationTitle]);

    const handleShowHistory = useCallback(() => {
      setShowHistory(true);
    }, []);

    const handleCloseHistory = useCallback(() => {
      setShowHistory(false);
    }, []);

    const handleSelectConversation = useCallback(
      async (conversation: SavedConversation) => {
        leaveConversation();
        setLoading(true);

        // Enter the conversation. Its signal is aborted once the chat enters another one
        // (New chat, another history conversation), which also abandons this load.
        const { signal, events: eventsPromise } = chatService.openConversation(
          conversation.threadId
        );
        try {
          const events = await eventsPromise;
          if (!events) return;

          // Reset state that may have been set while the conversation was loading
          eventHandler.clearState();
          setCurrentRunId(null);
          setPendingConfirmation(null);
          setPendingAskUser(null);
          confirmationService.cleanAll();
          humanInputService.cleanAll();
          // Restore the saved conversation name (which may be the generated
          // title or the first-user-message fallback). The name lives on the
          // SavedConversation object but is not included in the replayed
          // AG-UI events, so we must set it explicitly here.
          setConversationTitle(conversation.name || '');
          setShowHistory(false);
          // Keep the loading state until the replay below finishes (the finally block
          // clears it), so the composer only comes back once the timeline is fully
          // restored; a send started earlier would carry a partial history. This relies
          // on TOOL_CALL_END not being awaited below: a frontend tool that waits on the
          // user (confirmation, ask_user) keeps running after the replay instead of
          // holding the loading state.

          // Replay all events to reconstruct the conversation.
          //
          // TOOL_CALL_END is dispatched WITHOUT awaiting. A halt-type frontend
          // tool (e.g. `ask_user`) blocks inside handleToolCallEnd on
          // humanInputService.ask() until the user answers, which never happens
          // during replay. Awaiting it would stall the loop on the first such
          // tool, so the synthetic events for the remaining parallel tool calls
          // would never be consumed — only one ask_user card would appear. This
          // mirrors the live path, where the RxJS subscriber's async `next` does
          // not await handleEvent, letting parallel tool calls register
          // concurrently. All other events stay awaited to preserve order.
          for (const event of events) {
            // The user left this conversation during the replay
            if (signal.aborted) {
              return;
            }
            if (event.type === EventType.TOOL_CALL_END) {
              // Fire-and-forget: let parallel halt-type tools register together.
              void eventHandler.handleEvent(event);
            } else {
              await eventHandler.handleEvent(event);
            }
          }
        } catch (error: any) {
          if (!signal.aborted) {
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
          // An abandoned load leaves the loading state to the conversation the user moved to
          if (!signal.aborted) {
            setLoading(false);
          }
        }
      },
      [
        chatService,
        confirmationService,
        eventHandler,
        humanInputService,
        leaveConversation,
        setLoading,
        toasts,
      ]
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
            onDeleteConversation={(threadId) => chatService.deleteConversation(threadId)}
          />
        ) : (
          <ChatSessionErrorBoundary onStartNewSession={handleNewChat}>
            <ChatMessages
              layoutMode={layoutMode}
              timeline={timeline}
              isStreaming={isStreaming}
              isValidating={isValidating}
              onResendMessage={resendAvailable ? handleResendMessage : undefined}
              onResendToolResult={handleResendToolResult}
              onApproveConfirmation={handleApproveConfirmation}
              onRejectConfirmation={handleRejectConfirmation}
              onFillInput={(content) => {
                setInput(content);
                chatInputRef.current?.focus();
                telemetryRecorder?.recordEvent({ name: 'suggestion_click', data: {} });
              }}
              onAttachScreenshot={handleAttachScreenshot}
              inputValue={input}
              onRemoveInput={(content: string) =>
                setInput((prev) => prev.replace(content, '').trim())
              }
              threadId={chatService.getThreadId()}
              onShowHistory={handleShowHistory}
              conversationHistoryService={chatService.conversationHistoryService}
              onSelectConversation={handleSelectConversation}
              availableDataSources={dataSourcePrompt?.options ?? []}
              onDataSourceSelect={handleDataSourceSelect}
              {...enhancedProps}
              startResponse={startResponse}
            />

            {(isCapturing || screenshotData) && (
              <div
                className={`chatWindow__screenshotRow ${!screenshotData && isCapturing ? 'capturing' : ''}`}
              >
                {screenshotData && (
                  <>
                    <img
                      src={`data:${screenshotData.mimeType || 'image/jpeg'};base64,${screenshotData.base64}`}
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
              ref={chatInputRef}
              layoutMode={layoutMode}
              input={input}
              isCapturing={isCapturing}
              isStreaming={isStreaming}
              disabled={
                hasActiveToolCalls ||
                hasPendingResend ||
                !!pendingConfirmation ||
                !!pendingAskUser ||
                !!dataSourcePrompt ||
                isValidating
              }
              placeholder={
                !!dataSourcePrompt
                  ? i18n.translate('chat.input.selectDataSource', {
                      defaultMessage: 'Select a data source to continue...',
                    })
                  : pendingAskUser
                    ? i18n.translate('chat.input.waitingForAnswer', {
                        defaultMessage: 'Answer the question above to continue...',
                      })
                    : pendingConfirmation
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
              ownFocus={chatService?.getShouldAutoFocusInput?.() ?? false}
            />
          </ChatSessionErrorBoundary>
        )}
      </ChatContainer>
    );
  }
);
