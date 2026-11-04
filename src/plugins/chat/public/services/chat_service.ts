/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { AgUiAgent } from './ag_ui_agent';
import { RunAgentInput, Message, UserMessage, ToolMessage, InputContent } from '../../common/types';
import type { AssistantContextOptions, ToolDefinition } from '../../../context_provider/public';
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
import { ASK_USER_TOOL_NAME, SWITCH_DATA_SOURCE_TOOL_NAME } from '../../common';
import { ConversationHistoryService } from './conversation_history_service';
import { DataSourceUnresolvedError } from './data_source_unresolved_error';

export { DataSourceUnresolvedError };

export interface DataSourceInfo {
  id: string;
  title: string;
}

/**
 * Where the active data source of a run came from.
 * - page: the data source of the dataset on the current page (it pins the data source).
 * - caller: the data source the caller of sendMessageWithWindow passed with this message.
 * - pending: a choice the agent has not recorded yet: a picker choice, or a data source a caller
 *   passed with an earlier message.
 * - conversation: the last successful switch_data_source in the conversation.
 * - workspaceDefault / globalDefault: the default data source of the workspace, or the global
 *   default when not in a workspace.
 * - previousRun: the data source of the run whose tool result a continuation sends.
 */
export type DataSourceSource =
  | 'page'
  // The data source passed with this message (sendMessageWithWindow's dataSourceId). Sending
  // the message makes it the pending choice.
  | 'caller'
  // A data source chosen for the conversation but not recorded yet. Used ahead of the
  // conversation's own, and the agent is asked to record it with switch_data_source.
  | 'pending'
  | 'conversation'
  | 'workspaceDefault'
  | 'globalDefault'
  // A continuation that resolved nothing keeps the data source of the run that requested the tool.
  | 'previousRun';

/**
 * The data source a run uses, and why. Resolution is a pure read, so callers act on `kind` instead
 * of guessing why no data source was found.
 */
export type DataSourceResolution =
  // Multiple data sources are not enabled: runs carry no data source id.
  | { kind: 'disabled' }
  // The data source list could not be read.
  | { kind: 'list_failed' }
  // No data source is available to this workspace.
  | { kind: 'none_exist' }
  // Data sources exist but none resolved: the user has to pick one in the picker.
  | { kind: 'needs_selection'; available: DataSourceInfo[]; listComplete: boolean }
  // Data sources exist but none resolved, and chat.unresolvedDataSource is 'agent': the run is
  // sent without a data source, and the agent asks the user for one when the request needs data.
  | { kind: 'unselected'; available: DataSourceInfo[]; listComplete: boolean }
  | {
      kind: 'resolved';
      active: DataSourceInfo;
      source: DataSourceSource;
      available: DataSourceInfo[];
      // false when `available` may not hold every data source: the workspace has more than the
      // list shows, the active one was found only by a direct lookup, or a continuation fell
      // back to the previous run's data source.
      listComplete: boolean;
    };

/** Whether a message can be sent with this resolution (the others block the send). */
export const canRunWith = (
  resolution: DataSourceResolution
): resolution is Extract<DataSourceResolution, { kind: 'resolved' | 'disabled' | 'unselected' }> =>
  resolution.kind === 'resolved' ||
  resolution.kind === 'disabled' ||
  resolution.kind === 'unselected';

type DataSourceListResult = { ok: true; list: DataSourceInfo[]; complete: boolean } | { ok: false };

// One page of data sources. More would crowd the agent context; ids past it are looked up directly.
export const AVAILABLE_DATA_SOURCES_LIMIT = 100;

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
  // Whether multiple data sources are enabled. When false, runs carry no data source id.
  private dataSourceEnabled: boolean;
  // What happens when no data source resolves (see chat.unresolvedDataSource): 'picker' asks the
  // user before sending, 'agent' sends without one and lets the agent ask when it needs data.
  private unresolvedDataSource: 'picker' | 'agent';
  // The available data sources of the current conversation, read once per thread. A failed read
  // is dropped so the next caller reads again.
  private dataSources?: { threadId: string; promise: Promise<DataSourceListResult> };
  // Definite answers of direct lookups for ids missing from the list, per thread. null means the
  // id is not an available data source. Failed lookups are not cached.
  private dataSourceLookups?: {
    threadId: string;
    results: Map<string, DataSourceInfo | null>;
    inFlight: Map<string, Promise<DataSourceInfo | null | 'failed'>>;
  };
  // The conversation's data source: its last successful switch_data_source. Never a page or
  // default id; nothing about it is stored in the browser.
  private conversationDataSourceId?: string;
  // A data source chosen for the conversation that the agent has not recorded with
  // switch_data_source yet: a picker choice, or one a caller passed. Cleared once recorded.
  private pendingDataSourceId?: string;
  // The default data source setting, read once per thread and scope.
  private defaultDataSourceRead?: {
    threadId: string;
    inWorkspace: boolean;
    promise: Promise<string | undefined>;
  };
  // The data source each run was dispatched with, for the tools that run executes.
  private runDataSources = new Map<string, DataSourceInfo | undefined>();
  // The last dispatched run. Its data source is undefined when it went without one (an
  // `unselected` or `disabled` run), which is not the same as no run yet.
  private lastRun?: { dataSource?: DataSourceInfo };
  // Incremented per loadConversation, so only the latest load applies its thread.
  private conversationLoadToken = 0;

  // Conversation history service
  public conversationHistoryService: ConversationHistoryService;

  constructor(
    uiSettings: IUiSettingsClient,
    coreChatService?: ChatServiceStart,
    workspaces?: WorkspacesStart,
    savedObjectsClient?: SavedObjectsClientContract,
    // Without a saved objects client there is no way to read data sources.
    dataSourceEnabled: boolean = !!savedObjectsClient,
    unresolvedDataSource: 'picker' | 'agent' = 'picker'
  ) {
    this.unresolvedDataSource = unresolvedDataSource;
    // No need to pass URL anymore - agent will use the proxy endpoint
    this.agent = new AgUiAgent();
    this.uiSettings = uiSettings;
    this.coreChatService = coreChatService;
    this.workspaces = workspaces;
    this.savedObjectsClient = savedObjectsClient;
    this.dataSourceEnabled = dataSourceEnabled && !!savedObjectsClient;

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

    // The window applies the requested data source only if it actually sends the message.
    await chatWindowInstance.sendMessage({
      content,
      messages,
      dataSourceId: options?.dataSourceId,
    });

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

  /**
   * Read the data source id from the current page/panel context. Pure read: it never
   * mutates conversation state, and a throwing context store resolves to undefined.
   */
  private getDataSourceFromPageContext(): string | undefined {
    try {
      return this.getPageContextValue()?.dataset?.dataSource?.id;
    } catch {
      return undefined;
    }
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
    return this.getAgentVisibleContexts().map((ctx) => ({
      description: ctx.description,
      value: typeof ctx.value === 'string' ? ctx.value : JSON.stringify(ctx.value),
    }));
  }

  /**
   * The contexts the agent is allowed to see, before they are encoded for the wire.
   */
  public getAgentVisibleContexts(): AssistantContextOptions[] {
    const pplLintFixRequestCategory: PPLLintFixRequestCategory = 'ppl-lint-fix-request';
    return this.getAllAssistantContexts().filter(
      (ctx) => !ctx.categories?.includes(pplLintFixRequestCategory)
    );
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

  public isDataSourceEnabled(): boolean {
    return this.dataSourceEnabled;
  }

  /**
   * Read the default data source id: in a workspace only the workspace-level default (the
   * workspace scope never falls back to the global one), otherwise the global default. A failed
   * read counts as no default.
   */
  private getScopedDefaultDataSourceId(inWorkspace: boolean): Promise<string | undefined> {
    // Read once per conversation and scope, like the list: history, suggestions and every run
    // resolve the default, and each read is a request. A failed read is not kept.
    const threadId = this.getThreadId();
    const cached = this.defaultDataSourceRead;
    if (cached?.threadId === threadId && cached.inWorkspace === inWorkspace) return cached.promise;

    const entry = {
      threadId,
      inWorkspace,
      promise: getDefaultDataSourceId(
        this.uiSettings,
        inWorkspace ? UiSettingScope.WORKSPACE : UiSettingScope.GLOBAL
      ).then(
        (id) => id || undefined,
        () => {
          if (this.defaultDataSourceRead === entry) this.defaultDataSourceRead = undefined;
          return undefined;
        }
      ),
    };
    this.defaultDataSourceRead = entry;
    return entry.promise;
  }

  /**
   * The available data sources of the current conversation. Read once per thread and shared by
   * every caller; a failed read is not kept, so the next caller reads again.
   */
  private ensureDataSources(): Promise<DataSourceListResult> {
    const threadId = this.getThreadId();
    if (this.dataSources?.threadId === threadId) return this.dataSources.promise;
    const entry = { threadId, promise: this.fetchDataSources() };
    this.dataSources = entry;
    entry.promise.then((result) => {
      if (!result.ok && this.dataSources === entry) this.dataSources = undefined;
    });
    return entry.promise;
  }

  /** Start reading the data source list for a conversation that was just opened, without waiting. */
  private prefetchDataSources(): void {
    if (this.dataSourceEnabled) this.ensureDataSources();
  }

  /** Read one page of data sources. `complete` is false when the workspace has more. */
  private async fetchDataSources(): Promise<DataSourceListResult> {
    if (!this.savedObjectsClient) return { ok: false };
    try {
      const response = await this.savedObjectsClient.find<{ title: string }>({
        type: 'data-source',
        fields: ['title'],
        perPage: AVAILABLE_DATA_SOURCES_LIMIT,
      });
      const list = (response?.savedObjects || [])
        .map((ds) => ({ id: ds.id, title: ds.attributes?.title || ds.id }))
        .sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()));
      const total = typeof response?.total === 'number' ? response.total : list.length;
      return { ok: true, list, complete: total <= list.length };
    } catch {
      return { ok: false };
    }
  }

  /**
   * Look a data source up by id, for an id the list does not contain (one past the first page, or
   * created after the list was read). It is available only if it is a data source with attributes
   * that belongs to the current workspace (data source admins can read ones outside it). A failed
   * lookup is treated as not available and is not cached.
   */
  private lookupDataSource(id: string): Promise<DataSourceInfo | null | 'failed'> {
    const threadId = this.getThreadId();
    if (this.dataSourceLookups?.threadId !== threadId) {
      this.dataSourceLookups = { threadId, results: new Map(), inFlight: new Map() };
    }
    const { results, inFlight } = this.dataSourceLookups;
    const cached = results.get(id);
    if (cached !== undefined) return Promise.resolve(cached);
    // Concurrent resolutions of the same id (a send and the suggestions) share one request.
    const pending = inFlight.get(id);
    if (pending) return pending;
    const lookup = this.fetchDataSourceById(id, results).finally(() => inFlight.delete(id));
    inFlight.set(id, lookup);
    return lookup;
  }

  private async fetchDataSourceById(
    id: string,
    results: Map<string, DataSourceInfo | null>
  ): Promise<DataSourceInfo | null | 'failed'> {
    if (!this.savedObjectsClient) return 'failed';

    // Only a missing or forbidden object is a definite "not available".
    const isDefinite = (status: unknown) => status === 403 || status === 404;
    let found: DataSourceInfo | null;
    try {
      const ds = await this.savedObjectsClient.get<{ title?: string }>('data-source', id);
      const error = (ds as { error?: { statusCode?: number } } | undefined)?.error;
      if (error) {
        if (!isDefinite(error.statusCode)) return 'failed';
        found = null;
      } else {
        const workspaceId = this.workspaces?.currentWorkspaceId$.getValue();
        const usable =
          !!ds &&
          ds.type === 'data-source' &&
          // A missing object can come back as an id/type-only object with empty attributes.
          !!ds.attributes &&
          Object.keys(ds.attributes).length > 0 &&
          (!workspaceId || (ds.workspaces ?? []).includes(workspaceId));
        found = usable ? { id: ds.id, title: ds.attributes.title || ds.id } : null;
      }
    } catch (e) {
      // The whole request can be rejected with the status (e.g. a 403 for the workspace).
      const err = e as { res?: { status?: number }; body?: { statusCode?: number } };
      if (!isDefinite(err?.res?.status ?? err?.body?.statusCode)) return 'failed';
      found = null;
    }
    results.set(id, found);
    return found;
  }

  /**
   * The one availability check: an id is available if it is in the list, or a direct lookup finds
   * it. `failed` is true when the lookup itself failed, so the answer is not definite.
   */
  private async checkDataSource(
    id: string | undefined,
    list: DataSourceInfo[] | undefined
  ): Promise<{ dataSource?: DataSourceInfo; failed: boolean }> {
    if (!id) return { failed: false };
    const fromList = list?.find((ds) => ds.id === id);
    if (fromList) return { dataSource: fromList, failed: false };
    const lookup = await this.lookupDataSource(id);
    if (lookup === 'failed') return { failed: true };
    return { dataSource: lookup ?? undefined, failed: false };
  }

  /**
   * Check an id read from the page, the conversation history or the default setting. A failed
   * lookup counts as not found, so resolution moves on to the next candidate.
   */
  private async verifyDataSource(
    id: string | undefined,
    list: DataSourceInfo[] | undefined
  ): Promise<DataSourceInfo | undefined> {
    return (await this.checkDataSource(id, list)).dataSource;
  }

  /**
   * Build a resolved result. The active data source is always in `available`, even when only the
   * lookup found it; the list then may not hold every data source.
   */
  private toResolution(
    active: DataSourceInfo,
    source: DataSourceSource,
    list: DataSourceInfo[] | undefined,
    listComplete: boolean
  ): DataSourceResolution {
    const known = list ?? [];
    const inList = known.some((ds) => ds.id === active.id);
    return {
      kind: 'resolved',
      active,
      source,
      available: inList ? known : [...known, active],
      listComplete: listComplete && inList,
    };
  }

  /**
   * Resolve the data source for the next run. A pure read: nothing is written.
   *
   * Candidates, highest priority first: the page's dataset data source, the data source a caller
   * passed with this message (`callerDataSourceId`), a choice not recorded yet, the
   * conversation's data source, then the default (workspace-level in a workspace, global
   * otherwise). Each one is used only if it is verified; otherwise the next one is tried. When
   * none is, the user has to pick one (`needs_selection`), or, when chat.unresolvedDataSource is
   * 'agent', the run goes without one and the agent asks when it needs data (`unselected`).
   */
  public async resolveDataSourceForRun(options?: {
    callerDataSourceId?: string;
  }): Promise<DataSourceResolution> {
    if (!this.dataSourceEnabled) return { kind: 'disabled' };

    // Read the conversation's state before awaiting, so one resolution never mixes two
    // conversations if the user switches while it runs.
    const conversationDataSourceId = this.conversationDataSourceId;
    const pendingDataSourceId = this.pendingDataSourceId;
    const listResult = await this.ensureDataSources();
    const list = listResult.ok ? listResult.list : undefined;
    const resolved = (active: DataSourceInfo, source: DataSourceSource) =>
      this.toResolution(active, source, list, listResult.ok && listResult.complete);

    const page = await this.verifyDataSource(this.getDataSourceFromPageContext(), list);
    if (page) return resolved(page, 'page');

    // The data source of what this message asks about. One that does not verify leaves any
    // earlier choice in place.
    const callerId = options?.callerDataSourceId;
    if (callerId) {
      const caller = await this.verifyDataSource(callerId, list);
      if (caller) {
        return resolved(caller, caller.id === conversationDataSourceId ? 'conversation' : 'caller');
      }
      // eslint-disable-next-line no-console
      console.debug(`Chat: the data source "${callerId}" passed by the caller is not available.`);
    }

    // A choice not recorded yet comes before the conversation's own: it is the newer intent.
    if (pendingDataSourceId) {
      const pending = await this.verifyDataSource(pendingDataSourceId, list);
      if (pending) return resolved(pending, 'pending');
      // eslint-disable-next-line no-console
      console.debug(
        `Chat: the chosen data source "${pendingDataSourceId}" is not available; ignoring it.`
      );
    }

    const conversation = await this.verifyDataSource(conversationDataSourceId, list);
    if (conversation) return resolved(conversation, 'conversation');

    const inWorkspace = !!this.workspaces?.currentWorkspaceId$.getValue();
    const defaultId = await this.getScopedDefaultDataSourceId(inWorkspace);
    const defaultDataSource = await this.verifyDataSource(defaultId, list);
    if (defaultDataSource) {
      return resolved(defaultDataSource, inWorkspace ? 'workspaceDefault' : 'globalDefault');
    }

    if (!listResult.ok) return { kind: 'list_failed' };
    if (listResult.list.length === 0) return { kind: 'none_exist' };
    return {
      kind: this.unresolvedDataSource === 'agent' ? 'unselected' : 'needs_selection',
      available: listResult.list,
      listComplete: listResult.complete,
    };
  }

  /** The resolved data source id for read-only callers (history, suggestions), if any. */
  public async getDataSourceIdForRead(): Promise<string | undefined> {
    const resolution = await this.resolveDataSourceForRun();
    return resolution.kind === 'resolved' ? resolution.active.id : undefined;
  }

  /**
   * Check a data source id the agent asked to switch to, the same way candidates are checked.
   * `unverifiable` is true when the check itself failed (the list could not be read and the id
   * was not found, or the direct lookup failed), so the agent can ask the user to retry instead
   * of saying the data source does not exist.
   */
  public async verifyDataSourceId(
    id: string
  ): Promise<{ dataSource?: DataSourceInfo; available: DataSourceInfo[]; unverifiable: boolean }> {
    if (!this.dataSourceEnabled) return { available: [], unverifiable: false };
    const listResult = await this.ensureDataSources();
    const list = listResult.ok ? listResult.list : [];
    const { dataSource, failed } = await this.checkDataSource(id, list);
    if (dataSource) return { dataSource, available: list, unverifiable: false };
    return { available: list, unverifiable: failed || !listResult.ok };
  }

  /** The verified data source of the current page's dataset, if any. It pins the active one. */
  public async getPageDataSource(): Promise<DataSourceInfo | undefined> {
    const pageId = this.getDataSourceFromPageContext();
    if (!pageId || !this.dataSourceEnabled) return undefined;
    const listResult = await this.ensureDataSources();
    return this.verifyDataSource(pageId, listResult.ok ? listResult.list : undefined);
  }

  public getConversationDataSourceId(): string | undefined {
    return this.conversationDataSourceId;
  }

  /** The chosen data source the agent has not recorded yet, if any. */
  public getPendingDataSourceId(): string | undefined {
    return this.pendingDataSourceId;
  }

  /**
   * Choose a data source for the conversation without recording it: a picker choice, or one a
   * caller passed with a message that was sent (sendMessage sets it then). It is used ahead of
   * the conversation's own data source (verified like every candidate, ignored when not
   * available), and the agent is asked to record it with switch_data_source so it can be read
   * back from the history.
   */
  public setPendingDataSource(id: string): void {
    // Already the recorded data source: there is nothing for the agent to record.
    this.pendingDataSourceId = id === this.conversationDataSourceId ? undefined : id;
  }

  /**
   * Record the conversation's data source: a successful switch_data_source. Any pending choice is
   * settled by it (recorded, or replaced by the data source the user named instead).
   */
  public setConversationDataSource(id: string): void {
    this.conversationDataSourceId = id;
    this.pendingDataSourceId = undefined;
  }

  /**
   * The data source a run was dispatched with, for the tools that run executes. Runs are matched
   * by the runId the client sent, which AG-UI servers echo in RUN_STARTED. If a server uses its
   * own runId, this falls back to the last dispatched run (the one whose tools are executing,
   * since a continuation waits for them), then to a fresh resolution (tools replayed from history
   * have no run).
   */
  public async getRunDataSource(runId?: string): Promise<DataSourceInfo | undefined> {
    if (runId && this.runDataSources.has(runId)) return this.runDataSources.get(runId);
    if (this.lastRun) return this.lastRun.dataSource;
    const resolution = await this.resolveDataSourceForRun();
    return resolution.kind === 'resolved' ? resolution.active : undefined;
  }

  private recordRunDataSource(runId: string, dataSource: DataSourceInfo | undefined): void {
    this.runDataSources.set(runId, dataSource);
    // Keep only recent runs; older runs have no tools left to execute.
    if (this.runDataSources.size > 20) {
      this.runDataSources.delete(this.runDataSources.keys().next().value as string);
    }
    this.lastRun = { dataSource };
  }

  private clearConversationDataSourceState(): void {
    this.conversationDataSourceId = undefined;
    this.pendingDataSourceId = undefined;
    this.defaultDataSourceRead = undefined;
    this.runDataSources.clear();
    this.lastRun = undefined;
    this.dataSources = undefined;
    this.dataSourceLookups = undefined;
  }

  /**
   * Resolve the data source for a frontend-tool continuation. When nothing resolves (for example
   * the user left the page that pinned it), the continuation keeps the data source of the run
   * that requested the tool so the tool result still reaches the same agent.
   */
  private async resolveForContinuation(): Promise<DataSourceResolution> {
    const resolution = await this.resolveDataSourceForRun();
    if (resolution.kind === 'resolved' || resolution.kind === 'disabled') return resolution;
    const last = this.lastRun?.dataSource;
    // No earlier run to fall back to (a tool replayed from history whose data source no longer
    // verifies): the result is still delivered, without a data source id, so the run can finish.
    if (!last) return resolution;
    // Not the conversation's data source: no picker or page line applies to it.
    const list =
      resolution.kind === 'needs_selection' || resolution.kind === 'unselected'
        ? resolution.available
        : undefined;
    return this.toResolution(last, 'previousRun', list, false);
  }

  /**
   * Find the data source the conversation history selected: the result of its last successful
   * switch_data_source call. Rejected or failed calls, calls without a result and results that are
   * not JSON are ignored. The id is not checked here; resolution verifies it before use.
   */
  private readConversationDataSourceFromHistory(events: Event[]): string | undefined {
    // Every snapshot counts, in order, in case a backend restores one per run.
    const messages = events
      .filter((e) => e.type === EventType.MESSAGES_SNAPSHOT)
      .flatMap((e) => (e as MessagesSnapshotEvent).messages ?? []);
    const switchCallIds = new Set<string>();
    for (const message of messages) {
      if (message.role !== 'assistant' || !('toolCalls' in message) || !message.toolCalls) continue;
      for (const call of message.toolCalls) {
        if (call.function?.name === SWITCH_DATA_SOURCE_TOOL_NAME) switchCallIds.add(call.id);
      }
    }

    let found: string | undefined;
    for (const message of messages) {
      if (message.role !== 'tool' || !('toolCallId' in message)) continue;
      if (!switchCallIds.has((message as ToolMessage).toolCallId)) continue;
      try {
        const content = (message as ToolMessage).content;
        const result = typeof content === 'string' ? JSON.parse(content) : content;
        if (result?.success === true && typeof result.dataSourceId === 'string') {
          found = result.dataSourceId;
        }
      } catch {
        // Not a JSON result; skip it.
      }
    }
    return found;
  }

  /**
   * Publish the data source context for a run and return every context the agent may see. It
   * lists the available data sources and names the active one, or says none is active (an
   * `unselected` run). Other runs remove it.
   */
  private buildDataSourceContext(resolution: DataSourceResolution) {
    const contextStore = (window as any).assistantContextStore;

    if (contextStore) {
      if (resolution.kind === 'resolved' || resolution.kind === 'unselected') {
        contextStore.addContext({
          id: AVAILABLE_DATA_SOURCES_CONTEXT_ID,
          description: AVAILABLE_DATA_SOURCES_CONTEXT_DES,
          value: this.dataSourceContextLines(resolution).join('\n'),
        });
      } else {
        contextStore.removeContextById(AVAILABLE_DATA_SOURCES_CONTEXT_ID);
      }
    }

    // Build the per-run context from the store (static + dynamic + the data source context above),
    // filtering out categories the model must never receive (e.g. the PPL quick-fix request id).
    return this.getAgentContexts();
  }

  private dataSourceContextLines(
    resolution: Extract<DataSourceResolution, { kind: 'resolved' | 'unselected' }>
  ): string[] {
    const switchTool = SWITCH_DATA_SOURCE_TOOL_NAME;
    // JSON.stringify quotes and escapes the title so a title containing a quote or newline
    // cannot break the list format.
    const label = (ds: DataSourceInfo) => `${JSON.stringify(ds.title)} (id: ${ds.id})`;
    const { available, listComplete } = resolution;
    const lines = [
      `Available data sources: ${available.map(label).join(', ')}` +
        (listComplete ? '' : ' (this list may be incomplete)'),
    ];

    if (resolution.kind === 'unselected') {
      lines.push(`Active data source: none. Do not call tools that read data until one is active.`);
    } else {
      const { active, source } = resolution;
      lines.push(
        `Active data source: ${label(active)}`,
        `Tools that read data only reach the active data source; pass its title, and no other name, as the cluster name.`
      );
      if (source === 'page') {
        lines.push(
          `The dataset on the current page pins the active data source, so it cannot be switched here. If the user asks for another data source, tell them to select a dataset from it on the page, or to leave the page.`
        );
      }
      // A picker choice, or the data source of what the user asked about: the agent records it
      // so the conversation keeps it after this run.
      if (source === 'caller' || source === 'pending') {
        lines.push(
          `The active data source is not recorded in the conversation yet. Before calling any other tool, call ${switchTool} with dataSourceId "${active.id}".`
        );
      }
    }

    lines.push(
      `- If the user names an available data source that is not active, call ${switchTool} with its id first.`,
      listComplete
        ? `- If the user names a data source that is not listed, say you could not find it and list the available names.`
        : `- If the user names a data source that is not listed, say you could not find it among the listed ones, list their names, and ask the user for its id.`
    );
    if (resolution.kind === 'unselected') {
      const needsData = `If the request needs data (for example querying or listing indices, fields or logs)`;
      const noData = `Answer a request that needs no data (for example a general or syntax question) directly.`;
      // A title shared by two data sources gets its id, so an answer always names one of them.
      const titleCounts = new Map<string, number>();
      available.forEach((ds) => titleCounts.set(ds.title, (titleCounts.get(ds.title) ?? 0) + 1));
      const options = available
        .map((ds) =>
          JSON.stringify(titleCounts.get(ds.title)! > 1 ? `${ds.title} (id: ${ds.id})` : ds.title)
        )
        .join(', ');
      lines.push(
        ...(available.length === 1
          ? [
              `- ${needsData}, call ${switchTool} with the id of the only data source first. ${noData}`,
            ]
          : [
              `- ${needsData} and the user names no data source, call ${ASK_USER_TOOL_NAME} with inputType "select" and these options: ${options}. ${noData}`,
              `- Once the user has chosen a data source (for example in an ${ASK_USER_TOOL_NAME} answer), call ${switchTool} with its id.`,
              `- If the user declines to choose, say that no data source is selected, and do not call ${switchTool} or tools that read data.`,
            ]),
        `- Do not choose a data source based on what the question is about.`
      );
    } else {
      lines.push(
        `- If the user names no data source, use the active one. Do not choose a data source based on what the question is about.`
      );
    }
    return lines;
  }

  /**
   * Send a user message. `options.resolution` is the data source resolution the caller already
   * made for this send (the chat window does, to decide whether to show the picker); without it,
   * the data source is resolved here. Throws DataSourceUnresolvedError when the resolution cannot
   * run (see canRunWith).
   */
  public async sendMessage(
    content: string,
    messages: Message[],
    userMessage?: UserMessage,
    options?: { resolution?: DataSourceResolution }
  ): Promise<{
    observable: any;
    userMessage: UserMessage;
  }> {
    // Resolve once for this run: the run, its context and its tools all use this result.
    const resolution = options?.resolution ?? (await this.resolveDataSourceForRun());
    if (!canRunWith(resolution)) {
      throw new DataSourceUnresolvedError(resolution);
    }
    const runDataSource = resolution.kind === 'resolved' ? resolution.active : undefined;

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

    const threadId = this.getThreadId();

    if (!threadId) {
      this.removeActiveRequest(requestId);
      throw new Error('Thread ID is required to send a message');
    }

    // A data source passed with this message stays chosen for the conversation once it is sent,
    // until the agent records it.
    if (resolution.kind === 'resolved' && resolution.source === 'caller') {
      this.setPendingDataSource(resolution.active.id);
    }

    const context = this.buildDataSourceContext(resolution);
    const runId = this.generateRunId();
    this.recordRunDataSource(runId, runDataSource);

    const runInput: RunAgentInput = {
      threadId,
      runId,
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

    const observable = this.agent.runAgent(runInput, runDataSource?.id);

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
    // The conversation changed during the waits: this result belongs to the one that is gone.
    if (signal?.aborted || this.getThreadId() !== threadId) return skip('aborted');

    // Resolve right before dispatch, after the waits: a switch_data_source in the previous run
    // applies from this continuation on, and a skipped continuation never touches the context.
    const resolution = await this.resolveForContinuation();
    if (signal?.aborted || this.getThreadId() !== threadId) return skip('aborted');
    const runDataSource = resolution.kind === 'resolved' ? resolution.active : undefined;
    const runId = this.generateRunId();
    const runInput: RunAgentInput = {
      threadId,
      runId,
      messages: mappedMessages,
      tools: this.availableTools || [],
      context: this.buildDataSourceContext(resolution), // All contexts, stringified values
      state: {}, // Empty for agent internal use only
      // Client capability signal: this client can parse and strip the inline
      // CONVERSATION_TITLE: sentinel, so the server may emit the title line.
      forwardedProps: { allowConversationTitle: true },
    };

    // Continue the conversation with the tool result
    this.recordRunDataSource(runId, runDataSource);
    const observable = this.agent.runAgent(runInput, runDataSource?.id);
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

    const includeFullHistory =
      this.conversationHistoryService.getMemoryProvider().includeFullHistory;
    const mappedMessages = includeFullHistory ? [...messages, ...toolMessages] : [...toolMessages];

    const threadId = this.getThreadId();
    if (!threadId) return skip('no_thread_id');

    // Abort the halted main run so it does not overlap the continuation.
    this.agent.abort();

    // Each result is dispatched directly; the server reconciles it via its wire->native map
    // (see sendToolResult), which is idempotent and cross-process.
    if (!(await this.waitBeforeContinuation(signal))) return skip('aborted');
    if (this.getThreadId() !== threadId) return skip('aborted');

    // Resolve right before dispatch (see sendToolResult).
    const resolution = await this.resolveForContinuation();
    if (signal?.aborted || this.getThreadId() !== threadId) return skip('aborted');
    const runDataSource = resolution.kind === 'resolved' ? resolution.active : undefined;
    const runId = this.generateRunId();
    const runInput: RunAgentInput = {
      threadId,
      runId,
      messages: mappedMessages,
      tools: this.availableTools || [],
      context: this.buildDataSourceContext(resolution),
      state: {},
      // Client capability signal: this client can parse and strip the inline
      // CONVERSATION_TITLE: sentinel, so the server may emit the title line.
      forwardedProps: { allowConversationTitle: true },
    };

    this.recordRunDataSource(runId, runDataSource);
    const observable = this.agent.runAgent(runInput, runDataSource?.id);
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

  public newThread(): void {
    // Delegate to core service
    if (!this.coreChatService) {
      throw new Error('Core chat service not available');
    }
    this.coreChatService.newThread();

    // A new conversation has no data source of its own and reads the list afresh. A history load
    // still in flight must not take the thread back.
    ++this.conversationLoadToken;
    this.clearConversationDataSourceState();
    this.prefetchDataSources();

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
   * Load a specific conversation from history by thread ID.
   * Returns the AG-UI event array (with unfinished tool calls injected) for replay.
   *
   * The conversation's data source is read back from its history (its last successful
   * switch_data_source); nothing about it is stored in the browser.
   */
  public async loadConversation(threadId: string): Promise<Event[] | null> {
    const loadToken = ++this.conversationLoadToken;

    // The current conversation keeps its data source while this loads: the history is fetched
    // with the same data source the conversation list came from, and a failed load leaves the
    // user in the current conversation with nothing changed.
    const events = await this.conversationHistoryService.getConversation(threadId);
    // A newer load (or a new chat) started while this one was waiting: it owns the thread.
    if (loadToken !== this.conversationLoadToken) {
      return null;
    }
    if (!events) {
      return null;
    }

    // Switching for real: drop the previous conversation's data source state and context.
    this.clearConversationDataSourceState();
    this.clearDynamicContextFromStore(AVAILABLE_DATA_SOURCES_CONTEXT_ID);

    // Set the thread ID in core service
    if (this.coreChatService) {
      this.coreChatService.setThreadId(threadId);
    }

    this.conversationDataSourceId = this.readConversationDataSourceFromHistory(events);
    this.prefetchDataSources();

    return this.injectUnfinishedToolCallEvents(events);
  }

  /**
   * Delete a conversation.
   */
  public async deleteConversation(threadId: string): Promise<void> {
    await this.conversationHistoryService.deleteConversation(threadId);
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
   * Cleanup method to properly dispose of subscriptions
   */
  public destroy(): void {
    if (this.toolSubscription) {
      this.toolSubscription.unsubscribe();
      this.toolSubscription = undefined;
    }
  }
}
