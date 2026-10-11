/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './table_cell.scss';

import React, { useMemo } from 'react';
import { EuiButtonIcon, EuiToolTip } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { IndexPattern, DataView as Dataset } from 'src/plugins/data/public';
import { DocViewFilterFn, OpenSearchSearchHit } from '../../../types/doc_views_types';
import { useDatasetContext } from '../../../application/context';
import {
  isSpanIdColumn,
  isTraceIdColumn,
  TraceFlyoutButton,
  SpanIdLink,
  TraceIdLink,
  DurationTableCell,
  isDurationColumn,
} from './trace_utils/trace_utils';
import { LogActionMenu } from '../../log_action_menu';
import { JsonTree, GetLeafFilter } from './json_tree/json_tree';
import { tryParseJson, findFieldForLeaf, extractHighlightTerms } from './json_tree/json_utils';
import { useFormatJson } from './json_tree/format_json_setting';
import { mergeHighlightTerms, useQueryHighlightTerms } from './json_tree/query_highlight_terms';
import { formatDateAndTime } from './split_date_time';

export interface ITableCellProps {
  columnId: string;
  index?: number;
  isTimeField?: boolean;
  // Hides the "+"/"-" value-filter buttons. Set for time/date fields where PPL
  // exact-equality filtering is broken and timezone-confusing (see below).
  disableValueFilter?: boolean;
  onFilter?: DocViewFilterFn;
  fieldMapping?: any;
  sanitizedCellValue: string;
  rowData?: OpenSearchSearchHit<Record<string, unknown>>;
  // The dataset the row was rendered with. Passed explicitly so trace-cell links
  // don't depend on DatasetContext, which can transiently resolve to `undefined`
  // (e.g. while a new query/dataset is loading after an errored refresh) and
  // silently degrade Span ID / Trace ID / time cells to plain text.
  dataset?: IndexPattern | Dataset;
  isOnTracesPage: boolean;
  setIsRowSelected: (isRowSelected: boolean) => void;
  wrapCellText?: boolean;
  // Set on the time column of a row that shows a JSON tree: the row is several lines tall
  // anyway, so the date and the time go on separate lines to keep the column narrow.
  splitDateTime?: boolean;
}

// TODO: Move to a better cell component design that not rely on rowData
export const TableCellUI = ({
  columnId,
  index,
  isTimeField,
  disableValueFilter,
  onFilter,
  fieldMapping,
  sanitizedCellValue,
  rowData,
  dataset: datasetProp,
  isOnTracesPage,
  setIsRowSelected,
  wrapCellText,
  splitDateTime,
}: ITableCellProps) => {
  const { dataset: contextDataset } = useDatasetContext();
  // Prefer the explicitly-passed dataset; fall back to context for callers that
  // don't supply it.
  const dataset = datasetProp ?? contextDataset;

  // Despite its name, the `fieldMapping` prop is the raw (unformatted) value of this cell:
  // callers pass `flattened[columnId]`. `sanitizedCellValue` is the same value formatted as HTML.
  const rawValue: unknown = fieldMapping;

  // A string value that holds a JSON object or array is rendered as a collapsible tree instead
  // of one long string, regardless of the wrap setting. Object values are left alone: they keep
  // the dataset's own formatting. Users can turn this off in the table settings.
  const formatJson = useFormatJson();
  const parsedJson = useMemo(
    () =>
      formatJson && !isTimeField && typeof rawValue === 'string'
        ? tryParseJson(rawValue)
        : undefined,
    [formatJson, isTimeField, rawValue]
  );

  // Highlight what was searched for in the tree: the matches marked in the formatted value
  // (DSL results) plus the string literals of the query (PPL/SQL results carry no highlights).
  const queryTerms = useQueryHighlightTerms();
  const highlightTerms = useMemo(
    () =>
      parsedJson
        ? mergeHighlightTerms(extractHighlightTerms(sanitizedCellValue), queryTerms)
        : undefined,
    [parsedJson, sanitizedCellValue, queryTerms]
  );

  // Lets the tree remember what was expanded when the row is re-mounted (e.g. paging back).
  // Rows without a document id (e.g. aggregated PPL results) get no key and keep their state
  // only while mounted.
  const jsonStateKey =
    rowData?._id !== undefined ? `${rowData._index}/${rowData._id}/${columnId}` : undefined;

  // A leaf of the JSON can be filtered on when the same data is also indexed as a real,
  // filterable field of this document (e.g. the output of an ingest `json` processor).
  const getLeafFilter = useMemo<GetLeafFilter | undefined>(() => {
    if (!parsedJson || !onFilter || !rowData || !dataset) return undefined;
    const flattened = dataset.flattenHit(rowData);
    return (path, value) => {
      const fieldName = findFieldForLeaf(flattened, columnId, path, value);
      if (!fieldName || dataset.fields.getByName(fieldName)?.filterable === false) {
        return undefined;
      }
      return (mode) => onFilter(fieldName, value, mode);
    };
  }, [parsedJson, onFilter, rowData, dataset, columnId]);

  // When the row is already several lines tall (`splitDateTime`), show the date and the time of
  // the time column on separate lines. Both are formatted from the raw value with the field's
  // own formatter.
  const dateAndTime = useMemo(() => {
    if (!splitDateTime || !isTimeField || isOnTracesPage || !dataset) return undefined;
    const field = dataset.fields.getByName(columnId);
    return field ? formatDateAndTime(dataset.getFormatterForField(field), rawValue) : undefined;
  }, [splitDateTime, isTimeField, isOnTracesPage, dataset, columnId, rawValue]);

  const dataFieldContent =
    isSpanIdColumn(columnId) && isOnTracesPage && rowData && dataset ? (
      <SpanIdLink sanitizedCellValue={sanitizedCellValue} rowData={rowData} dataset={dataset} />
    ) : isTraceIdColumn(columnId) && isOnTracesPage && rowData && dataset ? (
      <TraceIdLink sanitizedCellValue={sanitizedCellValue} rowData={rowData} dataset={dataset} />
    ) : isTimeField && isOnTracesPage && rowData && dataset ? (
      <TraceFlyoutButton
        sanitizedCellValue={sanitizedCellValue}
        rowData={rowData}
        dataset={dataset}
        setIsRowSelected={setIsRowSelected}
      />
    ) : isOnTracesPage && isDurationColumn(columnId) ? (
      <DurationTableCell sanitizedCellValue={sanitizedCellValue} />
    ) : parsedJson ? (
      <JsonTree
        value={parsedJson}
        // `parsedJson` is only set for string values
        rawText={rawValue as string}
        getLeafFilter={getLeafFilter}
        stateKey={jsonStateKey}
        highlightTerms={highlightTerms}
      />
    ) : dateAndTime ? (
      <span
        className="exploreDocTableCell__dataField exploreDocTableCell__dateTime"
        data-test-subj="osdDocTableCellDataField"
      >
        <span>{dateAndTime[0]}</span>
        <span>{dateAndTime[1]}</span>
      </span>
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
      <span
        className={`exploreDocTableCell__filter${
          parsedJson ? ' exploreDocTableCell__filter--top' : ''
        }`}
        data-test-subj="osdDocTableCellFilter"
      >
        {/* Add AI icon before filter buttons - show for all cells except _source */}
        {rowData?._source && columnId !== '_source' && (
          <LogActionMenu
            document={rowData._source}
            query={undefined}
            indexPattern={dataset?.title}
            metadata={{ index, dataSourceEngineType: dataset?.dataSourceRef?.type }}
            iconType="generate"
            size="xs"
          />
        )}
        {/* No value filters on time/date fields. Exact-equality on a high-precision
            timestamp is both misleading (the raw UTC value differs from the
            timezone-formatted display) and effectively never matches, so time
            filtering is owned by the time picker. Also none on a JSON tree: its leaves
            carry their own filter buttons, and matching the whole JSON string is rarely
            what is wanted. */}
        {!disableValueFilter && !parsedJson && (
          <>
            <EuiToolTip
              content={i18n.translate('explore.filterForValue', {
                defaultMessage: 'Filter for value',
              })}
            >
              <EuiButtonIcon
                size="xs"
                onClick={() => onFilter?.(columnId, fieldMapping, '+')}
                iconType="magnifyWithPlus"
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
                iconType="magnifyWithMinus"
                aria-label={i18n.translate('explore.filterOutValue', {
                  defaultMessage: 'Filter out value',
                })}
                data-test-subj="filterOutValue"
                className="exploreDocTableCell__filterButton"
              />
            </EuiToolTip>
          </>
        )}
      </span>
    </>
  );

  return (
    <td
      data-test-subj="docTableField"
      className={`exploreDocTableCell ${
        isTimeField ? 'eui-textNoWrap' : wrapCellText || parsedJson ? '' : 'eui-textTruncate'
      }`}
    >
      <div className="exploreDocTableCell__content">{content}</div>
    </td>
  );
};

export const TableCell = React.memo(TableCellUI);
