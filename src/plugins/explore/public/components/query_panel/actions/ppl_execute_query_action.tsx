/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useDispatch } from 'react-redux';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../types';
import { loadQueryActionCreator } from '../../../application/utils/state_management/actions/query_editor/load_query';
import { useSetEditorTextWithQuery } from '../../../application/hooks';
import { QueryExecutionStatus } from '../../../application/utils/state_management/types';
import { prepareQueryForLanguage } from '../../../application/utils/languages';

export const PPL_QUERY_EXECUTION_TIMEOUT_MS = 10000;
export const PPL_QUERY_POLL_INTERVAL_MS = 1000;

interface PPLExecuteQueryArgs {
  query: string;
  autoExecute?: boolean;
  description?: string;
}

const NOOP_ASSISTANT_ACTION_HOOK = (_action: any) => {};

/**
 * Wait for query execution to complete and return the result status
 * @param services - Explore services containing the Redux store
 * @param cacheKey - The cache key for the query
 * @param timeoutMs - Maximum time to wait in milliseconds
 * @returns The query result status or null if timeout
 */
async function waitForQueryExecution(
  services: ExploreServices,
  cacheKey: string,
  timeoutMs: number
): Promise<{
  success: boolean;
  error?: {
    details: string;
    reason: string;
    type?: string;
  };
} | null> {
  const startTime = Date.now();
  const pollInterval = PPL_QUERY_POLL_INTERVAL_MS;

  return new Promise((resolve) => {
    const checkStatus = () => {
      const state = services.store.getState();
      const queryStatus = state.queryEditor.queryStatusMap[cacheKey];

      if (!queryStatus) {
        // Query hasn't started yet, keep waiting
        if (Date.now() - startTime < timeoutMs) {
          setTimeout(checkStatus, pollInterval);
        } else {
          // Timeout - return null
          resolve(null);
        }
        return;
      }

      // Check if query execution is complete
      if (queryStatus.status === QueryExecutionStatus.LOADING) {
        // Still loading, keep waiting
        if (Date.now() - startTime < timeoutMs) {
          setTimeout(checkStatus, pollInterval);
        } else {
          // Timeout
          resolve(null);
        }
        return;
      }

      // Query execution completed
      if (queryStatus.status === QueryExecutionStatus.ERROR) {
        // Query failed validation
        resolve({
          success: false,
          error: {
            details: queryStatus.error?.message?.details || 'Query execution failed',
            reason: queryStatus.error?.message?.reason || 'Unknown error',
            type: queryStatus.error?.message?.type,
          },
        });
      } else if (
        queryStatus.status === QueryExecutionStatus.READY ||
        queryStatus.status === QueryExecutionStatus.NO_RESULTS
      ) {
        // Query succeeded
        resolve({
          success: true,
        });
      } else {
        // Other status (UNINITIALIZED, etc.) - treat as timeout
        resolve(null);
      }
    };

    checkStatus();
  });
}

export function usePPLExecuteQueryAction(
  setEditorTextWithQuery: ReturnType<typeof useSetEditorTextWithQuery>
) {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const dispatch = useDispatch();
  const useAssistantAction =
    services.contextProvider?.hooks?.useAssistantAction || NOOP_ASSISTANT_ACTION_HOOK;

  useAssistantAction<PPLExecuteQueryArgs>({
    name: 'execute_ppl_query',
    description: 'Update the query bar with a PPL query and optionally execute it',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The PPL query to set in the query bar',
        },
        autoExecute: {
          type: 'boolean',
          description: 'Whether to automatically execute the query (default: true)',
        },
        description: {
          type: 'string',
          description: 'Optional description of what the query does',
        },
      },
      required: ['query'],
    },
    handler: async (args: any) => {
      try {
        // Check if we should auto-execute
        const shouldExecute = args.autoExecute !== false; // Default to true

        if (shouldExecute) {
          // Get the current query state to determine the cache key
          const state = services.store.getState();
          const query = state.query;

          // Prepare the query object to get the cache key
          const queryObject = {
            ...query,
            query: args.query,
          };
          const cacheKey = prepareQueryForLanguage(queryObject).query;

          // Use loadQueryActionCreator which updates the editor and executes the query
          // This follows the same pattern as Recent Queries
          // @ts-expect-error TS2345 TODO(ts-error): fixme
          dispatch(loadQueryActionCreator(services, setEditorTextWithQuery, args.query));

          // Wait for query execution to complete
          const executionResult = await waitForQueryExecution(
            services,
            cacheKey,
            PPL_QUERY_EXECUTION_TIMEOUT_MS
          );

          if (executionResult === null) {
            // Timeout - query is still running or something went wrong
            return {
              success: false,
              executed: false,
              query: args.query,
              message: 'Query execution timed out',
              error: 'Query execution took too long to complete',
            };
          }

          if (!executionResult.success) {
            // Query failed validation
            return {
              success: false,
              executed: false,
              query: args.query,
              message: `Query execution failed: ${
                executionResult.error?.reason || 'Unknown error'
              }`,
              error: `${executionResult.error?.type}: ${executionResult.error?.details}`,
            };
          }

          // Query succeeded
          return {
            success: true,
            executed: true,
            query: args.query,
            message: 'Query updated and executed successfully',
          };
        } else {
          // Just update the editor without executing
          setEditorTextWithQuery(args.query);

          return {
            success: true,
            executed: false,
            query: args.query,
            message: 'Query updated',
          };
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          query: args.query,
        };
      }
    },
  });
}
