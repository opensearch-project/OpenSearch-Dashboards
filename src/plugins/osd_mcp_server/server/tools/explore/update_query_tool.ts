/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Logger } from '../../../../../../core/server';
import { MCPTool } from '../../mcp_server';

export class UpdateQueryTool implements MCPTool {
  public readonly name = 'update_query';
  public readonly description =
    'Update the PPL/SQL query in OpenSearch Dashboards explore interface';

  public readonly inputSchema = {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The new query string to set in the explore interface (PPL or SQL)',
      },
      language: {
        type: 'string',
        description: 'Query language (PPL, SQL, DQL). Defaults to PPL if not specified',
        enum: ['PPL', 'SQL', 'DQL'],
      },
    },
    required: ['query'],
  };

  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  public async execute(input: { query: string; language?: string }): Promise<any> {
    this.logger.info('UpdateQueryTool: Executing', { input });

    const { query, language = 'PPL' } = input;

    if (!query || typeof query !== 'string') {
      throw new Error('Query parameter is required and must be a string');
    }

    try {
      // Access the global Explore services which includes the Redux store
      const globalServices = (global as any).exploreServices;
      if (!globalServices || !globalServices.store) {
        this.logger.warn(
          'UpdateQueryTool: Explore services not available, returning mock response'
        );
        return {
          success: false,
          message: 'Explore services not available. Make sure you are on an Explore page.',
          error: 'SERVICES_NOT_AVAILABLE',
          updatedQuery: query,
          language,
          timestamp: new Date().toISOString(),
          action: 'query_update_failed',
        };
      }

      // Get current state
      const currentState = globalServices.store.getState();
      const currentQuery = currentState.query;

      this.logger.info('UpdateQueryTool: Current query state', {
        currentQuery: currentQuery.query,
        currentLanguage: currentQuery.language,
        newQuery: query,
        newLanguage: language,
      });

      // Access Redux actions through global services
      const reduxActions = (global as any).exploreReduxActions;

      // Update query text with history tracking
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

      // If language is different, update the entire query state
      if (language && language !== currentQuery.language) {
        if (reduxActions && reduxActions.setQueryState) {
          globalServices.store.dispatch(
            reduxActions.setQueryState({
              query,
              language,
              dataset: currentQuery.dataset,
            })
          );
        } else {
          // Fallback: dispatch action directly
          globalServices.store.dispatch({
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
      const updatedState = globalServices.store.getState();
      const updatedQuery = updatedState.query;

      this.logger.info('UpdateQueryTool: Query updated successfully via Redux', {
        previousQuery: currentQuery.query,
        updatedQuery: updatedQuery.query,
        previousLanguage: currentQuery.language,
        updatedLanguage: updatedQuery.language,
        queryLength: query.length,
      });

      return {
        success: true,
        message: `Query updated successfully`,
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
    } catch (error) {
      this.logger.error('UpdateQueryTool: Failed to update query', error);
      throw new Error(
        `Failed to update query: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
