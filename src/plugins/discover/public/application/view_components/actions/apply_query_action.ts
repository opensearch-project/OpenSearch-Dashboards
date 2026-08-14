/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef } from 'react';
import { useMount, useUnmount } from 'react-use';
import { merge, Subscription } from 'rxjs';
import { filter, first, map } from 'rxjs/operators';
import { DiscoverServices } from '../../../build_services';
import {
  DataSubject,
  QueryAbortSubject,
  QueryCompleteSubject,
  RefetchSubject,
  ResultStatus,
} from '../utils/use_search';
import { extractQueryError } from '../utils/format_error';

export interface LanguageToolConfig {
  /** Language key stored on the query bar (matches query.language in page context). */
  languageKey: string;
  /** Human-facing display name used in descriptions and messages. */
  displayName: string;
  /** Unique assistant tool name for this language. */
  toolName: string;
}

export const LANGUAGE_TOOLS: LanguageToolConfig[] = [
  { languageKey: 'kuery', displayName: 'DQL', toolName: 'apply_dql_query' },
  { languageKey: 'lucene', displayName: 'Lucene', toolName: 'apply_lucene_query' },
  { languageKey: 'PPL', displayName: 'PPL', toolName: 'apply_ppl_query' },
  { languageKey: 'SQL', displayName: 'OpenSearch SQL', toolName: 'apply_sql_query' },
];

export const buildToolDefinition = (cfg: LanguageToolConfig) => {
  // SQL does not use the Discover time picker (from/to); time filtering is expressed in the query itself.
  const isSql = cfg.languageKey.toUpperCase() === 'SQL';

  const properties: Record<string, { type: string; description: string }> = {
    query: {
      type: 'string',
      description: `The ${cfg.displayName} query to set in the query bar${
        isSql ? '' : ' (without time filters)'
      }`,
    },
    description: {
      type: 'string',
      description: 'Optional description of what the query does',
    },
  };

  if (!isSql) {
    properties.from = {
      type: 'string',
      description:
        'Start time for the time range (e.g., "now-1h", "now-7d", "2024-01-01"). If provided, the time range will be updated.',
    };
    properties.to = {
      type: 'string',
      description:
        'End time for the time range (e.g., "now", "2024-01-31"). If provided along with from, the time range will be updated.',
    };
  }

  return {
    name: cfg.toolName,
    description: `Updates the Discover query bar with a ${cfg.displayName} query and runs the search in the classic Discover UI.
    LANGUAGE FOR ${cfg.displayName.toUpperCase()} ONLY: This tool ALWAYS writes ${cfg.displayName}. You cannot change the query language yourself - it is controlled by the user on the page. if a request needs another language, only that language's apply-query tool can handle it.
    WHEN TO USE: 
      (1)Call this when the user wants to execute a ${cfg.displayName} query, filter, or search over the data shown in Discover, and when running the query and letting the user see the matching rows can answer user request - regardless of how the user phrases it (imperative like "show/list/filter/display/find", or interrogative/analytical like "is there any error?", "which orders are over $500?", "what errors happened on web-01?").
      (2)If (1) is NOT met - i.e. you need the actual field values to analyze or generate a report - use backend data-retrieval tools with the same time range ${isSql ? '' : 'from/to'}: this ${cfg.toolName} tool only returns execution status (success/failure) and a result count, NOT the underlying data.
      ${
        ['kuery', 'lucene'].includes(cfg.languageKey.toLowerCase())
          ? `
      (3)${cfg.displayName} cannot aggregate or sort (e.g. top N, count, group by, sum, avg, percentile, sort/order by). If the request needs any of these, do NOT call this tool at all; instead compute the answer with a backend data-retrieval tool and report it to the user directly. Example: for "show repeat accounts", counting occurrences per account requires aggregation, so use a backend data-retrieval tool to compute the repeat accounts and tell the user the answer directly in this conversation - it is ABSOLUTELY FORBIDDEN to call this tool with the specific id (e.g. "account:212") in the UI.`
          : ''
      }
    PROHIBITED: 
      (1)It is STRICTLY FORBIDDEN to call this tool with a query that contains any literal value (ID, name, number, code, or any other specific value) extracted from a fixed value or list you fetched earlier in this conversation (e.g. "customer_id: ..."). In that case, simply report the backend result to the user directly in your reply, do NOT call this tool to mirror it in the UI. BEFORE calling this, you MUST explicitly verify: "Does the query contain any value (ID, number, name, code) retrieved from a previous tool call in this conversation?" - If YES → DO NOT call this tool.
      (2)It is STRICTLY FORBIDDEN to guess fields when generating a query, only reference fields you already know exist (from IndexMappingTool).
      ${
        isSql
          ? ''
          : `
      (3)The query should NOT contain time filters - use the from/to parameters to specify the time range.`
      }`,
    parameters: {
      type: 'object' as const,
      properties,
      required: ['query'],
    },
  };
};

/** All four tool definitions (shape only, without handlers). */
export const APPLY_QUERY_TOOL_DEFINITIONS = LANGUAGE_TOOLS.map(buildToolDefinition);

// Handler used when a language tool is not the current page language (registered as disabled, so
// it is filtered out of the assistant tool list and should never actually run).
const createUnavailableHandler = (cfg: LanguageToolConfig) => async () => ({
  success: false,
  error: 'Tool not available - not the current query language',
  message:
    `The ${cfg.displayName} query tool is not available because the Discover query bar is not currently using ${cfg.displayName}. ` +
    'Use the apply-query tool for the language the page is currently in. The query language is controlled by the user.',
  stop_tool_execution: true,
});

// Builds the real handler for the tool that matches the current page language.
const createApplyHandler =
  (
    cfg: LanguageToolConfig,
    services: DiscoverServices,
    data$: DataSubject,
    refetch$: RefetchSubject,
    queryComplete$: QueryCompleteSubject,
    queryAbort$: QueryAbortSubject
  ) =>
  async (args: any) => {
    try {
      const { queryString, timefilter } = services.data.query;

      const timeRangeMessage =
        args.from && args.to ? ` Time range set to ${args.from} - ${args.to}.` : '';
      if (args.from && args.to) {
        timefilter.timefilter.setTime({ from: args.from, to: args.to });
      }

      // Force this tool's language, preserving the current dataset.
      const currentQuery = queryString.getQuery();
      const language = currentQuery.language || cfg.languageKey;
      queryString.setQuery({
        ...currentQuery,
        query: args.query,
        language,
      });

      // Race the possible outcomes so the tool never hangs, however long the query takes:
      //  1. matched$: the real completion for THIS query/language arrives (success/failure).
      //  2. queryChanged$: the page query/language moves away from what we set.
      //  3. aborted$: the query is explicitly cancelled (e.g. the user starts query-assist).
      const matched$ = queryComplete$.pipe(
        filter((c) => c.query?.query === args.query && c.query?.language === language),
        first(),
        map((completion) => ({ type: 'completion' as const, completion }))
      );
      const queryChanged$ = queryString.getUpdates$().pipe(
        filter((q) => q.query !== args.query || (q.language || cfg.languageKey) !== language),
        first(),
        map(() => ({ type: 'aborted' as const }))
      );
      const aborted$ = queryAbort$.pipe(
        first(),
        map(() => ({ type: 'aborted' as const }))
      );
      const outcomePromise = merge(matched$, queryChanged$, aborted$).pipe(first()).toPromise();

      // Force a fetch even when the query/time is identical to the current
      refetch$.next();

      const outcome = await outcomePromise;

      if (outcome?.type === 'aborted') {
        return {
          success: false,
          executed: false,
          query: args.query,
          language,
          message: `Query execution was cancelled or did not complete.`,
          error: 'Query execution was interrupted',
          stop_tool_execution: true,
        };
      }

      const completion = outcome?.completion;
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
        const resultsCount = noResults ? 0 : finalData.hits || finalData.rows?.length || undefined;
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
  };

// Registers every language tool as disabled (used as a plugin-level placeholder and when the
// Discover view unmounts / the user navigates away).
export function registerAllDisabledApplyQueryActions(
  registerAction: (action: any) => void | undefined
) {
  if (!registerAction) return;

  LANGUAGE_TOOLS.forEach((cfg) => {
    registerAction({
      ...buildToolDefinition(cfg),
      available: 'disabled',
      handler: async () => ({
        success: false,
        error: 'STOP: Tool not available - context has changed',
        message:
          `The ${cfg.displayName} query tool is not available because the user is not in the Discover view. ` +
          'Do not attempt to use any more tools. Explain that you cannot execute queries because they are no longer in the Discover context, ' +
          'and suggest they navigate to the Discover view.',
        stop_tool_execution: true,
        context_lost: true,
      }),
    });
  });
}

export function useApplyQueryAction(
  services: DiscoverServices,
  data$: DataSubject,
  refetch$: RefetchSubject,
  queryComplete$: QueryCompleteSubject,
  queryAbort$: QueryAbortSubject
) {
  const registerAction = services.contextProvider?.actions?.registerAssistantAction;
  const currentLanguageRef = useRef<string>();
  const subscriptionRef = useRef<Subscription>();

  useMount(() => {
    if (!registerAction) return;

    const queryString = services.data.query.queryString;

    const findConfig = (language: string) =>
      LANGUAGE_TOOLS.find((cfg) => cfg.languageKey.toLowerCase() === language.toLowerCase());

    const enableTool = (cfg: LanguageToolConfig) =>
      registerAction({
        ...buildToolDefinition(cfg),
        available: 'enabled',
        handler: createApplyHandler(cfg, services, data$, refetch$, queryComplete$, queryAbort$),
      });

    const disableTool = (cfg: LanguageToolConfig) =>
      registerAction({
        ...buildToolDefinition(cfg),
        available: 'disabled',
        handler: createUnavailableHandler(cfg),
      });

    // Enable only the tool matching the current language. The other three stay disabled from the
    // plugin-level placeholder registration, so they are excluded from the assistant tool list.
    const initialLanguage = queryString.getQuery().language || 'kuery';
    const initialCfg = findConfig(initialLanguage);
    if (initialCfg) enableTool(initialCfg);
    currentLanguageRef.current = initialLanguage;

    // On a language switch, only the two affected tools change: disable the previous language's
    // tool and enable the new one. Other query updates (text, dataset) are ignored.
    subscriptionRef.current = queryString.getUpdates$().subscribe((query) => {
      const nextLanguage = query.language || 'kuery';
      if (nextLanguage === currentLanguageRef.current) return;

      const prevCfg = findConfig(currentLanguageRef.current || '');
      const nextCfg = findConfig(nextLanguage);
      if (prevCfg) disableTool(prevCfg);
      if (nextCfg) enableTool(nextCfg);
      currentLanguageRef.current = nextLanguage;
    });
  });

  // Cleanup: stop listening and restore all tools to the disabled placeholder state when the
  // Discover view unmounts.
  useUnmount(() => {
    subscriptionRef.current?.unsubscribe();
    if (registerAction) {
      registerAllDisabledApplyQueryActions(registerAction);
    }
  });
}
