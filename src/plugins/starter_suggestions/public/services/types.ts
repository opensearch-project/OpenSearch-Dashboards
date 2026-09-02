/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AssistantContextOptions } from '../../../context_provider/public';

/**
 * A single starter suggestion card shown on the chat empty screen.
 */
export interface StarterSuggestionItem {
  /** Optional stable identifier, used by providers that want to filter specific default items. */
  id?: string;
  icon: string;
  iconColor?: string;
  text: string;
  /** Prompt text filled into the chat input when this suggestion is clicked. */
  prompt?: string;
  /** Optional custom action invoked instead of filling the input. */
  action?: () => void;
}

/**
 * Context passed to a provider's getSuggestions() call.
 */
export interface StarterSuggestionsContext {
  appId: string;
  pathname: string;
  /** Resolves the effective data source id. Awaiting it counts against the provider's timeout. */
  getDataSourceId?: () => Promise<string | undefined>;
  /** The same context set that ships with a chat message. `value` may be an object or a JSON string. */
  contexts?: AssistantContextOptions[];
  /** The current default suggestion items. Providers may spread/filter these into their result. */
  defaults: StarterSuggestionItem[];
}

/**
 * A plugin-provided source of starter suggestions for the chat empty screen.
 * Providers are expected to register once during setup and stay registered for
 * the app's lifetime — activation is scoped by appId.
 */
export interface StarterSuggestionsProvider {
  /**
   * Unique identifier for the provider. Prefers camelCase.
   */
  id: string;
  /** Which app(s) this provider is active for. Inactive on all other pages. */
  appId: string | string[];
  /**
   * Compute the suggestions to show. May be async (e.g. calling an agent).
   * Raced against a timeout; an error or timeout falls back to the defaults.
   */
  getSuggestions: (
    context: StarterSuggestionsContext
  ) => StarterSuggestionItem[] | Promise<StarterSuggestionItem[]>;
}

/**
 * Handle returned from registerProvider().
 */
export interface StarterSuggestionsRegistration {
  /** Ask the host to re-invoke this provider's getSuggestions() now. */
  invalidate(): void;
  /** Remove this provider. Call from the owning plugin's stop() lifecycle. */
  unregister(): void;
}

export interface StarterSuggestionsResult {
  appId: string;
  providerId: string;
  items: StarterSuggestionItem[];
}

export interface StarterSuggestionsServiceContract {
  registerProvider(provider: StarterSuggestionsProvider): StarterSuggestionsRegistration;
  getSuggestions(context: StarterSuggestionsContext): Promise<StarterSuggestionsResult | null>;
  /** Listen for invalidate() calls; the callback gets the affected appId. Returns an unsubscribe. */
  onInvalidate(callback: (appId: string) => void): () => void;
  /**
   * Whether an app has a provider at all. Providers are expected to register
   * during setup, so the answer is stable for the app's lifetime.
   */
  hasProvider(appId: string): boolean;
}

/**
 * What other plugins get from StarterSuggestionsPluginSetup: registration only.
 */
export interface StarterSuggestionsSetupContract {
  registerProvider(provider: StarterSuggestionsProvider): StarterSuggestionsRegistration;
}
