/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  buildTimeFilterWhereClause,
  canAppendDefaultSort,
  enrichStreamingQuery,
  insertWhereCommand,
} from './enrich_streaming_query';

const RANGE = { from: '2026-09-15T00:00:00.000Z', to: '2026-09-16T00:00:00.000Z' };

describe('buildTimeFilterWhereClause', () => {
  it('emits a bare-string comparison for OpenSearch engines', () => {
    const clause = buildTimeFilterWhereClause('@timestamp', RANGE);
    expect(clause).toMatch(/^WHERE `@timestamp` >= '.+' AND `@timestamp` <= '.+'$/);
    expect(clause).not.toContain('TIMESTAMP(');
  });

  it('wraps literals in TIMESTAMP() for Open Distro engines, which reject bare strings', () => {
    const clause = buildTimeFilterWhereClause('@timestamp', RANGE, 'Elasticsearch');
    expect(clause).toContain("TIMESTAMP('");
  });

  it('quotes the field name so reserved characters are safe', () => {
    expect(buildTimeFilterWhereClause('@timestamp', RANGE)).toContain('`@timestamp`');
  });

  it('honours a non-default time field', () => {
    expect(buildTimeFilterWhereClause('event_time', RANGE)).toContain('`event_time`');
  });
});

describe('insertWhereCommand', () => {
  it('inserts directly after the source clause, not at the end', () => {
    expect(insertWhereCommand('source=logs | fields a', 'WHERE x = 1')).toBe(
      'source=logs | WHERE x = 1 | fields a'
    );
  });

  it('handles a query with only a source clause', () => {
    expect(insertWhereCommand('source=logs', 'WHERE x = 1')).toBe('source=logs | WHERE x = 1');
  });

  it('returns the query untouched for an empty clause', () => {
    expect(insertWhereCommand('source=logs | fields a', '')).toBe('source=logs | fields a');
  });

  it('normalises whitespace around pipes', () => {
    expect(insertWhereCommand('source=logs   |   fields a', 'WHERE x = 1')).toBe(
      'source=logs | WHERE x = 1 | fields a'
    );
  });
});

describe('canAppendDefaultSort', () => {
  it('allows a sort on a bare source query', () => {
    expect(canAppendDefaultSort('source=logs')).toBe(true);
  });

  it.each([
    'fields a, b',
    'sort - a',
    'stats count()',
    'head 10',
    'rare a',
    'top a',
    'rename a as b',
  ])('declines when the query contains | %s', (cmd) => {
    expect(canAppendDefaultSort(`source=logs | ${cmd}`)).toBe(false);
  });

  it('still allows a sort for `fields *`, which projects nothing away', () => {
    expect(canAppendDefaultSort('source=logs | fields *')).toBe(true);
  });

  it('is not fooled by a command name inside a quoted string', () => {
    expect(canAppendDefaultSort(`source=logs | where msg = '| stats count()'`)).toBe(true);
  });

  it('is not fooled by a command name inside a bracketed subquery', () => {
    expect(canAppendDefaultSort('source=logs | where a in [ source=o | stats count() ]')).toBe(
      true
    );
  });
});

describe('enrichStreamingQuery', () => {
  it('adds the time filter and the default sort for a bare query', () => {
    const out = enrichStreamingQuery({
      queryString: 'source=logs',
      timeFieldName: '@timestamp',
      timeRange: RANGE,
    });
    expect(out).toMatch(/^source=logs \| WHERE `@timestamp` >= .* \| sort - `@timestamp`$/);
  });

  it('adds the time filter but no sort when the query projects fields', () => {
    const out = enrichStreamingQuery({
      queryString: 'source=logs | fields @timestamp, a',
      timeFieldName: '@timestamp',
      timeRange: RANGE,
    });
    expect(out).toContain('WHERE `@timestamp`');
    expect(out).not.toContain('| sort -');
  });

  it('omits the sort for aggregation queries even when otherwise eligible', () => {
    const out = enrichStreamingQuery({
      queryString: 'source=logs',
      timeFieldName: '@timestamp',
      timeRange: RANGE,
      skipDefaultSort: true,
    });
    expect(out).toContain('WHERE `@timestamp`');
    expect(out).not.toContain('| sort -');
  });

  it('leaves the query untouched when the dataset has no time field', () => {
    expect(enrichStreamingQuery({ queryString: 'source=logs', timeRange: RANGE })).toBe(
      'source=logs'
    );
  });

  it('still appends the sort when there is no time range, as the interceptor does', () => {
    expect(enrichStreamingQuery({ queryString: 'source=logs', timeFieldName: '@timestamp' })).toBe(
      'source=logs | sort - `@timestamp`'
    );
  });

  it('places the time filter before existing pipeline stages', () => {
    const out = enrichStreamingQuery({
      queryString: 'source=logs | rex field=email "(?<u>.+)" | fields u',
      timeFieldName: '@timestamp',
      timeRange: RANGE,
    });
    expect(out.indexOf('WHERE')).toBeLessThan(out.indexOf('rex'));
  });
});
