/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { processors } from './index';
import { processorsRaw } from './index_raw';

describe('processorsRaw (for /api/metrics/vis/data-raw endpoint)', () => {
  test('should exclude mathAgg processor', () => {
    const processorNames = processorsRaw.map((p) => p.name);
    expect(processorNames).not.toContain('mathAgg');
  });

  test('should have same number of processors as standard list (excluding mathAgg)', () => {
    // processorsRaw should have exactly one fewer processor than standard (mathAgg is excluded)
    expect(processorsRaw.length).toBe(processors.length - 1);
  });

  test('should include expected processors', () => {
    const processorNames = processorsRaw.map((p) => p.name);

    // Verify key processors are present
    expect(processorNames).toContain('percentile');
    expect(processorNames).toContain('percentileRank');
    expect(processorNames).toContain('seriesAgg');
    expect(processorNames).toContain('timeShift');
    expect(processorNames).toContain('dropLastBucket');
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

    // Verify processors are in expected order
    expect(processorNames[0]).toBe('percentile');
    expect(processorNames[1]).toBe('percentileRank');
    expect(processorNames[2]).toBe('stdDeviationBands');
    expect(processorNames[3]).toBe('stdDeviationSibling');
    expect(processorNames[4]).toBe('stdMetricRaw');
    expect(processorNames[5]).toBe('stdSiblingRaw');
    // Note: mathAgg would be here in standard processors but is excluded
    expect(processorNames[6]).toBe('seriesAgg');
    expect(processorNames[7]).toBe('timeShift');
    expect(processorNames[8]).toBe('dropLastBucket');
  });
});
