/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MCPTool } from '../../mcp_server';

export class GetQueryStateTool implements MCPTool {
  public readonly name = 'get_query_state';
  public readonly description =
    'Get the current query state from OpenSearch Dashboards explore interface';

  public readonly inputSchema = {
    type: 'object',
    properties: {
      includeResults: {
        type: 'boolean',
        description: 'Whether to include query results summary in the response (default: false)',
        default: false,
      },
    },
    required: [],
  };

  private logger: any;

  constructor(logger: any) {
    this.logger = logger;
  }

  public async execute(input: { includeResults?: boolean }): Promise<any> {
    this.logger.info('GetQueryStateTool: Executing', { input });

    const { includeResults = false } = input;

    try {
      // Access the global Explore services which includes the Redux store
      const globalServices = (global as any).exploreServices;
      if (!globalServices || !globalServices.store) {
        this.logger.warn(
          'GetQueryStateTool: Explore services not available, returning mock response'
        );
        return {
          success: false,
          message: 'Explore services not available. Make sure you are on an Explore page.',
          error: 'SERVICES_NOT_AVAILABLE',
          includeResults,
          timestamp: new Date().toISOString(),
          action: 'get_query_state_failed',
        };
      }

      // Get current state from Redux store
      const currentState = globalServices.store.getState();
      const queryState = currentState.query;
      const uiState = currentState.ui;
      const queryEditorState = currentState.queryEditor;

      this.logger.info('GetQueryStateTool: Retrieved query state', {
        query: queryState.query,
        language: queryState.language,
        dataset: queryState.dataset?.title || 'default',
        activeTabId: uiState.activeTabId,
        includeResults,
      });

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
    } catch (error) {
      this.logger.error('GetQueryStateTool: Failed to get query state', error);
      throw new Error(
        `Failed to get query state: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
