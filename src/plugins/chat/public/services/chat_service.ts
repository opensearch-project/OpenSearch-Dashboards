/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AgUiAgent } from './ag_ui_agent';

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

    const runInput = {
      threadId: this.threadId,
      runId: this.generateRunId(),
      messages: [
        ...messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        {
          role: 'user',
          content,
        },
      ],
      tools: [], // Add tools here if your AG-UI server supports them
      state: {},
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
