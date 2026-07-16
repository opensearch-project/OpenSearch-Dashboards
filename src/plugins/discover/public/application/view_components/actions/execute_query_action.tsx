/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, ReactNode } from 'react';
import { EuiButton, EuiFlexGroup, EuiFlexItem, EuiText } from '@elastic/eui';
import { useMount, useUnmount } from 'react-use';
import { of } from 'rxjs';
import { catchError, filter, first, timeout } from 'rxjs/operators';
import { RenderProps } from '../../../../../context_provider/public';
import { DiscoverServices } from '../../../build_services';
import {
  DataSubject,
  QueryCompletion,
  QueryCompleteSubject,
  RefetchSubject,
  ResultStatus,
} from '../utils/use_search';
import { extractQueryError } from '../utils/format_error';

// Language key to display name mapping
const LANGUAGE_DISPLAY_NAMES: Record<string, string> = {
  kuery: 'DQL',
  lucene: 'Lucene',
  PPL: 'PPL',
  SQL: 'OpenSearch SQL',
};

// Shared tool definition for the classic Discover execute_query action.
export const EXECUTE_QUERY_TOOL_DEFINITION = {
  name: 'execute_dsl_ppl_query',
  description: `Updates the query bar with a DQL/PPL/Lucene/SQL query and runs the search in the classic Discover UI. When generating the query, only reference fields you already know exist (e.g. from IndexMappingTool or the page context) - do not guess field names. A single call can set the query, the query language, and the time range (from/to) together.
  WHEN TO USE (critical): Call this tool for ANY request that maps to a query, filter, or search over the data shown in Discover - regardless of how the user phrases it. This includes not only imperative phrasings ("show", "list", "display", "find", "filter") but ALSO interrogative and analytical ones: yes/no and existence questions ("is there any error?", "are there failed logins?", "do we have 5xx responses?"), counts ("how many 400s?"), and lookups ("which hosts returned errors?"). If answering the user requires looking at the Discover data, you MUST run the corresponding query through this tool first so the UI reflects exactly what is being answered.
  LANGUAGE RULE (critical): write the query in the user\'s CURRENT language on the interface, given in page context as query.language (e.g. "kuery" = DQL, "lucene", "PPL", "SQL") - omit this parameter or pass that same key to keep the current language. Do NOT switch to PPL or any other language on your own. Keep the current language unless the user EXPLICITLY names a different one (e.g. "use PPL", "in SQL").
  IMPORTANT: This tool only updates the visual query interface and returns execution status (success/failure) - it does NOT return the actual query results or data. If you need to retrieve actual data for analysis or generating reports, use backend data retrieval tools instead, and make sure to pass the same time range (from/to) to those backend tools for consistent results. 
  The query should NOT contain time filters - use the from/to parameters to specify the time range.`,
  parameters: {
    type: 'object' as const,
    properties: {
      query: {
        type: 'string',
        description: 'The query to set in the query bar (without time filters)',
      },
      language: {
        type: 'string',
        description: `The query language to use. 
          Defaults to the user\'s current language on the interface (query.language from page context) - omit this parameter or pass that same key to keep the current language. Only set a different language when the user explicitly requests it. 
          One of these keys: "kuery", "lucene", "PPL", "SQL". These keys map to the display names DQL, Lucene, PPL and OpenSearch SQL respectively. Always pass the key here, but when referring to the language in your reply to the user, use the display name (from page context query.languageDisplayName), never the raw key.`,
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

/**
 * Inline confirmation shown in the chat window only while a language
 * switch is pending. Auto-approves as soon as we can tell the requested
 * language matches the current one (or was omitted) -- the framework
 * still runs the standard confirmation handshake for every call because
 * `requiresConfirmation` is a static per-action flag, but this component
 * resolves it immediately with no visible prompt for the common case.
 *
 * While a real switch is awaiting the user's choice, the default running
 * indicator (via `renderDefault`) is hidden -- the tool hasn't been
 * approved yet, so showing "Running..." above an unanswered question is
 * misleading. As soon as the user responds (or there's nothing to
 * confirm), `renderDefault()` takes over so Parameters/Result look
 * identical to any other tool.
 */
function ExecuteQueryToolCallContent({
  currentLanguage,
  requestedLanguage,
  argsAvailable,
  onApprove,
  onReject,
  renderDefault,
}: {
  currentLanguage: string;
  requestedLanguage: string;
  argsAvailable: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  renderDefault?: () => ReactNode;
}) {
  const [responded, setResponded] = useState(false);

  const isSameLanguage =
    argsAvailable &&
    (!requestedLanguage || requestedLanguage.toLowerCase() === currentLanguage.toLowerCase());

  // Auto-approve as soon as we can confirm the language is not changing.
  // Re-fires when `onApprove` gets a fresh identity (i.e. once the
  // framework's confirmation request actually exists), so this correctly
  // resolves even if the very first render happens before that.
  useEffect(() => {
    if (isSameLanguage && onApprove) {
      onApprove();
    }
  }, [isSameLanguage, onApprove]);

  const showPrompt = argsAvailable && !isSameLanguage && !responded;

  if (!showPrompt) {
    return renderDefault ? <>{renderDefault()}</> : null;
  }

  const handleApprove = () => {
    setResponded(true);
    onApprove?.();
  };

  const handleReject = () => {
    setResponded(true);
    onReject?.();
  };

  const currentDisplayName = LANGUAGE_DISPLAY_NAMES[currentLanguage] || currentLanguage;
  const requestedDisplayName = LANGUAGE_DISPLAY_NAMES[requestedLanguage] || requestedLanguage;

  return (
    <div>
      <EuiText size="s">
        <p>
          The assistant wants to switch the query language from{' '}
          <strong>{currentDisplayName}</strong> to <strong>{requestedDisplayName}</strong>. Do you
          want to proceed?
        </p>
      </EuiText>
      <EuiFlexGroup gutterSize="s" style={{ marginTop: '8px' }}>
        <EuiFlexItem grow={false}>
          <EuiButton size="s" fill onClick={handleApprove}>
            Switch to {requestedDisplayName}
          </EuiButton>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton size="s" color="text" onClick={handleReject}>
            Keep {currentDisplayName}
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
}

// Helper function to register the disabled version of the action
export function registerDisabledExecuteQueryAction(
  registerAction: (action: any) => void | undefined
) {
  if (!registerAction) return;

  registerAction({
    ...EXECUTE_QUERY_TOOL_DEFINITION,
    available: 'disabled',
    handler: async () => {
      return {
        success: false,
        error: 'STOP: Tool not available - context has changed',
        message:
          'IMPORTANT: The execute_dsl_ppl_query tool is no longer available because the user has navigated away from the Discover view. ' +
          'Do not attempt to use any more tools. Instead, please respond directly to the user explaining that you cannot complete this action ' +
          'because they are no longer in the Discover context. Suggest they navigate to the Discover view if they want to execute queries.',
        stop_tool_execution: true,
        context_lost: true,
      };
    },
  });
}

export function useExecuteQueryAction(
  services: DiscoverServices,
  data$: DataSubject,
  refetch$: RefetchSubject,
  queryComplete$: QueryCompleteSubject
) {
  const registerAction = services.contextProvider?.actions?.registerAssistantAction;

  useMount(() => {
    if (!registerAction) return;

    registerAction({
      ...EXECUTE_QUERY_TOOL_DEFINITION,
      requiresConfirmation: true,
      useCustomRenderer: true,
      render: (props: RenderProps) => {
        // Once the tool call has settled, defer entirely to the default
        // presentation (running spinner already passed; now the
        // Parameters/Result accordion) -- same as any other tool.
        if (props.status === 'complete' || props.status === 'failed') {
          return props.renderDefault ? props.renderDefault() : null;
        }

        const currentQuery = services.data.query.queryString.getQuery();
        const currentLanguage = currentQuery.language || 'kuery';
        const requestedLanguage = props.args?.language || '';

        return (
          <ExecuteQueryToolCallContent
            currentLanguage={currentLanguage}
            requestedLanguage={requestedLanguage}
            argsAvailable={!!props.args}
            onApprove={props.onApprove}
            onReject={props.onReject}
            renderDefault={props.renderDefault}
          />
        );
      },
      handler: async (args: any) => {
        try {
          const { queryString, timefilter } = services.data.query;

          // Set time of DatePicker
          const timeRangeMessage =
            args.from && args.to ? ` Time range set to ${args.from} - ${args.to}.` : '';
          if (args.from && args.to) {
            timefilter.timefilter.setTime({ from: args.from, to: args.to });
          }

          // Set the new query, preserving the current dataset.
          const currentQuery = queryString.getQuery();
          const language = args.language || currentQuery.language;
          queryString.setQuery({
            ...currentQuery,
            query: args.query,
            language,
          });

          const completionPromise = queryComplete$
            .pipe(
              filter((c) => c.query?.query === args.query && c.query?.language === language),
              first(),
              timeout(30000),
              catchError(() =>
                of<QueryCompletion>({ data: data$.getValue(), query: queryString.getQuery() })
              )
            )
            .toPromise();

          // Force a fetch even when the query/time is identical to the current
          refetch$.next();

          const completion = await completionPromise;
          const finalData = completion?.data ?? data$.getValue();
          const status = finalData.status;

          if (status === ResultStatus.ERROR) {
            const reason = extractQueryError(finalData.queryStatus?.body?.error);
            return {
              success: false,
              executed: false,
              query: args.query,
              language,
              message: `Query execution failed: ${reason}`,
              error: reason,
            };
          }

          if (status === ResultStatus.READY || status === ResultStatus.NO_RESULTS) {
            // Handle special case: DQL/Lucene parse errors as NO_RESULTS
            if (status === ResultStatus.NO_RESULTS && completion?.actualError) {
              return {
                success: false,
                executed: false,
                query: args.query,
                language,
                message: `Query execution failed: ${completion.actualError}`,
                error: completion.actualError,
              };
            }

            const noResults = status === ResultStatus.NO_RESULTS;
            const resultsCount = noResults
              ? 0
              : finalData.hits || finalData.rows?.length || undefined;
            return {
              success: true,
              executed: true,
              query: args.query,
              language,
              resultsCount,
              timeRange: args.from && args.to ? { from: args.from, to: args.to } : undefined,
              message: noResults
                ? `Query executed successfully but returned no results.${timeRangeMessage}`
                : `Query executed successfully and returned ${resultsCount} result(s).${timeRangeMessage}`,
            };
          }

          // Did not complete (timed out, still loading, no dataset, or uninitialized).
          return {
            success: false,
            executed: false,
            query: args.query,
            language,
            message: `Query execution was cancelled or did not complete. Status: ${status}`,
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
      registerDisabledExecuteQueryAction(registerAction);
    }
  });
}
