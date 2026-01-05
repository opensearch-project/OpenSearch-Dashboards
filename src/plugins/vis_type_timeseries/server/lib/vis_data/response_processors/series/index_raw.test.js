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

  test('should include all other processors from standard list', () => {
    // Get all processor names except mathAgg
    const standardProcessorNames = processors
      .filter((p) => p.name !== 'mathAgg')
      .map((p) => p.name);

    const rawProcessorNames = processorsRaw.map((p) => p.name);

    // Verify all non-math processors are included
    standardProcessorNames.forEach((name) => {
      expect(rawProcessorNames).toContain(name);
    });
  });

  test('should have one fewer processor than standard list', () => {
    // processorsRaw should have exactly one fewer processor (mathAgg)
    expect(processorsRaw.length).toBe(processors.length - 1);
  });

  test('should maintain the same processor order as standard list (excluding mathAgg)', () => {
    // Get standard processors without mathAgg
    const standardWithoutMath = processors.filter((p) => p.name !== 'mathAgg');

    // Verify same order
    standardWithoutMath.forEach((processor, index) => {
      expect(processorsRaw[index].name).toBe(processor.name);
    });
  });

  test('should include expected processors', () => {
    const processorNames = processorsRaw.map((p) => p.name);

    // Verify key processors are present
    expect(processorNames).toContain('percentile');
    expect(processorNames).toContain('percentileRank');
    expect(processorNames).toContain('stdMetric');
    expect(processorNames).toContain('stdSibling');
    expect(processorNames).toContain('seriesAgg');
    expect(processorNames).toContain('timeShift');
    expect(processorNames).toContain('dropLastBucket');
  });
});
