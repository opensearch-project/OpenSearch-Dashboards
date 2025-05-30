/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './table_cell.scss';

import React from 'react';
import { EuiButtonIcon, EuiToolTip } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { DocViewFilterFn } from '../../../types/doc_views_types';

export interface ITableCellProps {
  columnId: string;
  isTimeField?: boolean;
  onFilter?: DocViewFilterFn;
  fieldMapping?: any;
  sanitizedCellValue: string;
}

export const TableCellUI = ({
  columnId,
  isTimeField,
  onFilter,
  fieldMapping,
  sanitizedCellValue,
}: ITableCellProps) => {
  const content = (
    <>
      <span
        className="exploreDocTableCell__dataField"
        data-test-subj="osdDocTableCellDataField"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: sanitizedCellValue }}
      />
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
