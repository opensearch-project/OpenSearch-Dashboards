/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { EuiToolTip, EuiLink, EuiIcon, EuiButtonEmpty } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { SPAN_ID_FIELD_PATHS, TRACE_ID_FIELD_PATHS } from '../../../../utils/trace_field_constants';
import { OpenSearchSearchHit } from '../../../../types/doc_views_types';
import { DataView as Dataset } from '../../../../../../data/common';
import './trace_utils.scss';
import { useTraceFlyoutContext } from '../../../../application/pages/traces/trace_flyout/trace_flyout_context';
import {
  round,
  nanoToMilliSec,
} from '../../../../application/pages/traces/trace_details/public/utils/helper_functions';

export const isOnTracesPage = (): boolean => {
  return (
    window.location.pathname.includes('/explore/traces') ||
    window.location.hash.includes('/explore/traces')
  );
};

export const isSpanIdColumn = (columnId: string): boolean => {
  return columnId === 'spanId' || columnId === 'span_id' || columnId === 'spanID';
};

export const isDurationColumn = (columnId: string) => {
  return columnId === 'durationNano' || columnId === 'durationInNanos';
};

export const extractFieldFromRowData = (
  rowData: OpenSearchSearchHit<Record<string, unknown>>,
  fields: readonly string[]
): string => {
  if (!rowData) return '';

  const getNestedValue = (obj: unknown, path: string): unknown => {
    return path.split('.').reduce((current: unknown, key: string) => {
      return current && typeof current === 'object' && current !== null
        ? (current as Record<string, unknown>)[key]
        : undefined;
    }, obj);
  };

  for (const field of fields) {
    const value = getNestedValue(rowData, field);

    if (value && typeof value === 'string') {
      return value;
    }
  }

  return '';
};

export const buildTraceDetailsUrl = (
  spanIdValue: string = '',
  traceIdValue: string,
  dataset: Dataset
): string => {
  const origin = window.location.origin;
  const pathname = window.location.pathname;

  // Get the base path before /app
  const basePathMatch = pathname.match(/^(.*?)\/app/);
  const basePath = basePathMatch ? basePathMatch[1] : '';

  let datasetParams = `dataset:(id:'${dataset?.id || 'default-dataset-id'}',title:'${
    dataset?.title || 'otel-v1-apm-span-*'
  }',type:'${dataset?.type || 'INDEX_PATTERN'}'`;

  // Add timeFieldName if present
  if (dataset?.timeFieldName) {
    datasetParams += `,timeFieldName:'${dataset.timeFieldName}'`;
  }

  // Add dataSource if present (external data source)
  // Handle both Dataset.dataSource and DataView.dataSourceRef
  const dataSourceInfo = (dataset as any)?.dataSource || (dataset as any)?.dataSourceRef;
  if (dataSourceInfo) {
    datasetParams += `,dataSource:(id:'${dataSourceInfo.id}',title:'${
      dataSourceInfo.title || dataSourceInfo.name
    }',type:'${dataSourceInfo.type}')`;
  }

  datasetParams += ')';

  // Build URL parameters
  const urlParams = `${datasetParams},spanId:'${spanIdValue}'`;
  const urlParamsWithTrace = traceIdValue ? `${urlParams},traceId:'${traceIdValue}'` : urlParams;

  return `${origin}${basePath}/app/explore/traces/traceDetails#/?_a=(${urlParamsWithTrace})`;
};

export const getTraceDetailsUrlParams = (
  spanIdValue: string,
  traceIdValue: string,
  dataset: Dataset
) => {
  const dataSourceInfo = (dataset as any)?.dataSource || (dataset as any)?.dataSourceRef;

  return {
    spanId: spanIdValue,
    ...(traceIdValue && { traceId: traceIdValue }),
    dataset: {
      id: dataset?.id || 'default-dataset-id',
      title: dataset?.title || 'otel-v1-apm-span-*',
      type: dataset?.type || 'INDEX_PATTERN',
      timeFieldName: dataset?.timeFieldName || 'timestamp',
      ...(dataSourceInfo && {
        dataSource: {
          id: dataSourceInfo.id,
          title: dataSourceInfo.title || dataSourceInfo.name,
          type: dataSourceInfo.type,
        },
      }),
    },
  };
};

export const handleSpanIdNavigation = (
  rowData: OpenSearchSearchHit<Record<string, unknown>>,
  dataset: Dataset
): void => {
  // Extract spanId from row data
  const spanIdValue = extractFieldFromRowData(rowData, SPAN_ID_FIELD_PATHS);

  // Extract traceId from row data
  const traceIdValue = extractFieldFromRowData(rowData, TRACE_ID_FIELD_PATHS);

  // Build and open the URL
  const fullPageUrl = buildTraceDetailsUrl(spanIdValue, traceIdValue, dataset);
  window.open(fullPageUrl, '_blank');
};

export interface SpanIdLinkProps {
  sanitizedCellValue: string;
  rowData: OpenSearchSearchHit<Record<string, unknown>>;
  dataset: Dataset;
}

export const SpanIdLink: React.FC<SpanIdLinkProps> = ({ sanitizedCellValue, rowData, dataset }) => {
  const handleSpanIdClick = () => {
    handleSpanIdNavigation(rowData, dataset);
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
        className="exploreSpanIdLink"
      >
        {sanitizedCellValue.replace(/<[^>]*>/g, '').trim()}
        <EuiIcon type="popout" size="s" />
      </EuiLink>
    </EuiToolTip>
  );
};

export interface TraceFlyoutButtonProps {
  sanitizedCellValue: string;
  rowData: OpenSearchSearchHit<Record<string, unknown>>;
  dataset: Dataset;
  setIsRowSelected: (isSelected: boolean) => void;
}

export const TraceFlyoutButton: React.FC<TraceFlyoutButtonProps> = ({
  sanitizedCellValue,
  rowData,
  dataset,
  setIsRowSelected,
}) => {
  const { openTraceFlyout, isFlyoutOpen, flyoutData } = useTraceFlyoutContext();
  const spanIdValue = extractFieldFromRowData(rowData, SPAN_ID_FIELD_PATHS);
  const traceIdValue = extractFieldFromRowData(rowData, TRACE_ID_FIELD_PATHS);

  useEffect(() => {
    if (isFlyoutOpen && flyoutData && flyoutData.spanId === spanIdValue) {
      setIsRowSelected(true);
    } else {
      setIsRowSelected(false);
    }
  }, [isFlyoutOpen, setIsRowSelected, flyoutData, spanIdValue]);

  const handleSpanFlyoutClick = () => {
    openTraceFlyout({
      spanId: spanIdValue,
      traceId: traceIdValue,
      dataset,
      rowData,
    });
  };

  return (
    <EuiButtonEmpty
      onClick={handleSpanFlyoutClick}
      data-test-subj="traceFlyoutButton"
      size="xs"
      flush="left"
    >
      {sanitizedCellValue.replace(/<[^>]*>/g, '').trim()}
    </EuiButtonEmpty>
  );
};

export interface TraceNavigationContext {
  traceId: string;
  spanId: string;
  dataset: Dataset;
}

export const navigateToTraceDetailsWithSpan = (context: TraceNavigationContext): void => {
  const url = buildTraceDetailsUrl(context.spanId, context.traceId, context.dataset);
  window.open(url, '_blank');
};

export const getStatusCodeColor = (statusCode: number | undefined): string => {
  if (!statusCode) return 'default';

  if (statusCode >= 200 && statusCode < 300) return 'success';
  if (statusCode >= 300 && statusCode < 400) return 'primary';
  if (statusCode >= 400 && statusCode < 500) return 'warning';
  if (statusCode >= 500 && statusCode < 600) return 'danger';
  return 'default';
};

interface DurationTableCellProps {
  sanitizedCellValue: string;
}

export const DurationTableCell: React.FC<DurationTableCellProps> = ({ sanitizedCellValue }) => {
  const duration = sanitizedCellValue
    .replace(/<[^>]*>/g, '')
    .replace(/,/g, '')
    .trim();

  const durationLabel = `${round(nanoToMilliSec(Math.max(0, Number(duration))), 2)} ms`;

  return (
    <span className="exploreDocTableCell__dataField" data-test-subj="osdDocTableCellDataField">
      <span>{durationLabel}</span>
    </span>
  );
};
