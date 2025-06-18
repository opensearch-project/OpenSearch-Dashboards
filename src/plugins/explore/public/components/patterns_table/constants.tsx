/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HorizontalAlignment } from '@elastic/charts';

export const PATTERNS_FIELD = 'patterns_field';
export const COUNT_FIELD = 'count';

export const patternsTableColumns = [
  {
    field: 'ratio',
    name: 'Event ratio',
    render: (val: number) => `${(val * 100).toFixed(3)}%`,
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
    align: HorizontalAlignment.Right,
  },
];
