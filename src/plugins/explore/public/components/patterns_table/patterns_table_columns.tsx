/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiBasicTableColumn, EuiButtonIcon, EuiToolTip } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import React from 'react';
import dompurify from 'dompurify';
import { PatternItem } from './patterns_table';
import { isValidFiniteNumber } from './utils/utils';
import { PatternsFlyoutRecord } from './patterns_table_flyout/patterns_table_flyout';

export const patternsTableColumns = (
  openPatternsTableFlyout: (record: PatternsFlyoutRecord) => void,
  onFilterForPattern: (pattern: string) => void,
  onFilterOutPattern: (pattern: string) => void
): Array<EuiBasicTableColumn<PatternItem>> => [
  {
    field: 'flyout',
    width: '100px',
    name: i18n.translate('explore.patterns.table.column.actions', {
      defaultMessage: 'Actions',
    }),
    render: (record: PatternsFlyoutRecord, item: PatternItem) => {
      return (
        <>
          <EuiToolTip
            content={i18n.translate('explore.patterns.table.column.inspectPatternTooltip', {
              defaultMessage: 'Inspect pattern',
            })}
          >
            <EuiButtonIcon
              aria-label={i18n.translate('explore.patterns.table.column.openPatternTableFlyout', {
                defaultMessage: 'Open pattern table flyout',
              })}
              iconType={'inspect'}
              onClick={() => openPatternsTableFlyout(record)}
            />
          </EuiToolTip>
          <EuiToolTip
            content={i18n.translate('explore.patterns.table.column.filterForPatternTooltip', {
              defaultMessage: 'Filter for pattern',
            })}
          >
            <EuiButtonIcon
              aria-label={i18n.translate('explore.patterns.table.column.filterForPattern', {
                defaultMessage: 'Filter for pattern',
              })}
              iconType={'magnifyWithPlus'}
              onClick={() => onFilterForPattern(item.pattern)}
            />
          </EuiToolTip>
          <EuiToolTip
            content={i18n.translate('explore.patterns.table.column.filterOutPatternTooltip', {
              defaultMessage: 'Filter out pattern',
            })}
          >
            <EuiButtonIcon
              aria-label={i18n.translate('explore.patterns.table.column.filterOutPattern', {
                defaultMessage: 'Filter out pattern',
              })}
              iconType={'magnifyWithMinus'}
              onClick={() => onFilterOutPattern(item.pattern)}
            />
          </EuiToolTip>
        </>
      );
    },
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
    width: '10%',
  },
  {
    field: 'sample',
    name: i18n.translate('explore.patterns.table.column.sampleLog', {
      defaultMessage: 'Pattern',
    }),
    render: (sample: string) => {
      const sanitizedSampleLog = dompurify.sanitize(sample);
      // eslint-disable-next-line react/no-danger
      return <span dangerouslySetInnerHTML={{ __html: sanitizedSampleLog || '—' }} />;
    },
  },
];
