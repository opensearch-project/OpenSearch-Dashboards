/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  EuiBasicTable,
  EuiBasicTableColumn,
  EuiText,
  EuiBadge,
  EuiIcon,
  EuiCodeBlock,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { LogHit } from '../../server/ppl_request_logs';

export interface DatasetLogsTableProps {
  logs: LogHit[];
  isLoading?: boolean;
  onSpanClick?: (spanId: string) => void;
  compactMode?: boolean; // When true, shows only the message column
}

export const DatasetLogsTable: React.FC<DatasetLogsTableProps> = ({
  logs,
  isLoading = false,
  onSpanClick,
  compactMode = false,
}) => {
  const [sortField, setSortField] = useState<keyof LogHit>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const toggleRowExpansion = useCallback(
    (log: LogHit) => {
      const newExpandedRows = new Set(expandedRows);
      if (newExpandedRows.has(log._id)) {
        newExpandedRows.delete(log._id);
      } else {
        newExpandedRows.add(log._id);
      }
      setExpandedRows(newExpandedRows);
    },
    [expandedRows]
  );

  const getExpandIconColumn = useCallback(
    (): EuiBasicTableColumn<LogHit> => ({
      name: '',
      width: '40px',
      render: (log: LogHit) => {
        const isExpanded = expandedRows.has(log._id);
        return (
          <EuiIcon
            type={isExpanded ? 'arrowDown' : 'arrowRight'}
            style={{ cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              toggleRowExpansion(log);
            }}
            aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
          />
        );
      },
    }),
    [expandedRows, toggleRowExpansion]
  );

  const columns: Array<EuiBasicTableColumn<LogHit>> = useMemo(() => {
    const allColumns = [
      getExpandIconColumn(),
      {
        field: 'timestamp',
        name: i18n.translate('explore.datasetLogsTable.column.timestamp', {
          defaultMessage: 'Time',
        }),
        sortable: true,
        width: '140px',
        render: (timestamp: string) => (
          <EuiText size="xs" style={{ fontFamily: 'monospace' }}>
            {formatTimestamp(timestamp)}
          </EuiText>
        ),
      },
      {
        field: 'level',
        name: i18n.translate('explore.datasetLogsTable.column.level', {
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
        name: i18n.translate('explore.datasetLogsTable.column.message', {
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
        name: i18n.translate('explore.datasetLogsTable.column.spanId', {
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
      return allColumns.filter((column) => 'field' in column && column.field === 'message');
    }

    return allColumns;
  }, [getExpandIconColumn, onSpanClick, compactMode]);

  const itemIdToExpandedRowMap = useMemo(() => {
    const expandedRowMap: Record<string, React.ReactNode> = {};

    expandedRows.forEach((logId) => {
      const log = logs.find((l) => l._id === logId);
      if (log) {
        expandedRowMap[logId] = (
          <div style={{ width: '100%' }}>
            <EuiText size="s" style={{ marginBottom: '8px', fontWeight: 'bold' }}>
              {i18n.translate('explore.datasetLogsTable.message', {
                defaultMessage: 'Message',
              })}
            </EuiText>

            <EuiCodeBlock
              language="text"
              paddingSize="s"
              isCopyable
              style={{ width: '100%', minWidth: '100%' }}
            >
              {log.message || 'N/A'}
            </EuiCodeBlock>
          </div>
        );
      }
    });

    return expandedRowMap;
  }, [expandedRows, logs]);

  const sortedLogs = useMemo(() => {
    // In compact mode, show all logs without sorting
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

    return sorted;
  }, [logs, sortField, sortDirection, compactMode]);

  interface TableChangeParams {
    sort?: {
      field: keyof LogHit;
      direction: 'asc' | 'desc';
    };
  }

  const onTableChange = ({ sort }: TableChangeParams) => {
    if (sort) {
      setSortField(sort.field);
      setSortDirection(sort.direction);
    }
  };

  if (isLoading) {
    return (
      <div>
        {i18n.translate('explore.datasetLogsTable.loadingLogs', {
          defaultMessage: 'Loading logs...',
        })}
      </div>
    );
  }

  const tableProps = {
    items: sortedLogs,
    itemId: '_id' as const,
    itemIdToExpandedRowMap,
    isExpandable: true,
    columns,
    loading: isLoading,
    tableLayout: 'auto' as const,
    'data-test-subj': 'dataset-logs-table',
    ...(compactMode
      ? {}
      : {
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
