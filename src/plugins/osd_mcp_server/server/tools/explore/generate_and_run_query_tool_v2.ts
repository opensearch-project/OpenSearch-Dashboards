/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Logger } from '../../../../../core/server';
import { MCPTool } from '../../mcp_server';

export class GenerateAndRunQueryToolV2 implements MCPTool {
  public readonly name = 'generate_and_run_query';
  public readonly description =
    'Generate PPL query from natural language, update the editor, and run the query';

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
  private updateQueryTool: any;
  private runQueryTool: any;
  private pendingCommands: any[];

  constructor(logger: Logger, updateQueryTool: any, runQueryTool: any, pendingCommands?: any[]) {
    this.logger = logger;
    this.updateQueryTool = updateQueryTool;
    this.runQueryTool = runQueryTool;
    this.pendingCommands = pendingCommands || [];
  }

  // Helper function to add command to pending queue (same as Redux Bridge)
  private addPendingCommand(command: any) {
    const commandWithId = {
      ...command,
      id: Date.now(),
      timestamp: new Date().toISOString(),
    };
    this.pendingCommands.push(commandWithId);
    this.logger.info(
      `📥 GenerateAndRunQueryToolV2: Added command to pending queue. Total pending: ${this.pendingCommands.length}`
    );
    this.logger.info(`📥 GenerateAndRunQueryToolV2: Command details:`, {
      commandDetails: commandWithId,
    });
    return commandWithId;
  }

  public async execute(input: { question: string; executeQuery?: boolean }): Promise<any> {
    this.logger.info('🤖 GenerateAndRunQueryToolV2: Starting execution');
    this.logger.info('GenerateAndRunQueryToolV2: Starting execution', {
      input,
      timestamp: new Date().toISOString(),
    });

    const { question, executeQuery = true } = input;

    if (!question || typeof question !== 'string') {
      throw new Error('Question parameter is required and must be a string');
    }

    try {
      // Use Redux Bridge to queue callAgentActionCreator for client-side execution
      this.logger.info(
        '🌉 GenerateAndRunQueryToolV2: Using Redux Bridge to queue callAgentActionCreator'
      );

      // Create the command that will be executed by the browser's Redux Bridge client
      const bridgeCommand = {
        action: 'execute_call_agent',
        type: 'call_agent',
        payload: { question, language: 'PPL' },
        timestamp: new Date().toISOString(),
        message:
          'callAgentActionCreator execution - query will be generated and executed via AI mode',
        directExecution: {
          method: 'callAgentActionCreator',
          params: { question, language: 'PPL' },
          description:
            'Execute callAgentActionCreator directly in browser context (same as AI mode)',
        },
      };

      this.logger.info('📡 GenerateAndRunQueryToolV2: Queuing callAgentActionCreator command', {
        question,
        language: 'PPL',
        method: 'redux_bridge_queue',
      });

      // Add command to pending queue (same as Redux Bridge routes)
      const queuedCommand = this.addPendingCommand(bridgeCommand);

      this.logger.info('✅ GenerateAndRunQueryToolV2: Command queued for browser execution', {
        commandId: queuedCommand.id,
        note: 'Browser Redux Bridge client will poll and execute callAgentActionCreator',
      });

      // Return success response indicating the command has been queued
      return {
        success: true,
        message: `Query generation queued for execution: "${question}". The PPL query will be generated and executed automatically in the Explore interface using the same AI mode as the manual AI button.`,
        question,
        method: 'redux_bridge_queue',
        timestamp: new Date().toISOString(),
        queuedCommand,
        note: 'callAgentActionCreator queued for browser execution - same as AI mode',
        guidance: 'The query will appear in the Explore editor and execute automatically',
        expectedResult:
          "PPL query like: source = opensearch_dashboards_sample_data_logs | where response = '200'",
      };
    } catch (error) {
      this.logger.error('❌ GenerateAndRunQueryToolV2: Failed', error);
      this.logger.error('GenerateAndRunQueryToolV2: Failed', error);
      throw new Error(
        `Failed to generate query: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
