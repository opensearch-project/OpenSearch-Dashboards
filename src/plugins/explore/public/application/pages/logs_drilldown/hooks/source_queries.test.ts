/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { runSourceCard, toHistogramResult } from './source_queries';

jest.mock('@osd/i18n', () => ({
  i18n: { translate: (_k: string, o: { defaultMessage: string }) => o.defaultMessage },
}));

const item = { id: 'g', name: 'g', timeFieldName: '@timestamp' };

const makeDrilldown = (overrides: Record<string, unknown> = {}) =>
  ({
    ScopeSelector: () => null,
    listItems: jest.fn(),
    toDataset: jest.fn(),
    fetchPreview: jest.fn().mockResolvedValue({
      rows: [{ '@timestamp': 't', a: 1, b: 2, c: 3, d: 4, e: 5, f: 6 }],
    }),
    fetchHistogram: jest.fn().mockResolvedValue({
      series: [{ name: 'ERROR', dataPoints: [[1000, 2]] }],
      intervalMs: 1000,
    }),
    ...overrides,
  }) as any;

const run = (drilldown: any) =>
  runSourceCard({
    drilldown,
    scope: { region: 'r' },
    item,
    from: 0,
    to: 3000,
    ranWith: 'k1',
    signal: new AbortController().signal,
  });

describe('runSourceCard', () => {
  it('runs the preview and histogram for the item, with the page range and a small size', async () => {
    const drilldown = makeDrilldown();
    const result = await run(drilldown);
    const args = {
      scope: { region: 'r' },
      item,
      from: 0,
      to: 3000,
      signal: expect.any(AbortSignal),
    };
    expect(drilldown.fetchPreview).toHaveBeenCalledWith({ ...args, size: 10 });
    expect(drilldown.fetchHistogram).toHaveBeenCalledWith(args);
    expect(result.ranWith).toBe('k1');
    // The time field first, then at most five others.
    expect(result.preview.columns).toEqual(['@timestamp', 'a', 'b', 'c', 'd', 'e']);
    expect(result.histogram?.totals).toEqual([{ name: 'ERROR', total: 2, bucket: 'error' }]);
  });

  it('fails the card when the preview fails', async () => {
    await expect(
      run(makeDrilldown({ fetchPreview: jest.fn().mockRejectedValue(new Error('denied')) }))
    ).rejects.toThrow('denied');
  });

  it('keeps the preview when only the histogram fails', async () => {
    const result = await run(
      makeDrilldown({ fetchHistogram: jest.fn().mockRejectedValue(new Error('too big')) })
    );
    expect(result.preview.rows).toHaveLength(1);
    expect(result.histogram).toBeUndefined();
    expect(result.histogramError).toBe('too big');
  });

  it('has no histogram for a source without one', async () => {
    const result = await run(makeDrilldown({ fetchHistogram: undefined }));
    expect(result.histogram).toBeUndefined();
    expect(result.histogramError).toBeUndefined();
  });
});

describe('toHistogramResult', () => {
  it('fills empty buckets across the range and totals each series', () => {
    const result = toHistogramResult(
      {
        series: [
          {
            name: 'INFO',
            dataPoints: [
              [0, 1],
              [2000, 3],
            ],
          },
          { name: 'ERROR', dataPoints: [[1000, 5]] },
        ],
        intervalMs: 1000,
      },
      0,
      3000
    );
    const info = result.series.find((s) => s.name === 'INFO')!;
    expect(info.dataPoints.map(([x]) => x)).toEqual(expect.arrayContaining([0, 1000, 2000]));
    expect(info.dataPoints.find(([x]) => x === 1000)?.[1]).toBe(0);
    expect(result.totals.map(({ name, total }) => [name, total])).toEqual([
      ['ERROR', 5],
      ['INFO', 4],
    ]);
    expect(result).toMatchObject({ intervalMs: 1000, from: 0, to: 3000 });
  });
});
