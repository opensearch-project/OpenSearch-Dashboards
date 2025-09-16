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
      console.log('🔧 UI Action: Expanding document', context.documentId);

      // Get context provider to trigger document expansion
      const contextProvider = (window as any).contextProvider;
      if (contextProvider && contextProvider.captureDynamicContext) {
        contextProvider.captureDynamicContext('DOCUMENT_EXPAND', {
          documentId: context.documentId,
          action: context.action || 'expand',
          expandedAt: Date.now(),
          source: 'ui_action',
        });
        console.log('✅ Document expansion triggered via context provider');
      } else {
        console.warn('❌ Context provider not available for document expansion');
        throw new Error('Context provider not available');
      }
    },
  });

  uiActions.registerAction({
    id: QUERY_UPDATE_ACTION,
    type: QUERY_UPDATE_TRIGGER,
    getDisplayName: () => 'Update Query',
    execute: async (context: QueryUpdateContext) => {
      console.log('🔧 UI Action: Updating PPL query', context.query);

      try {
        // Access the explore app's query service
        // This will need to be implemented based on explore app's state management
        const exploreServices = (window as any).exploreServices;
        if (exploreServices && exploreServices.queryService) {
          exploreServices.queryService.setQuery({
            query: context.query,
            language: 'PPL',
          });
          console.log('✅ Query updated successfully');
        } else {
          // Fallback: Try to find query input element and update it
          const queryInput = document.querySelector(
            '[data-test-subj="queryInput"]'
          ) as HTMLTextAreaElement;
          if (queryInput) {
            queryInput.value = context.query;
            queryInput.dispatchEvent(new Event('input', { bubbles: true }));
            console.log('✅ Query updated via DOM manipulation');
          } else {
            console.warn('❌ Could not find query service or input element');
            throw new Error('Query service not available');
          }
        }
      } catch (error) {
        console.error('❌ Error updating query:', error);
        throw error;
      }
    },
  });

  uiActions.registerAction({
    id: QUERY_RUN_ACTION,
    type: QUERY_RUN_TRIGGER,
    getDisplayName: () => 'Run Query',
    execute: async (context: QueryRunContext) => {
      console.log('🔧 UI Action: Running current query');

      try {
        // Access the explore app's query service
        const exploreServices = (window as any).exploreServices;
        if (exploreServices && exploreServices.queryService) {
          exploreServices.queryService.submitQuery();
          console.log('✅ Query executed successfully');
        } else {
          // Fallback: Try to find and click the run button
          const runButton = document.querySelector(
            '[data-test-subj="querySubmitButton"]'
          ) as HTMLButtonElement;
          if (runButton) {
            runButton.click();
            console.log('✅ Query executed via button click');
          } else {
            console.warn('❌ Could not find query service or run button');
            throw new Error('Query execution service not available');
          }
        }
      } catch (error) {
        console.error('❌ Error running query:', error);
        throw error;
      }
    },
  });

  console.log('✅ Explore UI Actions registered successfully');
}
