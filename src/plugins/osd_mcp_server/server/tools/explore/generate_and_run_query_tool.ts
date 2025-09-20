/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Logger } from '../../../../../core/server';
import { MCPTool } from '../../mcp_server';

export class GenerateAndRunQueryTool implements MCPTool {
  public readonly name = 'generate_and_run_query';
  public readonly description =
    'Generate and execute PPL query from natural language using AI mode (callAgentActionCreator)';

  public readonly inputSchema = {
    type: 'object',
    properties: {
      question: {
        type: 'string',
        description:
          'Natural language question to convert to PPL query and execute (e.g., "show me errors from last hour")',
      },
      executeQuery: {
        type: 'boolean',
        description: 'Whether to execute the generated query immediately (default: true)',
        default: true,
      },
    },
    required: ['question'],
  };

  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  public async execute(input: { question: string; executeQuery?: boolean }): Promise<any> {
    this.logger.info('GenerateAndRunQueryTool: Starting execution using callAgentActionCreator', {
      input,
      timestamp: new Date().toISOString(),
      questionLength: input.question?.length,
    });

    const { question, executeQuery = true } = input;

    if (!question || typeof question !== 'string') {
      throw new Error('Question parameter is required and must be a string');
    }

    try {
      // Access the global Explore services and Redux actions
      const globalServices = (global as any).exploreServices;
      const reduxActions = (global as any).exploreReduxActions;

      if (!globalServices || !globalServices.store || !reduxActions) {
        this.logger.warn(
          'GenerateAndRunQueryTool: Explore services or Redux actions not available'
        );
        return {
          success: false,
          message: 'Explore services not available. Make sure you are on an Explore page.',
          error: 'SERVICES_NOT_AVAILABLE',
          question,
          timestamp: new Date().toISOString(),
          action: 'query_generation_failed',
        };
      }

      // Get current dataset from Redux state (same as AI mode does)
      const currentState = globalServices.store.getState();
      const dataset = currentState.query?.dataset;

      this.logger.info('GenerateAndRunQueryTool: Current state info', {
        hasDataset: !!dataset,
        datasetTitle: dataset?.title,
        datasetId: dataset?.id,
        dataSourceId: dataset?.dataSource?.id,
        hasCallAgentAction: !!reduxActions.callAgentActionCreator,
      });

      if (!dataset) {
        return {
          success: false,
          message: 'No dataset selected. Please select a dataset first.',
          error: 'NO_DATASET',
          question,
          timestamp: new Date().toISOString(),
          action: 'query_generation_failed',
        };
      }

      if (executeQuery && reduxActions.callAgentActionCreator) {
        // Use the same action creator that AI mode uses - this handles everything:
        // - API call to /api/enhancements/assist/generate with proper parameters
        // - Time range updates if provided in response
        // - Query execution via runQueryActionCreator
        // - Error handling (ProhibitedQueryError, AgentError, etc.)
        // - History updates (lastExecutedPrompt, lastExecutedTranslatedQuery)
        // - UI state management
        this.logger.info(
          'GenerateAndRunQueryTool: Dispatching callAgentActionCreator (same as AI mode)'
        );

        await globalServices.store.dispatch(
          reduxActions.callAgentActionCreator({
            services: globalServices,
            editorText: question,
          })
        );

        // Get the updated state after execution
        const updatedState = globalServices.store.getState();
        const executedQuery = updatedState.query?.query;
        const results = updatedState.results;
        const lastExecutedPrompt = updatedState.queryEditor?.lastExecutedPrompt;
        const lastExecutedTranslatedQuery = updatedState.queryEditor?.lastExecutedTranslatedQuery;

        // Count results (same logic as our other tools)
        let totalResultCount = 0;
        let hasResults = false;
        Object.values(results || {}).forEach((result: any) => {
          if (result?.hits?.hits) {
            totalResultCount += result.hits.hits.length;
            hasResults = true;
          }
        });

        this.logger.info(
          'GenerateAndRunQueryTool: Query generated and executed successfully via callAgentActionCreator',
          {
            question,
            generatedQuery: lastExecutedTranslatedQuery,
            executedQuery,
            totalResultCount,
            hasResults,
            resultCacheKeys: Object.keys(results || {}).length,
          }
        );

        return {
          success: true,
          message: `Query generated and executed successfully from question: "${question}"`,
          question,
          generatedQuery: lastExecutedTranslatedQuery,
          executedQuery,
          dataset: {
            title: dataset.title,
            id: dataset.id,
            dataSourceId: dataset.dataSource?.id,
          },
          resultCount: totalResultCount,
          hasResults,
          resultCacheKeys: Object.keys(results || {}).length,
          timestamp: new Date().toISOString(),
          action: 'query_generated_and_executed',
          method: 'callAgentActionCreator',
          note: 'Used same flow as AI mode - robust and complete',
        };
      } else {
        // Fallback: just generate without executing (less common use case)
        // Still use the same API parameters as callAgentActionCreator
        const params = {
          question,
          index: dataset.title,
          language: 'PPL',
          dataSourceId: dataset.dataSource?.id,
        };

        this.logger.info('GenerateAndRunQueryTool: Calling API directly (generate only)', {
          params,
        });

        const response = await globalServices.http.post('/api/enhancements/assist/generate', {
          body: JSON.stringify(params),
        });

        return {
          success: true,
          message: `Query generated successfully from question: "${question}" (not executed)`,
          question,
          generatedQuery: response.query,
          timeRange: response.timeRange,
          dataset: {
            title: dataset.title,
            id: dataset.id,
            dataSourceId: dataset.dataSource?.id,
          },
          timestamp: new Date().toISOString(),
          action: 'query_generated_only',
          method: 'direct_api_call',
        };
      }
    } catch (error) {
      this.logger.error('GenerateAndRunQueryTool: Failed to generate/execute query', error);
      throw new Error(
        `Failed to generate query: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
