/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiBasicTableColumn } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import React from 'react';
import dompurify from 'dompurify';
import { PatternItem } from './patterns_table';
import { isValidFiniteNumber } from './utils/utils';
import { PatternsTableFlyout } from './patterns_table_flyout/patterns_table_flyout';

export const patternsTableColumns: Array<EuiBasicTableColumn<PatternItem>> = [
  {
    field: 'flyout',
    width: '40px', // roughly size of the EuiButtonIcon
    render: (record: any) => PatternsTableFlyout(record),
  },
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
    width: '10%',
  },
  {
    field: 'sample',
    name: i18n.translate('explore.patterns.table.column.sampleLog', {
      defaultMessage: 'Pattern Sample Log',
    }),
    render: (sample: string) => {
      const sanitizedSampleLog = dompurify.sanitize(sample);
      // eslint-disable-next-line react/no-danger
      return <span dangerouslySetInnerHTML={{ __html: sanitizedSampleLog || '—' }} />;
    },
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
    width: '10%',
  },
];
