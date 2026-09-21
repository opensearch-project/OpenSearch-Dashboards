/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  StarterSuggestionItem,
  StarterSuggestionsContext,
  StarterSuggestionsPluginSetup,
} from '../../starter_suggestions/public';
import { ResultStatus } from './application/view_components/utils';
import { DISCOVER_HOST_APP_ID, DISCOVER_PAGE_CONTEXT_ID, PLUGIN_ID } from '../common';

interface DiscoverPageContextValue {
  query?: {
    query?: string;
    language?: string;
    languageDisplayName?: string;
    status?: ResultStatus;
    resultsCount?: number;
    error?: string;
  };
}

const MAX_SUGGESTIONS = 3;

const readPageContext = (context: StarterSuggestionsContext): DiscoverPageContextValue => {
  return context.contexts?.find((entry) => entry.id === DISCOVER_PAGE_CONTEXT_ID)?.value ?? {};
};

export function registerDiscoverStarterSuggestions(
  starterSuggestions: StarterSuggestionsPluginSetup
) {
  return starterSuggestions.registerProvider({
    id: PLUGIN_ID,
    // The 'discover' app only redirects; the UI is rendered by data-explorer
    appId: DISCOVER_HOST_APP_ID,
    getSuggestions: (context: StarterSuggestionsContext): StarterSuggestionItem[] => {
      const query = readPageContext(context).query;
      const queryText = query?.query ?? '';
      const { defaults } = context;
      let cards: StarterSuggestionItem[];

      switch (query?.status) {
        case ResultStatus.ERROR:
          cards = [
            {
              id: 'fixQueryError',
              icon: 'alert',
              iconColor: 'danger',
              text: 'Fix this query error',
              prompt: `My query${queryText ? ` "${queryText}"` : ''} failed${
                query.error ? ` with error: "${query.error}"` : ''
              }. Help me fix it and run the corrected query on the page.`,
            },
          ];
          break;

        case ResultStatus.NO_RESULTS:
          cards = [
            {
              id: 'explainNoResults',
              icon: 'help',
              text: 'Why did my query return no results?',
              prompt: `My query${
                queryText ? ` "${queryText}"` : ''
              } returned no results. Help me work out why, then fix it and run the corrected query on the page.`,
            },
          ];
          break;

        case ResultStatus.READY:
          cards = [
            {
              id: 'describeSearch',
              icon: 'inspect',
              text: 'Explain the current search',
              prompt: 'Describe the current search on the page.',
            },
          ];
          break;

        default:
          cards = [];
      }

      return [...cards, ...defaults].slice(0, MAX_SUGGESTIONS);
    },
  });
}
