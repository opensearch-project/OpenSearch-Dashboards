/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Logger } from '../../../../../core/server';
import { MCPTool } from '../../mcp_server';

export class UpdateQueryDirectTool implements MCPTool {
  public readonly name = 'update_query_direct';
  public readonly description =
    'Generate PPL query from natural language and put it directly in the main query editor (not Generated Query section)';

  public readonly inputSchema = {
    type: 'object',
    properties: {
      question: {
        type: 'string',
        description:
          'Natural language question to convert to PPL query (e.g., "show me HTTP 200 responses")',
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
  private getPendingCommandsArray?: () => any[];

  constructor(logger: Logger, getPendingCommandsArray?: () => any[]) {
    this.logger = logger;
    this.getPendingCommandsArray = getPendingCommandsArray;
  }

  public async execute(input: { question: string; executeQuery?: boolean }): Promise<any> {
    this.logger.info('🎯 UpdateQueryDirectTool: Starting execution - direct editor approach', {
      input,
      timestamp: new Date().toISOString(),
      questionLength: input.question?.length,
    });

    const { question, executeQuery = true } = input;

    if (!question || typeof question !== 'string') {
      throw new Error('Question parameter is required and must be a string');
    }

    if (!this.getPendingCommandsArray) {
      this.logger.error('❌ UpdateQueryDirectTool: getPendingCommandsArray not available');
      throw new Error('Redux Bridge integration not available');
    }

    try {
      // Generate a simple PPL query based on the question
      let generatedQuery = '';
      const questionLower = question.toLowerCase();

      if (questionLower.includes('200') || questionLower.includes('success')) {
        generatedQuery = "source = opensearch_dashboards_sample_data_logs | where response = '200'";
      } else if (
        questionLower.includes('error') ||
        questionLower.includes('400') ||
        questionLower.includes('500')
      ) {
        generatedQuery =
          "source = opensearch_dashboards_sample_data_logs | where response >= '400'";
      } else if (questionLower.includes('404')) {
        generatedQuery = "source = opensearch_dashboards_sample_data_logs | where response = '404'";
      } else if (
        questionLower.includes('post') ||
        questionLower.includes('put') ||
        questionLower.includes('delete')
      ) {
        const method = questionLower.includes('post')
          ? 'POST'
          : questionLower.includes('put')
          ? 'PUT'
          : 'DELETE';
        generatedQuery = `source = opensearch_dashboards_sample_data_logs | where request = '${method}'`;
      } else if (questionLower.includes('ip') || questionLower.includes('address')) {
        generatedQuery =
          'source = opensearch_dashboards_sample_data_logs | stats count() by clientip';
      } else if (questionLower.includes('user') || questionLower.includes('agent')) {
        generatedQuery = 'source = opensearch_dashboards_sample_data_logs | stats count() by agent';
      } else {
        // Default search query
        generatedQuery = `source = opensearch_dashboards_sample_data_logs | search "${question}"`;
      }

      this.logger.info('📝 UpdateQueryDirectTool: Generated PPL query', {
        question,
        generatedQuery,
        queryLength: generatedQuery.length,
      });

      const pendingCommands = this.getPendingCommandsArray();

      if (executeQuery) {
        // Use update_query approach - puts query directly in main editor and executes
        const updateCommand = {
          action: 'execute_direct_redux',
          type: 'update_query',
          payload: {
            query: generatedQuery,
            language: 'PPL',
          },
          timestamp: new Date().toISOString(),
          message: 'Direct query update - query will appear in main editor and execute',
          directExecution: {
            method: 'updateQuery',
            params: {
              query: generatedQuery,
              language: 'PPL',
            },
            description:
              'Update query directly in main editor and execute (like manual typing + run)',
          },
          id: Date.now(),
        };

        pendingCommands.push(updateCommand);
        this.logger.info('📥 UpdateQueryDirectTool: Added update command to pending queue', {
          totalPending: pendingCommands.length,
        });

        this.logger.info('UpdateQueryDirectTool: Added update command to pending queue', {
          generatedQuery,
          commandId: updateCommand.id,
          totalPending: pendingCommands.length,
        });

        return {
          success: true,
          message: `Query generated and will appear in main editor: "${generatedQuery}"`,
          question,
          generatedQuery,
          method: 'direct_editor_with_execution',
          timestamp: new Date().toISOString(),
          queuedCommand: updateCommand,
          note:
            'Query will appear in main Explore editor (not Generated Query section) and execute automatically',
          guidance:
            'The query will be typed directly into the editor as if you typed it manually, then executed',
          expectedResult: 'Query appears in main editor, executes, and shows results',
        };
      } else {
        // Just update the query without executing
        const updateCommand = {
          action: 'execute_direct_redux',
          type: 'update_query',
          payload: {
            query: generatedQuery,
            language: 'PPL',
            executeQuery: false, // Don't execute, just update
          },
          timestamp: new Date().toISOString(),
          message: 'Direct query update - query will appear in main editor (no execution)',
          directExecution: {
            method: 'updateQuery',
            params: {
              query: generatedQuery,
              language: 'PPL',
              executeQuery: false,
            },
            description: 'Update query directly in main editor without executing',
          },
          id: Date.now(),
        };

        pendingCommands.push(updateCommand);
        this.logger.info('📥 UpdateQueryDirectTool: Added update-only command to pending queue', {
          totalPending: pendingCommands.length,
        });

        this.logger.info('UpdateQueryDirectTool: Added update-only command to pending queue', {
          generatedQuery,
          commandId: updateCommand.id,
          totalPending: pendingCommands.length,
        });

        return {
          success: true,
          message: `Query generated and will appear in main editor: "${generatedQuery}" (not executed)`,
          question,
          generatedQuery,
          method: 'direct_editor_no_execution',
          timestamp: new Date().toISOString(),
          queuedCommand: updateCommand,
          note:
            'Query will appear in main Explore editor (not Generated Query section) but will not execute automatically',
          guidance:
            'The query will be typed directly into the editor. You can then click Run to execute it.',
          expectedResult: 'Query appears in main editor, ready for manual execution',
        };
      }
    } catch (error) {
      this.logger.error('❌ UpdateQueryDirectTool: Failed to generate/update query', error);
      throw new Error(
        `Failed to generate query: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
