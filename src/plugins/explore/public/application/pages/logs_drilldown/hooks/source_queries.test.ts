/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { cardHistogramInterval, runSourceCard, toHistogramResult } from './source_queries';

jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: (_k: string, o: { defaultMessage: string; values?: Record<string, unknown> }) =>
      Object.entries(o.values ?? {}).reduce(
        (text, [key, value]) => text.replace(`{${key}}`, String(value)),
        o.defaultMessage
      ),
  },
}));

const item = { id: 'g', name: 'g', timeFieldName: '@timestamp' };
const dataset = { id: 'd', title: 'd', type: 'FAKE', language: 'FAKE_QL' };

/** A search source that answers by query text. */
const makeServices = (answers: Record<string, unknown[] | Error>) => {
  const fetched: Array<{ query: any; size: number; signal: AbortSignal }> = [];
  const create = jest.fn(async () => {
    let fields: any;
    return {
      setFields: (next: any) => (fields = next),
      fetch: async ({ abortSignal }: { abortSignal: AbortSignal }) => {
        fetched.push({ query: fields.query, size: fields.size, signal: abortSignal });
        const answer = answers[fields.query.query];
        if (answer instanceof Error) throw answer;
        return { hits: { hits: (answer ?? []).map((row) => ({ _source: row })) } };
      },
    };
  });
  let cached = false;
  const cacheDataset = jest.fn(async () => {
    cached = true;
  });
  return {
    fetched,
    cacheDataset,
    services: {
      data: {
        dataViews: { get: jest.fn(async () => (cached ? { id: 'd' } : undefined)) },
        search: { searchSource: { create } },
        query: { queryString: { getDatasetService: () => ({ cacheDataset }) } },
      },
      uiSettings: {},
      savedObjects: {},
      notifications: {},
      http: {},
    } as any,
  };
};

const makeDrilldown = (overrides: Record<string, unknown> = {}) =>
  ({
    ScopeSelector: () => null,
    listItems: jest.fn(),
    toDataset: jest.fn().mockResolvedValue(dataset),
    buildPreviewQuery: jest.fn(() => 'PREVIEW'),
    buildHistogramQuery: jest.fn(() => 'HISTOGRAM'),
    ...overrides,
  }) as any;

const run = (services: any, drilldown: any, datasetTypes = ['FAKE']) =>
  runSourceCard({
    services,
    drilldown,
    datasetTypes,
    scope: { region: 'r' },
    item,
    from: 0,
    to: 60 * 60 * 1000,
    ranWith: 'k1',
    signal: new AbortController().signal,
  });

describe('runSourceCard', () => {
  it("runs the source's queries on the item's own dataset, through the search service", async () => {
    const rows = Array.from({ length: 30 }, (_, i) => ({ '@timestamp': `t${i}`, a: i }));
    const { services, fetched, cacheDataset } = makeServices({
      PREVIEW: rows,
      HISTOGRAM: [{ '@timestamp': '1970-01-01T00:05:00.000Z', count: 4 }],
    });
    const drilldown = makeDrilldown();
    const result = await run(services, drilldown);

    expect(drilldown.toDataset).toHaveBeenCalledWith({ scope: { region: 'r' }, items: [item] });
    expect(cacheDataset).toHaveBeenCalled();
    expect(drilldown.buildPreviewQuery).toHaveBeenCalledWith({
      scope: { region: 'r' },
      item,
      dataset,
      size: 10,
    });
    expect(drilldown.buildHistogramQuery).toHaveBeenCalledWith(
      expect.objectContaining({ dataset, interval: '5m', timeFieldName: '@timestamp' })
    );
    expect(fetched.map(({ query }) => query)).toEqual([
      { query: 'PREVIEW', language: 'FAKE_QL', dataset },
      { query: 'HISTOGRAM', language: 'FAKE_QL', dataset },
    ]);
    // At most the size asked for, whatever the source returns.
    expect(result.preview.rows).toHaveLength(10);
    expect(result.preview.columns[0]).toBe('@timestamp');
    expect(result.histogram?.totals[0].total).toBe(4);
    expect(result.ranWith).toBe('k1');
  });

  it("refuses a dataset that isn't of the source's types", async () => {
    const { services } = makeServices({});
    await expect(run(services, makeDrilldown(), ['OTHER'])).rejects.toThrow(
      'The source returned a dataset of another type (FAKE).'
    );
  });

  it('fails the card on a failed preview, keeping the error as is', async () => {
    const rejection = Object.assign(new Error('denied'), { statusCode: 403 });
    const { services } = makeServices({ PREVIEW: rejection });
    await expect(run(services, makeDrilldown())).rejects.toBe(rejection);
  });

  it('keeps the preview when only the histogram fails, and runs none when not built', async () => {
    const { services } = makeServices({ PREVIEW: [{ a: 1 }], HISTOGRAM: new Error('too big') });
    const failed = await run(services, makeDrilldown());
    expect(failed.preview.rows).toHaveLength(1);
    expect(failed.histogramError).toBe('too big');

    const none = makeServices({ PREVIEW: [{ a: 1 }] });
    const result = await run(
      none.services,
      makeDrilldown({ buildHistogramQuery: () => undefined })
    );
    expect(result.histogram).toBeUndefined();
    expect(none.fetched).toHaveLength(1);
  });
});

describe('cardHistogramInterval and toHistogramResult', () => {
  it('picks 10 to 20 bars', () => {
    for (const span of [60 * 60 * 1000, 24 * 3600 * 1000, 7 * 86400 * 1000, 21 * 86400 * 1000]) {
      const { intervalMs } = cardHistogramInterval(0, span);
      expect(span / intervalMs).toBeGreaterThanOrEqual(10);
      expect(span / intervalMs).toBeLessThanOrEqual(20);
    }
  });

  it('reads the histogram columns, zone-less times as UTC, and fills empty buckets', () => {
    const result = toHistogramResult(
      [
        { '@timestamp': '1970-01-01 00:00:02', count: 3 },
        { '@timestamp': 0, count: 1 },
      ],
      1000,
      0,
      3000
    );
    const points = result.series[0].dataPoints;
    expect(points.find(([x]) => x === 0)?.[1]).toBe(1);
    expect(points.find(([x]) => x === 1000)?.[1]).toBe(0);
    expect(points.find(([x]) => x === 2000)?.[1]).toBe(3);
    expect(result.totals[0].total).toBe(4);
  });
});
