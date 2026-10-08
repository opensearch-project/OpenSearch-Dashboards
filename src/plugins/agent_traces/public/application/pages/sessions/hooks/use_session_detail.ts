/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { usePPLQueryDeps } from '../../traces/hooks/use_ppl_query_deps';
import { transformPPLDataToTraceHits } from '../../traces/trace_details/traces/ppl_to_trace_hits';
import { TraceRow, buildFullSpanTree, hitsToAgentSpans } from '../../traces/hooks/tree_utils';
import { buildSessionSpansQuery, getSourceCommand, rawStart } from '../session_utils';

export interface SessionTrace {
  traceId: string;
  /** Root row of the trace (carries input/output, latency, tokens). */
  root: TraceRow;
  /** Full span tree for the trace, as the trace flyout expects. */
  tree: TraceRow[];
  /** All spans of the trace flattened, earliest first. */
  spans: TraceRow[];
}

export interface UseSessionDetailResult {
  traces: SessionTrace[];
  loading: boolean;
  error: string | null;
}

const flatten = (rows: TraceRow[], out: TraceRow[] = []): TraceRow[] => {
  for (const row of rows) {
    out.push(row);
    if (row.children?.length) flatten(row.children as TraceRow[], out);
  }
  return out;
};

/** Load every span of a session's traces and build one tree per trace, earliest trace first. */
export const useSessionDetail = (
  traceIds: string[] | null,
  formatTs: (ts: string) => string
): UseSessionDetailResult => {
  const { pplService, datasetParam, baseQueryString } = usePPLQueryDeps();
  const [traces, setTraces] = useState<SessionTrace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const key = traceIds ? traceIds.join(',') : '';

  useEffect(() => {
    if (!traceIds || traceIds.length === 0 || !pplService || !datasetParam || !baseQueryString) {
      setTraces([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        // No time filter: a session's early turns can fall outside the picked range.
        const datasetWithoutTime = {
          id: datasetParam.id,
          title: datasetParam.title,
          type: datasetParam.type,
          ...(datasetParam.dataSource && { dataSource: datasetParam.dataSource }),
        };
        const source = getSourceCommand(baseQueryString);
        const response = await pplService.executeQuery(
          datasetWithoutTime as typeof datasetParam,
          buildSessionSpansQuery(source, traceIds)
        );
        const spans = hitsToAgentSpans(transformPPLDataToTraceHits(response));

        const byTrace = new Map<string, typeof spans>();
        for (const span of spans) {
          const list = byTrace.get(span.traceId) ?? [];
          list.push(span);
          byTrace.set(span.traceId, list);
        }

        const result: SessionTrace[] = [];
        for (const [traceId, traceSpans] of byTrace) {
          const tree = buildFullSpanTree(traceSpans, formatTs) as TraceRow[];
          const root = tree.find((r) => !r.parentSpanId) ?? tree[0];
          if (!root) continue;
          result.push({ traceId, root, tree, spans: flatten(tree) });
        }
        result.sort((a, b) => rawStart(a.root).localeCompare(rawStart(b.root)));

        if (!cancelled) setTraces(result);
      } catch (err) {
        if (!cancelled) setError((err as Error).message || 'Failed to load session');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, pplService, datasetParam, baseQueryString, formatTs]);

  return { traces, loading, error };
};
