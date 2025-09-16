/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MCPTool } from '../../mcp_server';

export class RunQueryTool implements MCPTool {
  public readonly name = 'run_query';
  public readonly description =
    'Execute the current query in OpenSearch Dashboards explore interface';

  public readonly inputSchema = {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description:
          'Optional query to run. If not provided, runs the current query in the interface',
      },
    },
    required: [],
  };

  private logger: any;

  constructor(logger: any) {
    this.logger = logger;
  }

  public async execute(input: { query?: string }): Promise<any> {
    this.logger.info('RunQueryTool: Executing', { input });

    const { query } = input;

    try {
      // Access the global Explore services which includes the Redux store
      const globalServices = (global as any).exploreServices;
      if (!globalServices || !globalServices.store) {
        this.logger.warn('RunQueryTool: Explore services not available, returning mock response');
        return {
          success: false,
          message: 'Explore services not available. Make sure you are on an Explore page.',
          error: 'SERVICES_NOT_AVAILABLE',
          providedQuery: query,
          timestamp: new Date().toISOString(),
          action: 'query_execution_failed',
        };
      }

      // Get current state
      const currentState = globalServices.store.getState();
      let currentQuery = currentState.query;

      // If a query was provided, update it first
      if (query) {
        this.logger.info('RunQueryTool: Updating query before execution', {
          previousQuery: currentQuery.query,
          newQuery: query,
        });

        // Access Redux actions through global services
        const reduxActions = (global as any).exploreReduxActions;
        if (reduxActions && reduxActions.setQueryStringWithHistory) {
          globalServices.store.dispatch(reduxActions.setQueryStringWithHistory(query));
        } else {
          // Fallback: dispatch action directly using action creator pattern
          globalServices.store.dispatch({
            type: 'query/setQueryStringWithHistory',
            payload: query,
            meta: { addToHistory: true },
          });
        }

        // Get updated state
        const updatedState = globalServices.store.getState();
        currentQuery = updatedState.query;
      }

      this.logger.info('RunQueryTool: Executing query', {
        query: currentQuery.query,
        language: currentQuery.language,
        dataset: currentQuery.dataset?.title || 'default',
      });

      // Execute the query using Redux actions through global services
      const reduxActions = (global as any).exploreReduxActions;
      let executePromise;

      if (reduxActions && reduxActions.executeQueries) {
        executePromise = globalServices.store.dispatch(
          reduxActions.executeQueries({ services: globalServices })
        );
      } else {
        // Fallback: dispatch action directly
        executePromise = globalServices.store.dispatch({
          type: 'query/executeQueries',
          payload: { services: globalServices },
        });
      }

      // Wait for query execution to complete
      await executePromise;

      // Get results from updated state
      const finalState = globalServices.store.getState();
      const results = finalState.results;
      const queryStatus = finalState.queryEditor?.queryStatus;

      // Count total results across all cache keys
      let totalResultCount = 0;
      let hasResults = false;

      Object.values(results).forEach((result: any) => {
        if (result?.hits?.hits) {
          totalResultCount += result.hits.hits.length;
          hasResults = true;
        }
      });

      this.logger.info('RunQueryTool: Query executed successfully', {
        executedQuery: currentQuery.query,
        language: currentQuery.language,
        resultCacheKeys: Object.keys(results).length,
        totalResultCount,
        hasResults,
        queryStatus,
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
    } catch (error) {
      this.logger.error('RunQueryTool: Failed to execute query', error);
      throw new Error(
        `Failed to execute query: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
