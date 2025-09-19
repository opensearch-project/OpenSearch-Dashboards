/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpSetup } from '../../../../core/public';

export class MCPClientAPI {
  private http: HttpSetup;

  constructor(http: HttpSetup) {
    this.http = http;
  }

  /**
   * Update query in the client-side Redux store
   */
  async updateQuery(query: string, language?: string): Promise<any> {
    // Access the global Explore services which includes the Redux store
    const globalServices = (global as any).exploreServices;
    if (!globalServices || !globalServices.store) {
      throw new Error(
        'Explore services not available. Make sure you are on an Explore page and it has fully loaded.'
      );
    }

    const { store } = globalServices;
    const reduxActions = (global as any).exploreReduxActions;

    // Get current state
    const currentState = store.getState();
    const currentQuery = currentState.query;

    // Update query text with history tracking
    if (reduxActions && reduxActions.setQueryStringWithHistory) {
      store.dispatch(reduxActions.setQueryStringWithHistory(query));
    } else {
      // Fallback: dispatch action directly
      store.dispatch({
        type: 'query/setQueryStringWithHistory',
        payload: query,
        meta: { addToHistory: true },
      });
    }

    // If language is different, update the entire query state
    if (language && language !== currentQuery.language) {
      if (reduxActions && reduxActions.setQueryState) {
        store.dispatch(
          reduxActions.setQueryState({
            query,
            language,
            dataset: currentQuery.dataset,
          })
        );
      } else {
        // Fallback: dispatch action directly
        store.dispatch({
          type: 'query/setQueryState',
          payload: {
            query,
            language,
            dataset: currentQuery.dataset,
          },
        });
      }
    }

    // Verify the update
    const updatedState = store.getState();
    const updatedQuery = updatedState.query;

    return {
      success: true,
      message: `Query updated successfully`,
      originalQuery: query,
      updatedQuery: updatedQuery.query,
      language: updatedQuery.language,
      previousQuery: currentQuery.query,
      previousLanguage: currentQuery.language,
      timestamp: new Date().toISOString(),
      action: 'query_updated',
      reduxActions:
        language !== currentQuery.language
          ? ['setQueryStringWithHistory', 'setQueryState']
          : ['setQueryStringWithHistory'],
    };
  }

  /**
   * Execute query in the client-side Redux store
   */
  async runQuery(query?: string): Promise<any> {
    const globalServices = (global as any).exploreServices;
    if (!globalServices || !globalServices.store) {
      throw new Error(
        'Explore services not available. Make sure you are on an Explore page and it has fully loaded.'
      );
    }

    const { store } = globalServices;
    const reduxActions = (global as any).exploreReduxActions;

    // Get current state
    let currentQuery = store.getState().query;

    // If a query was provided, update it first
    if (query) {
      if (reduxActions && reduxActions.setQueryStringWithHistory) {
        store.dispatch(reduxActions.setQueryStringWithHistory(query));
      } else {
        store.dispatch({
          type: 'query/setQueryStringWithHistory',
          payload: query,
          meta: { addToHistory: true },
        });
      }

      // Get updated state
      currentQuery = store.getState().query;
    }

    // Execute the query
    let executePromise;
    if (reduxActions && reduxActions.executeQueries) {
      executePromise = store.dispatch(reduxActions.executeQueries({ services: globalServices }));
    } else {
      executePromise = store.dispatch({
        type: 'query/executeQueries',
        payload: { services: globalServices },
      });
    }

    // Wait for query execution to complete
    await executePromise;

    // Get results from updated state
    const finalState = store.getState();
    const results = finalState.results;
    const queryStatus = finalState.queryEditor?.queryStatus;

    // Count total results
    let totalResultCount = 0;
    let hasResults = false;

    Object.values(results).forEach((result: any) => {
      if (result?.hits?.hits) {
        totalResultCount += result.hits.hits.length;
        hasResults = true;
      }
    });

    return {
      success: true,
      message: query
        ? `Query "${query}" executed successfully`
        : 'Current query executed successfully',
      executedQuery: currentQuery.query,
      language: currentQuery.language,
      dataset: currentQuery.dataset?.title || 'default',
      resultCount: totalResultCount,
      hasResults,
      resultCacheKeys: Object.keys(results).length,
      queryStatus,
      timestamp: new Date().toISOString(),
      action: 'query_executed',
      reduxActions: query ? ['setQueryStringWithHistory', 'executeQueries'] : ['executeQueries'],
    };
  }

  /**
   * Get current query state from the client-side Redux store
   */
  async getQueryState(includeResults?: boolean): Promise<any> {
    const globalServices = (global as any).exploreServices;
    if (!globalServices || !globalServices.store) {
      throw new Error(
        'Explore services not available. Make sure you are on an Explore page and it has fully loaded.'
      );
    }

    const currentState = globalServices.store.getState();
    const queryState = currentState.query;
    const uiState = currentState.ui;
    const queryEditorState = currentState.queryEditor;

    const response: any = {
      success: true,
      message: 'Query state retrieved successfully',
      queryState: {
        query: queryState.query,
        language: queryState.language,
        dataset: queryState.dataset
          ? {
              id: queryState.dataset.id,
              title: queryState.dataset.title,
              type: queryState.dataset.type,
            }
          : null,
      },
      uiState: {
        activeTabId: uiState.activeTabId,
      },
      queryEditor: {
        dateRange: queryEditorState?.dateRange,
        queryStatus: queryEditorState?.queryStatus,
      },
      includeResults,
      timestamp: new Date().toISOString(),
      action: 'query_state_retrieved',
    };

    // Include results summary if requested
    if (includeResults) {
      const results = currentState.results;
      const resultsSummary = {
        cacheKeys: Object.keys(results),
        totalCacheEntries: Object.keys(results).length,
        resultCounts: {} as Record<string, number>,
        hasResults: false,
      };

      // Count results for each cache key
      Object.entries(results).forEach(([cacheKey, result]: [string, any]) => {
        if (result?.hits?.hits) {
          resultsSummary.resultCounts[cacheKey] = result.hits.hits.length;
          resultsSummary.hasResults = true;
        } else {
          resultsSummary.resultCounts[cacheKey] = 0;
        }
      });

      response.results = resultsSummary;
    }

    return response;
  }
}

// Make it globally available
declare global {
  interface Window {
    mcpClientAPI?: MCPClientAPI;
  }
}

export const setupMCPClientAPI = (http: HttpSetup) => {
  const api = new MCPClientAPI(http);
  (window as any).mcpClientAPI = api;
  return api;
};
