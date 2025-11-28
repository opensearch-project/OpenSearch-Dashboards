/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject, Observable } from 'rxjs';
import {
  ChatServiceStart,
  Message,
  ChatWindowState,
  UserMessage,
  ChatImplementationFunctions,
} from './types';

/**
 * No-op implementation that delegates to plugin-provided fallback
 */
export class NoOpChatService implements ChatServiceStart {
  private fallbackImplementation?: ChatImplementationFunctions;

  setFallbackImplementation(fallback: ChatImplementationFunctions): void {
    this.fallbackImplementation = fallback;
  }

  isAvailable(): boolean {
    return false;
  }

  isWindowOpen(): boolean {
    return this.fallbackImplementation?.isWindowOpen?.()!;
  }

  getThreadId$(): Observable<string> {
    return this.fallbackImplementation?.getThreadId$?.()!;
  }

  getThreadId(): string {
    return this.fallbackImplementation?.getThreadId?.()!;
  }

  async openWindow(): Promise<void> {
    return this.fallbackImplementation?.openWindow?.();
  }

  async closeWindow(): Promise<void> {
    return this.fallbackImplementation?.closeWindow?.();
  }

  getWindowState(): ChatWindowState {
    return this.fallbackImplementation?.getWindowState?.()!;
  }

  async sendMessage(
    content: string,
    messages: Message[]
  ): Promise<{ observable: any; userMessage: UserMessage }> {
    return this.fallbackImplementation?.sendMessage?.(content, messages)!;
  }

  async sendMessageWithWindow(
    content: string,
    messages: Message[],
    options?: { clearConversation?: boolean }
  ): Promise<{ observable: any; userMessage: UserMessage }> {
    return this.fallbackImplementation?.sendMessageWithWindow?.(content, messages, options)!;
  }

  getWindowState$(): Observable<ChatWindowState> {
    return this.fallbackImplementation?.getWindowState$?.()!;
  }

  onWindowOpen(callback: () => void): () => void {
    return this.fallbackImplementation?.onWindowOpen?.(callback) ?? (() => {});
  }

  onWindowClose(callback: () => void): () => void {
    return this.fallbackImplementation?.onWindowClose?.(callback) ?? (() => {});
  }

  suggestedActionsService = undefined;
}
