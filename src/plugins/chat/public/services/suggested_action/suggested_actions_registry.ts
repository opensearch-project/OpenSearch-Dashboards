/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable no-console */

import { ChatContext, SuggestedActionsProvider, SuggestedActions } from './types';

/**
 * Registry for managing custom suggestion providers
 */
export class SuggestedActionsRegistry {
  private providers: Map<string, SuggestedActionsProvider> = new Map();
  private readonly defaultTimeout = 5000; // 5 seconds

  /**
   * Register a new suggestion provider
   * @param provider The suggestion provider to register
   * @throws Error if provider is invalid or already registered
   */
  register(provider: SuggestedActionsProvider): void {
    // Validate required fields
    if (!provider) {
      throw new Error('Provider cannot be null or undefined');
    }

    if (!provider.id || typeof provider.id !== 'string' || provider.id.trim() === '') {
      throw new Error('Provider must have a valid id');
    }

    if (!provider.getSuggestions || typeof provider.getSuggestions !== 'function') {
      throw new Error('Provider must have a getSuggestions method');
    }

    // Check if provider is already registered
    if (this.providers.has(provider.id)) {
      throw new Error(`Provider with id '${provider.id}' is already registered`);
    }

    // Validate priority if provided
    if (
      provider.priority !== undefined &&
      (typeof provider.priority !== 'number' || isNaN(provider.priority))
    ) {
      throw new Error('Provider priority must be a valid number');
    }

    // Validate isEnabled if provided
    if (provider.isEnabled !== undefined && typeof provider.isEnabled !== 'function') {
      throw new Error('Provider isEnabled must be a function');
    }

    this.providers.set(provider.id, provider);
  }

  /**
   * Unregister a suggestion provider by ID
   * @param providerId The ID of the provider to unregister
   * @returns true if provider was found and removed, false otherwise
   */
  unregister(providerId: string): boolean {
    if (!providerId || typeof providerId !== 'string') {
      return false;
    }

    return this.providers.delete(providerId);
  }

  /**
   * Get custom suggestions from all registered providers
   * @param context The chat context to pass to providers
   * @returns Promise resolving to array of suggestions sorted by priority
   */
  async getCustomSuggestions(context: ChatContext): Promise<SuggestedActions[]> {
    const enabledProviders = Array.from(this.providers.values()).filter((provider) => {
      try {
        return !provider.isEnabled || provider.isEnabled();
      } catch (error) {
        console.warn(`Error checking if provider '${provider.id}' is enabled:`, error);
        return false;
      }
    });

    if (enabledProviders.length === 0) {
      return [];
    }

    // Get suggestions from all providers with timeout and error handling
    const suggestionPromises = enabledProviders.map((provider) =>
      this.getSuggestionsFromProvider(provider, context)
    );

    const results = await Promise.allSettled(suggestionPromises);

    // Collect all successful suggestions
    const allSuggestions: Array<SuggestedActions & { providerId?: string; priority?: number }> = [];

    results.forEach((result, index) => {
      const provider = enabledProviders[index];

      if (result.status === 'fulfilled') {
        const suggestions = result.value;
        // Add provider metadata to each suggestion
        const enhancedSuggestions = suggestions.map((suggestion) => ({
          ...suggestion,
          providerId: provider.id,
          priority: provider.priority ?? 0,
        }));
        allSuggestions.push(...enhancedSuggestions);
      } else {
        console.error(`Provider '${provider.id}' failed to provide suggestions:`, result.reason);
      }
    });

    // Sort by priority (higher priority first) and return with providerId preserved
    return allSuggestions
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
      .map(({ priority, ...suggestion }) => suggestion);
  }

  /**
   * Get suggestions from a single provider with timeout and error handling
   * @param provider The provider to get suggestions from
   * @param context The chat context
   * @returns Promise resolving to array of suggestions
   */
  private async getSuggestionsFromProvider(
    provider: SuggestedActionsProvider,
    context: ChatContext
  ): Promise<SuggestedActions[]> {
    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Provider '${provider.id}' timed out after ${this.defaultTimeout}ms`));
        }, this.defaultTimeout);
      });

      // Race between provider call and timeout
      const suggestionsPromise = Promise.resolve(provider.getSuggestions(context));
      const suggestions = await Promise.race([suggestionsPromise, timeoutPromise]);

      // Validate suggestions format
      if (!Array.isArray(suggestions)) {
        throw new Error(`Provider '${provider.id}' must return an array of suggestions`);
      }

      // Validate each suggestion
      const validSuggestions = suggestions.filter((suggestion) => {
        if (!suggestion || typeof suggestion !== 'object') {
          console.warn(`Provider '${provider.id}' returned invalid suggestion:`, suggestion);
          return false;
        }

        if (!suggestion.actionType || typeof suggestion.actionType !== 'string') {
          console.warn(
            `Provider '${provider.id}' returned suggestion without valid actionType:`,
            suggestion
          );
          return false;
        }

        return true;
      });

      return validSuggestions;
    } catch (error) {
      // Log error but don't throw to prevent one provider from breaking others
      console.error(`Error getting suggestions from provider '${provider.id}':`, error);
      throw error; // Re-throw for Promise.allSettled to handle
    }
  }

  /**
   * Get the number of registered providers
   * @returns The count of registered providers
   */
  getProviderCount(): number {
    return this.providers.size;
  }

  /**
   * Get all registered provider IDs
   * @returns Array of provider IDs
   */
  getProviderIds(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Check if a provider is registered
   * @param providerId The provider ID to check
   * @returns true if provider is registered
   */
  hasProvider(providerId: string): boolean {
    return this.providers.has(providerId);
  }

  /**
   * Clear all registered providers
   */
  clear(): void {
    this.providers.clear();
  }
}
