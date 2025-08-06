/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './table_cell.scss';

import React from 'react';
import { EuiButtonIcon, EuiToolTip, EuiLink, EuiIcon } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { DocViewFilterFn } from '../../../types/doc_views_types';
import { useDatasetContext } from '../../../application/context';

export interface ITableCellProps {
  columnId: string;
  isTimeField?: boolean;
  onFilter?: DocViewFilterFn;
  fieldMapping?: any;
  sanitizedCellValue: string;
  rowData?: any;
}

// Custom URL functionality for trace navigation
const isOnTracesPage = (): boolean => {
  return (
    window.location.pathname.includes('/explore/traces') ||
    window.location.hash.includes('/explore/traces')
  );
};

const isSpanIdColumn = (columnId: string): boolean => {
  return columnId === 'spanId' || columnId === 'span_id' || columnId === 'spanID';
};

const extractTraceIdFromRowData = (rowData: any): string => {
  if (!rowData) return '';

  const possibleTraceIdFields = [
    'traceId',
    'trace_id',
    'traceID',
    '_source.traceId',
    '_source.trace_id',
    '_source.traceID',
  ];

  for (const field of possibleTraceIdFields) {
    const value = field.includes('.')
      ? field.split('.').reduce((obj, key) => obj?.[key], rowData)
      : rowData[field];

    if (value && typeof value === 'string') {
      return value;
    }
  }

  return '';
};

const buildTraceDetailsUrl = (spanIdValue: string, traceIdValue: string, dataset: any): string => {
  const origin = window.location.origin;
  const pathname = window.location.pathname;

  // Get the base path before /app
  const basePathMatch = pathname.match(/^(.*?)\/app/);
  const basePath = basePathMatch ? basePathMatch[1] : '';

  // Construct the URL with both spanId and traceId
  const urlParams = `dataset:(id:'${dataset?.id || 'default-dataset-id'}',title:'${
    dataset?.title || 'otel-v1-apm-span-*'
  }',type:'${dataset?.type || 'INDEX_PATTERN'}'),spanId:'${spanIdValue}'`;
  const urlParamsWithTrace = traceIdValue ? `${urlParams},traceId:'${traceIdValue}'` : urlParams;

  return `${origin}${basePath}/app/explore/traces/traceDetails#/?_a=(${urlParamsWithTrace})`;
};

const handleSpanIdNavigation = (sanitizedCellValue: string, rowData: any, dataset: any): void => {
  // Get the spanId value from the sanitized cell value (strip HTML tags)
  const spanIdValue = sanitizedCellValue.replace(/<[^>]*>/g, '').trim();

  // Extract traceId from row data
  const traceIdValue = extractTraceIdFromRowData(rowData);

  // Build and open the URL
  const fullPageUrl = buildTraceDetailsUrl(spanIdValue, traceIdValue, dataset);
  window.open(fullPageUrl, '_blank');
};

export const TableCellUI = ({
  columnId,
  isTimeField,
  onFilter,
  fieldMapping,
  sanitizedCellValue,
  rowData,
}: ITableCellProps) => {
  const { dataset } = useDatasetContext();

  const handleSpanIdClick = () => {
    if (!isSpanIdColumn(columnId) || !isOnTracesPage()) return;
    handleSpanIdNavigation(sanitizedCellValue, rowData, dataset);
  };

  const dataFieldContent =
    isSpanIdColumn(columnId) && isOnTracesPage() ? (
      <EuiToolTip
        content={i18n.translate('explore.spanIdLink.redirectTooltip', {
          defaultMessage: 'Redirect to trace details',
        })}
      >
        <EuiLink
          onClick={handleSpanIdClick}
          data-test-subj="spanIdLink"
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          {sanitizedCellValue.replace(/<[^>]*>/g, '').trim()}
          <EuiIcon type="popout" size="s" />
        </EuiLink>
      </EuiToolTip>
    ) : (
      <span
        className="exploreDocTableCell__dataField"
        data-test-subj="osdDocTableCellDataField"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: sanitizedCellValue }}
      />
    );

  const content = (
    <>
      {dataFieldContent}
      <span className="exploreDocTableCell__filter" data-test-subj="osdDocTableCellFilter">
        <EuiToolTip
          content={i18n.translate('explore.filterForValue', {
            defaultMessage: 'Filter for value',
          })}
        >
          <EuiButtonIcon
            size="xs"
            onClick={() => onFilter?.(columnId, fieldMapping, '+')}
            iconType="plusInCircle"
            aria-label={i18n.translate('explore.filterForValue', {
              defaultMessage: 'Filter for value',
            })}
            data-test-subj="filterForValue"
            className="exploreDocTableCell__filterButton"
          />
        </EuiToolTip>
        <EuiToolTip
          content={i18n.translate('explore.filterOutValue', {
            defaultMessage: 'Filter out value',
          })}
        >
          <EuiButtonIcon
            size="xs"
            onClick={() => onFilter?.(columnId, fieldMapping, '-')}
            iconType="minusInCircle"
            aria-label={i18n.translate('explore.filterOutValue', {
              defaultMessage: 'Filter out value',
            })}
            data-test-subj="filterOutValue"
            className="exploreDocTableCell__filterButton"
          />
        </EuiToolTip>
      </span>
    </>
  );

  return isTimeField ? (
    <td data-test-subj="docTableField" className="exploreDocTableCell eui-textNoWrap">
      {content}
    </td>
  ) : (
    <td
      data-test-subj="docTableField"
      className="exploreDocTableCell eui-textBreakAll eui-textBreakWord"
    >
      <div className="truncate-by-height">{content}</div>
    </td>
  );
};

export const TableCell = React.memo(TableCellUI);
