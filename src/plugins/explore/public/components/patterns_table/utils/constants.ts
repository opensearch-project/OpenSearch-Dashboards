/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiBasicTableColumn } from '@elastic/eui';
import { PatternItem } from '../patterns_table';

export const PATTERNS_FIELD = 'patterns_field';
export const COUNT_FIELD = 'count';

export const patternsTableColumns: Array<EuiBasicTableColumn<PatternItem>> = [
  {
    field: 'ratio',
    name: 'Event ratio',
    render: (val: number) => {
      // Check if value is a valid, finite number before formatting
      if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) {
        return '—';
      }
      return `${(val * 100).toFixed(2)}%`;
    },
    width: '15%',
  },
  {
    field: 'pattern',
    name: 'Pattern',
    render: (pattern: string) => pattern || '—',
  },
  {
    field: 'count',
    name: 'Event count',
    render: (val: number) => {
      // Check if value is a valid, finite number
      if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) {
        return '—';
      }
      return val;
    },
    align: 'right',
  },
];
