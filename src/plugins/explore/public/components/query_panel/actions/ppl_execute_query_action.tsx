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
import { prepareQueryForLanguage } from '../../../application/utils/languages';

// Shared tool definition for execute_ppl_query action
export const EXECUTE_PPL_QUERY_TOOL_DEFINITION = {
  name: 'execute_ppl_query',

  description:
    'UI ONLY - DOES NOT RETURN DATA. Writes a PPL query into the Explore query bar and runs it so the user sees the results on their screen. The return value is nothing but an execution status (success/failure); it NEVER contains rows, fields, counts, aggregations, or any query output. ' +
    'CHOOSING BETWEEN THIS TOOL AND THE BACKEND PPL TOOL: if you need the actual data - to answer a question, compute a number, inspect fields, validate a query, summarize, or generate a report - call the backend PPL query tool (pplQueryTool) instead; it is the only tool that returns query results. Call this tool only to change what the user is looking at, i.e. when the user asked to see, run, plot, or explore something in the Explore UI, or when you want to leave them with the final query for further exploration. ' +
    'Never call this tool as a way to fetch data, and never claim or infer what the data contains from its status response. When you need both - the data and the on-screen view - call pplQueryTool first to get the data, then call this tool once with the same query and the same time range so the UI stays consistent with your answer. ' +
    'The query must NOT contain time filters - use the from/to parameters to specify the time range, and pass the same from/to you passed to pplQueryTool.',
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

          await dispatch(loadQueryActionCreator(services, setEditorTextWithQuery, args.query));
          // Read queryStatusMap from state after execution and derive the cache key using
          // prepareQueryForLanguage (same as visualization tab). For tabs, cache key IS the query string,
          // which keeps stats commands that PPL queries may generate.
          const state = services.store.getState();
          const cacheKey = prepareQueryForLanguage({ ...state.query, query: args.query }).query;
          const queryStatus = state.queryEditor.queryStatusMap[cacheKey];

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
