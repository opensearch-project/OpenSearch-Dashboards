/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { buildChart } from './histogram_chart';
import { HistogramResult } from '../hooks/fetch_histogram';
import { severityColor } from '../severity';

const base = (series: HistogramResult['series']): HistogramResult => ({
  series,
  intervalMs: 60_000,
  from: 0,
  to: 900_000,
  totals: [],
});

describe('buildChart', () => {
  // --- positive cases ---
  it('builds a single blue series for the no-severity ("count") case', () => {
    const { chart, palette } = buildChart(
      base([
        {
          name: 'count',
          dataPoints: [
            [0, 5],
            [60_000, 3],
          ],
        },
      ])
    );
    // One series, palette is the single "regular logs" blue — colored via the `unknown` bucket
    // (SINGLE_SERIES_BUCKET), which now carries the prominent blue.
    expect(palette).toEqual([severityColor('unknown')]);
    // The point-series builder spans the [from,to] bounds at the given interval, so it carries at
    // least the two real buckets (and includes bucket 0).
    expect(chart.xAxisOrderedValues.length).toBeGreaterThanOrEqual(2);
    expect(chart.xAxisOrderedValues).toContain(0);
    // No breakdown series for the single-series case.
    expect(chart.series === undefined || chart.series.length <= 1).toBe(true);
  });

  it('orders severity series + palette error→warn→info→debug→unknown (bottom→top of stack)', () => {
    // Deliberately shuffled input; buildChart must reorder deterministically.
    const { chart, palette } = buildChart(
      base([
        { name: 'DEBUG', dataPoints: [[0, 1]] },
        { name: 'ERROR', dataPoints: [[0, 2]] },
        { name: 'INFO', dataPoints: [[0, 3]] },
        { name: 'WARN', dataPoints: [[0, 4]] },
      ])
    );
    // The palette reflects the canonical severity order.
    expect(palette).toEqual([
      severityColor('error'),
      severityColor('warn'),
      severityColor('info'),
      severityColor('debug'),
    ]);
    // The chart carries a breakdown series per severity.
    expect(chart.series?.map((s) => s.name)).toEqual(['ERROR', 'WARN', 'INFO', 'DEBUG']);
  });

  it('places unrecognized/unknown severities last in the stack', () => {
    const { chart, palette } = buildChart(
      base([
        { name: 'banana', dataPoints: [[0, 1]] },
        { name: 'ERROR', dataPoints: [[0, 2]] },
      ])
    );
    expect(chart.series?.map((s) => s.name)).toEqual(['ERROR', 'banana']);
    // The trailing color is the "unknown" (subdued) color.
    expect(palette[palette.length - 1]).toBe(severityColor('unknown'));
  });

  // --- edge case ---
  it('does not crash for an empty severity series list', () => {
    const { chart, palette } = buildChart(base([]));
    expect(palette).toEqual([]);
    expect(chart.series ?? []).toEqual([]);
  });
});
