/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable no-console */

import {
  StarterSuggestionItem,
  StarterSuggestionsContext,
  StarterSuggestionsProvider,
  StarterSuggestionsRegistration,
  StarterSuggestionsResult,
  StarterSuggestionsServiceContract,
} from './types';

const DEFAULT_TIMEOUT_MS = 4000;

export class StarterSuggestionsService implements StarterSuggestionsServiceContract {
  /** An appId has exactly one provider; a later registration replaces it. */
  private providersByAppId: Map<string, StarterSuggestionsProvider> = new Map();
  /** A provider id covers one or more appIds. */
  private appIdsByProviderId: Map<string, Set<string>> = new Map();
  private invalidateListeners: Set<(appId: string) => void> = new Set();
  private readonly timeoutMs: number;

  constructor(timeoutMs: number = DEFAULT_TIMEOUT_MS) {
    this.timeoutMs = timeoutMs;
  }

  private removeRegisterAppId(appId: string): void {
    const previousProvider = this.providersByAppId.get(appId);
    if (!previousProvider) {
      return;
    }
    const previousAppIds = this.appIdsByProviderId.get(previousProvider.id);
    previousAppIds?.delete(appId);
    if (previousAppIds?.size === 0) {
      this.appIdsByProviderId.delete(previousProvider.id);
    }

    this.providersByAppId.delete(appId);
  }

  private removeRegisterProvider(provider: StarterSuggestionsProvider): void {
    let removedAny = false;
    this.appIdsByProviderId.get(provider.id)?.forEach((appId) => {
      if (this.providersByAppId.get(appId) === provider) {
        this.providersByAppId.delete(appId);
        removedAny = true;
      }
    });
    if (removedAny) {
      this.appIdsByProviderId.delete(provider.id);
    }
  }

  registerProvider(provider: StarterSuggestionsProvider): StarterSuggestionsRegistration {
    if (!provider || typeof provider !== 'object') {
      throw new Error('Provider must be an object');
    }
    if (!provider.id || typeof provider.id !== 'string' || provider.id.trim() === '') {
      throw new Error('Provider must have a valid id');
    }
    if (!provider.getSuggestions || typeof provider.getSuggestions !== 'function') {
      throw new Error('Provider must have a getSuggestions method');
    }

    const appIds = Array.isArray(provider.appId) ? [...provider.appId] : [provider.appId];
    if (appIds.length === 0 || appIds.some((id) => !id)) {
      throw new Error('Provider must have a valid appId or non-empty appId array');
    }

    // Re-registering a provider replaces its whole previous appId list rather than
    // adding to it, so a dropped appId is left without a provider.
    const previousProviderOwnedAppIds = this.appIdsByProviderId.get(provider.id);
    if (previousProviderOwnedAppIds) {
      const [anyOwnedAppId] = previousProviderOwnedAppIds;
      const previousProvider = this.providersByAppId.get(anyOwnedAppId);

      if (previousProvider) {
        if (previousProvider !== provider) {
          const droppedAppIds = Array.from(previousProviderOwnedAppIds).filter(
            (appId) => !appIds.includes(appId)
          );
          console.warn(
            `StarterSuggestionsService: provider id '${provider.id}' is already registered for ` +
              `appId(s) [${Array.from(previousProviderOwnedAppIds).join(', ')}]; replacing it ` +
              `with a registration for [${appIds.join(', ')}]` +
              (droppedAppIds.length > 0
                ? `, which leaves [${droppedAppIds.join(', ')}] without a provider`
                : '')
          );
        }
        this.removeRegisterProvider(previousProvider);
      }
    }

    appIds.forEach((appId) => {
      const previousProvider = this.providersByAppId.get(appId);
      if (previousProvider) {
        console.warn(
          `StarterSuggestionsService: provider '${previousProvider.id}' ` +
            `for appId '${appId}' is being replaced by '${provider.id}'`
        );
        this.removeRegisterAppId(appId);
      }
      this.providersByAppId.set(appId, provider);
    });
    this.appIdsByProviderId.set(provider.id, new Set(appIds));

    return {
      invalidate: () => {
        appIds.forEach((appId) => this.notifyInvalidate(appId));
      },
      unregister: () => {
        this.removeRegisterProvider(provider);
      },
    };
  }

  async getSuggestions(
    context: StarterSuggestionsContext
  ): Promise<StarterSuggestionsResult | null> {
    const provider = this.providersByAppId.get(context.appId);
    if (!provider) {
      return null;
    }

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`Provider '${provider.id}' timed out after ${this.timeoutMs}ms`));
        }, this.timeoutMs);
      });

      const suggestionsPromise = new Promise<StarterSuggestionItem[]>((resolve) => {
        resolve(provider.getSuggestions(context));
      });
      const suggestions = await Promise.race([suggestionsPromise, timeoutPromise]);

      if (this.providersByAppId.get(context.appId) !== provider) {
        return null;
      }

      if (!Array.isArray(suggestions)) {
        throw new Error(`Provider '${provider.id}' must return an array`);
      }
      return { appId: context.appId, providerId: provider.id, items: suggestions };
    } catch (error) {
      console.error(`StarterSuggestionsService: error from provider '${provider.id}':`, error);
      return null;
    } finally {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    }
  }

  onInvalidate(callback: (appId: string) => void): () => void {
    this.invalidateListeners.add(callback);
    return () => {
      this.invalidateListeners.delete(callback);
    };
  }

  private notifyInvalidate(appId: string): void {
    this.invalidateListeners.forEach((listener) => {
      try {
        listener(appId);
      } catch (error) {
        console.error('StarterSuggestionsService: invalidate listener threw:', error);
      }
    });
  }

  hasProvider(appId: string): boolean {
    return this.providersByAppId.has(appId);
  }

  getRegisteredAppIds(): string[] {
    return Array.from(this.providersByAppId.keys());
  }

  clear(): void {
    this.providersByAppId.clear();
    this.appIdsByProviderId.clear();
    this.invalidateListeners.clear();
  }
}
