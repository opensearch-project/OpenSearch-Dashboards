/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PatternItem } from '../patterns_table';

// Mock data for patterns
export const mockPatternItems: PatternItem[] = [
  {
    pattern: 'INFO [main] Starting application',
    ratio: 0.35,
    count: 350,
  },
  {
    pattern: 'DEBUG [worker-1] Processing request',
    ratio: 0.25,
    count: 250,
  },
  {
    pattern: 'INFO [worker-2] Request completed successfully',
    ratio: 0.15,
    count: 150,
  },
  {
    pattern: 'WARN [worker-1] Slow query detected',
    ratio: 0.1,
    count: 100,
  },
  {
    pattern: 'ERROR [main] Failed to connect to database',
    ratio: 0.08,
    count: 80,
  },
  {
    pattern: 'INFO [scheduler] Running scheduled task',
    ratio: 0.05,
    count: 50,
  },
  {
    pattern: 'DEBUG [worker-3] Cache hit',
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
      pattern: `${baseItem.pattern} (variant ${Math.floor(i / baseItems.length) + 1})`,
      ratio: baseItem.ratio / (Math.floor(i / baseItems.length) + 2),
      count: Math.floor(baseItem.count / (Math.floor(i / baseItems.length) + 2)),
    });
  }

  return result;
};
