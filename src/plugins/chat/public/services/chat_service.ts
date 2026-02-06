/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Observable, Subscription } from 'rxjs';
import { AgUiAgent } from './ag_ui_agent';
import { RunAgentInput, Message, UserMessage, ToolMessage } from '../../common/types';
import type { ToolDefinition } from '../../../context_provider/public';
import { AssistantActionService } from '../../../context_provider/public';
import { ChatLayoutMode } from '../components/chat_header_button';
import type { ChatWindowInstance } from '../components/chat_window';
import {
  IUiSettingsClient,
  UiSettingScope,
  ChatServiceStart,
  ChatWindowState,
  WorkspacesStart,
} from '../../../../core/public';
import { getDefaultDataSourceId } from '../../../data_source_management/public';

export interface ChatState {
  messages: Message[];
  isStreaming: boolean;
  currentStreamingMessage?: string;
}

export interface CurrentChatState {
  threadId: string;
  messages: Message[];
}

export type ChatWindowStateCallback = (
  newWindowState: ChatWindowState,
  changed: { [key in keyof ChatWindowState]: boolean }
) => void;

export class ChatService {
  private agent: AgUiAgent;
  public availableTools: ToolDefinition[] = [];
  public events$: any;
  private activeRequests: Set<string> = new Set();
  private requestCounter: number = 0;
  private uiSettings: IUiSettingsClient;
  private coreChatService?: ChatServiceStart;
  private workspaces?: WorkspacesStart;

  // Chat state persistence
  private readonly STORAGE_KEY = 'chat.currentState';
  private currentMessages: Message[] = [];

  // ChatWindow ref for delegating sendMessage calls to proper timeline management
  private chatWindowRef: React.RefObject<ChatWindowInstance> | null = null;

  // Subscription to assistant action service for tool updates
  private toolSubscription?: Subscription;

  // Cache for datasourceId to avoid repeated lookups
  private cachedDataSourceId?: string;

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

    // Try to restore existing state first
    const currentChatState = this.loadCurrentChatState();
    if (currentChatState?.threadId && this.coreChatService) {
      // Set thread ID in core service
      this.coreChatService.setThreadId(currentChatState.threadId);
    }

    // Clean up trailing error messages from interrupted sessions (e.g., page refresh)
    const messages = currentChatState?.messages || [];
    this.currentMessages = this.removeTrailingErrorMessages(messages);

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

  // Window state management - delegate to core service
  public isWindowOpen(): boolean {
    if (!this.coreChatService) {
      throw new Error('Core chat service not available');
    }
    return this.coreChatService.isWindowOpen();
  }

  public getWindowState(): ChatWindowState {
    if (!this.coreChatService) {
      throw new Error('Core chat service not available');
    }
    return this.coreChatService.getWindowState();
  }

  public getWindowMode(): ChatLayoutMode {
    if (!this.coreChatService) {
      throw new Error('Core chat service not available');
    }
    const windowMode = this.coreChatService.getWindowState().windowMode;
    return windowMode === 'sidecar' ? ChatLayoutMode.SIDECAR : ChatLayoutMode.FULLSCREEN;
  }

  public getPaddingSize(): number {
    if (!this.coreChatService) {
      throw new Error('Core chat service not available');
    }
    const paddingSize = this.coreChatService.getWindowState().paddingSize;
    // Fallback to default if undefined
    return paddingSize ?? 400;
  }

  public setWindowState(newWindowState: Partial<ChatWindowState>): void {
    if (!this.coreChatService) {
      throw new Error('Core chat service not available');
    }
    this.coreChatService.setWindowState(newWindowState);
  }

  public onWindowStateChange(callback: ChatWindowStateCallback): () => void {
    if (!this.coreChatService) {
      throw new Error('Core chat service not available');
    }

    let previousState: ChatWindowState | null = null;

    // Subscribe to core service observable and add change tracking logic
    const subscription = this.coreChatService.getWindowState$().subscribe((newState) => {
      if (previousState === null) {
        previousState = { ...newState };
        return;
      }

      // Compare with previous state to determine what changed
      const changed = {
        isWindowOpen: previousState.isWindowOpen !== newState.isWindowOpen,
        windowMode: previousState.windowMode !== newState.windowMode,
        paddingSize: previousState.paddingSize !== newState.paddingSize,
      };

      // Only notify if something actually changed
      if (changed.isWindowOpen || changed.windowMode || changed.paddingSize) {
        callback(newState, changed);
        previousState = { ...newState };
      }
    });

    return () => subscription.unsubscribe();
  }

  public onWindowOpenRequest(callback: () => void): () => void {
    if (!this.coreChatService) {
      throw new Error('Core chat service not available');
    }
    return this.coreChatService.onWindowOpen(callback);
  }

  public onWindowCloseRequest(callback: () => void): () => void {
    if (!this.coreChatService) {
      throw new Error('Core chat service not available');
    }
    return this.coreChatService.onWindowClose(callback);
  }

  // ChatWindow ref management for proper timeline handling
  public setChatWindowRef(ref: React.RefObject<ChatWindowInstance>): void {
    this.chatWindowRef = ref;
  }

  public clearChatWindowRef(): void {
    this.chatWindowRef = null;
  }

  public async openWindow(): Promise<void> {
    if (!this.coreChatService) {
      throw new Error('Core chat service not available');
    }
    await this.coreChatService.openWindow();
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
    // Ensure window is open
    await this.openWindow();

    // Clear conversation if requested (create new thread)
    if (options?.clearConversation) {
      this.newThread();

      // If we have ChatWindow ref, also clear its conversation
      if (this.chatWindowRef?.current) {
        this.chatWindowRef.current.startNewChat();
      }
    }

    // If ChatWindow is available, delegate to its sendMessage for proper timeline management
    if (this.chatWindowRef?.current && this.isWindowOpen()) {
      try {
        await this.chatWindowRef.current.sendMessage({ content, messages });

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
      } catch (error) {
        // Fall back to direct service call if delegation fails
      }
    }

    // Fallback to direct service call
    const result = await this.sendMessage(content, messages);
    return result;
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

  /**
   * Get workspace-aware data source ID
   * Determines the correct data source based on current workspace context
   */
  private async getWorkspaceAwareDataSourceId(): Promise<string | undefined> {
    try {
      // Try to get data source from page context first
      const contextStore = (window as any).assistantContextStore;
      const allContexts = contextStore ? contextStore.getAllContexts() : [];

      const pageDataSourceId = this.extractDataSourceIdFromPageContext(allContexts);
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
    return this.cachedDataSourceId || (await this.getWorkspaceAwareDataSourceId());
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

    const runInput: RunAgentInput = {
      threadId: this.getThreadId(),
      runId: this.generateRunId(),
      messages: [...messages, userMessage],
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
    messages: Message[]
  ): Promise<{
    observable: any;
    toolMessage: ToolMessage;
  }> {
    const requestId = this.generateRequestId();

    this.addActiveRequest(requestId);
    const toolMessage: ToolMessage = {
      id: this.generateMessageId(),
      role: 'tool',
      content: typeof result === 'string' ? result : JSON.stringify(result),
      toolCallId,
    };

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
    const mappedMessages = [...messages, toolMessage];

    const runInput: RunAgentInput = {
      threadId: this.getThreadId(),
      runId: this.generateRunId(),
      messages: mappedMessages,
      tools: this.availableTools || [],
      context, // All contexts (static + dynamic) with stringified values
      state: {}, // Empty for agent internal use only
      forwardedProps: {},
    };

    // Continue the conversation with the tool result
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

    this.events$ = trackedObservable;

    return { observable: trackedObservable, toolMessage };
  }

  public abort(): void {
    this.agent.abort();
  }

  public resetConnection(): void {
    this.agent.resetConnection();
  }

  // Chat state persistence methods
  private saveCurrentChatState(): void {
    const state: CurrentChatState = {
      threadId: this.getThreadId(),
      messages: this.currentMessages,
    };
    try {
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to save chat state to sessionStorage:', error);
    }
  }

  private loadCurrentChatState(): CurrentChatState | null {
    try {
      const stored = sessionStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to load chat state from sessionStorage:', error);
      return null;
    }
  }

  private clearCurrentChatState(): void {
    try {
      sessionStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to clear chat state from sessionStorage:', error);
    }
  }

  /**
   * Remove trailing system error messages from restored chat sessions.
   * This prevents stale "network error" messages from interrupted connections (page refresh)
   * from appearing when the user returns to the chat.
   */
  private removeTrailingErrorMessages(messages: any[]): any[] {
    if (!messages.length) {
      return messages;
    }

    // Work backwards from the end, removing trailing system error messages
    let endIndex = messages.length;
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];

      // Check if this is the specific network error from page refresh
      if (message.role === 'system' && message.content === 'Error: network error') {
        endIndex = i; // Mark for removal
      } else {
        // Stop when we hit a non-error message
        break;
      }
    }

    // Return array without trailing error messages
    return messages.slice(0, endIndex);
  }

  public saveCurrentChatStatePublic(): void {
    this.saveCurrentChatState();
  }

  public getCurrentMessages(): Message[] {
    return this.currentMessages;
  }

  public updateCurrentMessages(messages: Message[]): void {
    this.currentMessages = messages;
    this.saveCurrentChatState();
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

    this.currentMessages = [];
    this.clearCurrentChatState();

    // Clear dynamic context from global store for fresh chat session
    this.clearDynamicContextFromStore();

    // Reset AgUiAgent connection state to clear any aborted controllers
    this.resetConnection();
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
