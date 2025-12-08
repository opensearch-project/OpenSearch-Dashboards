/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiBasicTable,
  EuiBasicTableColumn,
  EuiButtonIcon,
  EuiCopy,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSwitch,
  EuiSpacer,
  EuiTablePagination,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import React, { useMemo, useState } from 'react';
import { IPrometheusSearchResult } from '../../application/utils/state_management/slices';
import './metrics_raw_table.scss';

export interface MetricsRawTableProps {
  searchResult?: IPrometheusSearchResult;
}

interface RawTableRow {
  id: number;
  metricString: string;
  value: string | number;
}

const RESERVED_FIELDS = ['Time', 'Value', '__name__'];

const emptyHits: NonNullable<IPrometheusSearchResult['instantHits']>['hits'] = [];

/**
 * Formats a Prometheus metric in the raw format:
 * metric_name{label1="value1", label2="value2"} value
 *
 * In expanded mode:
 * metric_name{
 *     label1="value1",
 *     label2="value2"
 * }
 */
const formatMetricString = (source: Record<string, unknown>, expanded: boolean): string => {
  const metricName = (source.__name__ as string) || '';
  const labels: string[] = [];

  // Collect all labels (non-reserved fields)
  Object.entries(source).forEach(([key, val]) => {
    if (!RESERVED_FIELDS.includes(key) && val !== undefined && val !== null) {
      labels.push(`${key}="${String(val)}"`);
    }
  });

  if (labels.length === 0) {
    return metricName;
  }

  if (expanded) {
    const indent = '    ';
    return `${metricName}{\n${indent}${labels.join(',\n' + indent)}\n}`;
  }

  return `${metricName}{${labels.join(', ')}}`;
};

export const MetricsRawTable: React.FC<MetricsRawTableProps> = ({ searchResult }) => {
  const [expanded, setExpanded] = useState(false);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 });

  const rows = searchResult?.instantHits?.hits || emptyHits;

  const tableData: RawTableRow[] = useMemo(() => {
    return rows.map((hit, index) => {
      const source = hit._source || {};
      return {
        id: index,
        metricString: formatMetricString(source, expanded),
        value: source.Value !== undefined ? source.Value : '—',
      };
    });
  }, [rows, expanded]);

  const columns: Array<EuiBasicTableColumn<RawTableRow>> = useMemo(
    () => [
      {
        field: 'metricString',
        name: i18n.translate('explore.metricsRawTable.metricColumn', {
          defaultMessage: 'Metric',
        }),
        render: (metricString: string) => (
          <EuiFlexGroup gutterSize="s" alignItems="flexStart" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiCopy textToCopy={metricString}>
                {(copy) => (
                  <EuiButtonIcon
                    iconType="copy"
                    onClick={copy}
                    aria-label={i18n.translate('explore.metricsRawTable.copyMetricAriaLabel', {
                      defaultMessage: 'Copy metric to clipboard',
                    })}
                    color="text"
                    size="xs"
                  />
                )}
              </EuiCopy>
            </EuiFlexItem>
            <EuiFlexItem grow>
              <EuiText size="s" style={{ whiteSpace: 'pre-wrap' }}>
                <code>{metricString}</code>
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        ),
      },
      {
        field: 'value',
        name: i18n.translate('explore.metricsRawTable.valueColumn', {
          defaultMessage: 'Value',
        }),
        align: 'right',
        width: '150px',
        style: { verticalAlign: 'top' },
        render: (value: string | number) => (
          <EuiText size="s">
            <code>{value}</code>
          </EuiText>
        ),
      },
    ],
    []
  );

  const paginatedData = useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize;
    return tableData.slice(start, start + pagination.pageSize);
  }, [tableData, pagination]);

  const pageCount = Math.ceil(tableData.length / pagination.pageSize);

  return (
    <>
      <EuiSpacer size="s" />
      <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
        <EuiFlexItem grow={false}>
          <EuiSwitch
            label={i18n.translate('explore.metricsRawTable.expandResultsLabel', {
              defaultMessage: 'Expand results',
            })}
            checked={expanded}
            onChange={(e) => setExpanded(e.target.checked)}
            compressed
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiText size="s">
            <FormattedMessage
              id="explore.metricsRawTable.resultSeriesCount"
              defaultMessage="Result series: {count}"
              values={{ count: tableData.length }}
            />
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="s" />
      <div className="metricsRawTable">
        <div className="metricsRawTable__tableContainer">
          <EuiBasicTable items={paginatedData} columns={columns} />
        </div>
        {tableData.length > 0 && (
          <div className="metricsRawTable__pagination">
            <EuiTablePagination
              activePage={pagination.pageIndex}
              itemsPerPage={pagination.pageSize}
              itemsPerPageOptions={[25, 50, 100]}
              pageCount={pageCount}
              onChangePage={(pageIndex) => setPagination((prev) => ({ ...prev, pageIndex }))}
              onChangeItemsPerPage={(pageSize) => setPagination({ pageIndex: 0, pageSize })}
            />
          </div>
        )}
      </div>
    </>
  );
};
