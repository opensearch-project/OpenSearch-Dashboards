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
  values: Array<{ label: string; value: string | number | null }>;
}

const emptyHits: NonNullable<IPrometheusSearchResult['instantHits']>['hits'] = [];

const extractValueColumns = (
  source: Record<string, unknown>
): Array<{ label: string; value: string | number | null }> => {
  const valueColumns: Array<{ label: string; value: string | number | null }> = [];
  const valueKeys = Object.keys(source).filter((key) => key.startsWith('Value #'));

  if (valueKeys.length > 0) {
    valueKeys.sort().forEach((key) => {
      const label = key.replace('Value ', '');
      const val = source[key];
      valueColumns.push({
        label,
        value: val !== undefined && val !== null ? (val as string | number) : null,
      });
    });
  } else if (source.Value !== undefined) {
    valueColumns.push({ label: '', value: source.Value as string | number });
  }

  return valueColumns;
};

const formatMetricString = (source: Record<string, unknown>, expanded: boolean): string => {
  const metric = source.Metric as string;
  if (!expanded) return metric;

  const match = metric.match(/^([^{]*)\{(.*)\}$/);
  if (match) {
    const [, metricName, labelsStr] = match;
    const labels = labelsStr.split(', ');
    const indent = '    ';
    return `${metricName}{\n${indent}${labels.join(',\n' + indent)}\n}`;
  }
  return metric;
};

export const MetricsRawTable: React.FC<MetricsRawTableProps> = ({ searchResult }) => {
  const [expanded, setExpanded] = useState(false);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 });

  const rows = searchResult?.instantHits?.hits || emptyHits;

  const valueColumnLabels = useMemo(() => {
    if (rows.length === 0) return [''];
    const firstSource = rows[0]._source || {};
    const valueColumns = extractValueColumns(firstSource);
    return valueColumns.map((vc) => vc.label);
  }, [rows]);

  const tableData: RawTableRow[] = useMemo(() => {
    return rows.map((hit, index) => {
      const source = hit._source || {};
      return {
        id: index,
        metricString: formatMetricString(source, expanded),
        values: extractValueColumns(source),
      };
    });
  }, [rows, expanded]);

  const columns: Array<EuiBasicTableColumn<RawTableRow>> = useMemo(() => {
    const baseColumns: Array<EuiBasicTableColumn<RawTableRow>> = [
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
    ];

    // Add value columns dynamically based on query labels
    valueColumnLabels.forEach((label, index) => {
      const columnName = label
        ? i18n.translate('explore.metricsRawTable.valueColumnWithLabel', {
            defaultMessage: 'Value {label}',
            values: { label },
          })
        : i18n.translate('explore.metricsRawTable.valueColumn', {
            defaultMessage: 'Value',
          });

      baseColumns.push({
        field: 'values',
        name: columnName,
        align: 'right',
        style: { verticalAlign: 'top' },
        render: (values: Array<{ label: string; value: string | number | null }>) => {
          const valueEntry = values[index];
          const displayValue =
            valueEntry?.value !== null && valueEntry?.value !== undefined ? valueEntry.value : '—';
          return (
            <EuiText size="s">
              <code>{displayValue}</code>
            </EuiText>
          );
        },
      });
    });

    return baseColumns;
  }, [valueColumnLabels]);

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
          <EuiBasicTable items={paginatedData} columns={columns} tableLayout="auto" />
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
