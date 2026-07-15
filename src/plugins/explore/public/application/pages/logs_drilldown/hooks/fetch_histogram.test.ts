/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { fetchHistogram } from './fetch_histogram';

// A fixed 15-minute window (epoch ms): 2026-07-11T03:05:00Z … 03:20:00Z. Fixed (no Date.now()) so
// the sample bucket timestamps below land inside the window after gap-fill.
const TO = 1_783_740_000_000; // 2026-07-11T03:20:00Z
const FROM = TO - 15 * 60 * 1000; // 2026-07-11T03:05:00Z

const post = jest.fn();
const makeServices = () => (({ http: { post } } as unknown) as any);

// Build a columnar PPL data_frame response the way the enhancements endpoint returns it.
const dataFrame = (fields: Array<{ name: string; values: unknown[] }>) => ({
  body: { fields, size: fields[0]?.values.length ?? 0 },
});

const sentQueryOf = () => JSON.parse(post.mock.calls[0][1].body).query.query as string;

describe('fetchHistogram', () => {
  beforeEach(() => jest.clearAllMocks());

  // --- positive cases ---

  it('builds a severity-stacked query bounded to the time range and folds it into series', async () => {
    post.mockResolvedValue(
      dataFrame([
        { name: 'count', values: [5, 2, 3] },
        {
          name: 'span(@timestamp,30s)',
          values: ['2026-07-11 03:10:00', '2026-07-11 03:10:00', '2026-07-11 03:10:30'],
        },
        { name: 'severityText', values: ['INFO', 'ERROR', 'INFO'] },
      ])
    );

    const res = await fetchHistogram(makeServices(), {
      indexName: 'otel-frontend',
      timeFieldName: '@timestamp',
      severityField: 'severityText',
      from: FROM,
      to: TO,
    });

    // The PPL query is time-bounded (WHERE ... TIMESTAMP(...)) and groups by span + severity, with
    // both the time field and severity field backtick-quoted.
    const sentQuery = sentQueryOf();
    expect(sentQuery).toMatch(
      /where `@timestamp` >= TIMESTAMP\('.*'\) and `@timestamp` <= TIMESTAMP\('.*'\)/
    );
    expect(sentQuery).toMatch(
      /stats count\(\) as count by span\(`@timestamp`, .*\), `severityText`/
    );

    // Two severity series (INFO, ERROR); totals summed per severity.
    const names = res.series.map((s) => s.name).sort();
    expect(names).toEqual(['ERROR', 'INFO']);
    const totalsByName = Object.fromEntries(res.totals.map((t) => [t.name, t.total]));
    expect(totalsByName.INFO).toBe(8); // 5 + 3
    expect(totalsByName.ERROR).toBe(2);
  });

  it('handles the no-severity single-series case', async () => {
    post.mockResolvedValue(
      dataFrame([
        { name: 'count', values: [10, 4] },
        { name: 'span(@timestamp,30s)', values: ['2026-07-11 03:10:00', '2026-07-11 03:10:30'] },
      ])
    );

    const res = await fetchHistogram(makeServices(), {
      indexName: 'nginx-access-logs',
      timeFieldName: '@timestamp',
      from: FROM,
      to: TO,
    });

    const sentQuery = sentQueryOf();
    expect(sentQuery).toMatch(/stats count\(\) as count by span\(`@timestamp`, .*\)$/);
    expect(res.series).toHaveLength(1);
    expect(res.series[0].name).toBe('count');
    expect(res.totals[0].total).toBe(14);
  });

  it('backtick-quotes a dotted nested time field so the path resolves (span, where, and severity)', async () => {
    post.mockResolvedValue(
      dataFrame([
        { name: 'count', values: [1] },
        { name: 'span(attributes.time,30s)', values: ['2026-07-11 03:10:00'] },
        { name: 'log.level', values: ['WARN'] },
      ])
    );

    await fetchHistogram(makeServices(), {
      indexName: 'otel-nested',
      timeFieldName: 'attributes.time',
      severityField: 'log.level',
      from: FROM,
      to: TO,
    });

    const sentQuery = sentQueryOf();
    // Dotted nested paths must be a single backtick-quoted identifier everywhere they appear.
    expect(sentQuery).toContain('span(`attributes.time`, ');
    expect(sentQuery).toContain('`log.level`');
    expect(sentQuery).toMatch(/where `attributes\.time` >= TIMESTAMP/);
    // A dotted path must never appear un-quoted (would be parsed as `attributes`.`time`).
    expect(sentQuery).not.toMatch(/span\(attributes\.time,/);
  });

  it('buckets OTel numeric severityNumber values into colored severity totals', async () => {
    post.mockResolvedValue(
      dataFrame([
        { name: 'count', values: [7, 1] },
        { name: 'span(@timestamp,30s)', values: ['2026-07-11 03:10:00', '2026-07-11 03:10:00'] },
        { name: 'severityNumber', values: ['9', '17'] }, // 9=info, 17=error
      ])
    );

    const res = await fetchHistogram(makeServices(), {
      indexName: 'otel-frontend',
      timeFieldName: '@timestamp',
      severityField: 'severityNumber',
      from: FROM,
      to: TO,
    });

    const buckets = Object.fromEntries(res.totals.map((t) => [t.bucket, t.total]));
    expect(buckets.info).toBe(7);
    expect(buckets.error).toBe(1);
  });

  it('gap-fills empty buckets across the range (0-count buckets are present)', async () => {
    // A single data point; the rest of the 15m/30s buckets should be zero-filled.
    post.mockResolvedValue(
      dataFrame([
        { name: 'count', values: [3] },
        { name: 'span(@timestamp,30s)', values: ['2026-07-11 03:10:00'] },
      ])
    );

    const res = await fetchHistogram(makeServices(), {
      indexName: 'sparse-index',
      timeFieldName: '@timestamp',
      from: FROM,
      to: TO,
    });

    // More than one bucket returned (zero-filled), and the sum equals the single real count.
    expect(res.series[0].dataPoints.length).toBeGreaterThan(1);
    const sum = res.series[0].dataPoints.reduce((acc, [, y]) => acc + y, 0);
    expect(sum).toBe(3);
    // At least one zero bucket exists.
    expect(res.series[0].dataPoints.some(([, y]) => y === 0)).toBe(true);
  });

  it('sends the data source id + index into the isolated PPL dataset (multi-data-source)', async () => {
    post.mockResolvedValue(
      dataFrame([
        { name: 'count', values: [1] },
        { name: 'span(@timestamp,30s)', values: ['2026-07-11 03:10:00'] },
      ])
    );

    await fetchHistogram(makeServices(), {
      indexName: 'remote-logs',
      timeFieldName: '@timestamp',
      dataSource: { id: 'ds-2', title: 'Cluster 2', type: 'OpenSearch' } as any,
      from: FROM,
      to: TO,
    });

    const body = JSON.parse(post.mock.calls[0][1].body);
    expect(body.query.dataset.dataSource.id).toBe('ds-2');
    expect(body.query.dataset.title).toBe('remote-logs');
    expect(body.query.language).toBe('PPL');
  });

  // --- negative / edge cases ---

  it('returns empty series + totals for an empty response body (no data in range)', async () => {
    post.mockResolvedValue({ body: { fields: [], size: 0 } });

    const res = await fetchHistogram(makeServices(), {
      indexName: 'empty-index',
      timeFieldName: '@timestamp',
      from: FROM,
      to: TO,
    });

    // Single-series shape, all-zero after gap-fill, and zero total.
    expect(res.series).toHaveLength(1);
    expect(res.totals).toEqual([]);
    const sum = res.series[0].dataPoints.reduce((acc, [, y]) => acc + y, 0);
    expect(sum).toBe(0);
  });

  it('tolerates a malformed response (missing body) without throwing', async () => {
    post.mockResolvedValue(undefined);

    const res = await fetchHistogram(makeServices(), {
      indexName: 'weird-index',
      timeFieldName: '@timestamp',
      from: FROM,
      to: TO,
    });

    expect(res.series).toHaveLength(1);
    expect(res.totals).toEqual([]);
  });

  it('coerces non-numeric / missing counts to 0 rather than NaN', async () => {
    post.mockResolvedValue(
      dataFrame([
        { name: 'count', values: ['not-a-number', null] },
        { name: 'span(@timestamp,30s)', values: ['2026-07-11 03:10:00', '2026-07-11 03:10:30'] },
      ])
    );

    const res = await fetchHistogram(makeServices(), {
      indexName: 'bad-counts',
      timeFieldName: '@timestamp',
      from: FROM,
      to: TO,
    });

    const sum = res.series[0].dataPoints.reduce((acc, [, y]) => acc + y, 0);
    expect(Number.isNaN(sum)).toBe(false);
    expect(sum).toBe(0);
  });

  it('propagates an aborted/failed request to the caller (best-effort handled upstream)', async () => {
    post.mockRejectedValue(new Error('aborted'));

    await expect(
      fetchHistogram(makeServices(), {
        indexName: 'x',
        timeFieldName: '@timestamp',
        from: FROM,
        to: TO,
      })
    ).rejects.toThrow('aborted');
  });

  it('labels missing severity values as "unknown"', async () => {
    post.mockResolvedValue(
      dataFrame([
        { name: 'count', values: [2] },
        { name: 'span(@timestamp,30s)', values: ['2026-07-11 03:10:00'] },
        { name: 'severityText', values: [null] },
      ])
    );

    const res = await fetchHistogram(makeServices(), {
      indexName: 'missing-sev',
      timeFieldName: '@timestamp',
      severityField: 'severityText',
      from: FROM,
      to: TO,
    });

    expect(res.series.map((s) => s.name)).toEqual(['unknown']);
    expect(res.totals[0]).toMatchObject({ name: 'unknown', bucket: 'unknown', total: 2 });
  });
});
