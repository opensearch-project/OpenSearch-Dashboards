/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiPanel, EuiText, EuiSpacer, EuiCode, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { useDispatch } from 'react-redux';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../types';
import { loadQueryActionCreator } from '../../../application/utils/state_management/actions/query_editor/load_query';
import { useSetEditorTextWithQuery } from '../../../application/hooks';
import { defaultPrepareQueryString } from '../../../application/utils/state_management/actions/query_actions';
import { QueryExecutionStatus } from '../../../application/utils/state_management/types';
import { AppStore } from '../../../application/utils/state_management/store';

interface PPLExecuteQueryArgs {
  query: string;
  autoExecute?: boolean;
  description?: string;
}

const NOOP_ASSISTANT_ACTION_HOOK = (_action: any) => {};

/**
 * Helper function to wait for query execution to complete
 * Polls the Redux store until the query reaches a terminal state
 */
const waitForQueryCompletion = async (
  store: AppStore,
  cacheKey: string,
  timeoutMs: number = 300000
): Promise<{ success: boolean; error?: any; elapsedMs?: number }> => {
  const startTime = Date.now();
  const pollInterval = 100; // Check every 100ms

  return new Promise((resolve) => {
    const checkStatus = () => {
      const state = store.getState();
      const queryStatus = state.queryEditor.queryStatusMap[cacheKey];

      if (!queryStatus) {
        // Query status not yet created, continue polling
        if (Date.now() - startTime < timeoutMs) {
          setTimeout(checkStatus, pollInterval);
        } else {
          resolve({
            success: false,
            error: 'Query execution timed out - no status received',
          });
        }
        return;
      }

      // Check if query reached a terminal state
      if (queryStatus.status === QueryExecutionStatus.READY) {
        resolve({
          success: true,
          elapsedMs: queryStatus.elapsedMs,
        });
      } else if (queryStatus.status === QueryExecutionStatus.NO_RESULTS) {
        resolve({
          success: true,
          elapsedMs: queryStatus.elapsedMs,
        });
      } else if (queryStatus.status === QueryExecutionStatus.ERROR) {
        resolve({
          success: false,
          error: queryStatus.error,
          elapsedMs: queryStatus.elapsedMs,
        });
      } else if (Date.now() - startTime >= timeoutMs) {
        // Timeout reached
        resolve({
          success: false,
          error: 'Query execution timed out',
        });
      } else {
        // Still loading, continue polling
        setTimeout(checkStatus, pollInterval);
      }
    };

    checkStatus();
  });
};

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
          // Prepare the cache key to monitor query execution
          const query = services.data.query.queryString.getQuery();
          const queryWithNewString = { ...query, query: args.query, language: 'PPL' };
          const cacheKey = defaultPrepareQueryString(queryWithNewString);

          // Use loadQueryActionCreator which updates the editor and executes the query
          // This follows the same pattern as Recent Queries
          dispatch(loadQueryActionCreator(services, setEditorTextWithQuery, args.query));

          // Wait for query execution to complete
          const result = await waitForQueryCompletion(services.store, cacheKey);

          if (result.success) {
            return {
              success: true,
              executed: true,
              query: args.query,
              message: `Query executed successfully${
                result.elapsedMs ? ` in ${result.elapsedMs}ms` : ''
              }`,
              elapsedMs: result.elapsedMs,
            };
          } else {
            // Query failed - return error details
            const errorDetails = result.error;
            let errorMessage = 'Query execution failed';

            if (errorDetails && typeof errorDetails === 'object') {
              if (errorDetails.message?.reason) {
                errorMessage = errorDetails.message.reason;
              } else if (errorDetails.message?.details) {
                errorMessage = errorDetails.message.details;
              } else if (typeof errorDetails === 'string') {
                errorMessage = errorDetails;
              }
            }

            return {
              success: false,
              executed: true,
              query: args.query,
              error: errorMessage,
              errorDetails,
              elapsedMs: result.elapsedMs,
            };
          }
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
    render: ({ status, args, result }: any) => {
      if (!args) return null;

      const getStatusColor = () => {
        if (status === 'failed' || (result && !result.success)) return 'danger';
        if (status === 'complete' && result?.executed) return 'success';
        if (status === 'complete') return 'primary';
        return 'subdued';
      };

      const getStatusIcon = () => {
        if (status === 'failed' || (result && !result.success)) return '✗';
        if (status === 'executing') return '⟳';
        return '✓';
      };

      const getStatusMessage = () => {
        if (status === 'executing') return 'Executing query...';
        if (status === 'complete' && result?.message) return result.message;
        if (status === 'failed' || (result && !result.success)) {
          return result?.error || 'Failed to execute query';
        }
        return 'Query updated';
      };

      return (
        <EuiPanel paddingSize="s" color={getStatusColor()}>
          <EuiFlexGroup alignItems="center" gutterSize="s">
            <EuiFlexItem grow={false}>
              <EuiText size="s">
                <strong>{getStatusIcon()}</strong>
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiText size="s">{getStatusMessage()}</EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
          {args.description && (
            <>
              <EuiSpacer size="xs" />
              <EuiText size="xs" color="subdued">
                {args.description}
              </EuiText>
            </>
          )}
          <EuiSpacer size="xs" />
          <EuiText size="xs">
            <EuiCode transparentBackground>{args.query}</EuiCode>
          </EuiText>
          {result?.errorDetails && (
            <>
              <EuiSpacer size="xs" />
              <EuiText size="xs" color="danger">
                {result.errorDetails.message?.details && (
                  <div>{result.errorDetails.message.details}</div>
                )}
                {result.errorDetails.message?.type && (
                  <div>Error type: {result.errorDetails.message.type}</div>
                )}
              </EuiText>
            </>
          )}
        </EuiPanel>
      );
    },
  });
}
