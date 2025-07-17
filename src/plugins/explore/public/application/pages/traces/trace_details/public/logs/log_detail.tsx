/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiButton, EuiDataGridColumn, EuiPanel } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import moment from 'moment';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RenderCustomDataGrid } from '../utils/custom_datagrid';
import { PPLService } from '../../server/ppl_request_helpers';
import { fetchLogsData } from '../../server/ppl_request_logs';
import { PanelTitle } from '../utils/helper_functions';
import { LogEntry, parseLogHits } from './ppl_to_log_hits';
import { redirectToLogs } from '../utils/redirection_helpers';
import { useOpenSearchDashboards } from '../../../../../../../../opensearch_dashboards_react/public';
import { DataExplorerServices } from '../../../../../../../../data_explorer/public';
import { TraceHit } from '../traces/ppl_to_trace_hits';
import { TRACE_ANALYTICS_DATE_FORMAT } from '../utils/shared_const';

interface LogsDetailsProps {
  traceId: string;
  dataSourceId: string;
  pplService?: PPLService;
  availableWidth?: number;
  traceData: TraceHit[];
}

const getLogColumns = (availableWidth?: number): EuiDataGridColumn[] => {
  // Use the available width or a default of 1200px
  const baseWidth = availableWidth || 1200;

  // Calculate the total width available for columns after accounting for padding and scrollbar
  const effectiveWidth = baseWidth - 40; // 40px for padding and scrollbar

  // Define column proportions
  const columnProportions = {
    time: 0.15,
    spanId: 0.15,
    severity: 0.1,
    number: 0.1,
    body: 0.5,
  };

  const getWidth = (proportion: number) => Math.max(100, Math.floor(effectiveWidth * proportion));

  return [
    {
      id: '@timestamp',
      display: i18n.translate('explore.logs.column.time', {
        defaultMessage: 'Time',
      }),
      initialWidth: getWidth(columnProportions.time),
    },
    {
      id: 'spanId',
      display: i18n.translate('explore.logs.column.spanId', {
        defaultMessage: 'Span ID',
      }),
      initialWidth: getWidth(columnProportions.spanId),
    },
    {
      id: 'severityText',
      display: i18n.translate('explore.logs.column.severityText', {
        defaultMessage: 'Severity Text',
      }),
      initialWidth: getWidth(columnProportions.severity),
    },
    {
      id: 'severityNumber',
      display: i18n.translate('explore.logs.column.severityNumber', {
        defaultMessage: 'Severity Number',
      }),
      initialWidth: getWidth(columnProportions.number),
    },
    {
      id: 'body',
      display: i18n.translate('explore.logs.column.body', {
        defaultMessage: 'Body',
      }),
      initialWidth: getWidth(columnProportions.body),
    },
  ];
};

const renderLogCellValue = ({
  rowIndex,
  columnId,
  items,
}: {
  rowIndex: number;
  columnId: string;
  items: LogEntry[];
}) => {
  const item = items[rowIndex];
  if (!item) return '-';

  const value = item[columnId];

  switch (columnId) {
    case '@timestamp':
      // Handle different timestamp formats
      const timestamp = value || item.time || item.observedTimestamp;
      if (!timestamp) return '-';

      try {
        // Handle the format "2025-06-06 21:05:09.550788"
        let dateStr = timestamp;
        if (typeof timestamp === 'string' && !timestamp.includes('T') && !timestamp.includes('Z')) {
          // Convert space-separated format to ISO format
          dateStr = timestamp.replace(' ', 'T') + 'Z';
        }
        return moment(dateStr).format(TRACE_ANALYTICS_DATE_FORMAT);
      } catch (error) {
        // Silently handle error and return string representation
        return String(timestamp);
      }
    case 'spanId':
      return value || '-';
    case 'severityText':
      return value || '-';
    case 'severityNumber':
      return value !== undefined && value !== null ? value.toString() : '-';
    case 'body':
      return value || '-';
    default:
      return value || '-';
  }
};

export function LogsDetails({
  traceId,
  dataSourceId,
  pplService,
  availableWidth,
  traceData,
}: LogsDetailsProps) {
  const [items, setItems] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { services } = useOpenSearchDashboards<DataExplorerServices>();
  const [tableParams, setTableParams] = useState({
    page: 0,
    size: 10,
    sortingColumns: [] as Array<{
      id: string;
      direction: 'asc' | 'desc';
    }>,
  });

  const handleFetchLogData = useCallback(async () => {
    if (!pplService || !traceId || !dataSourceId) {
      setError(
        i18n.translate('explore.logs.error.missingParameters', {
          defaultMessage: 'Missing required parameters for log fetch',
        })
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch raw response data from PPL service
      const rawResponse = await fetchLogsData({
        traceId,
        dataSourceId,
        pplService,
      });

      // Transform the raw response using parseLogHits from ppl_to_log_hits
      const hitsArray = parseLogHits(rawResponse);
      let logs = hitsArray.map((hit) => hit._source);

      // Apply sorting if needed
      if (tableParams.sortingColumns.length > 0) {
        logs = logs.sort((a, b) => {
          for (const { id, direction } of tableParams.sortingColumns) {
            let aValue = a[id];
            let bValue = b[id];

            // Special handling for timestamp
            if (id === '@timestamp') {
              aValue = aValue || a.time || a.observedTimestamp;
              bValue = bValue || b.time || b.observedTimestamp;
            }

            if (aValue < bValue) return direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return direction === 'asc' ? 1 : -1;
          }
          return 0;
        });
      }

      // Apply pagination
      const start = tableParams.page * tableParams.size;
      const end = start + tableParams.size;
      const pageItems = logs.slice(start, end);

      setItems(pageItems);
      setTotal(logs.length);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [traceId, dataSourceId, pplService, tableParams]);

  // Debounced fetch effect
  useEffect(() => {
    if (traceId && dataSourceId && pplService) {
      const timeoutId = setTimeout(() => {
        handleFetchLogData();
      }, 300); // 300ms debounce

      return () => clearTimeout(timeoutId);
    }
  }, [traceId, dataSourceId, pplService, handleFetchLogData]);

  const columns = useMemo(() => getLogColumns(availableWidth), [availableWidth]);

  const renderCellValue = useCallback(
    ({ rowIndex, columnId }) =>
      renderLogCellValue({
        rowIndex,
        columnId,
        items,
      }),
    [items]
  );

  const visibleColumns = useMemo(() => columns.map(({ id }) => id), [columns]);

  const viewLogsButton = useMemo(
    () => (
      <EuiButton
        size="s"
        iconType="discoverApp"
        onClick={() => {
          if (dataSourceId && traceId && services && traceData.length > 0) {
            // Create the dataSourceMDSId array with the required format
            const dataSourceMDSId = [{ id: dataSourceId, label: 'DockerTest' }]; // TODO replace with label
            // Use traceData for redirection instead of logs data
            redirectToLogs(traceData, dataSourceMDSId, traceId, services);
          } else {
            // Cannot redirect due to missing parameters
            setError(
              i18n.translate('explore.logs.error.missingRedirectionParameters', {
                defaultMessage: 'Missing required parameters for log redirection',
              })
            );
          }
        }}
      >
        {i18n.translate('explore.logs.button.viewAssociatedLogs', {
          defaultMessage: 'View associated Logs',
        })}
      </EuiButton>
    ),
    [traceData, dataSourceId, traceId, services]
  );

  if (error) {
    return (
      <EuiPanel>
        <PanelTitle
          title={i18n.translate('explore.logs.panel.title', {
            defaultMessage: 'Logs',
          })}
        />
        <div>
          {i18n.translate('explore.logs.error.loading', {
            defaultMessage: 'Error loading logs: {errorMessage}',
            values: { errorMessage: error },
          })}
        </div>
      </EuiPanel>
    );
  }

  return (
    <EuiPanel data-test-subj="logs-panel">
      <PanelTitle
        title={i18n.translate('explore.logs.panel.title', {
          defaultMessage: 'Logs',
        })}
        totalItems={total}
        action={viewLogsButton}
      />
      <div style={{ marginTop: '16px', overflowY: 'auto', maxHeight: 500 }}>
        {RenderCustomDataGrid({
          columns,
          renderCellValue,
          rowCount: total,
          visibleColumns,
          availableWidth,
          isTableDataLoading: isLoading,
          fullScreen: false,
          sorting: {
            columns: tableParams.sortingColumns,
            onSort: (sortingColumns: Array<{ id: string; direction: 'asc' | 'desc' }>) =>
              setTableParams((prev) => ({ ...prev, sortingColumns, page: 0 })),
          },
          pagination: {
            pageIndex: tableParams.page,
            pageSize: tableParams.size,
            pageSizeOptions: [10, 50, 100],
            onChangePage: (page: number) => setTableParams((prev) => ({ ...prev, page })),
            onChangeItemsPerPage: (size: number) =>
              setTableParams((prev) => ({ ...prev, size, page: 0 })),
          },
        })}
      </div>
    </EuiPanel>
  );
}
