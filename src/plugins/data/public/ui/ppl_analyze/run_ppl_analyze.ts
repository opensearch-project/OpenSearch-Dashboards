/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import dateMath from '@elastic/datemath';
import { v4 as uuidv4 } from 'uuid';
import { i18n } from '@osd/i18n';
import { HttpStart } from '../../../../../core/public';
import { Query } from '../../index';
import { TimefilterContract } from '../../query';
import {
  setPPLAnalyzeResult,
  setPPLAnalyzeLoading,
  isPPLAnalyzeOpen,
} from '../../query/ppl_analyze_state';

const ANALYZE_PATH = '/api/enhancements/ppl/analyze';
const CANCEL_PATH = '/api/enhancements/ppl/cancel';

// Monotonically increasing counter used to discard out-of-order responses.
// Each call captures the current value; only the response matching the latest
// call is committed to analyzeResult$.
let latestRequestId = 0;

// Tracks the currently in-flight analyze request so it can be cancelled when a
// newer request supersedes it or the user closes the panel. Cleared once the
// request settles.
let inFlight: { queryId: string; dataSourceId?: string; http: HttpStart } | null = null;

/**
 * Cancels the in-flight analyze request (if any) by asking the backend to cancel
 * the OpenSearch task tagged with our queryId. Best-effort: failures are swallowed
 * since the request may have already completed server-side.
 */
export function cancelPPLAnalyze() {
  const pending = inFlight;
  if (!pending) return;
  inFlight = null;
  pending.http
    .fetch({
      method: 'POST',
      path: CANCEL_PATH,
      body: JSON.stringify({
        queryId: pending.queryId,
        dataSourceId: pending.dataSourceId,
      }),
    })
    .catch(() => {
      // Task may have already finished or never started — nothing to clean up.
    });
}

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
      const timeFilter = `WHERE \`${safeFieldName}\` >= '${fromStr}' AND \`${safeFieldName}\` <= '${toStr}'`;
      const commands = queryString.split('|');
      commands.splice(1, 0, ` ${timeFilter} `);
      queryString = commands.map((cmd) => cmd.trim()).join(' | ');
    }
  }

  // A newer request supersedes any in-flight one — cancel it server-side so we
  // don't leave an orphaned OpenSearch task running.
  cancelPPLAnalyze();

  const requestId = ++latestRequestId;
  const queryId = uuidv4();
  const dataSourceId = query.dataset?.dataSource?.id;
  inFlight = { queryId, dataSourceId, http };
  setPPLAnalyzeLoading(true);
  http
    .fetch({
      method: 'POST',
      path: ANALYZE_PATH,
      body: JSON.stringify({
        query: queryString,
        dataSourceId,
        queryId,
      }),
    })
    .then((result) => {
      // Discard stale responses from superseded requests
      if (requestId !== latestRequestId) return;
      inFlight = null;
      setPPLAnalyzeResult({
        query: query.query as string,
        response: result,
      });
    })
    .catch((err) => {
      if (requestId !== latestRequestId) return;
      inFlight = null;
      // A non-2xx response rejects with an HttpFetchError whose `body` holds the
      // parsed error payload ({ statusCode, error, message }). Commit that as the
      // result so the panel can surface the error; fall back to a synthetic body
      // when no structured payload is available (e.g. a network failure).
      const response = err?.body ?? {
        error:
          err?.response?.statusText ||
          i18n.translate('data.pplAnalyze.error.requestFailed', {
            defaultMessage: 'Request failed',
          }),
        message:
          err?.message ||
          i18n.translate('data.pplAnalyze.error.couldNotComplete', {
            defaultMessage: 'The analyze request could not be completed.',
          }),
        statusCode: err?.response?.status,
      };
      setPPLAnalyzeResult({
        query: query.query as string,
        response,
      });
    });
}
