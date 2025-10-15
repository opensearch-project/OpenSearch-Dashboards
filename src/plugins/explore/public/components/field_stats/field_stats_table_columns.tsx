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
        if (item.error) {
          return (
            <EuiToolTip
              content={i18n.translate('explore.fieldStats.table.failedToLoadStatistics', {
                defaultMessage: 'Failed to load statistics',
              })}
            >
              <EuiBadge>
                {i18n.translate('explore.fieldStats.table.errorIndicator', {
                  defaultMessage: 'Unsupported',
                })}
              </EuiBadge>
            </EuiToolTip>
          );
        }
        return (
          <span>
            {docCount.toLocaleString()} ({item.docPercentage.toFixed(1)}%)
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
        if (item.error) {
          return (
            <EuiToolTip
              content={i18n.translate('explore.fieldStats.table.failedToLoadStatistics', {
                defaultMessage: 'Failed to load statistics',
              })}
            >
              <EuiBadge>
                {i18n.translate('explore.fieldStats.table.errorIndicator', {
                  defaultMessage: 'Unsupported',
                })}
              </EuiBadge>
            </EuiToolTip>
          );
        }
        return count?.toLocaleString() || '—';
      },
    },
  ];
};
