/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiBasicTableColumn, EuiButtonIcon, EuiBadge, EuiToolTip } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FieldStatsItem } from './utils/field_stats_types';
import { FieldIcon } from '../../../../opensearch_dashboards_react/public';

interface GetFieldStatsColumnsParams {
  expandedRows: Set<string>;
  onRowExpand: (fieldName: string) => void;
}

/**
 * Renders an error badge with tooltip for fields that failed to load statistics
 */
const renderErrorBadge = (errorMessage?: string) => (
  <EuiToolTip
    content={
      errorMessage ||
      i18n.translate('explore.fieldStats.table.failedToLoadStatistics', {
        defaultMessage: 'Failed to load statistics',
      })
    }
  >
    <EuiBadge color="danger">
      {i18n.translate('explore.fieldStats.table.errorIndicator', {
        defaultMessage: 'Error',
      })}
    </EuiBadge>
  </EuiToolTip>
);

export const getFieldStatsColumns = ({
  expandedRows,
  onRowExpand,
}: GetFieldStatsColumnsParams): Array<EuiBasicTableColumn<FieldStatsItem>> => {
  return [
    {
      width: '40px',
      isExpander: true,
      render: (item: FieldStatsItem) => (
        <EuiButtonIcon
          onClick={() => onRowExpand(item.name)}
          aria-label={
            expandedRows.has(item.name)
              ? i18n.translate('explore.fieldStats.table.collapseAriaLabel', {
                  defaultMessage: 'Collapse',
                })
              : i18n.translate('explore.fieldStats.table.expandAriaLabel', {
                  defaultMessage: 'Expand',
                })
          }
          iconType={expandedRows.has(item.name) ? 'arrowDown' : 'arrowRight'}
          data-test-subj={`fieldStatsExpandButton-${item.name}`}
        />
      ),
    },
    {
      field: 'type',
      name: i18n.translate('explore.fieldStats.table.typeColumnLabel', {
        defaultMessage: 'Type',
      }),
      sortable: true,
      width: '60px',
      align: 'center',
      render: (type: string) => <FieldIcon type={type} size="s" />,
    },
    {
      field: 'name',
      name: i18n.translate('explore.fieldStats.table.fieldNameColumnLabel', {
        defaultMessage: 'Field Name',
      }),
      sortable: true,
      render: (name: string) => <strong>{name}</strong>,
    },
    {
      field: 'docCount',
      name: i18n.translate('explore.fieldStats.table.documentCountColumnLabel', {
        defaultMessage: 'Document Count',
      }),
      sortable: true,
      width: '200px',
      align: 'right',
      render: (docCount: number, item: FieldStatsItem) => {
        if (item.errorMessage) {
          return renderErrorBadge(item.errorMessage);
        }

        // Show emdash ONLY when percentage couldn't be calculated (total count fetch failed)
        // 0% is a valid percentage and should be displayed
        const percentageDisplay =
          item.docPercentage !== undefined ? `${item.docPercentage.toFixed(1)}%` : '—';

        return (
          <span>
            {docCount.toLocaleString()} ({percentageDisplay})
          </span>
        );
      },
    },
    {
      field: 'distinctCount',
      name: i18n.translate('explore.fieldStats.table.distinctValuesColumnLabel', {
        defaultMessage: 'Distinct Values',
      }),
      sortable: true,
      width: '180px',
      align: 'right',
      render: (count: number, item: FieldStatsItem) => {
        if (item.errorMessage) {
          return renderErrorBadge(item.errorMessage);
        }
        return count?.toLocaleString() || '—';
      },
    },
  ];
};
