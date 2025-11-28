/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreService } from '../../types';
import { ChatServiceSetup, ChatServiceStart, ChatImplementationFunctions, Message } from './types';
import { NoOpChatService } from './no_op_chat_service';

/**
 * Core chat service implementation
 * Contains the actual chat functionality
 */
export class ChatService implements CoreService<ChatServiceSetup, ChatServiceStart> {
  private implementation?: ChatImplementationFunctions;
  private serviceStart?: ChatServiceStart;
  private suggestedActionsService?: { registerProvider(provider: any): void };
  private noOpService = new NoOpChatService();

  public setup(): ChatServiceSetup {
    return {
      setImplementation: (implementation: ChatImplementationFunctions) => {
        this.implementation = implementation;

        // Update service methods with implementation if service is already started
        if (this.serviceStart) {
          this.serviceStart.sendMessage = async (content: string, messages: Message[]) => {
            return implementation.sendMessage(content, messages);
          };
          this.serviceStart.sendMessageWithWindow = async (
            content: string,
            messages: Message[],
            options?: { clearConversation?: boolean }
          ) => {
            return implementation.sendMessageWithWindow(content, messages, options);
          };
        }
      },

      setFallbackImplementation: (fallback: ChatImplementationFunctions) => {
        this.noOpService.setFallbackImplementation(fallback);
      },

      setSuggestedActionsService: (service: { registerProvider(provider: any): void }) => {
        this.suggestedActionsService = service;

        // Update the start interface if it's already been created
        if (this.serviceStart) {
          this.serviceStart.suggestedActionsService = service;
        }
      },

      suggestedActionsService: this.suggestedActionsService,
    };
  }

  public start(): ChatServiceStart {
    this.serviceStart = {
      // Infrastructure method - availability check
      isAvailable: () => {
        return !!this.implementation;
      },

      // Pure delegation to either implementation or no-op service
      getThreadId: () => {
        return this.implementation?.getThreadId() ?? this.noOpService.getThreadId();
      },
      getThreadId$: () => {
        return this.implementation?.getThreadId$() ?? this.noOpService.getThreadId$();
      },

      // Message operations
      sendMessage: async (content: string, messages: Message[]) => {
        return (
          this.implementation?.sendMessage(content, messages) ??
          this.noOpService.sendMessage(content, messages)
        );
      },
      sendMessageWithWindow: async (
        content: string,
        messages: Message[],
        options?: { clearConversation?: boolean }
      ) => {
        return (
          this.implementation?.sendMessageWithWindow(content, messages, options) ??
          this.noOpService.sendMessageWithWindow(content, messages, options)
        );
      },

      // Window management
      isWindowOpen: () => {
        return this.implementation?.isWindowOpen() ?? this.noOpService.isWindowOpen();
      },
      openWindow: async () => {
        return this.implementation?.openWindow() ?? this.noOpService.openWindow();
      },
      closeWindow: async () => {
        return this.implementation?.closeWindow() ?? this.noOpService.closeWindow();
      },
      getWindowState: () => {
        return this.implementation?.getWindowState() ?? this.noOpService.getWindowState();
      },
      getWindowState$: () => {
        return this.implementation?.getWindowState$() ?? this.noOpService.getWindowState$();
      },
      onWindowOpen: (callback: () => void) => {
        return (
          this.implementation?.onWindowOpen(callback) ?? this.noOpService.onWindowOpen(callback)
        );
      },
      onWindowClose: (callback: () => void) => {
        return (
          this.implementation?.onWindowClose(callback) ?? this.noOpService.onWindowClose(callback)
        );
      },

      // Infrastructure service
      suggestedActionsService: this.suggestedActionsService,
    };

    return this.serviceStart!;
  }

  public async stop() {
    // Reset state
    this.implementation = undefined;
    this.serviceStart = undefined;
    this.suggestedActionsService = undefined;
  }
}
