/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { AgUiAgent } from './ag_ui_agent';
import { RunAgentInput, Message, UserMessage, ToolMessage, InputContent } from '../../common/types';
import type { ToolDefinition } from '../../../context_provider/public';
import { AssistantActionService } from '../../../context_provider/public';
import type { ChatWindowInstance } from '../components/chat_window';
import {
  IUiSettingsClient,
  UiSettingScope,
  ChatServiceStart,
  WorkspacesStart,
  SavedObjectsClientContract,
  Event,
  EventType,
  MessagesSnapshotEvent,
  ToolCallStartEvent,
  ToolCallArgsEvent,
  ToolCallEndEvent,
} from '../../../../core/public';
import { getDefaultDataSourceId } from '../../../data_source_management/public';
import { ConversationHistoryService } from './conversation_history_service';

export interface DataSourceInfo {
  id: string;
  title: string;
}

export interface ChatState {
  messages: Message[];
  isStreaming: boolean;
  currentStreamingMessage?: string;
}

export interface CurrentChatState {
  threadId: string;
  messages: Message[];
}

/**
 * How long a frontend-tool continuation waits before dispatch, so the tool-result write is visible
 * to a backend that does not reconcile it server-side (ml-commons). See
 * {@link ChatService.waitBeforeContinuation}.
 */
export const CONTINUATION_DISPATCH_DELAY_MS = 3000;

export class ChatService {
  private agent: AgUiAgent;
  public availableTools: ToolDefinition[] = [];
  public events$: any;
  private activeRequests: Set<string> = new Set();
  private requestCounter: number = 0;
  private uiSettings: IUiSettingsClient;
  private coreChatService?: ChatServiceStart;
  private workspaces?: WorkspacesStart;
  private savedObjectsClient?: SavedObjectsClientContract;

  // Chat-UI-scoped, non-persisted signal: whether the chat input should
  // auto-focus when the ChatWindow next mounts. Driven by the plugin
  // (see plugin.ts#setupChatbotWindowState) so that explicit opens (header
  // "Ask AI" button, workspace quick-start, sendMessageWithWindow) focus the
  // input, while bootstrap auto-open (restoring persisted window state)
  // does not steal focus on page load. Deliberately lives in the chat
  // plugin rather than core.public.chat — it is a UI concern, not part of
  // core's window-lifecycle contract.
  private shouldAutoFocusInput$ = new BehaviorSubject<boolean>(false);

  // ChatWindow instance for delegating sendMessage calls to proper timeline management
  private chatWindowInstance: ChatWindowInstance | null = null;

  // Promise to track when window instance becomes available
  private windowInstancePromise: Promise<ChatWindowInstance> | null = null;
  private windowInstanceResolver: ((instance: ChatWindowInstance) => void) | null = null;

  // Subscription to assistant action service for tool updates
  private toolSubscription?: Subscription;

  // Data source explicitly selected by user in this session
  private cachedDataSourceId?: string;

  // Cached available data sources for the current workspace
  private cachedAvailableDataSources?: DataSourceInfo[];

  // Conversation history service
  public conversationHistoryService: ConversationHistoryService;

  constructor(
    uiSettings: IUiSettingsClient,
    coreChatService?: ChatServiceStart,
    workspaces?: WorkspacesStart,
    savedObjectsClient?: SavedObjectsClientContract
  ) {
    // No need to pass URL anymore - agent will use the proxy endpoint
    this.agent = new AgUiAgent();
    this.uiSettings = uiSettings;
    this.coreChatService = coreChatService;
    this.workspaces = workspaces;
    this.savedObjectsClient = savedObjectsClient;

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
    return `run-${Date.now()}-${Math.random().toString(36).substring(2, 11).padEnd(9, '0')}`;
  }

  public generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 11).padEnd(9, '0')}`;
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

  /**
   * Wait until no OTHER run is active before dispatching a follow-up run.
   *
   * Fixes #11881: a frontend-tool round-trip opens a second run (the tool
   * result dispatch) once the tool executes in the browser. If the first run's
   * SSE stream hasn't finished yet — e.g. a parallel backend tool is still
   * resolving — dispatching the second run against the same thread hits the
   * agent server's per-thread concurrency guard and throws
   * `ConcurrencyException`. Polling `activeRequests` until it drains (excluding
   * `exceptRequestId`, the caller's own id) lets the first run close first, so
   * the two runs are serialized instead of racing.
   *
   * Bounded by `maxWaitMs` so a first run that never closes can't hang the UI
   * forever — after the timeout we proceed anyway (best effort).
   */
  private async waitForActiveRunsToClear(
    exceptRequestId: string,
    maxWaitMs = 15000,
    intervalMs = 100
  ): Promise<void> {
    const deadline = Date.now() + maxWaitMs;
    while (Date.now() < deadline) {
      const others = Array.from(this.activeRequests).filter((id) => id !== exceptRequestId);
      if (others.length === 0) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    // eslint-disable-next-line no-console
    console.warn(
      `waitForActiveRunsToClear: timed out after ${maxWaitMs}ms with active runs still present; dispatching follow-up run anyway`
    );
  }

  public getPaddingSize(): number {
    if (!this.coreChatService) {
      throw new Error('Core chat service not available');
    }
    const paddingSize = this.coreChatService.getWindowState().paddingSize;
    // Fallback to default if undefined
    return paddingSize ?? 400;
  }

  /**
   * Whether the chat input should auto-focus when the window mounts.
   * See `shouldAutoFocusInput$` for the full rationale.
   */
  public getShouldAutoFocusInput(): boolean {
    return this.shouldAutoFocusInput$.getValue();
  }

  /**
   * Set the auto-focus-on-mount signal. Called by the plugin's window-open/
   * close wiring (see plugin.ts#setupChatbotWindowState) — not intended to
   * be called directly by UI components.
   */
  public setShouldAutoFocusInput(value: boolean): void {
    this.shouldAutoFocusInput$.next(value);
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
    content: string | InputContent[],
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
      content: typeof content === 'string' ? content.trim() : content,
    };

    // Return a dummy observable since ChatWindow handles everything internally
    const dummyObservable = new Observable((subscriber) => {
      subscriber.complete();
    });

    return { observable: dummyObservable, userMessage };
  }

  private getDataSourceFromPageContext() {
    const dsId = this.getPageContextValue()?.dataset?.dataSource?.id;
    return dsId;
  }

  private getAllAssistantContexts(): any[] {
    const contextStore = (window as any).assistantContextStore;
    return contextStore ? contextStore.getAllContexts() : [];
  }

  /**
   * Resolve the parsed value of the current page context (the one carrying appId).
   */
  private getPageContextValue(): any | undefined {
    const pageContext = this.getAllAssistantContexts().find((ctx) => {
      if (!ctx.categories?.includes('page')) return false;
      try {
        const value = typeof ctx.value === 'string' ? JSON.parse(ctx.value) : ctx.value;
        return value?.appId;
      } catch {
        return false;
      }
    });
    if (!pageContext) return undefined;

    return typeof pageContext.value === 'string'
      ? JSON.parse(pageContext.value)
      : pageContext.value;
  }

  public getCurrentTimeRange(): { from: string; to: string } | undefined {
    const timeRange = this.getPageContextValue()?.timeRange;
    if (timeRange?.from && timeRange?.to) {
      return { from: timeRange.from, to: timeRange.to };
    }
    return undefined;
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
   * Get the current data source ID from all resolution sources.
   */
  public async getCurrentDataSourceId(): Promise<string | undefined> {
    return (
      this.getDataSourceFromPageContext() ||
      this.cachedDataSourceId ||
      (await this.getWorkspaceAwareDataSourceId())
    );
  }

  public async getCurrentDataSourceInfo(): Promise<{ id: string; title?: string } | undefined> {
    const id = await this.getCurrentDataSourceId();
    if (!id) return undefined;
    const availableDs = await this.getAvailableDataSources();
    const title = availableDs.find((ds) => ds.id === id)?.title;
    return { id, title };
  }

  public async sendMessage(
    content: string,
    messages: Message[],
    userMessage?: UserMessage
  ): Promise<{
    observable: any;
    userMessage: UserMessage;
  }> {
    const requestId = this.generateRequestId();

    this.addActiveRequest(requestId);

    // Use provided user message or create one
    if (!userMessage) {
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
        userMessage = this.getUserMessage(content);
      }
    }

    // Get workspace-aware data source ID
    const dataSourceId = await this.getCurrentDataSourceId();

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
    const includeFullHistory =
      this.conversationHistoryService.getMemoryProvider().includeFullHistory;
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

    // Abort the halted main run so it does not overlap the continuation.
    this.agent.abort();

    // The tool result is dispatched directly; the server reconciles it into the persisted
    // placeholder via its {wire tool_call_id -> native toolUseId} map (ag_ui_strands
    // session_reconcile), which is idempotent and cross-process.
    if (!(await this.waitBeforeContinuation(signal))) return skip('aborted');

    // Fix #11881: wait for the previous run (e.g. the one that requested this
    // frontend tool) to finish before dispatching this tool-result run.
    // Dispatching while the prior run still holds the thread triggers the agent
    // server's per-thread concurrency guard (ConcurrencyException). This
    // serializes the two runs instead of racing them.
    await this.waitForActiveRunsToClear(requestId);
    if (signal?.aborted) return skip('aborted');

    // Continue the conversation with the tool result
    const observable = this.agent.runAgent(runInput, dataSourceId);
    const trackedObservable = this.buildTrackedRunObservable(observable, requestId, signal);

    this.events$ = trackedObservable;

    return { observable: trackedObservable, toolMessage };
  }

  /**
   * Wait before dispatching a frontend-tool continuation.
   *
   * The agent server reconciles a tool result into its persisted placeholder through the
   * ag_ui_strands wire->native map, so it needs no delay. ml-commons has no such reconciliation and
   * no backend polling, so a continuation that arrives before the placeholder write is visible can
   * miss it. This delay keeps that path working while both backends are supported.
   *
   * Resolves false when the caller aborts during the wait, so the dispatch is skipped rather than
   * firing seconds after cancellation.
   */
  private waitBeforeContinuation(signal?: AbortSignal): Promise<boolean> {
    if (signal?.aborted) return Promise.resolve(false);
    return new Promise((resolve) => {
      const onAbort = () => {
        clearTimeout(timer);
        resolve(false);
      };
      const timer = setTimeout(() => {
        signal?.removeEventListener('abort', onAbort);
        resolve(true);
      }, CONTINUATION_DISPATCH_DELAY_MS);
      signal?.addEventListener('abort', onAbort, { once: true });
    });
  }

  /**
   * Wrap a run observable to track completion and honor the caller's abort
   * signal. When the signal fires, we abort the underlying agent fetch and
   * surface an AbortError to subscribers so they can distinguish a
   * cancellation from a real stream error. Shared by the single- and
   * batched-tool-result dispatch paths.
   */
  private buildTrackedRunObservable(
    observable: any,
    requestId: string,
    signal?: AbortSignal
  ): Observable<any> {
    return new Observable((subscriber: any) => {
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
  }

  /**
   * Batched sibling of {@link sendToolResult}: sends several parallel frontend
   * tool results in one continuation run (one `role=tool` message per
   * `toolCallId`), keeping each `toolUse` adjacent to its `toolResult` and
   * matching the memory store's fan-out shape. Since all calls belong to one
   * assistant message, a single `abort()` + one sync-poll (on the last id)
   * covers the batch.
   */
  public async sendToolResults(
    items: Array<{ toolCallId: string; result: any }>,
    messages: Message[],
    signal?: AbortSignal
  ): Promise<{
    observable: any;
    toolMessages: ToolMessage[];
    skipped?: {
      reason: 'result_already_exists' | 'sync_timeout' | 'no_thread_id' | 'aborted';
    };
  }> {
    const requestId = this.generateRequestId();
    this.addActiveRequest(requestId);

    const toolMessages: ToolMessage[] = items.map((item) => ({
      id: this.generateMessageId(),
      role: 'tool',
      content: typeof item.result === 'string' ? item.result : JSON.stringify(item.result),
      toolCallId: item.toolCallId,
    }));

    const skip = (
      reason: 'result_already_exists' | 'sync_timeout' | 'no_thread_id' | 'aborted'
    ) => {
      this.removeActiveRequest(requestId);
      return {
        observable: new Observable((subscriber) => subscriber.complete()),
        toolMessages,
        skipped: { reason },
      };
    };

    if (signal?.aborted) return skip('aborted');

    const dataSourceId = await this.getWorkspaceAwareDataSourceId();

    const contextStore = (window as any).assistantContextStore;
    const allContexts = contextStore ? contextStore.getAllContexts() : [];
    const context = allContexts.map((ctx: any) => ({
      description: ctx.description,
      value: typeof ctx.value === 'string' ? ctx.value : JSON.stringify(ctx.value),
    }));

    const includeFullHistory = this.conversationHistoryService.getMemoryProvider()
      .includeFullHistory;
    const mappedMessages = includeFullHistory ? [...messages, ...toolMessages] : [...toolMessages];

    const threadId = this.getThreadId();
    if (!threadId) return skip('no_thread_id');

    const runInput: RunAgentInput = {
      threadId,
      runId: this.generateRunId(),
      messages: mappedMessages,
      tools: this.availableTools || [],
      context,
      state: {},
      forwardedProps: {},
    };

    // Abort the halted main run so it does not overlap the continuation.
    this.agent.abort();

    // Each result is dispatched directly; the server reconciles it via its wire->native map
    // (see sendToolResult), which is idempotent and cross-process.
    if (!(await this.waitBeforeContinuation(signal))) return skip('aborted');

    const observable = this.agent.runAgent(runInput, dataSourceId);
    const trackedObservable = this.buildTrackedRunObservable(observable, requestId, signal);

    this.events$ = trackedObservable;

    return { observable: trackedObservable, toolMessages };
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

    // Clear data source selection and cache for new session
    this.cachedDataSourceId = undefined;
    this.cachedAvailableDataSources = undefined;

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

    // Tool call events belong BEFORE the run ends, as they do in a live stream: RUN_FINISHED clears
    // the handler's active-message map, so a tool call replayed after it can no longer resolve its
    // parent and would spawn a second assistant message instead of attaching to the restored one.
    const rebuilt = [
      ...events.slice(0, snapshotIndex),
      patchedSnapshot,
      ...events.slice(snapshotIndex + 1),
    ];
    const runFinishedIndex = rebuilt.findIndex((e) => e.type === EventType.RUN_FINISHED);
    const insertAt = runFinishedIndex === -1 ? rebuilt.length : runFinishedIndex;
    return [...rebuilt.slice(0, insertAt), ...syntheticEvents, ...rebuilt.slice(insertAt)];
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
   * Create a user message for timeline display
   */
  public getUserMessage(content: string | InputContent[], rawMessage?: string): UserMessage {
    if (Array.isArray(content)) {
      return {
        id: this.generateMessageId(),
        role: 'user',
        content,
        ...(rawMessage ? { rawMessage } : {}),
      };
    }

    return {
      id: this.generateMessageId(),
      role: 'user',
      content: content.trim(),
      rawMessage: rawMessage || content.trim(),
    };
  }

  /**
   * Explicitly set the data source ID (e.g., after user selection)
   */
  public setDataSourceId(id: string): void {
    this.cachedDataSourceId = id;
  }

  /**
   * Get all available data sources, excluding incompatible ones (e.g. AnalyticEngine)
   */
  public async getAvailableDataSources(): Promise<DataSourceInfo[]> {
    if (this.cachedAvailableDataSources) return this.cachedAvailableDataSources;
    if (!this.savedObjectsClient) return [];

    try {
      const response = await this.savedObjectsClient.find<{
        title: string;
        dataSourceEngineType?: string;
      }>({
        type: 'data-source',
        fields: ['title', 'dataSourceEngineType'],
        perPage: 100,
      });

      this.cachedAvailableDataSources = (response?.savedObjects || [])
        .filter((ds) => ds.attributes?.dataSourceEngineType !== 'AnalyticEngine')
        .map((ds) => ({ id: ds.id, title: ds.attributes?.title || ds.id }))
        .sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()));
      return this.cachedAvailableDataSources;
    } catch {
      return [];
    }
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
