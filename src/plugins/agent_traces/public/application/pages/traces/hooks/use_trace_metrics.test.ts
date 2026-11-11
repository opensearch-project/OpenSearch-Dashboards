/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { buildMetricsQueries } from './use_trace_metrics';

describe('buildMetricsQueries', () => {
  const source = 'source = otel-v1-apm-span*';
  const filtered = `${source} | where serviceName = "x"`;
  const rootCase = '(isAiRoot) AND NOT spanId in ("a")';
  const queries = buildMetricsQueries(source, filtered, rootCase);

  it('keeps the AI-root condition out of case(), where it would become a script', () => {
    Object.values(queries).forEach((query) => {
      expect(query).not.toMatch(/case\([^)]*isAiRoot/);
    });
    expect(queries.roots).toContain(`where ${rootCase}`);
    expect(queries.rootStats).toContain(`where ${rootCase}`);
  });

  it('counts traces with one aggregation, not per trace', () => {
    expect(queries.roots).toBe(
      `${source} | where ${rootCase} | stats distinct_count(traceId) as total_traces, count() as total_runs`
    );
    expect(queries.errorRoots).toBe(
      `${source} | where (${rootCase}) AND \`status.code\` = 2 | stats distinct_count(traceId) as error_traces`
    );
    expect(queries.rootStats).toContain(
      'distinct_count(traceId) as filtered_traces, count() as filtered_runs'
    );
    Object.values(queries).forEach((query) => expect(query).not.toContain('by traceId'));
  });

  it('applies the user filter only to the filtered queries', () => {
    expect(queries.spans.startsWith(`${source} |`)).toBe(true);
    expect(queries.roots.startsWith(`${source} |`)).toBe(true);
    expect(queries.errorRoots.startsWith(`${source} |`)).toBe(true);
    expect(queries.rootStats.startsWith(filtered)).toBe(true);
    expect(queries.filteredSpans.startsWith(filtered)).toBe(true);
  });

  it('dedupes the filtered counts with the filtered exclusion', () => {
    const scoped = buildMetricsQueries(source, filtered, '(totals)', '(scoped)');
    expect(scoped.roots).toContain('where (totals)');
    expect(scoped.errorRoots).toContain('where ((totals))');
    expect(scoped.rootStats).toContain('where (scoped)');
  });
});
