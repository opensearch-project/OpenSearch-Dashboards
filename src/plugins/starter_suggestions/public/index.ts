/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { StarterSuggestionsPlugin } from './plugin';

export function plugin() {
  return new StarterSuggestionsPlugin();
}

export { StarterSuggestionsPlugin };
export type { StarterSuggestionsPluginSetup, StarterSuggestionsPluginStart } from './types';
export type {
  StarterSuggestionItem,
  StarterSuggestionsContext,
  StarterSuggestionsProvider,
  StarterSuggestionsRegistration,
  StarterSuggestionsResult,
} from './services';
export { StarterSuggestionsService } from './services';
