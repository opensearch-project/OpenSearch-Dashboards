/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useDispatch } from 'react-redux';
import { useMount, useUnmount } from 'react-use';
import { AppDispatch } from '../../../application/utils/state_management/store';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../types';
import { loadQueryActionCreator } from '../../../application/utils/state_management/actions/query_editor/load_query';
import { useSetEditorTextWithQuery } from '../../../application/hooks';
import { setDateRange } from '../../../application/utils/state_management/slices/query_editor/query_editor_slice';
import { QueryExecutionStatus } from '../../../application/utils/state_management/types';

// Shared tool definition for execute_ppl_query action
export const EXECUTE_PPL_QUERY_TOOL_DEFINITION = {
  name: 'execute_ppl_query',
  description:
    'Updates the query bar with a PPL query and executes it in the UI. IMPORTANT: This tool only updates the visual query interface and returns execution status (success/failure) - it does NOT return the actual query results or data. Use this tool when you want to help the user visualize data in the Explore interface. If you need to retrieve actual data for analysis or generating reports, use backend data retrieval tools instead, and make sure to pass the same time range (from/to) to those backend tools for consistent results. The query should NOT contain time filters - use the from/to parameters to specify the time range.',
  parameters: {
    type: 'object' as const,
    properties: {
      query: {
        type: 'string',
        description: 'The PPL query to set in the query bar (without time filters)',
      },
      autoExecute: {
        type: 'boolean',
        description: 'Whether to automatically execute the query (default: true)',
      },
      description: {
        type: 'string',
        description: 'Optional description of what the query does',
      },
      from: {
        type: 'string',
        description:
          'Start time for the time range (e.g., "now-1h", "now-7d", "2024-01-01"). If provided, the time range will be updated.',
      },
      to: {
        type: 'string',
        description:
          'End time for the time range (e.g., "now", "2024-01-31"). If provided along with from, the time range will be updated.',
      },
    },
    required: ['query'],
  },
};

// Helper function to register the disabled version of the action
export function registerDisabledPPLExecuteQueryAction(
  registerAction: (action: any) => void | undefined
) {
  if (!registerAction) return;

  registerAction({
    ...EXECUTE_PPL_QUERY_TOOL_DEFINITION,
    available: 'disabled',
    handler: async () => {
      return {
        success: false,
        error: 'STOP: Tool not available - context has changed',
        message:
          'IMPORTANT: The execute_ppl_query tool is no longer available because the user has navigated away from the query panel. ' +
          'Do not attempt to use any more tools. Instead, please respond directly to the user explaining that you cannot complete this action ' +
          'because they are no longer in the query panel context. Suggest they navigate to the Logs, Traces, or Metrics explorer view if they want to execute queries.',
        stop_tool_execution: true,
        context_lost: true,
      };
    },
  });
}

export function usePPLExecuteQueryAction(
  setEditorTextWithQuery: ReturnType<typeof useSetEditorTextWithQuery>
) {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const dispatch = useDispatch<AppDispatch>();
  const registerAction = services.contextProvider?.actions?.registerAssistantAction;

  useMount(() => {
    if (!registerAction) return;

    registerAction({
      ...EXECUTE_PPL_QUERY_TOOL_DEFINITION,
      handler: async (args: any) => {
        try {
          const shouldExecute = args.autoExecute !== false;
          const timeRangeMessage =
            args.from && args.to ? ` Time range set to ${args.from} - ${args.to}.` : '';

          if (args.from && args.to) {
            dispatch(setDateRange({ from: args.from, to: args.to }));
            services.data.query.timefilter.timefilter.setTime({
              from: args.from,
              to: args.to,
            });
          }

          if (!shouldExecute) {
            setEditorTextWithQuery(args.query);
            return {
              success: true,
              executed: false,
              query: args.query,
              timeRange: args.from && args.to ? { from: args.from, to: args.to } : undefined,
              message: `Query updated.${timeRangeMessage}`,
            };
          }

          const queryStatus = await dispatch(
            loadQueryActionCreator(services, setEditorTextWithQuery, args.query)
          );

          // Check for explicit error status
          if (queryStatus.status === QueryExecutionStatus.ERROR) {
            const msg = queryStatus.error?.message;
            const errorMessage = msg
              ? `${msg.type ? `${msg.type}: ` : ''}${msg.details}`
              : 'Query execution failed';
            return {
              success: false,
              executed: false,
              query: args.query,
              message: `Query execution failed: ${errorMessage}`,
              error: errorMessage,
            };
          }

          // Check if query completed successfully (READY or NO_RESULTS)
          if (
            queryStatus.status === QueryExecutionStatus.READY ||
            queryStatus.status === QueryExecutionStatus.NO_RESULTS
          ) {
            const noResults = queryStatus.status === QueryExecutionStatus.NO_RESULTS;
            return {
              success: true,
              executed: true,
              query: args.query,
              resultsCount: noResults ? 0 : undefined,
              timeRange: args.from && args.to ? { from: args.from, to: args.to } : undefined,
              message: noResults
                ? `Query executed successfully but returned no results.${timeRangeMessage}`
                : `Query updated and executed successfully.${timeRangeMessage}`,
            };
          }

          // Query didn't complete (LOADING, UNINITIALIZED, or unknown status)
          // This happens when user navigates away or query is cancelled
          return {
            success: false,
            executed: false,
            query: args.query,
            message: `Query execution was cancelled or did not complete. Status: ${queryStatus.status}`,
            error: 'Query execution was interrupted',
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            query: args.query,
          };
        }
      },
    });
  });

  // Cleanup: restore the disabled version when component unmounts
  useUnmount(() => {
    if (registerAction) {
      registerDisabledPPLExecuteQueryAction(registerAction);
    }
  });
}
