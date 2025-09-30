/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Observable } from 'rxjs';
import { AgUiAgent } from './ag_ui_agent';
import { RunAgentInput, Message, UserMessage, ToolMessage } from '../../common/types';
import type { ToolDefinition } from '../../../context_provider/public';

export interface ChatState {
  messages: Message[];
  isStreaming: boolean;
  currentStreamingMessage?: string;
}

export class ChatService {
  private agent: AgUiAgent;
  private threadId: string;
  public availableTools: ToolDefinition[] = [];
  public events$: any;
  private activeRequests: Set<string> = new Set();
  private requestCounter: number = 0;

  constructor(serverUrl?: string) {
    this.agent = new AgUiAgent(serverUrl);
    this.threadId = this.generateThreadId();
  }

  private generateThreadId(): string {
    return `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRunId(): string {
    return `run-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRequestId(): string {
    this.requestCounter++;
    return `chat-req-${Date.now()}-${this.requestCounter}`;
  }

  private isRequestActive(): boolean {
    return this.activeRequests.size > 0;
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

  public newThread(): void {
    this.threadId = this.generateThreadId();
  }
}
