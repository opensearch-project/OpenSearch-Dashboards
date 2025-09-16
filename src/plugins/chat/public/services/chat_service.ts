/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AgUiAgent } from './ag_ui_agent';
import { ChatContextManager } from './chat_context_manager';
import { ContextItem } from '../types/context';
import { RunAgentInput } from '../../common/types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  context?: ContextItem[];
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

  public async sendMessage(
    content: string,
    messages: ChatMessage[]
  ): Promise<{
    observable: any;
    userMessage: ChatMessage;
  }> {
    // Get current context from context manager
    const activeContexts = this.contextManager?.getActiveContexts() || [];

    const userMessage: ChatMessage = {
      id: this.generateMessageId(),
      role: 'user',
      content,
      timestamp: Date.now(),
      context: activeContexts,
    };

    // Build context-aware content
    let contextAwareContent = content;
    if (activeContexts.length > 0) {
      const contextSummary = this.buildContextSummary(activeContexts);
      contextAwareContent = `${content}\n\nContext:\n${contextSummary}`;
    }

    const runInput: RunAgentInput = {
      threadId: this.threadId,
      runId: this.generateRunId(),
      messages: [
        ...messages.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
        })),
        {
          id: this.generateMessageId(),
          role: 'user',
          content: contextAwareContent,
        },
      ],
      tools: [], // Add tools here if your AG-UI server supports them
      context: activeContexts.map((ctx) => ({
        description: `${ctx.type}: ${ctx.label}`,
        value: JSON.stringify({
          type: ctx.type,
          label: ctx.label,
          data: ctx.data,
          timestamp: ctx.timestamp,
        }),
      })),
      state: {},
      forwardedProps: {},
    };

    const observable = this.agent.runAgent(runInput, {
      onTextMessageStartEvent: ({ event }: any) => {
        // Handle message start
      },
      onTextMessageContentEvent: ({ event }: any) => {
        // Handle streaming text content
      },
      onTextMessageEndEvent: ({ event }: any) => {
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

    return { observable, userMessage };
  }

  public abort(): void {
    this.agent.abort();
  }

  public newThread(): void {
    this.threadId = this.generateThreadId();
  }

  private buildContextSummary(contexts: ContextItem[]): string {
    const summaryParts: string[] = [];

    contexts.forEach((ctx) => {
      switch (ctx.type) {
        case 'time_range':
          summaryParts.push(`Time Range: ${ctx.label}`);
          break;
        case 'filters':
          summaryParts.push(`Filter: ${ctx.label}`);
          break;
        case 'query':
          summaryParts.push(`Query: ${ctx.label}`);
          break;
        case 'index_pattern':
          summaryParts.push(`Index Pattern: ${ctx.label}`);
          break;
        case 'dashboard':
          summaryParts.push(`Dashboard: ${ctx.label}`);
          break;
        case 'app_state':
          summaryParts.push(`Current App: ${ctx.label}`);
          break;
        case 'document':
          summaryParts.push(`Document: ${JSON.stringify(ctx.data).substring(0, 100)}...`);
          break;
        default:
          summaryParts.push(`${ctx.type}: ${ctx.label}`);
      }
    });

    return summaryParts.join('\n');
  }
}
