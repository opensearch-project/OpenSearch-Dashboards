/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable no-console */

import { CoreSetup, CoreStart, Plugin } from '../../../core/public';
import { setupMCPClientAPI } from './api/mcp_client_api';
// Import Redux bridge client to initialize it
import './redux_bridge_client';

// Define client-side types (cannot import from server)
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface OsdMcpServerPluginSetup {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface OsdMcpServerPluginStart {}

export class OsdMcpServerPlugin
  implements Plugin<OsdMcpServerPluginSetup, OsdMcpServerPluginStart> {
  public setup(core: CoreSetup): OsdMcpServerPluginSetup {
    console.log('OSD MCP Server Plugin Setup (Client)');

    // Register HTTP interceptors for Redux bridge endpoints
    core.http.intercept({
      request: (request, controller) => {
        // Intercept Redux bridge calls that the original standalone MCP server was making
        if (request.path?.startsWith('/api/osd-mcp-server/redux/')) {
          console.log('Intercepting Redux bridge call:', request.path);

          return new Promise(async (resolve) => {
            try {
              // Check if we have access to the global services (Redux store)
              const globalServices = (global as any).exploreServices;
              const reduxActions = (global as any).exploreReduxActions;

              console.log('Checking global services availability:', {
                globalServices: !!globalServices,
                store: !!globalServices?.store,
                reduxActions: !!reduxActions,
                currentUrl: window.location.href,
                isExplorePage: window.location.href.includes('/app/explore'),
              });

              if (!globalServices || !globalServices.store) {
                console.warn('Redux store not available for bridge call');
                resolve({
                  ...request,
                  body: JSON.stringify({
                    success: false,
                    error: 'REDUX_STORE_NOT_AVAILABLE',
                    message:
                      'Redux store not available. Make sure you are on an Explore page and it has fully loaded.',
                    path: request.path,
                    timestamp: new Date().toISOString(),
                    debug: {
                      globalServices: !!globalServices,
                      store: !!globalServices?.store,
                      currentUrl: window.location.href,
                      isExplorePage: window.location.href.includes('/app/explore'),
                    },
                  }),
                });
                return;
              }

              let result;
              const body = request.body ? JSON.parse(request.body as string) : {};
              const action = request.path.replace('/api/osd-mcp-server/redux/', '');

              console.log('Executing Redux bridge action:', action, body);

              switch (action) {
                case 'update-query':
                  result = await this.executeUpdateQuery(globalServices, reduxActions, body);
                  break;
                case 'execute-query':
                  result = await this.executeRunQuery(globalServices, reduxActions, body);
                  break;
                case 'state':
                  result = await this.getReduxState(globalServices, body);
                  break;
                default:
                  result = {
                    success: false,
                    error: `Unknown Redux bridge action: ${action}`,
                  };
              }

              console.log('Redux bridge action completed:', result);

              resolve({
                ...request,
                body: JSON.stringify(result),
              });
            } catch (error) {
              console.error('Redux bridge action failed:', error);
              resolve({
                ...request,
                body: JSON.stringify({
                  success: false,
                  error: error instanceof Error ? error.message : 'Unknown error',
                  path: request.path,
                  timestamp: new Date().toISOString(),
                }),
              });
            }
          });
        }

        return request;
      },
    });

    return {};
  }

  public start(core: CoreStart): OsdMcpServerPluginStart {
    console.log('OSD MCP Server Plugin Start (Client)');

    // Set up the MCP Client API
    setupMCPClientAPI(core.http);
    console.log('MCP Client API set up and available globally');

    return {};
  }

  public stop() {
    console.log('OSD MCP Server Plugin Stop (Client)');
    // Clean up global API
    delete (window as any).mcpClientAPI;
  }

  private async executeUpdateQuery(globalServices: any, reduxActions: any, body: any) {
    const { query, language = 'PPL' } = body;
    const { store } = globalServices;

    // Get current state
    const currentState = store.getState();
    const currentQuery = currentState.query;

    // Update query text with history tracking
    if (reduxActions && reduxActions.setQueryStringWithHistory) {
      store.dispatch(reduxActions.setQueryStringWithHistory(query));
    } else {
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
      message: `Query updated successfully via Redux bridge`,
      originalQuery: query,
      updatedQuery: updatedQuery.query,
      language: updatedQuery.language,
      previousQuery: currentQuery.query,
      previousLanguage: currentQuery.language,
      timestamp: new Date().toISOString(),
      action: 'query_updated_via_redux_bridge',
      reduxActions:
        language !== currentQuery.language
          ? ['setQueryStringWithHistory', 'setQueryState']
          : ['setQueryStringWithHistory'],
    };
  }

  private async executeRunQuery(globalServices: any, reduxActions: any, body: any) {
    const { query, waitForResults = true } = body;
    const { store } = globalServices;

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

    // Wait for query execution to complete if requested
    if (waitForResults) {
      await executePromise;
    }

    // Get results from updated state
    const finalState = store.getState();
    const results = finalState.results;
    const queryStatus = finalState.queryEditor?.queryStatus;

    // Count total results
    let totalResultCount = 0;
    let hasResults = false;

    Object.values(results || {}).forEach((result: any) => {
      if (result?.hits?.hits) {
        totalResultCount += result.hits.hits.length;
        hasResults = true;
      }
    });

    return {
      success: true,
      message: query
        ? `Query "${query}" executed successfully via Redux bridge`
        : 'Current query executed successfully via Redux bridge',
      executedQuery: currentQuery.query,
      language: currentQuery.language,
      dataset: currentQuery.dataset?.title || 'default',
      resultCount: totalResultCount,
      hasResults,
      resultCacheKeys: Object.keys(results || {}).length,
      queryStatus,
      waitForResults,
      timestamp: new Date().toISOString(),
      action: 'query_executed_via_redux_bridge',
      reduxActions: query ? ['setQueryStringWithHistory', 'executeQueries'] : ['executeQueries'],
    };
  }

  private async getReduxState(globalServices: any, body: any) {
    const { includeResults = false } = body;
    const currentState = globalServices.store.getState();
    const queryState = currentState.query;
    const uiState = currentState.ui;
    const queryEditorState = currentState.queryEditor;

    const response: any = {
      success: true,
      message: 'Query state retrieved successfully via Redux bridge',
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
      action: 'query_state_retrieved_via_redux_bridge',
    };

    // Include results summary if requested
    if (includeResults) {
      const results = currentState.results;
      const resultsSummary = {
        cacheKeys: Object.keys(results || {}),
        totalCacheEntries: Object.keys(results || {}).length,
        resultCounts: {} as Record<string, number>,
        hasResults: false,
      };

      // Count results for each cache key
      Object.entries(results || {}).forEach(([cacheKey, result]: [string, any]) => {
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
