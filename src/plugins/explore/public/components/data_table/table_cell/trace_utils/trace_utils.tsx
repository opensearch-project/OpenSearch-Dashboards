/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiToolTip, EuiLink, EuiIcon } from '@elastic/eui';
import { i18n } from '@osd/i18n';

export const isOnTracesPage = (): boolean => {
  return (
    window.location.pathname.includes('/explore/traces') ||
    window.location.hash.includes('/explore/traces')
  );
};

export const isSpanIdColumn = (columnId: string): boolean => {
  return columnId === 'spanId' || columnId === 'span_id' || columnId === 'spanID';
};

export const extractTraceIdFromRowData = (rowData: any): string => {
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

export const buildTraceDetailsUrl = (
  spanIdValue: string,
  traceIdValue: string,
  dataset: any
): string => {
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

export const handleSpanIdNavigation = (
  sanitizedCellValue: string,
  rowData: any,
  dataset: any
): void => {
  // Get the spanId value from the sanitized cell value (strip HTML tags)
  const spanIdValue = sanitizedCellValue.replace(/<[^>]*>/g, '').trim();

  // Extract traceId from row data
  const traceIdValue = extractTraceIdFromRowData(rowData);

  // Build and open the URL
  const fullPageUrl = buildTraceDetailsUrl(spanIdValue, traceIdValue, dataset);
  window.open(fullPageUrl, '_blank');
};

export interface SpanIdLinkProps {
  sanitizedCellValue: string;
  rowData: any;
  dataset: any;
}

export const SpanIdLink: React.FC<SpanIdLinkProps> = ({ sanitizedCellValue, rowData, dataset }) => {
  const handleSpanIdClick = () => {
    handleSpanIdNavigation(sanitizedCellValue, rowData, dataset);
  };

  return (
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
  );
};
