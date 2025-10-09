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
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiIcon,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { LogHit } from '../../server/ppl_request_logs';

export interface DatasetLogsTableProps {
  logs: LogHit[];
  isLoading?: boolean;
  onSpanClick?: (spanId: string) => void;
}

export const DatasetLogsTable: React.FC<DatasetLogsTableProps> = ({
  logs,
  isLoading = false,
  onSpanClick,
}) => {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<keyof LogHit>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getLevelColor = (level?: string) => {
    if (!level) return 'default';
    const lowerLevel = level.toLowerCase();
    switch (lowerLevel) {
      case 'error':
        return 'danger';
      case 'warn':
      case 'warning':
        return 'warning';
      case 'info':
        return 'primary';
      case 'debug':
        return 'default';
      default:
        return 'default';
    }
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
    return [
      getExpandIconColumn(),
      {
        field: 'timestamp',
        name: i18n.translate('explore.datasetLogsTable.column.timestamp', {
          defaultMessage: 'Time',
        }),
        sortable: true,
        width: '180px',
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
        width: '100px',
        render: (level: string) => {
          if (!level) return <span>-</span>;
          return <EuiBadge color={getLevelColor(level)}>{level}</EuiBadge>;
        },
      },
      {
        field: 'message',
        name: i18n.translate('explore.datasetLogsTable.column.message', {
          defaultMessage: 'Message',
        }),
        sortable: false,
        render: (message: string) => (
          <EuiText size="xs" style={{ wordBreak: 'break-word' }}>
            {message || 'N/A'}
          </EuiText>
        ),
      },
    ];
  }, [getExpandIconColumn]);

  const itemIdToExpandedRowMap = useMemo(() => {
    const expandedRowMap: Record<string, React.ReactNode> = {};

    expandedRows.forEach((logId) => {
      const log = logs.find((l) => l._id === logId);
      if (log) {
        expandedRowMap[logId] = (
          <EuiPanel color="subdued" paddingSize="s">
            <EuiFlexGroup direction="column" gutterSize="s">
              <EuiFlexItem>
                <EuiFlexGroup gutterSize="m">
                  <EuiFlexItem grow={false} style={{ minWidth: '100px' }}>
                    <EuiText size="xs">
                      <strong>
                        {i18n.translate('explore.datasetLogsTable.timestamp', {
                          defaultMessage: 'Timestamp:',
                        })}
                      </strong>
                    </EuiText>
                  </EuiFlexItem>
                  <EuiFlexItem>
                    <EuiText size="xs" style={{ fontFamily: 'monospace' }}>
                      {formatTimestamp(log.timestamp)}
                    </EuiText>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiFlexItem>

              {log.level && (
                <EuiFlexItem>
                  <EuiFlexGroup gutterSize="m">
                    <EuiFlexItem grow={false} style={{ minWidth: '100px' }}>
                      <EuiText size="xs">
                        <strong>
                          {i18n.translate('explore.datasetLogsTable.level', {
                            defaultMessage: 'Level:',
                          })}
                        </strong>
                      </EuiText>
                    </EuiFlexItem>
                    <EuiFlexItem>
                      <EuiBadge color={getLevelColor(log.level)}>{log.level}</EuiBadge>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiFlexItem>
              )}

              <EuiFlexItem>
                <EuiFlexGroup gutterSize="m">
                  <EuiFlexItem grow={false} style={{ minWidth: '100px' }}>
                    <EuiText size="xs">
                      <strong>
                        {i18n.translate('explore.datasetLogsTable.message', {
                          defaultMessage: 'Message:',
                        })}
                      </strong>
                    </EuiText>
                  </EuiFlexItem>
                  <EuiFlexItem>
                    <EuiText size="xs" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {log.message || 'N/A'}
                    </EuiText>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiFlexItem>

              {log.spanId && (
                <EuiFlexItem>
                  <EuiFlexGroup gutterSize="m">
                    <EuiFlexItem grow={false} style={{ minWidth: '100px' }}>
                      <EuiText size="xs">
                        <strong>
                          {i18n.translate('explore.datasetLogsTable.spanId', {
                            defaultMessage: 'Span ID:',
                          })}
                        </strong>
                      </EuiText>
                    </EuiFlexItem>
                    <EuiFlexItem>
                      <EuiText
                        size="xs"
                        style={{
                          fontFamily: 'monospace',
                          wordBreak: 'break-all',
                          color: onSpanClick ? '#006BB4' : 'inherit',
                          cursor: onSpanClick ? 'pointer' : 'default',
                          textDecoration: onSpanClick ? 'underline' : 'none',
                        }}
                        onClick={() => onSpanClick && onSpanClick(log.spanId!)}
                      >
                        {log.spanId}
                      </EuiText>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiFlexItem>
              )}

              {log.traceId && (
                <EuiFlexItem>
                  <EuiFlexGroup gutterSize="m">
                    <EuiFlexItem grow={false} style={{ minWidth: '100px' }}>
                      <EuiText size="xs">
                        <strong>
                          {i18n.translate('explore.datasetLogsTable.traceId', {
                            defaultMessage: 'Trace ID:',
                          })}
                        </strong>
                      </EuiText>
                    </EuiFlexItem>
                    <EuiFlexItem>
                      <EuiText
                        size="xs"
                        style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}
                      >
                        {log.traceId}
                      </EuiText>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiFlexItem>
              )}
            </EuiFlexGroup>
          </EuiPanel>
        );
      }
    });

    return expandedRowMap;
  }, [expandedRows, logs, onSpanClick]);

  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      if (sortField === 'timestamp') {
        aValue = new Date(a.timestamp).getTime();
        bValue = new Date(b.timestamp).getTime();
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
  }, [logs, sortField, sortDirection]);

  const pagination = useMemo(
    () => ({
      pageIndex,
      pageSize,
      totalItemCount: logs.length,
      pageSizeOptions: [10, 25, 50, 100],
    }),
    [pageIndex, pageSize, logs.length]
  );

  const onTableChange = ({ page, sort }: any) => {
    if (page) {
      setPageIndex(page.index);
      setPageSize(page.size);
    }
    if (sort) {
      setSortField(sort.field);
      setSortDirection(sort.direction);
    }
  };

  if (logs.length === 0 && !isLoading) {
    return (
      <EuiPanel>
        <EuiText textAlign="center" color="subdued">
          {i18n.translate('explore.datasetLogsTable.noLogs', {
            defaultMessage: 'No logs found',
          })}
        </EuiText>
      </EuiPanel>
    );
  }

  return (
    <EuiBasicTable
      items={sortedLogs}
      itemId="_id"
      itemIdToExpandedRowMap={itemIdToExpandedRowMap}
      isExpandable={true}
      columns={columns}
      pagination={pagination}
      loading={isLoading}
      sorting={{
        sort: {
          field: sortField,
          direction: sortDirection,
        },
      }}
      onChange={onTableChange}
      tableLayout="auto"
      data-test-subj="dataset-logs-table"
    />
  );
};
