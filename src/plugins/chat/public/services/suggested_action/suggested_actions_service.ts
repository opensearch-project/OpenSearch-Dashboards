/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable no-console */

import type { Message } from '../../../common/types';
import { SuggestedActionsRegistry } from './suggested_actions_registry';
import {
  ChatContext,
  SuggestedActionsProvider,
  SuggestedActionsServiceSetupContract,
  SuggestedActionsServiceStartContract,
  SuggestedActions,
} from './types';

/**
 * Service for managing custom suggestion providers and retrieving suggestions
 */
export class SuggestedActionsService {
  private registry: SuggestedActionsRegistry;

  constructor() {
    this.registry = new SuggestedActionsRegistry();
  }

  /**
   * Initialize the suggestion service
   */
  setup(): SuggestedActionsServiceSetupContract {
    return {
      registerProvider: this.registerProvider.bind(this),
      unregisterProvider: this.unregisterProvider.bind(this),
      getCustomSuggestions: this.getCustomSuggestions.bind(this),
    };
  }

  /**
   * Start the suggestion service and return the contract interface
   * @returns SuggestionServiceContract for use by other services
   */
  start(): SuggestedActionsServiceStartContract {
    return {
      registerProvider: this.registerProvider.bind(this),
      unregisterProvider: this.unregisterProvider.bind(this),
      getCustomSuggestions: this.getCustomSuggestions.bind(this),
    };
  }

  /**
   * Stop the suggestion service and perform cleanup
   */
  stop(): void {
    // Clear all registered providers
    this.registry.clear();
  }

  /**
   * Register a new suggestion provider with validation
   * @param provider The suggestion provider to register
   * @throws Error if provider is invalid
   */
  registerProvider(provider: SuggestedActionsProvider): void {
    // Additional validation beyond what the registry does
    if (!provider) {
      throw new Error('Provider cannot be null or undefined');
    }

    if (typeof provider !== 'object') {
      throw new Error('Provider must be an object');
    }

    // Delegate to registry for registration
    try {
      this.registry.register(provider);
    } catch (error) {
      // Re-throw with additional context
      throw new Error(`Failed to register suggestion provider: ${error.message}`);
    }
  }

  /**
   * Unregister a suggestion provider by ID
   * @param providerId The ID of the provider to unregister
   * @returns true if provider was found and removed, false otherwise
   */
  unregisterProvider(providerId: string): void {
    if (!providerId || typeof providerId !== 'string') {
      throw new Error('Provider ID must be a non-empty string');
    }

    // Delegate to registry
    const wasRemoved = this.registry.unregister(providerId);

    if (!wasRemoved) {
      console.warn(`Provider with ID '${providerId}' was not found for unregistration`);
    }
  }

  /**
   * Get custom suggestions for the given chat context
   * @param context The chat context containing conversation state
   * @returns Promise resolving to array of custom suggestions
   */
  async getCustomSuggestions(context: ChatContext): Promise<SuggestedActions[]> {
    // Validate context
    if (!context) {
      throw new Error('Chat context is required');
    }

    if (!Array.isArray(context.messageHistory)) {
      throw new Error('Chat context must include messageHistory array');
    }

    // Build complete context with defaults
    const completeContext: ChatContext = {
      conversationId: context.conversationId,
      currentMessage: context.currentMessage,
      messageHistory: context.messageHistory,
      dataSourceId: context.dataSourceId,
    };

    try {
      // Delegate to registry
      return await this.registry.getCustomSuggestions(completeContext);
    } catch (error) {
      console.error('Error retrieving custom suggestions:', error);
      // Return empty array instead of throwing to prevent breaking chat interface
      return [];
    }
  }

  /**
   * Build ChatContext from chat state parameters
   * @param conversationId Current conversation ID
   * @param currentMessage Current message being processed
   * @param messageHistory Array of previous messages
   * @param userContext User context information
   * @param dataSourceId Current data source ID
   * @returns Complete ChatContext object
   */
  buildChatContext(
    conversationId?: string,
    currentMessage?: Message,
    messageHistory: Message[] = [],
    dataSourceId?: string
  ): ChatContext {
    return {
      conversationId,
      currentMessage,
      messageHistory,
      dataSourceId,
    };
  }

  /**
   * Get the number of registered providers (for debugging/monitoring)
   * @returns Number of registered providers
   */
  getProviderCount(): number {
    return this.registry.getProviderCount();
  }

  /**
   * Get all registered provider IDs (for debugging/monitoring)
   * @returns Array of provider IDs
   */
  getProviderIds(): string[] {
    return this.registry.getProviderIds();
  }
}
