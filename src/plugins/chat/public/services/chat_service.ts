/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject, EMPTY, Observable, Subscription } from 'rxjs';
import { AgUiAgent } from './ag_ui_agent';
import { RunAgentInput, Message, UserMessage, ToolMessage, InputContent } from '../../common/types';
import type { ToolDefinition } from '../../../context_provider/public';
import { AssistantActionService } from '../../../context_provider/public';
import type { PPLLintFixRequestCategory } from '../../../data/public';
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
import { ConversationDataSourceStore } from './conversation_data_source_store';

export interface DataSourceInfo {
  id: string;
  title: string;
}

export type SendDataSourceResolution =
  | { status: 'ok'; dataSourceId: string }
  | { status: 'unsupported' }
  | { status: 'needs_selection'; options: DataSourceInfo[] }
  | { status: 'none' }
  | { status: 'stale' };

/** A conversation the chat entered: see ChatService.openConversation. */
export interface ConversationSession {
  /** Aborted once the chat enters another conversation. */
  signal: AbortSignal;
  /**
   * The AG-UI events to replay, or null when there is nothing to replay (including a load the
   * user abandoned).
   */
  events: Promise<Event[] | null>;
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

export const AVAILABLE_DATA_SOURCES_CONTEXT_ID = 'available-data-sources-context';
export const AVAILABLE_DATA_SOURCES_CONTEXT_DES =
  'Context for available data sources in this conversation';

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
  // User-confirmed conversation-level data source override.
  private confirmedDataSourceId?: string;
  // Data source ids that have appeared in this conversation.
  private sessionDataSourceList: string[] = [];
  // Persists confirmedDataSourceId + sessionDataSourceList per threadId
  private conversationDataSourceStore = new ConversationDataSourceStore();
  // Cached available data sources for the current workspace
  private cachedAvailableDataSources?: DataSourceInfo[];
  // Cached AnalyticEngine check for the last data source a send was resolved against
  private unsupportedDataSourceCache?: { dataSourceId: string; unsupported: boolean };
  // The conversation currently shown. Replaced (and the old one aborted) whenever the chat
  // enters another conversation, so async work started for the old one can tell it is stale.
  private conversationScope = new AbortController();

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

  /**
   * Open the chat window and send a message through it. The returned observable completes
   * immediately; the window streams the response into its own timeline. Without
   * `clearConversation`, a message that arrives while the window is busy (streaming,
   * resolving a data source, or loading a history conversation) is dropped, as a send from
   * the input would be.
   */
  public async sendMessageWithWindow(
    content: string | InputContent[],
    messages: Message[],
    options?: { clearConversation?: boolean; dataSourceId?: string }
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

    if (options?.dataSourceId) {
      this.setDataSourceId(options.dataSourceId);
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

  private getDataSourceFromPageContext(readOnly?: boolean) {
    const dsId = this.getPageContextValue()?.dataset?.dataSource?.id;
    if (!readOnly && dsId) {
      this.setDataSourceId(dsId);
    }
    return dsId;
  }

  private getAllAssistantContexts(): any[] {
    const contextStore = (window as any).assistantContextStore;
    return contextStore ? contextStore.getAllContexts() : [];
  }

  /**
   * Contexts sent to the agent, in AG-UI `{description, value}` form. The PPL
   * quick-fix stamps its approved request id under this category purely so a
   * cross-window caller can recover it from the store; the model must never
   * receive it, or it could echo the id back as an apply arg and stand in for
   * the user's Approve click. Typed against data's category so a rename there
   * fails to compile here.
   */
  private getAgentContexts(): Array<{ description: string; value: string }> {
    const pplLintFixRequestCategory: PPLLintFixRequestCategory = 'ppl-lint-fix-request';
    return this.getAllAssistantContexts()
      .filter((ctx) => !ctx.categories?.includes(pplLintFixRequestCategory))
      .map((ctx) => ({
        description: ctx.description,
        value: typeof ctx.value === 'string' ? ctx.value : JSON.stringify(ctx.value),
      }));
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
  private async getWorkspaceAwareDataSourceId(
    readOnly = false,
    signal: AbortSignal = this.conversationScope.signal
  ): Promise<string | undefined> {
    try {
      // Try to get data source from page context first
      const pageDataSourceId = this.getDataSourceFromPageContext(readOnly);
      if (pageDataSourceId) {
        if (!readOnly) {
          this.setDataSourceId(pageDataSourceId);
        }

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
      // Only commit it to the conversation this lookup started in. If the user left that
      // conversation while the lookup was in flight, skip the write; still return the value
      // and let the caller decide what to do.
      if (!readOnly && !signal.aborted) {
        this.setDataSourceId(dataSourceId || undefined);
      }
      return dataSourceId || undefined;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to determine data source, proceeding without:', error);
      return undefined; // Graceful fallback - undefined means local cluster
    }
  }

  /**
   * Get the current data source ID from all resolution sources.
   *
   * Priority (highest to lowest):
   *   1. getDataSourceFromPageContext() — data source inferred from the current page/panel context
   *   2. confirmedDataSourceId — explicit conversation-level override confirmed or selected by the user
   *   3. getWorkspaceAwareDataSourceId() — workspace default
   *
   * @param readOnly when true, resolve without committing anything: no setDataSourceId
   * @param signal the conversation the caller acts for (see getConversationSignal). Defaults
   *   to the current one; pass the caller's own when calling after an await.
   */
  public async getCurrentDataSourceId(
    readOnly = false,
    signal: AbortSignal = this.conversationScope.signal
  ): Promise<string | undefined> {
    const ds =
      this.getDataSourceFromPageContext(readOnly) ||
      this.confirmedDataSourceId ||
      (await this.getWorkspaceAwareDataSourceId(readOnly, signal));

    return ds;
  }

  /**
   * Pure read of the resolved data source — never mutates conversation state.
   */
  public peekCurrentDataSourceId(): Promise<string | undefined> {
    return this.getCurrentDataSourceId(true);
  }

  public getConfirmedDataSourceId(): string | undefined {
    return this.confirmedDataSourceId;
  }

  public clearSessionDataSourceAndContext(): void {
    this.confirmedDataSourceId = undefined;
    this.sessionDataSourceList = [];
    this.clearDynamicContextFromStore(AVAILABLE_DATA_SOURCES_CONTEXT_ID);
  }

  public setSessionDataSourceList(id: string | undefined): void {
    if (!id || this.sessionDataSourceList.includes(id)) {
      return;
    }

    this.sessionDataSourceList = [...this.sessionDataSourceList, id];
    this.persistDataSourceState();
  }

  public getSessionDataSourceList(): string[] {
    return [...this.sessionDataSourceList];
  }

  private clearConversationDataSourceState(): void {
    this.confirmedDataSourceId = undefined;
    this.sessionDataSourceList = [];
    this.cachedAvailableDataSources = undefined;
    this.unsupportedDataSourceCache = undefined;
  }

  private persistDataSourceState(): void {
    const threadId = this.getThreadId();
    if (!threadId) return;
    this.conversationDataSourceStore.set(threadId, {
      sessionDataSourceList: this.sessionDataSourceList,
      confirmedDataSourceId: this.confirmedDataSourceId,
    });
  }

  /**
   * Restore a conversation's data source state from the store
   */
  private async restoreDataSourceStateFromStore(
    threadId: string,
    signal: AbortSignal
  ): Promise<void> {
    const stored = this.conversationDataSourceStore.get(threadId);
    if (!stored) return;

    const [validIds, confirmedValid] = await Promise.all([
      Promise.all(
        (stored.sessionDataSourceList ?? []).map((id) =>
          this.validateDataSourceId(id)
            .then(({ valid }) => (valid ? id : undefined))
            .catch(() => undefined)
        )
      ),
      stored.confirmedDataSourceId
        ? this.validateDataSourceId(stored.confirmedDataSourceId)
            .then(({ valid }) => valid)
            .catch(() => false)
        : Promise.resolve(false),
    ]);

    // The user left this conversation while the stored data sources were being validated:
    // do not hand its data source state to the conversation the user switched to.
    if (signal.aborted) return;

    this.sessionDataSourceList = validIds.filter((id): id is string => !!id);
    this.confirmedDataSourceId = confirmedValid ? stored.confirmedDataSourceId : undefined;

    this.persistDataSourceState();
  }

  /**
   * Check a data source id against the available data source list.
   */
  public async validateDataSourceId(id: string): Promise<{
    valid: boolean;
    dataSource?: DataSourceInfo;
    availableDataSources: DataSourceInfo[];
  }> {
    let available = await this.getAvailableDataSources();
    let dataSource = available.find((ds) => ds.id === id);

    // A data source created after the cache warmed would be rejected — refresh once.
    if (!dataSource && available.length > 0) {
      available = await this.getAvailableDataSources(true);
      dataSource = available.find((ds) => ds.id === id);
    }

    if (available.length === 0) {
      return { valid: true, availableDataSources: available };
    }

    return { valid: !!dataSource, dataSource, availableDataSources: available };
  }

  public async getCurrentDataSourceInfo(): Promise<{ id: string; title?: string } | undefined> {
    const id = await this.getCurrentDataSourceId();
    if (!id) return undefined;
    const availableDs = await this.getAvailableDataSources();
    const title = availableDs.find((ds) => ds.id === id)?.title;
    return { id, title };
  }

  /**
   * Decide which data source a new send uses, before the user message is sent.
   *
   * - `ok`: the current data source is compatible; send with it.
   * - `unsupported`: the current data source does not support AI features (AnalyticEngine).
   * - `needs_selection`: there is no usable current data source; ask the user to pick one.
   * - `none`: the workspace has no compatible data source.
   * - `stale`: the user left the conversation (`signal` aborted) while this was resolving.
   */
  public async resolveSendDataSource(signal: AbortSignal): Promise<SendDataSourceResolution> {
    const dataSourceId = await this.getCurrentDataSourceId(false, signal);
    if (signal.aborted) return { status: 'stale' };

    const unsupported = dataSourceId ? await this.isUnsupportedDataSource(dataSourceId) : false;
    if (signal.aborted) return { status: 'stale' };
    if (unsupported) return { status: 'unsupported' };

    const options = await this.getAvailableDataSources();
    if (signal.aborted) return { status: 'stale' };

    if (dataSourceId && options.some((ds) => ds.id === dataSourceId)) {
      return { status: 'ok', dataSourceId };
    }
    return options.length > 0 ? { status: 'needs_selection', options } : { status: 'none' };
  }

  private async isUnsupportedDataSource(dataSourceId: string): Promise<boolean> {
    if (this.unsupportedDataSourceCache?.dataSourceId === dataSourceId) {
      return this.unsupportedDataSourceCache.unsupported;
    }
    if (!this.savedObjectsClient) return false;
    try {
      const ds = await this.savedObjectsClient.get<{ dataSourceEngineType?: string }>(
        'data-source',
        dataSourceId
      );
      const unsupported = ds?.attributes?.dataSourceEngineType === 'AnalyticEngine';
      this.unsupportedDataSourceCache = { dataSourceId, unsupported };
      return unsupported;
    } catch {
      return false;
    }
  }

  /**
   * @param signal when given and aborted (the user left the conversation the caller acts for),
   *   the shared context store is left untouched, so a stale send cannot write its
   *   conversation's data source context into the conversation the user switched to.
   */
  private async buildAvailableDsContext(dataSourceId?: string, signal?: AbortSignal) {
    const contextStore = signal?.aborted ? undefined : (window as any).assistantContextStore;

    const sessionDataSourceList = this.getSessionDataSourceList();

    if (contextStore && sessionDataSourceList.length > 1) {
      const availableDataSources = await this.getAvailableDataSources();
      if (signal?.aborted) return this.getAgentContexts();
      const activeDatasource = availableDataSources.find((ds) => ds.id === dataSourceId);

      const activeDsLabel = activeDatasource
        ? `"${activeDatasource.title}" (id: ${activeDatasource.id})`
        : `id: ${dataSourceId}`;
      const sessionDsLabel = sessionDataSourceList
        .map((id) => {
          const sessionDataSource = availableDataSources.find((ds) => ds.id === id);
          return sessionDataSource
            ? `"${sessionDataSource.title}" (id: ${sessionDataSource.id})`
            : `id: ${id}`;
        })
        .join(', ');

      contextStore.addContext({
        id: AVAILABLE_DATA_SOURCES_CONTEXT_ID,
        description: AVAILABLE_DATA_SOURCES_CONTEXT_DES,
        value: [
          `Currently active data source: ${activeDsLabel}`,
          `Data sources already seen in this conversation (ordered from the oldest(first) to the most recent(last)): ${sessionDsLabel}`,
          `IMPORTANT — this conversation involves MORE THAN ONE data source.`,
          `Before ANY data-source-aware action (inspecting fields, querying data, or creating a`,
          `visualization), you MUST have the USER pick which data source to use for the current`,
          `request by calling the ask_user tool with inputType 'select'. Build ONE option per data`,
          `source listed above: set each option's label to the data source's NAME/title (this is what`,
          `the user sees — NEVER show the raw id to the user) and its value to that data source's id`,
          `(used internally to switch, not displayed). Example: ask_user({ inputType: 'select', prompt:`,
          `'This conversation uses multiple data sources. Which one should I use?', options: [{ label:`,
          `'<data source name>', value: '<data source id>' }, ...] }).`,
          `A data source being currently active or previously confirmed does NOT satisfy this`,
          `requirement — you MUST still call ask_user whenever the user has not explicitly chosen one`,
          `for the current request. Do NOT silently reuse the current/last data source, do NOT guess,`,
          `and do NOT ask which data source to use in free-form text.`,
          `Once the user answers, call switch_data_source with the chosen id to apply it, then proceed`,
          `using that data source for the rest of the current request.`,
        ].join('\n'),
      });
    } else if (contextStore) {
      contextStore.removeContextById(AVAILABLE_DATA_SOURCES_CONTEXT_ID);
    }

    // Build the per-run context from the store (static + dynamic + the datasource context above),
    // filtering out categories the model must never receive (e.g. the PPL quick-fix request id).
    return this.getAgentContexts();
  }

  /**
   * @param signal the conversation this send belongs to (see getConversationSignal). Defaults
   *   to the current one. It is checked after the data source and context are resolved, right
   *   before the request is built; a send whose conversation the user has left is not started
   *   and comes back with `dropped: true` and an empty observable.
   */
  public async sendMessage(
    content: string,
    messages: Message[],
    userMessage?: UserMessage,
    signal: AbortSignal = this.conversationScope.signal
  ): Promise<{
    observable: any;
    userMessage: UserMessage;
    dropped?: boolean;
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
    const dataSourceId = await this.getCurrentDataSourceId(false, signal);
    const context = signal.aborted ? [] : await this.buildAvailableDsContext(dataSourceId, signal);

    // The user left this conversation while the data source or context was resolving: do not
    // send this message with the thread id of the conversation the user switched to.
    if (signal.aborted) {
      this.removeActiveRequest(requestId);
      return { observable: EMPTY, userMessage, dropped: true };
    }

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
      // Client capability signal: this client can parse and strip the inline
      // CONVERSATION_TITLE: sentinel, so the server may emit the title line.
      forwardedProps: { allowConversationTitle: true },
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

    // try the confirmed conversation override first; getCurrentDataSourceId still falls back
    // to getWorkspaceAwareDataSourceId
    const dataSourceId = await this.getCurrentDataSourceId();
    const context = await this.buildAvailableDsContext(dataSourceId);

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
      // Client capability signal: this client can parse and strip the inline
      // CONVERSATION_TITLE: sentinel, so the server may emit the title line.
      forwardedProps: { allowConversationTitle: true },
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

    const dataSourceId = await this.getCurrentDataSourceId();
    const context = await this.buildAvailableDsContext(dataSourceId);

    const includeFullHistory =
      this.conversationHistoryService.getMemoryProvider().includeFullHistory;
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
      // Client capability signal: this client can parse and strip the inline
      // CONVERSATION_TITLE: sentinel, so the server may emit the title line.
      forwardedProps: { allowConversationTitle: true },
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
  public async saveConversation(messages: Message[], title?: string): Promise<void> {
    if (messages.length > 0) {
      const threadId = this.getThreadId();
      if (!threadId) {
        throw new Error('Thread ID is required to save conversation');
      }
      await this.conversationHistoryService.saveConversation(threadId, messages, title);
    }
  }

  private clearDynamicContextFromStore(id?: string): void {
    const contextStore = (window as any).assistantContextStore;
    if (!contextStore) {
      return;
    }

    if (id) {
      contextStore.removeContextById(id);
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

  /**
   * The conversation currently shown. Take it once at the start of an operation that acts
   * for this conversation (a send, a resend) and pass it down; once it is aborted, the user
   * has left the conversation and the operation should stop without touching shared state.
   */
  public getConversationSignal(): AbortSignal {
    return this.conversationScope.signal;
  }

  /** Abandon the current conversation's async work and start a new scope. */
  private enterConversation(): AbortSignal {
    this.conversationScope.abort();
    this.conversationScope = new AbortController();
    return this.conversationScope.signal;
  }

  /** Enter a new, empty conversation. */
  public newThread(): void {
    // Delegate to core service
    if (!this.coreChatService) {
      throw new Error('Core chat service not available');
    }
    this.enterConversation();
    this.coreChatService.newThread();

    // Clear data source selection and cache for new session
    this.clearConversationDataSourceState();

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
   * Enter a conversation from history: abandon the current conversation's async work, then
   * load the conversation's events and its data source state.
   *
   * The returned session's signal is aborted once the chat enters another conversation (a new
   * chat, another history conversation, or the window closing). An abandoned load neither
   * switches the active thread to `threadId` nor restores its data source state, and its
   * events resolve to null. The signal is returned synchronously, so the caller can tell an
   * abandoned load apart even when loading throws.
   */
  public openConversation(threadId: string): ConversationSession {
    const signal = this.enterConversation();
    this.clearSessionDataSourceAndContext();
    return { signal, events: this.loadConversationEvents(threadId, signal) };
  }

  private async loadConversationEvents(
    threadId: string,
    signal: AbortSignal
  ): Promise<Event[] | null> {
    const events = await this.conversationHistoryService.getConversation(threadId);
    if (!events || signal.aborted) {
      return null;
    }

    // Set the thread ID in core service
    if (this.coreChatService) {
      this.coreChatService.setThreadId(threadId);
    }

    await this.restoreDataSourceStateFromStore(threadId, signal);
    if (signal.aborted) {
      return null;
    }

    return this.injectUnfinishedToolCallEvents(events);
  }

  /** Leave the current conversation without entering another one (the chat window closed). */
  public closeConversation(): void {
    this.enterConversation();
    this.coreChatService?.resetThreadId();
  }

  /**
   * Delete a conversation and its persisted data source state.
   */
  public async deleteConversation(threadId: string): Promise<void> {
    await this.conversationHistoryService.deleteConversation(threadId);
    this.conversationDataSourceStore.delete(threadId);
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
  public setDataSourceId(id: string | undefined): void {
    this.confirmedDataSourceId = id;
    if (!id) return;
    this.setSessionDataSourceList(id);
    this.persistDataSourceState();
  }

  /**
   * Get all available data sources, excluding incompatible ones (e.g. AnalyticEngine)
   */
  public async getAvailableDataSources(forceRefresh: boolean = false): Promise<DataSourceInfo[]> {
    // The cache lives until newThread(), so a data source created mid-session is invisible
    // to it. forceRefresh lets validateDataSourceId() re-check.
    if (!forceRefresh && this.cachedAvailableDataSources) return this.cachedAvailableDataSources;
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
