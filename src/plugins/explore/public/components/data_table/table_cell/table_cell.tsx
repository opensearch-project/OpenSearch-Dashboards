/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './table_cell.scss';

import React from 'react';
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
}: ITableCellProps) => {
  const { dataset: contextDataset } = useDatasetContext();
  // Prefer the explicitly-passed dataset; fall back to context for callers that
  // don't supply it.
  const dataset = datasetProp ?? contextDataset;

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
            filtering is owned by the time picker. */}
        {!disableValueFilter && (
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
        isTimeField ? 'eui-textNoWrap' : wrapCellText ? '' : 'eui-textTruncate'
      }`}
    >
      <div className="exploreDocTableCell__content">{content}</div>
    </td>
  );
};

export const TableCell = React.memo(TableCellUI);
