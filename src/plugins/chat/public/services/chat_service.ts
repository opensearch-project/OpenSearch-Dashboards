/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Observable } from 'rxjs';
import { AgUiAgent } from './ag_ui_agent';
import { RunAgentInput, Message, UserMessage, ToolMessage } from '../../common/types';
import type { ToolDefinition } from '../../../context_provider/public';
import { ChatLayoutMode } from '../components/chat_header_button';
import type { ChatWindowInstance } from '../components/chat_window';

export interface ChatState {
  messages: Message[];
  isStreaming: boolean;
  currentStreamingMessage?: string;
}

export interface ChatWindowState {
  isWindowOpen: boolean;
  windowMode: ChatLayoutMode;
  paddingSize: number;
}

export type ChatWindowStateCallback = (
  newWindowState: ChatWindowState,
  changed: { [key in keyof ChatWindowState]: boolean }
) => void;

export class ChatService {
  private agent: AgUiAgent;
  private threadId: string;
  public availableTools: ToolDefinition[] = [];
  public events$: any;
  private activeRequests: Set<string> = new Set();
  private requestCounter: number = 0;

  // Window state management
  private _isWindowOpen: boolean = false;
  private _windowMode: ChatLayoutMode = ChatLayoutMode.SIDECAR;
  private _windowPaddingSize: number = 400;
  private windowStateCallbacks: Set<ChatWindowStateCallback> = new Set();
  private windowOpenCallbacks: Set<() => void> = new Set();
  private windowCloseCallbacks: Set<() => void> = new Set();

  // ChatWindow ref for delegating sendMessage calls to proper timeline management
  private chatWindowRef: React.RefObject<ChatWindowInstance> | null = null;

  constructor() {
    // No need to pass URL anymore - agent will use the proxy endpoint
    this.agent = new AgUiAgent();
    this.threadId = this.generateThreadId();
  }

  public getThreadId = () => {
    return this.threadId;
  };

  private generateThreadId(): string {
    return `thread-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  private generateRunId(): string {
    return `run-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  private generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  private generateRequestId(): string {
    this.requestCounter++;
    return `chat-req-${Date.now()}-${this.requestCounter}`;
  }

  private addActiveRequest(requestId: string): void {
    this.activeRequests.add(requestId);
    // eslint-disable-next-line no-console
    console.log(
      `📊 [ChatService] Active requests: ${this.activeRequests.size} (added: ${requestId})`
    );
  }

  private removeActiveRequest(requestId: string): void {
    this.activeRequests.delete(requestId);
    // eslint-disable-next-line no-console
    console.log(
      `📊 [ChatService] Active requests: ${this.activeRequests.size} (removed: ${requestId})`
    );
  }

  // Window state management public API
  public isWindowOpen(): boolean {
    return this._isWindowOpen;
  }

  public getWindowMode(): ChatLayoutMode {
    return this._windowMode;
  }

  public getPaddingSize(): number {
    return this._windowPaddingSize;
  }

  public getWindowState(): ChatWindowState {
    return {
      isWindowOpen: this._isWindowOpen,
      windowMode: this._windowMode,
      paddingSize: this._windowPaddingSize,
    };
  }

  public setWindowState(newWindowState: Partial<ChatWindowState>): void {
    const { isWindowOpen, windowMode, paddingSize } = newWindowState;
    const previousWindowState = this.getWindowState();
    const changed = {
      isWindowOpen: false,
      windowMode: false,
      paddingSize: false,
    };

    if (isWindowOpen !== undefined && previousWindowState.isWindowOpen !== isWindowOpen) {
      this._isWindowOpen = isWindowOpen;
      changed.isWindowOpen = true;
    }

    if (windowMode !== undefined && previousWindowState.windowMode !== windowMode) {
      this._windowMode = windowMode;
      changed.windowMode = true;
    }

    if (paddingSize !== undefined && previousWindowState.paddingSize !== paddingSize) {
      this._windowPaddingSize = paddingSize;
      changed.paddingSize = true;
    }

    // Notify listeners if state changed
    if (changed.isWindowOpen || changed.windowMode || changed.paddingSize) {
      this.windowStateCallbacks.forEach((callback) =>
        callback({ ...previousWindowState, ...newWindowState }, changed)
      );
    }
  }

  public onWindowStateChange(callback: ChatWindowStateCallback): () => void {
    this.windowStateCallbacks.add(callback);
    // Return unsubscribe function
    return () => this.windowStateCallbacks.delete(callback);
  }

  public onWindowOpenRequest(callback: () => void): () => void {
    this.windowOpenCallbacks.add(callback);
    // Return unsubscribe function
    return () => this.windowOpenCallbacks.delete(callback);
  }

  public onWindowCloseRequest(callback: () => void): () => void {
    this.windowCloseCallbacks.add(callback);
    // Return unsubscribe function
    return () => this.windowCloseCallbacks.delete(callback);
  }

  // ChatWindow ref management for proper timeline handling
  public setChatWindowRef(ref: React.RefObject<ChatWindowInstance>): void {
    this.chatWindowRef = ref;
  }

  public clearChatWindowRef(): void {
    this.chatWindowRef = null;
  }

  public async openWindow(): Promise<void> {
    if (!this._isWindowOpen) {
      // Trigger callbacks to request window opening
      this.windowOpenCallbacks.forEach((callback) => callback());
    }
  }

  public async closeWindow(): Promise<void> {
    if (this._isWindowOpen) {
      // Trigger callbacks to request window closing
      this.windowCloseCallbacks.forEach((callback) => callback());
    }
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
    if (this.chatWindowRef?.current && this._isWindowOpen) {
      try {
        await this.chatWindowRef.current.sendMessage({ content });

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

  public async sendMessage(
    content: string,
    messages: Message[]
  ): Promise<{
    observable: any;
    userMessage: UserMessage;
  }> {
    const requestId = this.generateRequestId();

    this.addActiveRequest(requestId);
    const userMessage: UserMessage = {
      id: this.generateMessageId(),
      role: 'user',
      content: content.trim(),
    };

    // Get all contexts from the assistant context store (static + dynamic)
    const contextStore = (window as any).assistantContextStore;
    const allContexts = contextStore ? contextStore.getAllContexts() : [];

    // Convert to AG-UI format: {description: string, value: string}
    const context = allContexts.map((ctx: any) => ({
      description: ctx.description,
      value: typeof ctx.value === 'string' ? ctx.value : JSON.stringify(ctx.value),
    }));

    const runInput: RunAgentInput = {
      threadId: this.threadId,
      runId: this.generateRunId(),
      messages: [...messages, userMessage],
      tools: this.availableTools || [], // Pass available tools to AG-UI server
      context, // All contexts (static + dynamic) with stringified values
      state: {}, // Empty for agent internal use only
      forwardedProps: {},
    };

    const observable = this.agent.runAgent(runInput);

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
      threadId: this.threadId,
      runId: this.generateRunId(),
      messages: mappedMessages,
      tools: this.availableTools || [],
      context, // All contexts (static + dynamic) with stringified values
      state: {}, // Empty for agent internal use only
      forwardedProps: {},
    };

    // Continue the conversation with the tool result
    const observable = this.agent.runAgent(runInput);

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

  public newThread(): void {
    this.threadId = this.generateThreadId();
  }
}
