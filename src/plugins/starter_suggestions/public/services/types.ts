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
 * Providers register once (typically at plugin setup/start) and remain
 * registered for the app's lifetime — activation is scoped by appId.
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
   * The chat plugin races this against a timeout and falls back on error.
   */
  getSuggestions: (
    context: StarterSuggestionsContext
  ) => StarterSuggestionItem[] | Promise<StarterSuggestionItem[]>;
}

/**
 * Handle returned from registerProvider().
 */
export interface StarterSuggestionsRegistration {
  /** Force the chat plugin to re-invoke this provider's getSuggestions() now. */
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
   * Whether an app has a provider at all. Providers register once at setup and
   * never come and go, so a false answer stays false for the app's lifetime.
   */
  hasProvider(appId: string): boolean;
}

/**
 * What other plugins get from ChatPluginSetup: registration only.
 */
export interface StarterSuggestionsSetupContract {
  registerProvider(provider: StarterSuggestionsProvider): StarterSuggestionsRegistration;
}
