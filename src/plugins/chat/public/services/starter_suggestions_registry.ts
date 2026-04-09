/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface StarterSuggestionItem {
  icon: string;
  iconColor?: string;
  text: string;
  prompt: string;
}

class StarterSuggestionsRegistry {
  private registry: Map<string, StarterSuggestionItem[]> = new Map();

  register(appId: string, suggestions: StarterSuggestionItem[]): void {
    this.registry.set(appId, suggestions);
  }

  unregister(appId: string): void {
    this.registry.delete(appId);
  }

  getSuggestions(appId: string): StarterSuggestionItem[] | undefined {
    return this.registry.get(appId);
  }
}

export const starterSuggestionsRegistry = new StarterSuggestionsRegistry();
