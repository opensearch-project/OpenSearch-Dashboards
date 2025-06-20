/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiBasicTableColumn } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { PatternItem } from '../patterns_table';
import { isValidFiniteNumber } from './utils';

export const PATTERNS_FIELD = 'patterns_field';
export const COUNT_FIELD = 'count';

export const patternsTableColumns: Array<EuiBasicTableColumn<PatternItem>> = [
  {
    field: 'ratio',
    name: i18n.translate('explore.patterns.table.column.eventRatio', {
      defaultMessage: 'Event ratio',
    }),
    render: (val: number) => {
      if (!isValidFiniteNumber(val)) {
        return '—';
      }
      return `${(val * 100).toFixed(2)}%`;
    },
    width: '15%',
  },
  {
    field: 'pattern',
    name: i18n.translate('explore.patterns.table.column.pattern', {
      defaultMessage: 'Pattern',
    }),
    render: (pattern: string) => pattern || '—',
  },
  {
    field: 'count',
    name: i18n.translate('explore.patterns.table.column.eventCount', {
      defaultMessage: 'Event count',
    }),
    render: (val: number) => {
      if (!isValidFiniteNumber(val)) {
        return '—';
      }
      return val;
    },
    align: 'right',
  },
];
