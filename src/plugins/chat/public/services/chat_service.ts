/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Observable, Subscription } from 'rxjs';
import { AgUiAgent } from './ag_ui_agent';
import { RunAgentInput, Message, UserMessage, ToolMessage } from '../../common/types';
import type { ToolDefinition } from '../../../context_provider/public';
import { AssistantActionService } from '../../../context_provider/public';
import type { ChatWindowInstance } from '../components/chat_window';
import {
  IUiSettingsClient,
  UiSettingScope,
  ChatServiceStart,
  WorkspacesStart,
  Event,
  EventType,
  MessagesSnapshotEvent,
  ToolCallStartEvent,
  ToolCallArgsEvent,
  ToolCallEndEvent,
} from '../../../../core/public';
import { getDefaultDataSourceId } from '../../../data_source_management/public';
import { ConversationHistoryService } from './conversation_history_service';

export interface ChatState {
  messages: Message[];
  isStreaming: boolean;
  currentStreamingMessage?: string;
}

export interface CurrentChatState {
  threadId: string;
  messages: Message[];
}

export class ChatService {
  private agent: AgUiAgent;
  public availableTools: ToolDefinition[] = [];
  public events$: any;
  private activeRequests: Set<string> = new Set();
  private requestCounter: number = 0;
  private uiSettings: IUiSettingsClient;
  private coreChatService?: ChatServiceStart;
  private workspaces?: WorkspacesStart;

  // ChatWindow instance for delegating sendMessage calls to proper timeline management
  private chatWindowInstance: ChatWindowInstance | null = null;

  // Promise to track when window instance becomes available
  private windowInstancePromise: Promise<ChatWindowInstance> | null = null;
  private windowInstanceResolver: ((instance: ChatWindowInstance) => void) | null = null;

  // Subscription to assistant action service for tool updates
  private toolSubscription?: Subscription;

  // Cache for datasourceId to avoid repeated lookups
  private cachedDataSourceId?: string;

  // Conversation history service
  public conversationHistoryService: ConversationHistoryService;

  constructor(
    uiSettings: IUiSettingsClient,
    coreChatService?: ChatServiceStart,
    workspaces?: WorkspacesStart
  ) {
    // No need to pass URL anymore - agent will use the proxy endpoint
    this.agent = new AgUiAgent();
    this.uiSettings = uiSettings;
    this.coreChatService = coreChatService;
    this.workspaces = workspaces;

    // Initialize conversation history service
    if (!coreChatService) {
      throw new Error('Core chat service is required for conversation history');
    }
    this.conversationHistoryService = new ConversationHistoryService(coreChatService);

    // Subscribe to assistant action service to keep tools in sync
    const assistantActionService = AssistantActionService.getInstance();
    this.toolSubscription = assistantActionService.getState$().subscribe((state) => {
      this.availableTools = state.toolDefinitions;
    });
  }

  public getThreadId = () => {
    if (!this.coreChatService) {
      throw new Error('Core chat service not available');
    }
    return this.coreChatService.getThreadId();
  };

  public getThreadId$ = () => {
    if (!this.coreChatService) {
      throw new Error('Core chat service not available');
    }
    return this.coreChatService.getThreadId$();
  };

  private generateRunId(): string {
    return `run-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  public generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  private generateRequestId(): string {
    this.requestCounter++;
    return `chat-req-${Date.now()}-${this.requestCounter}`;
  }

  private addActiveRequest(requestId: string): void {
    this.activeRequests.add(requestId);
  }

  private removeActiveRequest(requestId: string): void {
    this.activeRequests.delete(requestId);
  }

  public getPaddingSize(): number {
    if (!this.coreChatService) {
      throw new Error('Core chat service not available');
    }
    const paddingSize = this.coreChatService.getWindowState().paddingSize;
    // Fallback to default if undefined
    return paddingSize ?? 400;
  }

  // ChatWindow instance management for proper timeline handling
  public setChatWindowInstance(instance: ChatWindowInstance): void {
    this.chatWindowInstance = instance;

    // Resolve the promise if someone is waiting for the instance
    if (this.windowInstanceResolver) {
      this.windowInstanceResolver(instance);
      this.windowInstanceResolver = null;
      this.windowInstancePromise = null;
    }
  }

  public clearChatWindowInstance(): void {
    this.chatWindowInstance = null;
    // Reset promise when instance is cleared
    this.windowInstancePromise = null;
    this.windowInstanceResolver = null;
  }

  public async openWindow(): Promise<ChatWindowInstance> {
    if (!this.coreChatService) {
      throw new Error('Core chat service not available');
    }

    // If window is already open and instance is available, return it immediately
    if (this.coreChatService.isWindowOpen() && this.chatWindowInstance) {
      return this.chatWindowInstance;
    }

    // Create a promise that will resolve when the window instance becomes available
    const windowInstancePromise =
      this.windowInstancePromise ||
      new Promise<ChatWindowInstance>((resolve) => {
        this.windowInstanceResolver = resolve;
      });
    if (!this.windowInstancePromise) {
      this.windowInstancePromise = windowInstancePromise;
    }

    // Trigger window opening
    await this.coreChatService.openWindow();

    // Wait for the window instance to be set (by setChatWindowInstance)
    const instance = await windowInstancePromise;
    return instance;
  }

  public async closeWindow(): Promise<void> {
    if (!this.coreChatService) {
      throw new Error('Core chat service not available');
    }
    await this.coreChatService.closeWindow();
  }

  public async sendMessageWithWindow(
    content: string,
    messages: Message[],
    options?: { clearConversation?: boolean }
  ): Promise<{
    observable: any;
    userMessage: UserMessage;
  }> {
    // Start new thread first to avoid restoring from latest conversation when window opens
    if (options?.clearConversation) {
      this.newThread();
    }
    // Ensure window is open and get the window instance
    const chatWindowInstance = await this.openWindow();

    // Reset chat window UI to a fresh chat panel
    if (options?.clearConversation) {
      chatWindowInstance.startNewChat();
    }

    await chatWindowInstance.sendMessage({ content, messages });

    // Create a user message for consistency with the return type
    const userMessage: UserMessage = {
      id: this.generateMessageId(),
      role: 'user',
      content: content.trim(),
    };

    // Return a dummy observable since ChatWindow handles everything internally
    const dummyObservable = new Observable((subscriber) => {
      subscriber.complete();
    });

    return { observable: dummyObservable, userMessage };
  }

  /**
   * Extract data source ID from page context
   * Looks for page contexts with appId and dataset.dataSource.id structure
   */
  private extractDataSourceIdFromPageContext(allContexts: any[]): string | undefined {
    // Find page context by checking for 'page' category and appId in value
    const pageContext = allContexts.find((ctx) => {
      // Look for contexts in 'page' category instead of filtering by ID existence
      if (!ctx.categories?.includes('page')) return false;

      try {
        const value = typeof ctx.value === 'string' ? JSON.parse(ctx.value) : ctx.value;
        return value?.appId; // Page contexts have appId
      } catch {
        return false;
      }
    });

    if (!pageContext) return undefined;

    const contextValue =
      typeof pageContext.value === 'string' ? JSON.parse(pageContext.value) : pageContext.value;

    // TODO: Consider adding more robust nested field search for dataSource.id
    // if the standard dataset.dataSource.id pattern is not found
    return contextValue?.dataset?.dataSource?.id;
  }

  private getDataSourceFromPageContext() {
    const contextStore = (window as any).assistantContextStore;
    const allContexts = contextStore ? contextStore.getAllContexts() : [];

    return this.extractDataSourceIdFromPageContext(allContexts);
  }

  /**
   * Get workspace-aware data source ID
   * Determines the correct data source based on current workspace context
   */
  private async getWorkspaceAwareDataSourceId(): Promise<string | undefined> {
    try {
      // Try to get data source from page context first
      const pageDataSourceId = this.getDataSourceFromPageContext();
      if (pageDataSourceId) {
        this.cachedDataSourceId = pageDataSourceId;
        return pageDataSourceId;
      }

      // Fallback to existing workspace-aware logic
      if (!this.uiSettings) {
        // eslint-disable-next-line no-console
        console.warn('UI Settings not available, using default data source');
        return undefined;
      }

      // Get workspace context
      const workspaces = this.workspaces;
      if (!workspaces) {
        // eslint-disable-next-line no-console
        console.warn('Workspaces service not available, using global scope');
        return undefined;
      }

      const currentWorkspaceId = workspaces.currentWorkspaceId$.getValue();

      // Determine scope based on workspace context
      const scope: UiSettingScope = !!currentWorkspaceId
        ? UiSettingScope.WORKSPACE
        : UiSettingScope.GLOBAL;

      // Get default data source with proper scope
      const dataSourceId = await getDefaultDataSourceId(this.uiSettings, scope);

      this.cachedDataSourceId = dataSourceId || undefined;
      return dataSourceId || undefined;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to determine data source, proceeding without:', error);
      return undefined; // Graceful fallback - undefined means local cluster
    }
  }

  /**
   * Get the current cached data source ID
   * Returns the datasourceId that was last retrieved
   */
  public async getCurrentDataSourceId(): Promise<string | undefined> {
    return (
      this.getDataSourceFromPageContext() ||
      this.cachedDataSourceId ||
      (await this.getWorkspaceAwareDataSourceId())
    );
  }

  public async sendMessage(
    content: string,
    messages: Message[]
  ): Promise<{
    observable: any;
    userMessage: UserMessage;
  }> {
    const requestId = this.generateRequestId();

    this.addActiveRequest(requestId);

    // Check if the last message in the array is a user message with array content
    // If so, append the text to the existing content array (for multimodal messages)
    let userMessage: UserMessage;
    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
    const hasArrayContent = lastMessage?.role === 'user' && Array.isArray(lastMessage.content);

    if (hasArrayContent && lastMessage) {
      // Remove the last message from the array since we'll merge it with the new message
      messages = messages.slice(0, -1);

      // Append text to the existing content array (preserves order from caller)
      userMessage = {
        ...lastMessage,
        id: this.generateMessageId(),
        content: [...(lastMessage.content as any[]), { type: 'text', text: content.trim() }],
      };
    } else {
      // No array content, create a simple text message
      userMessage = {
        id: this.generateMessageId(),
        role: 'user',
        content: content.trim(),
      };
    }

    // Get workspace-aware data source ID
    const dataSourceId = await this.getWorkspaceAwareDataSourceId();

    // Get all contexts from the assistant context store (static + dynamic)
    const contextStore = (window as any).assistantContextStore;
    const allContexts = contextStore ? contextStore.getAllContexts() : [];

    // Convert to AG-UI format: {description: string, value: string}
    const context = allContexts.map((ctx: any) => ({
      description: ctx.description,
      value: typeof ctx.value === 'string' ? ctx.value : JSON.stringify(ctx.value),
    }));
    const threadId = this.getThreadId();

    if (!threadId) {
      throw new Error('Thread ID is required to send a message');
    }

    const runInput: RunAgentInput = {
      threadId,
      runId: this.generateRunId(),
      messages: this.conversationHistoryService.getMemoryProvider().includeFullHistory
        ? [...messages, userMessage]
        : [userMessage],
      tools: this.availableTools || [], // Pass available tools to AG-UI server
      context, // All contexts (static + dynamic) with stringified values
      state: {}, // Empty for agent internal use only
      forwardedProps: {},
    };

    const observable = this.agent.runAgent(runInput, dataSourceId);

    // Wrap observable to track completion
    const trackedObservable = new Observable((subscriber: any) => {
      const subscription = observable.subscribe({
        next: (value: any) => subscriber.next(value),
        error: (error: any) => {
          this.removeActiveRequest(requestId);
          subscriber.error(error);
        },
        complete: () => {
          this.removeActiveRequest(requestId);
          subscriber.complete();
        },
      });
      return () => subscription.unsubscribe();
    });

    // Store the observable as events$ for tool call handling
    this.events$ = trackedObservable;

    return { observable: trackedObservable, userMessage };
  }

  /**
   * Number of consecutive polls in which the tool call id must be observed
   * in history before we treat it as stably synced. Any pending observation
   * or error resets the streak. This guards against transient snapshots
   * where the id briefly appears then disappears as memory is rewritten.
   */
  private readonly TOOL_CALL_SYNC_MATURITY_THRESHOLD = 3;

  /**
   * Sleep for `ms` milliseconds, bailing out early if `signal` aborts.
   * Returns true if the sleep was interrupted by the signal, false if the
   * timer completed normally.
   */
  private interruptibleSleep(ms: number, signal?: AbortSignal): Promise<boolean> {
    if (signal?.aborted) return Promise.resolve(true);

    return new Promise<boolean>((resolve) => {
      const onAbort = () => {
        clearTimeout(timeoutId);
        resolve(true);
      };
      const timeoutId = setTimeout(() => {
        signal?.removeEventListener('abort', onAbort);
        resolve(false);
      }, ms);
      signal?.addEventListener('abort', onAbort, { once: true });
    });
  }

  /**
   * Wait for tool call to be synced to agentic memory.
   *
   * Polls conversation history up to `maxAttempts` times, waiting `intervalMs`
   * between polls. Returns one of:
   * - `{ shouldSend: true,  reason: 'synced' }`              — tool call is in
   *   history, caller may dispatch the tool result.
   * - `{ shouldSend: false, reason: 'result_already_exists' }` — another
   *   window persisted a tool result first; caller should skip dispatch.
   * - `{ shouldSend: false, reason: 'sync_timeout' }`        — polling
   *   exhausted without observing sync; caller should skip dispatch and
   *   surface a resendable failure to the user.
   * - `{ shouldSend: false, reason: 'no_thread_id' }`        — no thread id
   *   available; caller should skip dispatch.
   * - `{ shouldSend: false, reason: 'aborted' }`             — caller-supplied
   *   abort signal fired; caller should skip dispatch.
   *
   * Note: exhausted attempts no longer silently proceed — the caller must
   * decide whether to resend.
   */
  private async waitForToolCallSync(
    toolCallId: string,
    maxAttempts: number = 15,
    intervalMs: number = 1000,
    signal?: AbortSignal
  ): Promise<{
    shouldSend: boolean;
    reason: 'synced' | 'no_thread_id' | 'result_already_exists' | 'sync_timeout' | 'aborted';
  }> {
    if (signal?.aborted) return { shouldSend: false, reason: 'aborted' };

    const threadId = this.getThreadId();
    if (!threadId) return { shouldSend: false, reason: 'no_thread_id' };

    const checkSyncStatus = async (): Promise<'result_already_exists' | 'synced' | 'pending'> => {
      const events = await this.conversationHistoryService.getConversation(threadId);
      if (!events) return 'pending';

      const hasToolResult = events.some((event) => {
        if (event.type === EventType.MESSAGES_SNAPSHOT && 'messages' in event) {
          const messages = (event as any).messages as Message[];
          return messages.some(
            (msg) =>
              msg.role === 'tool' && 'toolCallId' in msg && (msg as any).toolCallId === toolCallId
          );
        }
        return false;
      });
      if (hasToolResult) return 'result_already_exists';

      const hasToolCall = events.some((event) => {
        if (event.type === EventType.MESSAGES_SNAPSHOT && 'messages' in event) {
          const messages = (event as any).messages as Message[];
          return messages.some(
            (msg) =>
              msg.role === 'assistant' &&
              'toolCalls' in msg &&
              Array.isArray((msg as any).toolCalls) &&
              (msg as any).toolCalls.some((tc: any) => tc.id === toolCallId)
          );
        }
        return false;
      });
      return hasToolCall ? 'synced' : 'pending';
    };

    let consecutiveSyncedPolls = 0;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (signal?.aborted) return { shouldSend: false, reason: 'aborted' };

      try {
        const status = await checkSyncStatus();
        if (signal?.aborted) return { shouldSend: false, reason: 'aborted' };

        if (status === 'result_already_exists') {
          return { shouldSend: false, reason: 'result_already_exists' };
        }
        if (status === 'synced') {
          // Require `TOOL_CALL_SYNC_MATURITY_THRESHOLD` consecutive synced
          // observations before treating the tool call as stably synced.
          // This guards against transient snapshots where the id appears
          // briefly before being rewritten.
          consecutiveSyncedPolls += 1;
          if (consecutiveSyncedPolls >= this.TOOL_CALL_SYNC_MATURITY_THRESHOLD) {
            return { shouldSend: true, reason: 'synced' };
          }
        } else {
          // Pending — id not yet in snapshot. Reset the streak so the
          // maturity guarantee is "consecutive", not "cumulative".
          consecutiveSyncedPolls = 0;
        }
      } catch (error) {
        // Reset the streak on any error — maturity requires uninterrupted
        // successful observations.
        consecutiveSyncedPolls = 0;
        // eslint-disable-next-line no-console
        console.warn(`Failed to check tool call sync status (attempt ${attempt + 1}):`, error);
      }

      // Wait before next attempt (skip the wait after the final attempt).
      // The sleep is interruptible so `cancelToolResultDispatch` aborts
      // immediately rather than waiting for the next tick.
      if (attempt < maxAttempts - 1) {
        const interrupted = await this.interruptibleSleep(intervalMs, signal);
        if (interrupted) return { shouldSend: false, reason: 'aborted' };
      }
    }

    // Exhausted attempts without observing sync — do NOT silently dispatch.
    // Surface the failure so the caller can show a system message and let the
    // user decide whether to resend.
    // eslint-disable-next-line no-console
    console.warn(
      `Tool call sync check timed out after ${maxAttempts} attempts for toolCallId: ${toolCallId}`
    );
    return { shouldSend: false, reason: 'sync_timeout' };
  }

  public async sendToolResult(
    toolCallId: string,
    result: any,
    messages: Message[],
    signal?: AbortSignal
  ): Promise<{
    observable: any;
    toolMessage: ToolMessage;
    skipped?: {
      reason: 'result_already_exists' | 'sync_timeout' | 'no_thread_id' | 'aborted';
    };
  }> {
    const requestId = this.generateRequestId();

    this.addActiveRequest(requestId);

    const toolMessage: ToolMessage = {
      id: this.generateMessageId(),
      role: 'tool',
      content: typeof result === 'string' ? result : JSON.stringify(result),
      toolCallId,
    };

    // Helper to return a completed empty observable paired with a skip
    // reason. Centralizes active-request cleanup so callers don't have to
    // repeat it in each branch.
    const skip = (
      reason: 'result_already_exists' | 'sync_timeout' | 'no_thread_id' | 'aborted'
    ) => {
      this.removeActiveRequest(requestId);
      return {
        observable: new Observable((subscriber) => subscriber.complete()),
        toolMessage,
        skipped: { reason },
      };
    };

    // Early-out if the caller aborted before we even began.
    if (signal?.aborted) return skip('aborted');

    // Get workspace-aware data source ID
    const dataSourceId = await this.getWorkspaceAwareDataSourceId();

    // Get all contexts from the assistant context store (static + dynamic)
    const contextStore = (window as any).assistantContextStore;
    const allContexts = contextStore ? contextStore.getAllContexts() : [];

    // Convert to AG-UI format: {description: string, value: string}
    const context = allContexts.map((ctx: any) => ({
      description: ctx.description,
      value: typeof ctx.value === 'string' ? ctx.value : JSON.stringify(ctx.value),
    }));

    // Send the tool result back to the agent with full conversation history
    const includeFullHistory = this.conversationHistoryService.getMemoryProvider()
      .includeFullHistory;
    const mappedMessages = includeFullHistory ? [...messages, toolMessage] : [toolMessage];

    const threadId = this.getThreadId();

    if (!threadId) {
      // No thread id — dispatch isn't possible. Skip rather than throwing so
      // callers can surface a user-visible system message instead of a
      // silent console error.
      return skip('no_thread_id');
    }

    const runInput: RunAgentInput = {
      threadId,
      runId: this.generateRunId(),
      messages: mappedMessages,
      tools: this.availableTools || [],
      context, // All contexts (static + dynamic) with stringified values
      state: {}, // Empty for agent internal use only
      forwardedProps: {},
    };

    // Wait for tool call result to be synced to agentic memory only when not including full history
    // (when full history is included, messages are passed directly so no sync wait needed)
    if (!includeFullHistory) {
      const syncResult = await this.waitForToolCallSync(toolCallId, undefined, undefined, signal);

      // Sync check returned a reason to skip dispatch:
      // - `result_already_exists`: another window already persisted a tool
      //   result. Skip to avoid a duplicate.
      // - `sync_timeout`: polling exhausted. Skip and surface the failure so
      //   the user can resend.
      // - `aborted`: caller cancelled via the AbortSignal. Skip silently.
      if (!syncResult.shouldSend) {
        return skip(syncResult.reason as Exclude<typeof syncResult.reason, 'synced'>);
      }
    }

    // If the signal fired between sync completion and dispatch, bail out.
    if (signal?.aborted) return skip('aborted');

    // Continue the conversation with the tool result
    const observable = this.agent.runAgent(runInput, dataSourceId);

    // Wrap observable to track completion and honor the caller's abort
    // signal. When the signal fires, we abort the underlying agent fetch and
    // surface an AbortError to subscribers so they can distinguish a
    // cancellation from a real stream error.
    const trackedObservable = new Observable((subscriber: any) => {
      // `settled` guards against emitting twice when the abort handler races
      // with the inner subscription's error/complete (aborting the agent
      // typically triggers both paths).
      let settled = false;
      const settle = (fn: () => void) => {
        if (settled) return;
        settled = true;
        signal?.removeEventListener('abort', onAbort);
        this.removeActiveRequest(requestId);
        fn();
      };

      const onAbort = () => {
        settle(() => {
          this.agent.abort();
          const abortError = new Error('Tool result send aborted');
          abortError.name = 'AbortError';
          subscriber.error(abortError);
        });
      };

      if (signal?.aborted) {
        onAbort();
        return;
      }

      signal?.addEventListener('abort', onAbort, { once: true });

      const subscription = observable.subscribe({
        next: (value: any) => {
          if (!settled) subscriber.next(value);
        },
        error: (error: any) => settle(() => subscriber.error(error)),
        complete: () => settle(() => subscriber.complete()),
      });

      return () => {
        settle(() => {
          /* no-op — unsubscribe path just needs cleanup, not an error */
        });
        subscription.unsubscribe();
      };
    });

    this.events$ = trackedObservable;

    return { observable: trackedObservable, toolMessage };
  }

  public abort(): void {
    this.agent.abort();
  }

  public resetConnection(): void {
    this.agent.resetConnection();
  }

  /**
   * Save messages to conversation history
   */
  public async saveConversation(messages: Message[]): Promise<void> {
    if (messages.length > 0) {
      const threadId = this.getThreadId();
      if (!threadId) {
        throw new Error('Thread ID is required to save conversation');
      }
      await this.conversationHistoryService.saveConversation(threadId, messages);
    }
  }

  private clearDynamicContextFromStore(): void {
    const contextStore = (window as any).assistantContextStore;
    if (!contextStore) {
      return;
    }

    // Get all contexts with IDs that are NOT page contexts (dynamic contexts) and remove them
    const allContexts = contextStore.getAllContexts();
    const dynamicContexts = allContexts.filter(
      (ctx: any) => ctx.id && !ctx.categories?.includes('page')
    );

    dynamicContexts.forEach((ctx: any) => {
      contextStore.removeContextById(ctx.id);
    });
  }

  public newThread(): void {
    // Delegate to core service
    if (!this.coreChatService) {
      throw new Error('Core chat service not available');
    }
    this.coreChatService.newThread();

    // Clear dynamic context from global store for fresh chat session
    this.clearDynamicContextFromStore();

    // Reset AgUiAgent connection state to clear any aborted controllers
    this.resetConnection();
  }

  /**
   * Preprocess a conversation's event array before replay.
   *
   * Finds the MESSAGES_SNAPSHOT event and checks whether the last assistant message
   * contains tool calls that have no corresponding tool result messages (i.e. the
   * frontend tool execution never completed). When such "unfinished" tool calls are
   * found the method:
   *   1. Rewrites the MESSAGES_SNAPSHOT so the last assistant message only contains
   *      the *finished* tool calls — giving the event handler a clean baseline.
   *   2. Appends synthetic TOOL_CALL_START → TOOL_CALL_ARGS → TOOL_CALL_END events
   *      for every unfinished tool call so the event handler re-executes them exactly
   *      as if they had just arrived from the agent.
   *
   * If there are no unfinished tool calls the original array is returned unchanged.
   */
  private injectUnfinishedToolCallEvents(events: Event[]): Event[] {
    const snapshotIndex = events.findIndex((e) => e.type === EventType.MESSAGES_SNAPSHOT);
    if (snapshotIndex === -1) return events;

    const snapshot = events[snapshotIndex] as MessagesSnapshotEvent;
    const messages = snapshot.messages;
    if (!messages || messages.length === 0) return events;

    const lastMessage = messages[messages.length - 1];
    if (
      lastMessage.role !== 'assistant' ||
      !('toolCalls' in lastMessage) ||
      !lastMessage.toolCalls
    ) {
      return events;
    }

    const toolResultIds = new Set(
      messages
        .filter((m) => m.role === 'tool' && 'toolCallId' in m)
        .map((m) => (m as any).toolCallId as string)
    );

    const assistantActionService = AssistantActionService.getInstance();

    const unfinished = lastMessage.toolCalls.filter(
      (tc) => assistantActionService.hasAction(tc.function.name) && !toolResultIds.has(tc.id)
    );

    if (unfinished.length === 0) return events;

    const unfinishedIds = new Set(unfinished.map((tc) => tc.id));

    // Rewrite the snapshot: strip unfinished tool calls from the last assistant message
    const patchedLastMessage = {
      ...lastMessage,
      toolCalls: lastMessage.toolCalls.filter((tc) => !unfinishedIds.has(tc.id)),
    };
    const patchedSnapshot: MessagesSnapshotEvent = {
      ...snapshot,
      messages: [...messages.slice(0, -1), patchedLastMessage],
    };

    // Build synthetic tool call events for each unfinished tool call
    const syntheticEvents: Event[] = [];
    for (const toolCall of unfinished) {
      syntheticEvents.push({
        type: EventType.TOOL_CALL_START,
        toolCallId: toolCall.id,
        toolCallName: toolCall.function.name,
        parentMessageId: lastMessage.id,
        timestamp: Date.now(),
      } as ToolCallStartEvent);

      syntheticEvents.push({
        type: EventType.TOOL_CALL_ARGS,
        toolCallId: toolCall.id,
        delta: toolCall.function.arguments,
        timestamp: Date.now(),
      } as ToolCallArgsEvent);

      syntheticEvents.push({
        type: EventType.TOOL_CALL_END,
        toolCallId: toolCall.id,
        timestamp: Date.now(),
      } as ToolCallEndEvent);
    }

    // Return: events before snapshot + patched snapshot + events after snapshot + synthetic events
    return [
      ...events.slice(0, snapshotIndex),
      patchedSnapshot,
      ...events.slice(snapshotIndex + 1),
      ...syntheticEvents,
    ];
  }

  /**
   * Restore the latest conversation from agentic memory.
   * Returns the AG-UI event array (with unfinished tool calls injected) for replay,
   * or null if no conversation exists or a thread is already active.
   */
  public async restoreLatestConversation(): Promise<Event[] | null> {
    // Check if thread ID is already set - if so, skip restore and use existing thread
    const currentThreadId = this.coreChatService?.getThreadId();
    if (currentThreadId) {
      // Thread already set, don't restore from latest conversation
      return null;
    }

    // Get the latest conversation summary from conversation history service
    const result = await this.conversationHistoryService.getConversations({
      page: 0,
      pageSize: 1,
    });

    if (result.conversations.length > 0) {
      // Found a latest conversation - get full details
      const latestConversationSummary = result.conversations[0];
      // Get the full conversation with all events
      const events = await this.conversationHistoryService.getConversation(
        latestConversationSummary.threadId
      );

      if (!events) {
        // No events found, generate a new thread
        this.newThread();
        return null;
      }

      // Set the thread ID in core service
      if (this.coreChatService) {
        this.coreChatService.setThreadId(latestConversationSummary.threadId);
      }

      return this.injectUnfinishedToolCallEvents(events);
    }

    // No conversation found, generate a new thread
    this.newThread();
    return null;
  }

  /**
   * Load a specific conversation from history by thread ID.
   * Returns the AG-UI event array (with unfinished tool calls injected) for replay.
   */
  public async loadConversation(threadId: string): Promise<Event[] | null> {
    const events = await this.conversationHistoryService.getConversation(threadId);
    if (!events) {
      return null;
    }

    // Set the thread ID in core service
    if (this.coreChatService) {
      this.coreChatService.setThreadId(threadId);
    }

    return this.injectUnfinishedToolCallEvents(events);
  }

  /**
   * Cleanup method to properly dispose of subscriptions
   */
  public destroy(): void {
    if (this.toolSubscription) {
      this.toolSubscription.unsubscribe();
      this.toolSubscription = undefined;
    }
  }
}
