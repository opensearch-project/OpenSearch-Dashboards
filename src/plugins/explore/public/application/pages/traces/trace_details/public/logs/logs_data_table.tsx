/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useMemo } from 'react';
import { EuiBasicTable, EuiBasicTableColumn, EuiText, EuiBadge } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { LogHit } from '../../server/ppl_request_logs';

interface TableChangeParams {
  page?: {
    index: number;
    size: number;
  };
  sort?: {
    field: keyof LogHit;
    direction: 'asc' | 'desc';
  };
}

export interface LogsDataTableProps {
  logs: LogHit[];
  isLoading?: boolean;
  onSpanClick?: (spanId: string) => void;
  compactMode?: boolean; // When true, shows only the message column
}

export const LogsDataTable: React.FC<LogsDataTableProps> = ({
  logs,
  isLoading = false,
  onSpanClick,
  compactMode = false,
}) => {
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(50);
  const [sortField, setSortField] = React.useState<keyof LogHit>('timestamp');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc');

  const columns: Array<EuiBasicTableColumn<LogHit>> = useMemo(() => {
    const allColumns = [
      {
        field: 'timestamp',
        name: i18n.translate('explore.logsDataTable.column.timestamp', {
          defaultMessage: 'Time',
        }),
        sortable: true,
        width: '140px',
        render: (timestamp: string) => (
          <EuiText size="xs" style={{ fontFamily: 'monospace' }}>
            {new Date(timestamp).toLocaleString()}
          </EuiText>
        ),
      },
      {
        field: 'level',
        name: i18n.translate('explore.logsDataTable.column.level', {
          defaultMessage: 'Level',
        }),
        sortable: true,
        width: '80px',
        render: (level: string) => {
          if (!level) return <span>-</span>;
          const color = level.toLowerCase() === 'error' ? 'danger' : 'default';
          return <EuiBadge color={color}>{level}</EuiBadge>;
        },
      },
      {
        field: 'message',
        name: i18n.translate('explore.logsDataTable.column.message', {
          defaultMessage: 'Message',
        }),
        sortable: false,
        render: (message: string) => (
          <EuiText size="xs" style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
            {message || 'N/A'}
          </EuiText>
        ),
      },
      {
        field: 'spanId',
        name: i18n.translate('explore.logsDataTable.column.spanId', {
          defaultMessage: 'Span ID',
        }),
        sortable: false,
        width: '200px',
        render: (spanId: string) => {
          if (!spanId) return <span>-</span>;
          return (
            <EuiText
              size="xs"
              style={{
                fontFamily: 'monospace',
                wordBreak: 'break-all',
                color: onSpanClick ? '#006BB4' : 'inherit',
                cursor: onSpanClick ? 'pointer' : 'default',
                textDecoration: onSpanClick ? 'underline' : 'none',
              }}
              onClick={() => onSpanClick && onSpanClick(spanId)}
            >
              {spanId}
            </EuiText>
          );
        },
      },
    ];

    if (compactMode) {
      return allColumns.filter((column) => column.field === 'message');
    }

    return allColumns;
  }, [onSpanClick, compactMode]);

  const sortedLogs = useMemo(() => {
    // In compact mode, show all logs without sorting or pagination
    if (compactMode) {
      return logs;
    }

    const sorted = [...logs].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      if (sortField === 'timestamp') {
        aValue = a.timestamp;
        bValue = b.timestamp;
      } else if (sortField === 'level') {
        aValue = a.level || '';
        bValue = b.level || '';
      } else {
        aValue = '';
        bValue = '';
      }

      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });

    const startIndex = pageIndex * pageSize;
    return sorted.slice(startIndex, startIndex + pageSize);
  }, [logs, sortField, sortDirection, pageIndex, pageSize, compactMode]);

  const pagination = useMemo(
    () => ({
      pageIndex,
      pageSize,
      totalItemCount: logs.length,
      pageSizeOptions: [10, 25, 50, 100],
    }),
    [pageIndex, pageSize, logs.length]
  );

  const onTableChange = ({ page, sort }: TableChangeParams) => {
    if (page) {
      setPageIndex(page.index);
      setPageSize(page.size);
    }
    if (sort) {
      setSortField(sort.field);
      setSortDirection(sort.direction);
    }
  };

  if (isLoading) {
    return <div>Loading logs...</div>;
  }

  const tableProps = {
    items: sortedLogs,
    columns,
    loading: isLoading,
    tableLayout: 'auto' as const,
    'data-test-subj': 'logs-data-table',
    ...(compactMode
      ? {}
      : {
          pagination,
          sorting: {
            sort: {
              field: sortField,
              direction: sortDirection,
            },
          },
          onChange: onTableChange,
        }),
  };

  return <EuiBasicTable {...tableProps} />;
};
