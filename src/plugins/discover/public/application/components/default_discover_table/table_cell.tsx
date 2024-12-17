/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import './_table_cell.scss';

import React from 'react';
import { EuiButtonIcon, EuiToolTip } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { DocViewFilterFn } from '../../doc_views/doc_views_types';

export interface TableCellProps {
  columnId: string;
  isTimeField?: boolean;
  onFilter?: DocViewFilterFn;
  filterable?: boolean;
  fieldMapping?: any;
  sanitizedCellValue: string;
}

const TableCellUI = ({
  columnId,
  isTimeField,
  onFilter,
  fieldMapping,
  sanitizedCellValue,
}: TableCellProps) => {
  const content = (
    <>
      <span
        className="osdDocTableCell__dataField"
        data-test-subj="osdDocTableCellDataField"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: sanitizedCellValue }}
      />
      <span className="osdDocTableCell__filter" data-test-subj="osdDocTableCellFilter">
        <EuiToolTip
          content={i18n.translate('discover.filterForValue', {
            defaultMessage: 'Filter for value',
          })}
        >
          <EuiButtonIcon
            size="xs"
            onClick={() => onFilter?.(columnId, fieldMapping, '+')}
            iconType="plusInCircle"
            aria-label={i18n.translate('discover.filterForValue', {
              defaultMessage: 'Filter for value',
            })}
            data-test-subj="filterForValue"
            className="osdDocTableCell__filterButton"
          />
        </EuiToolTip>
        <EuiToolTip
          content={i18n.translate('discover.filterOutValue', {
            defaultMessage: 'Filter out value',
          })}
        >
          <EuiButtonIcon
            size="xs"
            onClick={() => onFilter?.(columnId, fieldMapping, '-')}
            iconType="minusInCircle"
            aria-label={i18n.translate('discover.filterOutValue', {
              defaultMessage: 'Filter out value',
            })}
            data-test-subj="filterOutValue"
            className="osdDocTableCell__filterButton"
          />
        </EuiToolTip>
      </span>
    </>
  );

  return isTimeField ? (
    <td data-test-subj="docTableField" className="osdDocTableCell eui-textNoWrap">
      {content}
    </td>
  ) : (
    <td
      data-test-subj="docTableField"
      className="osdDocTableCell eui-textBreakAll eui-textBreakWord"
    >
      <div className="truncate-by-height">{content}</div>
    </td>
  );
};

export const TableCell = React.memo(TableCellUI);
