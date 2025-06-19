/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PatternItem } from './patterns_table';

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
