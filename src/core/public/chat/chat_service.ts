/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { CoreService } from '../../types';
import {
  ChatServiceSetup,
  ChatServiceStart,
  ChatImplementationFunctions,
  Message,
  ChatWindowState,
} from './types';
import { ChatScreenshotService } from './screenshot_service';

/**
 * Core chat service - manages infrastructure state
 */
export class ChatService implements CoreService<ChatServiceSetup, ChatServiceStart> {
  private implementation?: ChatImplementationFunctions;
  private suggestedActionsService?: { registerProvider(provider: any): void };
  private screenshotService: ChatScreenshotService;

  // Core-managed infrastructure state
  private threadId$ = new BehaviorSubject<string>(this.generateThreadId());
  private windowState$ = new BehaviorSubject<ChatWindowState>({
    isWindowOpen: false,
    windowMode: 'sidecar',
    paddingSize: 400,
  });
  private windowOpenCallbacks = new Set<() => void>();
  private windowCloseCallbacks = new Set<() => void>();

  constructor() {
    this.screenshotService = new ChatScreenshotService();
  }

  private generateThreadId(): string {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 11);
    return `thread-${timestamp}-${randomStr}`;
  }

  public setup(): ChatServiceSetup {
    return {
      setImplementation: (implementation: ChatImplementationFunctions) => {
        this.implementation = implementation;
      },

      setSuggestedActionsService: (service: { registerProvider(provider: any): void }) => {
        this.suggestedActionsService = service;
      },

      suggestedActionsService: this.suggestedActionsService,

      setScreenshotPageContainerElement: (element: HTMLElement) => {
        this.screenshotService.setPageContainerElement(element);
      },

      screenshot: this.screenshotService,
    };
  }

  public start(): ChatServiceStart {
    const setWindowState = (partialState: Partial<ChatWindowState>) => {
      const currentState = this.windowState$.getValue();
      const newState = { ...currentState, ...partialState };
      this.windowState$.next(newState);
    };

    const chatServiceInstance = this;

    return {
      // Availability check
      isAvailable: () => {
        return !!this.implementation;
      },

      // Thread management (core-managed)
      getThreadId: () => {
        return this.threadId$.getValue();
      },

      getThreadId$: () => {
        return this.threadId$.asObservable();
      },

      setThreadId: (threadId: string) => {
        this.threadId$.next(threadId);
      },

      newThread: () => {
        const newThreadId = this.generateThreadId();
        this.threadId$.next(newThreadId);
      },

      // Window state management (core-managed)
      isWindowOpen: () => {
        return this.windowState$.getValue().isWindowOpen;
      },

      getWindowState: () => {
        return this.windowState$.getValue();
      },

      getWindowState$: () => {
        return this.windowState$.asObservable();
      },

      setWindowState,

      onWindowOpen: (callback: () => void) => {
        this.windowOpenCallbacks.add(callback);
        return () => this.windowOpenCallbacks.delete(callback);
      },

      onWindowClose: (callback: () => void) => {
        this.windowCloseCallbacks.add(callback);
        return () => this.windowCloseCallbacks.delete(callback);
      },

      // Operations (delegated to plugin - throw if unavailable)
      openWindow: async () => {
        if (!this.implementation) {
          throw new Error(
            'Chat service is not available. Please ensure the chat plugin is enabled.'
          );
        }

        // Trigger callbacks to request window opening
        this.windowOpenCallbacks.forEach((callback) => callback());
      },

      closeWindow: async () => {
        if (!this.implementation) {
          throw new Error(
            'Chat service is not available. Please ensure the chat plugin is enabled.'
          );
        }

        // Trigger callbacks to request window closing
        this.windowCloseCallbacks.forEach((callback) => callback());
      },

      sendMessage: async (content: string, messages: Message[]) => {
        if (!this.implementation) {
          throw new Error(
            'Chat service is not available. Please ensure the chat plugin is enabled.'
          );
        }
        return this.implementation.sendMessage(content, messages);
      },

      sendMessageWithWindow: async (
        content: string,
        messages: Message[],
        options?: { clearConversation?: boolean }
      ) => {
        if (!this.implementation) {
          throw new Error(
            'Chat service is not available. Please ensure the chat plugin is enabled.'
          );
        }
        return this.implementation.sendMessageWithWindow(content, messages, options);
      },

      // Infrastructure service - use getter to ensure dynamic access
      get suggestedActionsService() {
        return chatServiceInstance.suggestedActionsService;
      },

      // Screenshot page container element (deprecated)
      get screenshotPageContainerElement() {
        return chatServiceInstance.screenshotService.getPageContainerElement();
      },

      // Screenshot service
      screenshot: this.screenshotService,
    };
  }

  public async stop() {
    this.implementation = undefined;
    this.suggestedActionsService = undefined;
    this.windowOpenCallbacks.clear();
    this.windowCloseCallbacks.clear();
    this.screenshotService.stop();
  }
}
