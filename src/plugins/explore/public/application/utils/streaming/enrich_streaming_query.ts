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

/** Local two-digit date formatting, matching `formatDate` in query_enhancements/common. */
const formatDate = (dateString: string): string => {
  const d = new Date(dateString);
  const pad = (n: number) => `0${n}`.slice(-2);
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
};

/**
 * Legacy Elasticsearch (Open Distro) PPL rejects a bare string compared against a timestamp, so
 * those engines need an explicit `TIMESTAMP(...)` wrapper. OpenSearch PPL folds a bare string into a
 * native range query, whereas the wrapper forces a per-value script filter that trips the cluster's
 * script-compilation rate limit, so it is only applied where required.
 */
export const buildTimeFilterWhereClause = (
  timeFieldName: string,
  timeRange: TimeRange,
  engineType?: string
): string => {
  const { fromDate, toDate } = formatTimePickerDate(timeRange, DATE_FORMAT);
  const wrap = getDataSourceEngineCapabilities(engineType).usesOpenDistroSqlPpl
    ? (literal: string) => `TIMESTAMP('${literal}')`
    : (literal: string) => `'${literal}'`;
  return `WHERE \`${timeFieldName}\` >= ${wrap(formatDate(fromDate))} AND \`${timeFieldName}\` <= ${wrap(
    formatDate(toDate)
  )}`;
};

/** Inserts a where command directly after the source clause. */
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
