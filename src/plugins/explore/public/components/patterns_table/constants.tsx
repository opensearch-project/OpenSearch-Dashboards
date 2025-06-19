/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiBasicTableColumn } from '@elastic/eui';
import { PatternItem } from './patterns_table';

export const PATTERNS_FIELD = 'patterns_field';
export const COUNT_FIELD = 'count';

export const patternsTableColumns: Array<EuiBasicTableColumn<PatternItem>> = [
  {
    field: 'ratio',
    name: 'Event ratio',
    render: (val: number) => {
      // Check if value is a valid, finite number before formatting
      if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) {
        return '-';
      }
      return `${(val * 100).toFixed(2)}%`;
    },
    width: '15%',
  },
  {
    field: 'pattern',
    name: 'Pattern',
    render: (pattern: string) => pattern || '-',
  },
  {
    field: 'count',
    name: 'Event count',
    render: (val: number) => {
      // Check if value is a valid, finite number
      if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) {
        return '-';
      }
      return val;
    },
    align: 'right',
  },
];

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
