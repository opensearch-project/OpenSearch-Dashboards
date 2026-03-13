/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiToolTip,
  EuiLink,
  EuiIcon,
  EuiText,
  EuiBadge,
  EuiButtonIcon,
  EuiHealth,
  EuiLoadingSpinner,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { SPAN_ID_FIELD_PATHS, TRACE_ID_FIELD_PATHS } from '../../../../utils/trace_field_constants';
import { DocViewFilterFn, OpenSearchSearchHit } from '../../../../types/doc_views_types';
import { DataView as Dataset } from '../../../../../../data/common';
import './trace_utils.scss';
import { validateRequiredTraceFields } from '../../../../utils/trace_field_validation';
import { extractFieldFromRowData } from '../../../../utils/trace_field_validation';
import {
  round,
  nanoToMilliSec,
} from '../../../../application/pages/traces/trace_details/utils/helper_functions';
import {
  getSpanCategory,
  getCategoryMeta,
  getOperationNamesForCategory,
} from '../../../../services/span_categorization';
import { useTraceExpansion } from '../../../../application/pages/traces/trace_expansion_context';

export const isOnTracesPage = (): boolean => {
  return window.location.pathname.includes('/agentTraces');
};

export const isSpanIdColumn = (columnId: string): boolean => {
  return columnId === 'spanId' || columnId === 'span_id' || columnId === 'spanID';
};

export const isDurationColumn = (columnId: string) => {
  return columnId === 'durationNano' || columnId === 'durationInNanos';
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

  return `${origin}${basePath}/app/agentTraces/traces/traceDetails#/?_a=(${urlParamsWithTrace})`;
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
  // Validate required fields before allowing navigation
  const validationResult = validateRequiredTraceFields(rowData as any);
  const isValid = validationResult.isValid;

  const handleSpanIdClick = () => {
    if (isValid) {
      handleSpanIdNavigation(rowData, dataset);
    }
  };

  const displayValue = sanitizedCellValue.replace(/<[^>]*>/g, '').trim();

  if (!isValid) {
    // Return non-clickable text when required fields are missing
    return (
      <EuiToolTip
        content={i18n.translate('agentTraces.spanIdLink.missingFieldsTooltip', {
          defaultMessage:
            'Required trace fields are missing. Please update your data ingestion to include all required fields.',
        })}
      >
        <EuiText size="s" color="subdued">
          {displayValue}
        </EuiText>
      </EuiToolTip>
    );
  }

  return (
    <EuiToolTip
      content={i18n.translate('agentTraces.spanIdLink.redirectTooltip', {
        defaultMessage: 'Redirect to trace details',
      })}
    >
      <EuiLink
        onClick={handleSpanIdClick}
        data-test-subj="spanIdLink"
        className="agentTracesSpanIdLink"
      >
        {displayValue}
        <EuiIcon type="popout" size="s" />
      </EuiLink>
    </EuiToolTip>
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
    <span className="agentTracesDocTableCell__dataField" data-test-subj="osdDocTableCellDataField">
      <span>{durationLabel}</span>
    </span>
  );
};

// --- Agent Traces Virtual Column Support ---

/** Get a stable unique ID for a hit row. PPL query results don't populate _id,
 *  so we fall back to spanId from _source. */
export const getHitId = (hit: OpenSearchSearchHit<Record<string, any>>): string => {
  return hit._id || (hit._source as any)?.spanId || '';
};

export const isOnAgentTracesPage = (): boolean => {
  return window.location.pathname.includes('/agentTraces');
};

const AgentTracesKindCell: React.FC<{ hitId: string }> = ({ hitId }) => {
  const ctx = useTraceExpansion();
  if (!ctx) return null;

  const meta = ctx.getRowMeta(hitId);
  if (!meta) return null;

  const { traceRow, level, isExpandable } = meta;
  const isTraceLoading = ctx.traceLoadingState.get(traceRow.traceId)?.loading;

  const category = getSpanCategory(traceRow);
  const catMeta = getCategoryMeta(category);

  return (
    <div
      className="agentTracesTable__kindCell"
      style={level ? { paddingLeft: `${level * 20}px` } : undefined}
    >
      {isExpandable && !isTraceLoading && (
        <EuiButtonIcon
          size="xs"
          iconType={ctx.expandedRows.has(traceRow.id) ? 'arrowDown' : 'arrowRight'}
          onClick={(e: React.MouseEvent) => ctx.toggleExpansion(e, traceRow.id, traceRow.traceId)}
          aria-label={
            ctx.expandedRows.has(traceRow.id)
              ? i18n.translate('agentTraces.dataTable.collapse', { defaultMessage: 'Collapse' })
              : i18n.translate('agentTraces.dataTable.expand', { defaultMessage: 'Expand' })
          }
          color="subdued"
          iconSize="s"
        />
      )}
      {isExpandable && isTraceLoading && (
        <span className="agentTracesTable__spinnerWrapper">
          <EuiLoadingSpinner size="s" />
        </span>
      )}
      {!isExpandable && ctx.hasExpandableRows && (
        <span className="agentTracesTable__expandSpacer" />
      )}
      <EuiBadge className="agentTraces__categoryBadge" color={catMeta.color}>
        {catMeta.label}
      </EuiBadge>
    </div>
  );
};

const AgentTracesStatusCell: React.FC<{ status: string }> = ({ status }) => (
  <EuiHealth color={status === 'success' ? 'success' : 'danger'} textSize="xs">
    {status === 'success'
      ? i18n.translate('agentTraces.dataTable.statusSuccess', { defaultMessage: 'Success' })
      : i18n.translate('agentTraces.dataTable.statusError', { defaultMessage: 'Error' })}
  </EuiHealth>
);

const TokenIcon: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ verticalAlign: 'middle', marginRight: 4, flexShrink: 0 }}
  >
    <path
      d="M9 11.625C11.2782 11.625 13.125 9.77817 13.125 7.5C13.125 5.22183 11.2782 3.375 9 3.375L6.5 2H9C12.0376 2 14.5 4.46243 14.5 7.5C14.5 10.5376 12.0376 13 9 13H6.5L9 11.625Z"
      fill="currentColor"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6.5 11.625C8.77817 11.625 10.625 9.77817 10.625 7.5C10.625 5.22183 8.77817 3.375 6.5 3.375C4.22183 3.375 2.375 5.22183 2.375 7.5C2.375 9.77817 4.22183 11.625 6.5 11.625ZM12 7.5C12 10.5376 9.53757 13 6.5 13C3.46243 13 1 10.5376 1 7.5C1 4.46243 3.46243 2 6.5 2C9.53757 2 12 4.46243 12 7.5Z"
      fill="currentColor"
    />
  </svg>
);

const AgentTracesTokensCell: React.FC<{
  total: number | string;
  inputTokens: number | null;
  outputTokens: number | null;
}> = ({ total, inputTokens, outputTokens }) => {
  if (total === '—' || total === null || total === undefined) {
    return <>—</>;
  }

  const tooltipContent = (
    <div>
      <div>Tokens: {total}</div>
      <hr
        style={{ margin: '4px 0', border: 'none', borderTop: '1px solid rgba(255,255,255,0.3)' }}
      />
      <div>Input tokens: {inputTokens ?? '—'}</div>
      <div>Output tokens: {outputTokens ?? '—'}</div>
    </div>
  );
  return (
    <EuiToolTip content={tooltipContent} position="top">
      <EuiBadge color="hollow" iconType={() => <TokenIcon />} style={{ borderRadius: 999 }}>
        {typeof total === 'number' ? total.toLocaleString() : total}
      </EuiBadge>
    </EuiToolTip>
  );
};

/** Time cell that shows the formatted startTime from the TraceRow as a clickable link. */
export const AgentTracesTimeCell: React.FC<{
  hitId: string;
}> = ({ hitId }) => {
  const ctx = useTraceExpansion();
  if (!ctx) return null;

  const meta = ctx.getRowMeta(hitId);
  if (!meta) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    ctx.onRowClick?.(hitId);
  };

  return (
    <td className="agentTracesDocTableCell eui-textNoWrap">
      <span
        className="agentTracesDocTableCell__dataField"
        data-test-subj="osdDocTableCellDataField"
      >
        <EuiLink color="primary" onClick={handleClick} data-test-subj="agentTracesTimeLink">
          {meta.traceRow.startTime}
        </EuiLink>
      </span>
    </td>
  );
};

/** Map virtual column names to actual source field names for filtering. */
export const VIRTUAL_COL_SOURCE_FIELD: Record<string, string> = {
  kind: 'attributes.gen_ai.operation.name',
  status: 'status.code',
  latency: 'durationInNanos',
  totalTokens: 'attributes.gen_ai.usage.total_tokens',
  input: 'attributes.gen_ai.input.messages',
  output: 'attributes.gen_ai.output.messages',
};

const AGENT_TRACES_VIRTUAL_COLUMNS = new Set(Object.keys(VIRTUAL_COL_SOURCE_FIELD));

export const isAgentTracesVirtualColumn = (col: string): boolean => {
  return AGENT_TRACES_VIRTUAL_COLUMNS.has(col);
};

const VirtualCellFilterButtons: React.FC<{
  colName: string;
  fieldMapping: unknown;
  onFilter?: DocViewFilterFn;
  invertOperations?: boolean;
  contentToCopy?: string;
}> = ({ colName, fieldMapping, onFilter, invertOperations, contentToCopy }) => {
  if (!onFilter) return null;
  const sourceField = VIRTUAL_COL_SOURCE_FIELD[colName] || colName;
  // When invertOperations is true, "filter for" uses '-' (negate) and "filter out" uses '+'
  const filterForOp = invertOperations ? '-' : '+';
  const filterOutOp = invertOperations ? '+' : '-';
  return (
    <span className="agentTracesDocTableCell__filter" data-test-subj="osdDocTableCellFilter">
      <EuiToolTip
        content={i18n.translate('agentTraces.filterForValue', {
          defaultMessage: 'Filter for value',
        })}
      >
        <EuiButtonIcon
          size="xs"
          onClick={() => onFilter(sourceField, fieldMapping, filterForOp)}
          iconType="magnifyWithPlus"
          aria-label={i18n.translate('agentTraces.filterForValue', {
            defaultMessage: 'Filter for value',
          })}
          data-test-subj="filterForValue"
          className="agentTracesDocTableCell__filterButton"
        />
      </EuiToolTip>
      <EuiToolTip
        content={i18n.translate('agentTraces.filterOutValue', {
          defaultMessage: 'Filter out value',
        })}
      >
        <EuiButtonIcon
          size="xs"
          onClick={() => onFilter(sourceField, fieldMapping, filterOutOp)}
          iconType="magnifyWithMinus"
          aria-label={i18n.translate('agentTraces.filterOutValue', {
            defaultMessage: 'Filter out value',
          })}
          data-test-subj="filterOutValue"
          className="agentTracesDocTableCell__filterButton"
        />
      </EuiToolTip>
      {contentToCopy && (
        <EuiToolTip
          content={i18n.translate('agentTraces.copyValue', {
            defaultMessage: 'Copy value',
          })}
        >
          <EuiButtonIcon
            size="xs"
            onClick={() => {
              navigator.clipboard.writeText(contentToCopy);
            }}
            iconType="copy"
            aria-label={i18n.translate('agentTraces.copyValue', {
              defaultMessage: 'Copy value',
            })}
            data-test-subj="copyValue"
            className="agentTracesDocTableCell__filterButton"
          />
        </EuiToolTip>
      )}
    </span>
  );
};

interface AgentTracesVirtualCellProps {
  colName: string;
  row: OpenSearchSearchHit<Record<string, unknown>>;
  onFilter?: DocViewFilterFn;
  fieldMapping?: unknown;
}

export const AgentTracesVirtualCell: React.FC<AgentTracesVirtualCellProps> = ({
  colName,
  row,
  onFilter,
  fieldMapping,
}) => {
  const ctx = useTraceExpansion();
  const hitId = getHitId(row);
  const meta = ctx?.getRowMeta(hitId);
  const traceRow = meta?.traceRow;

  if (!traceRow) {
    return <td className="agentTracesDocTableCell" />;
  }

  let content: React.ReactNode;
  let truncationTooltipText = '';
  switch (colName) {
    case 'kind':
      content = <AgentTracesKindCell hitId={hitId} />;
      break;
    case 'status':
      content = <AgentTracesStatusCell status={traceRow.status} />;
      break;
    case 'latency':
      content = traceRow.latency;
      if (typeof traceRow.latency === 'string') truncationTooltipText = traceRow.latency;
      break;
    case 'totalTokens':
      content = (
        <AgentTracesTokensCell
          total={traceRow.totalTokens}
          inputTokens={traceRow.inputTokens}
          outputTokens={traceRow.outputTokens}
        />
      );
      break;
    case 'input':
      content = traceRow.input;
      if (typeof traceRow.input === 'string') truncationTooltipText = traceRow.input;
      break;
    case 'output':
      content = traceRow.output;
      if (typeof traceRow.output === 'string') truncationTooltipText = traceRow.output;
      break;
    default:
      content = null;
  }

  // Resolve filter value and operations per column
  let filterValue: unknown = fieldMapping;
  let invertOperations = false;

  if (colName === 'kind') {
    // Kind: use all operation names for the category (OR filter)
    const category = getSpanCategory(traceRow);
    filterValue = getOperationNamesForCategory(category);
  } else if (colName === 'status') {
    // Status: always filter on error code 2.
    // For success rows, invert operations so "filter for" produces != 2
    filterValue = 2;
    invertOperations = traceRow.status === 'success';
  }

  // No filter buttons for totalTokens (composite value) or "Other" kind (no mapped operations)
  const showFilter =
    colName !== 'totalTokens' &&
    !(colName === 'kind' && Array.isArray(filterValue) && filterValue.length === 0);

  const tdClassName =
    colName === 'input' || colName === 'output'
      ? 'agentTracesDocTableCell agentTracesDocTableCell--wideText'
      : 'agentTracesDocTableCell';

  return (
    <td className={tdClassName}>
      <div className="agentTracesDocTableCell__content">
        <span
          className="agentTracesDocTableCell__dataField"
          data-test-subj="osdDocTableCellDataField"
          onMouseEnter={
            truncationTooltipText
              ? (e: React.MouseEvent<HTMLSpanElement>) => {
                  const el = e.currentTarget;
                  el.title = el.scrollWidth > el.clientWidth ? truncationTooltipText : '';
                }
              : undefined
          }
        >
          {content}
        </span>
        {showFilter && (
          <VirtualCellFilterButtons
            colName={colName}
            fieldMapping={filterValue}
            onFilter={onFilter}
            invertOperations={invertOperations}
            contentToCopy={
              truncationTooltipText || (typeof content === 'string' ? content : undefined)
            }
          />
        )}
      </div>
    </td>
  );
};
