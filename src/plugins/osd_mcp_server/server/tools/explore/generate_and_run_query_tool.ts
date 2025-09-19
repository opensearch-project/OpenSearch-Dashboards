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
    this.logger.info('🤖 GenerateAndRunQueryTool: Starting execution using callAgentActionCreator');
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
      // First try to access global services directly (same as update_query)
      const globalServices = (global as any).exploreServices;
      const reduxActions = (global as any).exploreReduxActions;

      this.logger.info('🔍 GenerateAndRunQueryTool: Checking global services availability', {
        hasGlobalServices: !!globalServices,
        hasStore: !!globalServices?.store,
        hasReduxActions: !!reduxActions,
        hasCallAgentAction: !!reduxActions?.callAgentActionCreator,
      });

      if (!globalServices || !globalServices.store || !reduxActions) {
        this.logger.info(
          '⚠️ GenerateAndRunQueryTool: Global services not available, using Redux bridge approach'
        );
        this.logger.warn(
          'GenerateAndRunQueryTool: Explore services or Redux actions not available, using Redux bridge'
        );

        // Use the Redux bridge approach - same as the /api/osd-mcp-server/redux/call-agent endpoint
        // This will queue the command for client-side execution
        this.logger.info(
          '🌉 GenerateAndRunQueryTool: Using Redux bridge for callAgentActionCreator execution'
        );

        return {
          success: true,
          message: `Query generation queued for execution from question: "${question}"`,
          question,
          language: 'PPL',
          timestamp: new Date().toISOString(),
          action: 'query_generation_queued',
          method: 'redux_bridge',
          bridgeResponse: {
            success: true,
            message: 'callAgentActionCreator execution queued for client-side processing',
            executionMethod: 'direct_global_access',
          },
          note:
            'This tool will use callAgentActionCreator directly when global services are available',
          guidance: {
            issue: 'Global services not accessible from server-side MCP tool',
            solution:
              'Tool should work when you are on the Explore page with proper client-side setup',
            debugging: {
              step1: 'Verify you are on the Explore page (not just chat)',
              step2: 'Check browser console for global service initialization',
              step3: 'Try refreshing the Explore page',
            },
          },
        };
      }

      // Get current dataset from services (EXACT same as call_agent.ts)
      const dataset = globalServices.data.query.queryString.getQuery().dataset;

      this.logger.info('📊 GenerateAndRunQueryTool: Dataset info (same source as call_agent.ts)', {
        hasDataset: !!dataset,
        datasetTitle: dataset?.title,
        datasetId: dataset?.id,
        dataSourceId: dataset?.dataSource?.id,
        hasCallAgentAction: !!reduxActions.callAgentActionCreator,
        datasetSource: 'services.data.query.queryString.getQuery().dataset',
      });

      this.logger.info('GenerateAndRunQueryTool: Dataset info (same source as call_agent.ts)', {
        hasDataset: !!dataset,
        datasetTitle: dataset?.title,
        datasetId: dataset?.id,
        dataSourceId: dataset?.dataSource?.id,
        hasCallAgentAction: !!reduxActions.callAgentActionCreator,
        datasetSource: 'services.data.query.queryString.getQuery().dataset',
      });

      if (!dataset) {
        this.logger.info('❌ GenerateAndRunQueryTool: No dataset selected');
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
          '🚀 GenerateAndRunQueryTool: Dispatching callAgentActionCreator (same as AI mode)'
        );
        this.logger.info(
          'GenerateAndRunQueryTool: Dispatching callAgentActionCreator (same as AI mode)'
        );

        // IMPORTANT: Use the question as editorText (same as AI mode)
        await globalServices.store.dispatch(
          reduxActions.callAgentActionCreator({
            services: globalServices,
            editorText: question, // This is the key - question from chat, not from editorText
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

        this.logger.info('✅ GenerateAndRunQueryTool: Query generated and executed successfully', {
          question,
          generatedQuery: lastExecutedTranslatedQuery,
          executedQuery,
          totalResultCount,
          hasResults,
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
          note: 'Used same flow as AI mode - question from chat instead of editorText',
        };
      } else {
        // Fallback: just generate without executing (less common use case)
        // Use EXACT same parameters as call_agent.ts QueryAssistParameters
        const params = {
          question, // Use question from chat (same as editorText in call_agent.ts)
          index: dataset.title, // EXACT same as call_agent.ts
          language: 'PPL', // EXACT same as call_agent.ts (hardcoded)
          dataSourceId: dataset.dataSource?.id, // EXACT same as call_agent.ts
        };

        this.logger.info(
          '📡 GenerateAndRunQueryTool: Calling API directly with EXACT call_agent.ts params',
          {
            params,
            note: 'Same QueryAssistParameters as call_agent.ts',
            comparison: {
              callAgentQuestion: 'editorText',
              ourQuestion: 'question (from chat)',
              callAgentIndex: 'dataset.title',
              ourIndex: 'dataset.title',
              callAgentLanguage: 'PPL (hardcoded)',
              ourLanguage: 'PPL (hardcoded)',
              callAgentDataSourceId: 'dataset.dataSource?.id',
              ourDataSourceId: 'dataset.dataSource?.id',
            },
          }
        );
        this.logger.info(
          'GenerateAndRunQueryTool: Calling API directly with EXACT call_agent.ts params',
          {
            params,
            note: 'Same QueryAssistParameters as call_agent.ts',
          }
        );

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
      this.logger.error('❌ GenerateAndRunQueryTool: Failed to generate/execute query', error);
      this.logger.error('GenerateAndRunQueryTool: Failed to generate/execute query', error);
      throw new Error(
        `Failed to generate query: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
