/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import dateMath from '@elastic/datemath';
import { HttpStart } from '../../../../../core/public';
import { Query } from '../../index';
import { TimefilterContract } from '../../query';
import {
  setPPLAnalyzeResult,
  setPPLAnalyzeLoading,
  isPPLAnalyzeOpen,
} from '../../query/ppl_analyze_state';

// Monotonically increasing counter used to discard out-of-order responses.
// Each call captures the current value; only the response matching the latest
// call is committed to analyzeResult$.
let latestRequestId = 0;

export function runPPLAnalyzeInBackground({
  query,
  http,
  timefilter,
  onlyIfOpen = false,
}: {
  query: Query;
  http: HttpStart;
  timefilter: TimefilterContract;
  onlyIfOpen?: boolean;
}) {
  if (query.language?.toLowerCase() !== 'ppl' || !query.query) return;
  if (onlyIfOpen && !isPPLAnalyzeOpen()) return;

  let queryString = query.query as string;
  let injectedTimeFilter: string | undefined;
  const timeFieldName = query.dataset?.timeFieldName;

  // Only inject a time filter for search queries (source=... or search source=...).
  // Non-search commands like describe, show, or queries that already contain
  // a WHERE clause in the first position are left untouched to avoid producing
  // syntactically invalid PPL.
  const normalised = queryString.toLowerCase().replace(/\s/g, '');
  const isSearchQuery = normalised.startsWith('source=') || normalised.startsWith('searchsource=');

  if (timeFieldName && isSearchQuery) {
    const timeRange = timefilter.getTime();
    const fromMoment = dateMath.parse(timeRange.from);
    const toMoment = dateMath.parse(timeRange.to, { roundUp: true });
    if (fromMoment && toMoment) {
      const fromStr = fromMoment.utc().format('YYYY-MM-DD HH:mm:ss.SSS');
      const toStr = toMoment.utc().format('YYYY-MM-DD HH:mm:ss.SSS');
      // Escape backticks in the field name to prevent PPL injection via identifier quoting
      const safeFieldName = timeFieldName.replace(/`/g, '``');
      injectedTimeFilter = `WHERE \`${safeFieldName}\` >= '${fromStr}' AND \`${safeFieldName}\` <= '${toStr}'`;
      const commands = queryString.split('|');
      commands.splice(1, 0, ` ${injectedTimeFilter} `);
      queryString = commands.map((cmd) => cmd.trim()).join(' | ');
    }
  }

  const requestId = ++latestRequestId;
  setPPLAnalyzeLoading(true);
  http
    .fetch({
      method: 'POST',
      path: '/api/enhancements/ppl/analyze',
      body: JSON.stringify({
        query: queryString,
        dataSourceId: query.dataset?.dataSource?.id,
      }),
    })
    .then((result) => {
      // Discard stale responses from superseded requests
      if (requestId !== latestRequestId) return;
      setPPLAnalyzeResult({
        query: query.query as string,
        response: result,
        injectedTimeFilter,
      });
    })
    .catch(() => {
      if (requestId !== latestRequestId) return;
      setPPLAnalyzeLoading(false);
    });
}
