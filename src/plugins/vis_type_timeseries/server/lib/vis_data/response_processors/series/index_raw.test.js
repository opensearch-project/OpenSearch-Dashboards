/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { processorsRaw } from './index_raw';

describe('processorsRaw (for /api/metrics/vis/data-raw endpoint)', () => {
  test('should exclude mathAgg processor (math is evaluated client-side)', () => {
    const processorNames = processorsRaw.map((p) => p.name);
    expect(processorNames).not.toContain('mathAgg');
  });

  test('should exclude timeShift and dropLastBucket (applied client-side after math)', () => {
    const processorNames = processorsRaw.map((p) => p.name);
    // These must run AFTER math, which happens in the browser, so they are applied
    // client-side in public/lib/post_process_raw_series.js instead.
    expect(processorNames).not.toContain('timeShift');
    expect(processorNames).not.toContain('dropLastBucket');
  });

  test('should include expected processors', () => {
    const processorNames = processorsRaw.map((p) => p.name);

    expect(processorNames).toContain('percentile');
    expect(processorNames).toContain('percentileRank');
    expect(processorNames).toContain('percentileRaw');
    expect(processorNames).toContain('seriesAgg');
    expect(processorNames).toContain('stdDeviationBands');
    expect(processorNames).toContain('stdDeviationSibling');
  });

  test('should use stdMetricRaw instead of stdMetric', () => {
    const processorNames = processorsRaw.map((p) => p.name);
    expect(processorNames).toContain('stdMetricRaw');
    expect(processorNames).not.toContain('stdMetric');
  });

  test('should use stdSiblingRaw instead of stdSibling', () => {
    const processorNames = processorsRaw.map((p) => p.name);
    expect(processorNames).toContain('stdSiblingRaw');
    expect(processorNames).not.toContain('stdSibling');
  });

  test('should maintain expected processor order', () => {
    const processorNames = processorsRaw.map((p) => p.name);

    expect(processorNames).toEqual([
      'percentile',
      'percentileRank',
      'percentileRaw',
      'stdDeviationBands',
      'stdDeviationSibling',
      'stdMetricRaw',
      'stdSiblingRaw',
      // mathAgg excluded (client-side); timeShift + dropLastBucket excluded (client-side after math)
      'seriesAgg',
    ]);
  });
});
