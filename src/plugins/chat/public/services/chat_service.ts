/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AgUiAgent } from './ag_ui_agent';
import { ChatContextManager } from './chat_context_manager';
import { RunAgentInput } from '../../common/types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
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
        ...messages.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
        })),
        // IMPORTANT: Reuse the same userMessage so we don't create a second
        // synthetic user entry (which was causing duplicate user prompts
        // to appear / be sent to the agent).
        {
          id: userMessage.id,
          role: userMessage.role,
          content: userMessage.content,
        },
      ],
      tools: [], // Add tools here if your AG-UI server supports them
      context: assistantContexts, // Include assistant contexts
      state: {
        staticContext: this.contextManager?.getRawStaticContext() || null,
        dynamicContext: this.contextManager?.getRawDynamicContext() || null,
      },
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
}
