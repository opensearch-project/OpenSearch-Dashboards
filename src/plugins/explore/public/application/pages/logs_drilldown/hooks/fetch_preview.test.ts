/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  extractRows,
  deriveColumns,
  toFriendlyError,
  fetchPreview,
  DEFAULT_PREVIEW_SIZE,
} from './fetch_preview';

describe('extractRows', () => {
  it('un-pivots a columnar PPL data_frame into row objects', () => {
    const rows = extractRows({
      body: {
        size: 2,
        fields: [
          { name: '@timestamp', values: ['t1', 't2'] },
          { name: 'level', values: ['INFO', 'ERROR'] },
        ],
      },
    });
    expect(rows).toEqual([
      { '@timestamp': 't1', level: 'INFO' },
      { '@timestamp': 't2', level: 'ERROR' },
    ]);
  });

  it('derives the row count from the first field when body.size is absent', () => {
    const rows = extractRows({
      body: { fields: [{ name: 'a', values: [1, 2, 3] }] },
    });
    expect(rows).toEqual([{ a: 1 }, { a: 2 }, { a: 3 }]);
  });

  it('falls back to classic hits[]._source', () => {
    const rows = extractRows({ hits: { hits: [{ _source: { a: 1 } }, { _source: { b: 2 } }] } });
    expect(rows).toEqual([{ a: 1 }, { b: 2 }]);
  });

  it('tolerates a hit missing _source', () => {
    expect(extractRows({ hits: { hits: [{}, { _source: { a: 1 } }] } })).toEqual([{}, { a: 1 }]);
  });

  it('returns an empty list for an empty response', () => {
    expect(extractRows({})).toEqual([]);
  });

  it('returns an empty list for an undefined/null response', () => {
    expect(extractRows(undefined)).toEqual([]);
    expect(extractRows(null)).toEqual([]);
  });
});

describe('deriveColumns', () => {
  it('leads with the time field and caps at 6 columns', () => {
    const rows = [{ a: 1, b: 2, '@timestamp': 't', c: 3, d: 4, e: 5, f: 6 }];
    const cols = deriveColumns(rows, '@timestamp');
    expect(cols[0]).toBe('@timestamp');
    expect(cols).toHaveLength(6);
  });

  it('unions column names across rows with differing keys', () => {
    const cols = deriveColumns([{ a: 1 }, { b: 2 }, { a: 3, c: 4 }]);
    expect(cols).toEqual(['a', 'b', 'c']);
  });

  it('does not lead with a time field that is not present in the rows', () => {
    // timeFieldName given but no row has it → plain order, no crash.
    expect(deriveColumns([{ user_id: 1 }], '@timestamp')).toEqual(['user_id']);
  });

  it('handles a no-time-field index (no leading time column)', () => {
    expect(deriveColumns([{ user_id: 1, email: 'x' }])).toEqual(['user_id', 'email']);
  });

  it('returns an empty list when there are no rows', () => {
    expect(deriveColumns([])).toEqual([]);
    expect(deriveColumns([], '@timestamp')).toEqual([]);
  });
});

describe('toFriendlyError', () => {
  it('maps a missing-PPL-engine error to actionable guidance', () => {
    expect(toFriendlyError(new Error('no handler found for _plugins/_ppl'))).toMatch(
      /PPL query engine/
    );
  });

  it('maps a raw _ppl string (non-Error) to guidance', () => {
    expect(toFriendlyError('GET /_plugins/_ppl failed')).toMatch(/PPL query engine/);
  });

  it('passes through other messages', () => {
    expect(toFriendlyError(new Error('boom'))).toBe('boom');
  });

  it('gives a generic fallback for an empty/nullish error', () => {
    expect(toFriendlyError(undefined)).toBe('Unable to preview this index');
    expect(toFriendlyError('')).toBe('Unable to preview this index');
  });
});

describe('fetchPreview', () => {
  const mkPost = () => jest.fn().mockResolvedValue({ body: { size: 0, fields: [] } });

  it('sorts by the (backtick-quoted) time field for a time-based index and issues head N', async () => {
    const post = mkPost();
    await fetchPreview(({ http: { post } } as unknown) as any, {
      indexName: 'logs-app-1',
      timeFieldName: '@timestamp',
      size: 10,
    });
    const q = JSON.parse(post.mock.calls[0][1].body).query.query as string;
    expect(q).toBe('source = logs-app-1 | sort - `@timestamp` | head 10');
  });

  it('bounds the preview to the time range (WHERE before sort) when from/to are given', async () => {
    const post = mkPost();
    await fetchPreview(({ http: { post } } as unknown) as any, {
      indexName: 'logs-app-1',
      timeFieldName: '@timestamp',
      size: 10,
      from: Date.parse('2026-07-13T22:30:00.000Z'),
      to: Date.parse('2026-07-13T22:45:00.000Z'),
    });
    const q = JSON.parse(post.mock.calls[0][1].body).query.query as string;
    // WHERE clause sits between source and sort, so it matches the histogram's window.
    expect(q).toMatch(
      /^source = logs-app-1 \| where `@timestamp` >= TIMESTAMP\('.*'\) and `@timestamp` <= TIMESTAMP\('.*'\) \| sort - `@timestamp` \| head 10$/
    );
  });

  it('does NOT add a time filter when from/to are omitted (latest N docs)', async () => {
    const post = mkPost();
    await fetchPreview(({ http: { post } } as unknown) as any, {
      indexName: 'logs-app-1',
      timeFieldName: '@timestamp',
      size: 10,
    });
    const q = JSON.parse(post.mock.calls[0][1].body).query.query as string;
    expect(q).toBe('source = logs-app-1 | sort - `@timestamp` | head 10');
    expect(q).not.toMatch(/where/);
  });

  it('does NOT add a time filter for a no-time-field index even if from/to are passed', async () => {
    const post = mkPost();
    await fetchPreview(({ http: { post } } as unknown) as any, {
      indexName: 'lookup-users',
      size: 10,
      from: 1,
      to: 2,
    });
    const q = JSON.parse(post.mock.calls[0][1].body).query.query as string;
    expect(q).toBe('source = lookup-users | head 10');
  });

  it('backtick-quotes a dotted nested time field so the sort path resolves', async () => {
    const post = mkPost();
    await fetchPreview(({ http: { post } } as unknown) as any, {
      indexName: 'otel-nested',
      timeFieldName: 'attributes.time',
      size: 5,
    });
    const q = JSON.parse(post.mock.calls[0][1].body).query.query as string;
    expect(q).toBe('source = otel-nested | sort - `attributes.time` | head 5');
    expect(q).not.toMatch(/sort - attributes\.time/);
  });

  it('omits the sort for a no-time-field index', async () => {
    const post = mkPost();
    await fetchPreview(({ http: { post } } as unknown) as any, {
      indexName: 'lookup-users',
      size: 10,
    });
    const q = JSON.parse(post.mock.calls[0][1].body).query.query as string;
    expect(q).toBe('source = lookup-users | head 10');
  });

  it('defaults to DEFAULT_PREVIEW_SIZE when size is omitted', async () => {
    const post = mkPost();
    await fetchPreview(({ http: { post } } as unknown) as any, { indexName: 'logs' });
    const q = JSON.parse(post.mock.calls[0][1].body).query.query as string;
    expect(q).toBe(`source = logs | head ${DEFAULT_PREVIEW_SIZE}`);
  });

  it('forwards the abort signal and the data source id into the dataset', async () => {
    const post = mkPost();
    const signal = new AbortController().signal;
    await fetchPreview(
      ({ http: { post } } as unknown) as any,
      {
        indexName: 'remote-logs',
        timeFieldName: '@timestamp',
        dataSource: { id: 'ds-2', title: 'C2', type: 'OpenSearch' } as any,
      },
      signal
    );
    expect(post.mock.calls[0][1].signal).toBe(signal);
    const body = JSON.parse(post.mock.calls[0][1].body);
    expect(body.query.dataset.dataSource.id).toBe('ds-2');
    expect(body.query.dataset.title).toBe('remote-logs');
  });

  it('returns parsed rows + columns from a columnar response', async () => {
    const post = jest.fn().mockResolvedValue({
      body: {
        size: 1,
        fields: [
          { name: 'level', values: ['INFO'] },
          { name: '@timestamp', values: ['t1'] },
        ],
      },
    });
    const res = await fetchPreview(({ http: { post } } as unknown) as any, {
      indexName: 'logs',
      timeFieldName: '@timestamp',
    });
    expect(res.rows).toEqual([{ level: 'INFO', '@timestamp': 't1' }]);
    // Time field leads the column list.
    expect(res.columns[0]).toBe('@timestamp');
  });
});
