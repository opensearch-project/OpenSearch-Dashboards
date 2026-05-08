/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PatternItem } from '../patterns_table';

// Mock data for patterns
export const mockPatternItems: PatternItem[] = [
  {
    sample: 'INFO [main] Starting application',
    pattern: 'INFO [main] * application',
    ratio: 0.35,
    count: 350,
  },
  {
    sample: 'DEBUG [worker-1] Processing request',
    pattern: 'DEBUG [worker-1] * request',
    ratio: 0.25,
    count: 250,
  },
  {
    sample: 'INFO [worker-2] Request completed successfully',
    pattern: 'INFO [worker-2] * completed *',
    ratio: 0.15,
    count: 150,
  },
  {
    sample: 'WARN [worker-1] Slow query detected',
    pattern: 'WARN [worker-1] * query *',
    ratio: 0.1,
    count: 100,
  },
  {
    sample: 'ERROR [main] Failed to connect to database',
    pattern: 'ERROR [main] * to connect *',
    ratio: 0.08,
    count: 80,
  },
  {
    sample: 'INFO [scheduler] Running scheduled task',
    pattern: 'INFO [scheduler] * scheduled *',
    ratio: 0.05,
    count: 50,
  },
  {
    sample: 'DEBUG [worker-3] Cache hit',
    pattern: 'DEBUG [worker-3] * hit',
    ratio: 0.02,
    count: 20,
  },
];

/**
 * Generate a larger dataset for pagination testing
 */
export const generateLargeDataset = (baseItems: PatternItem[], count: number): PatternItem[] => {
  const result: PatternItem[] = [...baseItems];

  for (let i = 0; i < count; i++) {
    const baseItem = baseItems[i % baseItems.length];
    result.push({
      sample: `${baseItem.sample} (variant ${Math.floor(i / baseItems.length) + 1})`,
      pattern: `${baseItem.pattern} (variant ${Math.floor(i / baseItems.length) + 1})`,
      ratio: baseItem.ratio / (Math.floor(i / baseItems.length) + 2),
      count: Math.floor(baseItem.count / (Math.floor(i / baseItems.length) + 2)),
    });
  }

  return result;
};
