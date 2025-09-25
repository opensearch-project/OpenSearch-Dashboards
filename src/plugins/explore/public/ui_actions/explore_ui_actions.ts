/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import { UiActionsSetup } from '../../../ui_actions/public';
import {
  EXPLORE_DOCUMENT_EXPAND_TRIGGER,
  QUERY_UPDATE_TRIGGER,
  QUERY_RUN_TRIGGER,
  EXPLORE_DOCUMENT_EXPAND_ACTION,
  QUERY_UPDATE_ACTION,
  QUERY_RUN_ACTION,
  DocumentExpandContext,
  QueryUpdateContext,
  QueryRunContext,
} from './types';

export function registerExploreUIActions(uiActions: UiActionsSetup) {
  // Register triggers
  uiActions.registerTrigger({
    id: EXPLORE_DOCUMENT_EXPAND_TRIGGER,
    title: 'Expand Document',
    description: 'Expand a document in the explore logs view to see full details',
  });

  uiActions.registerTrigger({
    id: QUERY_UPDATE_TRIGGER,
    title: 'Update PPL Query',
    description: 'Update the PPL query in explore query panel',
  });

  uiActions.registerTrigger({
    id: QUERY_RUN_TRIGGER,
    title: 'Run Query',
    description: 'Execute the current query in explore',
  });

  // Register actions
  uiActions.registerAction({
    id: EXPLORE_DOCUMENT_EXPAND_ACTION,
    type: EXPLORE_DOCUMENT_EXPAND_TRIGGER,
    getDisplayName: () => 'Expand Document',
    execute: async (context: DocumentExpandContext) => {
      // Document expansion context is now handled by useDynamicContext hook in components
      // The table row component should use useDynamicContext to register expansion context
    },
  });

  uiActions.registerAction({
    id: QUERY_UPDATE_ACTION,
    type: QUERY_UPDATE_TRIGGER,
    getDisplayName: () => 'Update Query',
    execute: async (context: QueryUpdateContext) => {
      try {
        // Access the explore app's query service
        // This will need to be implemented based on explore app's state management
        const exploreServices = (window as any).exploreServices;
        if (exploreServices && exploreServices.queryService) {
          exploreServices.queryService.setQuery({
            query: context.query,
            language: 'PPL',
          });
        } else {
          // Fallback: Try to find query input element and update it
          const queryInput = document.querySelector(
            '[data-test-subj="queryInput"]'
          ) as HTMLTextAreaElement;
          if (queryInput) {
            queryInput.value = context.query;
            queryInput.dispatchEvent(new Event('input', { bubbles: true }));
          } else {
            throw new Error('Query service not available');
          }
        }
      } catch (error) {
        throw error;
      }
    },
  });

  uiActions.registerAction({
    id: QUERY_RUN_ACTION,
    type: QUERY_RUN_TRIGGER,
    getDisplayName: () => 'Run Query',
    execute: async (context: QueryRunContext) => {
      try {
        // Access the explore app's query service
        const exploreServices = (window as any).exploreServices;
        if (exploreServices && exploreServices.queryService) {
          exploreServices.queryService.submitQuery();
        } else {
          // Fallback: Try to find and click the run button
          const runButton = document.querySelector(
            '[data-test-subj="querySubmitButton"]'
          ) as HTMLButtonElement;
          if (runButton) {
            runButton.click();
          } else {
            throw new Error('Query execution service not available');
          }
        }
      } catch (error) {
        throw error;
      }
    },
  });
}
