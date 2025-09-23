/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Observable } from 'rxjs';
import { AgUiAgent } from './ag_ui_agent';
import { ChatContextManager } from './chat_context_manager';
import { RunAgentInput } from '../../common/types';
import type { ToolDefinition } from '../../../context_provider/public';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  timestamp: number;
  toolCallId?: string;
}

export interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  currentStreamingMessage?: string;
}

export class ChatService {
  private agent: AgUiAgent;
  private threadId: string;
  private contextManager?: ChatContextManager;
  public availableTools: ToolDefinition[] = [];
  public events$: any;
  private activeRequests: Set<string> = new Set();
  private requestCounter: number = 0;

  constructor(serverUrl?: string) {
    this.agent = new AgUiAgent(serverUrl);
    this.threadId = this.generateThreadId();
  }

  public setContextManager(contextManager: ChatContextManager): void {
    this.contextManager = contextManager;
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
    messages: ChatMessage[]
  ): Promise<{
    observable: any;
    userMessage: ChatMessage;
  }> {
    const requestId = this.generateRequestId();

    this.addActiveRequest(requestId);
    const userMessage: ChatMessage = {
      id: this.generateMessageId(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    // Get assistant contexts from the store
    let assistantContexts: Array<{ description: string; value: any }> = [];
    const contextStore = (window as any).assistantContextStore;
    if (contextStore) {
      // Get contexts with 'chat' category for backend
      assistantContexts = contextStore.getBackendFormattedContexts('chat');
    }

    const runInput: RunAgentInput = {
      threadId: this.threadId,
      runId: this.generateRunId(),
      messages: [
        ...messages.map((msg) => {
          const baseMessage: any = {
            id: msg.id,
            role: msg.role,
            content: msg.content,
          };
          if (msg.toolCallId) {
            baseMessage.toolCallId = msg.toolCallId;
          }
          return baseMessage;
        }),
        // IMPORTANT: Reuse the same userMessage so we don't create a second
        // synthetic user entry (which was causing duplicate user prompts
        // to appear / be sent to the agent).
        {
          id: userMessage.id,
          role: userMessage.role,
          content: userMessage.content,
        },
      ],
      tools: this.availableTools || [], // Pass available tools to AG-UI server
      context: assistantContexts, // Include assistant contexts
      state: {
        staticContext: this.contextManager?.getRawStaticContext() || null,
        dynamicContext: this.contextManager?.getRawDynamicContext() || null,
      },
      forwardedProps: {},
    };

    const observable = this.agent.runAgent(runInput, {
      onTextMessageStartEvent: () => {
        // Handle message start
      },
      onTextMessageContentEvent: () => {
        // Handle streaming text content
      },
      onTextMessageEndEvent: () => {
        // Handle message end
      },
      onRunStartedEvent: () => {
        // Handle run started
      },
      onRunFinishedEvent: () => {
        // Handle run finished
      },
      onRunErrorEvent: ({ event }: any) => {
        // Handle errors
        // eslint-disable-next-line no-console
        console.error('Chat error:', event.message);
      },
    });

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
    messages: ChatMessage[]
  ): Promise<{
    observable: any;
    toolMessage: ChatMessage;
  }> {
    const requestId = this.generateRequestId();

    this.addActiveRequest(requestId);
    // Create a tool result message - use 'user' role for AG-UI server compatibility
    const toolMessage: ChatMessage = {
      id: this.generateMessageId(),
      role: 'user',
      content: typeof result === 'string' ? result : JSON.stringify(result),
      timestamp: Date.now(),
      toolCallId,
    };

    // Get assistant contexts from the store
    let assistantContexts: Array<{ description: string; value: any }> = [];
    const contextStore = (window as any).assistantContextStore;
    if (contextStore) {
      // Get contexts with 'chat' category for backend
      assistantContexts = contextStore.getBackendFormattedContexts('chat');
    }

    // Send the tool result back to the agent with full conversation history
    const mappedMessages = [
      ...messages.map((msg) => {
        const baseMessage: any = {
          id: msg.id,
          role: msg.role,
          content: msg.content,
        };
        if (msg.toolCallId) {
          baseMessage.toolCallId = msg.toolCallId;
        }
        return baseMessage;
      }),
      {
        id: toolMessage.id,
        role: toolMessage.role,
        content: toolMessage.content,
        toolCallId: toolMessage.toolCallId,
      },
    ];

    const runInput: RunAgentInput = {
      threadId: this.threadId,
      runId: this.generateRunId(),
      messages: mappedMessages,
      tools: this.availableTools || [],
      context: assistantContexts, // Include assistant contexts
      state: {
        staticContext: this.contextManager?.getRawStaticContext() || null,
        dynamicContext: this.contextManager?.getRawDynamicContext() || null,
      },
      forwardedProps: {},
    };

    // Continue the conversation with the tool result
    const observable = this.agent.runAgent(runInput, {});

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
