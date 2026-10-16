/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  formatTimePickerDate,
  getDataSourceEngineCapabilities,
  TimeRange,
} from '../../../../../data/common';

/**
 * Applies the query enrichment that `PPLSearchInterceptor` performs, for the streaming path which
 * bypasses that interceptor.
 *
 * Must stay byte-identical to `PPLSearchInterceptor.buildQuery` and `appendDefaultSort`; a
 * divergence means the same query returns different results depending on whether streaming is
 * enabled. Dashboard filters are intentionally absent: the interceptor applies those only for the
 * `dashboards` app.
 */

const DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss.SSS';

const SORT_BLOCKING_COMMANDS = ['sort', 'stats', 'head', 'rare', 'top', 'rename'];
const SORT_BLOCKING_COMMAND_REGEX = new RegExp(
  `\\|\\s*(${SORT_BLOCKING_COMMANDS.join('|')})\\b`,
  'i'
);

/**
 * Open Distro PPL rejects a bare string compared against a timestamp and needs `TIMESTAMP(...)`.
 * Applied only there: on OpenSearch the wrapper forces a per-value script filter that trips the
 * cluster's script-compilation rate limit, where a bare string folds into a native range query.
 */
export const buildTimeFilterWhereClause = (
  timeFieldName: string,
  timeRange: TimeRange,
  engineType?: string
): string => {
  // Used as they come: formatTimePickerDate already emits DATE_FORMAT in UTC. Re-parsing through a
  // local-time formatter shifts the bound (notably across a DST gap) and drops the milliseconds.
  const { fromDate, toDate } = formatTimePickerDate(timeRange, DATE_FORMAT);
  const wrap = getDataSourceEngineCapabilities(engineType).usesOpenDistroSqlPpl
    ? (literal: string) => `TIMESTAMP('${literal}')`
    : (literal: string) => `'${literal}'`;
  return `WHERE \`${timeFieldName}\` >= ${wrap(fromDate)} AND \`${timeFieldName}\` <= ${wrap(
    toDate
  )}`;
};

/**
 * Inserts a where command directly after the source clause.
 *
 * Kept byte-identical to `PPLFilterUtils.insertWhereCommand`, which the standard (interceptor) path
 * uses: the streaming and non-streaming paths must enrich a query the same way or one query returns
 * different results depending on whether streaming is on. That shared implementation splits on a
 * bare `|`, which mis-handles a `|` inside a string literal or bracketed subquery; the bug is
 * tracked against the util so both paths can be fixed together rather than diverging here.
 */
export const insertWhereCommand = (query: string, whereCommand: string): string => {
  if (!whereCommand) return query;
  const commands = query.split('|');
  commands.splice(1, 0, whereCommand);
  return commands.map((cmd) => cmd.trim()).join(' | ');
};

/**
 * A default sort is only appended when the query neither projects specific fields nor contains a
 * command whose output order the sort would override.
 */
export const canAppendDefaultSort = (queryString: string): boolean => {
  const masked = queryString
    .replace(/\[.*?\]/g, (match) => '\0'.repeat(match.length))
    .replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, (match) => '\0'.repeat(match.length));
  const hasFieldsProjection = /\|\s*fields\b/i.test(masked) && !/\|\s*fields\s+\*/i.test(masked);
  return !hasFieldsProjection && !SORT_BLOCKING_COMMAND_REGEX.test(masked);
};

export interface EnrichStreamingQueryArgs {
  queryString: string;
  timeFieldName?: string;
  timeRange?: TimeRange;
  engineType?: string;
  /**
   * Aggregation queries must not receive a default sort: it would make the plan blocking and is
   * meaningless over buckets.
   */
  skipDefaultSort?: boolean;
}

export const enrichStreamingQuery = ({
  queryString,
  timeFieldName,
  timeRange,
  engineType,
  skipDefaultSort = false,
}: EnrichStreamingQueryArgs): string => {
  let enriched = queryString;

  if (timeFieldName && timeRange) {
    enriched = insertWhereCommand(
      enriched,
      buildTimeFilterWhereClause(timeFieldName, timeRange, engineType)
    );
  }

  if (!skipDefaultSort && timeFieldName && canAppendDefaultSort(enriched)) {
    enriched = `${enriched} | sort - \`${timeFieldName}\``;
  }

  return enriched;
};
