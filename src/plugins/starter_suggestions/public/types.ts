/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  StarterSuggestionsServiceContract,
  StarterSuggestionsSetupContract,
} from './services/types';

/**
 * Registration only. Plugins that contribute suggestions take this at setup().
 */
export type StarterSuggestionsPluginSetup = StarterSuggestionsSetupContract;

/**
 * The full registry, for the plugin that renders the suggestions.
 */
export type StarterSuggestionsPluginStart = StarterSuggestionsServiceContract;
