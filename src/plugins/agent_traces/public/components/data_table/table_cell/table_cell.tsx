/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './table_cell.scss';

import React from 'react';
import { EuiButtonIcon, EuiToolTip } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { DocViewFilterFn, OpenSearchSearchHit } from '../../../types/doc_views_types';
import { useDatasetContext } from '../../../application/context';
import {
  isSpanIdColumn,
  SpanIdLink,
  DurationTableCell,
  isDurationColumn,
} from './trace_utils/trace_utils';
import { LogActionMenu } from '../../log_action_menu';

export interface ITableCellProps {
  columnId: string;
  index?: number;
  isTimeField?: boolean;
  onFilter?: DocViewFilterFn;
  fieldMapping?: any;
  sanitizedCellValue: string;
  rowData?: OpenSearchSearchHit<Record<string, unknown>>;
  isOnTracesPage: boolean;
  setIsRowSelected: (isRowSelected: boolean) => void;
  wrapCellText?: boolean;
}

// TODO: Move to a better cell component design that not rely on rowData
export const TableCellUI = ({
  columnId,
  index,
  isTimeField,
  onFilter,
  fieldMapping,
  sanitizedCellValue,
  rowData,
  isOnTracesPage,
  setIsRowSelected,
  wrapCellText,
}: ITableCellProps) => {
  const { dataset } = useDatasetContext();

  const dataFieldContent =
    isSpanIdColumn(columnId) && isOnTracesPage && rowData && dataset ? (
      <SpanIdLink sanitizedCellValue={sanitizedCellValue} rowData={rowData} dataset={dataset} />
    ) : isOnTracesPage && isDurationColumn(columnId) ? (
      <DurationTableCell sanitizedCellValue={sanitizedCellValue} />
    ) : (
      <span
        className="agentTracesDocTableCell__dataField"
        data-test-subj="osdDocTableCellDataField"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: sanitizedCellValue }}
        onMouseEnter={(e: React.MouseEvent<HTMLSpanElement>) => {
          const el = e.currentTarget;
          el.title = el.scrollWidth > el.clientWidth ? el.textContent || '' : '';
        }}
      />
    );

  const content = (
    <>
      {dataFieldContent}
      <span className="agentTracesDocTableCell__filter" data-test-subj="osdDocTableCellFilter">
        {/* Add AI icon before filter buttons - show for all cells except _source */}
        {rowData?._source && columnId !== '_source' && (
          <LogActionMenu
            document={rowData._source}
            query={undefined}
            indexPattern={dataset?.title}
            metadata={{ index }}
            iconType="generate"
            size="xs"
          />
        )}
        <EuiToolTip
          content={i18n.translate('agentTraces.filterForValue', {
            defaultMessage: 'Filter for value',
          })}
        >
          <EuiButtonIcon
            size="xs"
            onClick={() => onFilter?.(columnId, fieldMapping, '+')}
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
            onClick={() => onFilter?.(columnId, fieldMapping, '-')}
            iconType="magnifyWithMinus"
            aria-label={i18n.translate('agentTraces.filterOutValue', {
              defaultMessage: 'Filter out value',
            })}
            data-test-subj="filterOutValue"
            className="agentTracesDocTableCell__filterButton"
          />
        </EuiToolTip>
        <EuiToolTip
          content={i18n.translate('agentTraces.copyValue', {
            defaultMessage: 'Copy value',
          })}
        >
          <EuiButtonIcon
            size="xs"
            onClick={() => {
              const textToCopy = sanitizedCellValue.replace(/<[^>]*>/g, '');
              navigator.clipboard.writeText(textToCopy);
            }}
            iconType="copy"
            aria-label={i18n.translate('agentTraces.copyValue', {
              defaultMessage: 'Copy value',
            })}
            data-test-subj="copyValue"
            className="agentTracesDocTableCell__filterButton"
          />
        </EuiToolTip>
      </span>
    </>
  );

  return (
    <td
      data-test-subj="docTableField"
      className={`agentTracesDocTableCell ${
        isTimeField ? 'eui-textNoWrap' : wrapCellText ? '' : 'eui-textTruncate'
      }`}
    >
      <div className="agentTracesDocTableCell__content">{content}</div>
    </td>
  );
};

export const TableCell = React.memo(TableCellUI);
