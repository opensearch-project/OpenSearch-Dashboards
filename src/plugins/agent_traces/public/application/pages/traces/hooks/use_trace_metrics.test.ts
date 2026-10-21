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
    expect(queries.filteredRoots).toContain(`where ${rootCase}`);
  });

  it('counts traces exactly, and agent runs and errored traces per trace', () => {
    expect(queries.roots).toBe(
      `${source} | where ${rootCase} | eval err = if(\`status.code\` = 2, 1, 0) | stats count() as runs, max(err) as err by traceId | stats count() as total_traces, sum(runs) as total_runs, sum(err) as error_traces`
    );
    expect(queries.filteredRoots).toBe(
      `${filtered} | where ${rootCase} | stats count() as runs by traceId | stats count() as filtered_traces, sum(runs) as filtered_runs`
    );
    expect(queries.roots).not.toContain('distinct_count(traceId)');
  });

  it('applies the user filter only to the filtered queries', () => {
    expect(queries.spans.startsWith(`${source} |`)).toBe(true);
    expect(queries.roots.startsWith(`${source} |`)).toBe(true);
    expect(queries.rootStats.startsWith(filtered)).toBe(true);
    expect(queries.filteredSpans.startsWith(filtered)).toBe(true);
  });

  it('dedupes the filtered counts with the filtered exclusion', () => {
    const scoped = buildMetricsQueries(source, filtered, '(totals)', '(scoped)');
    expect(scoped.roots).toContain('where (totals)');
    expect(scoped.rootStats).toContain('where (scoped)');
    expect(scoped.filteredRoots).toContain('where (scoped)');
  });
});
