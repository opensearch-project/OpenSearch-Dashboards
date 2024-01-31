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
  columnType?: string;
  onFilter: DocViewFilterFn;
  filterable?: boolean;
  fieldMapping?: any;
  sanitizedCellValue: string;
}

export const TableCell = ({
  columnId,
  columnType,
  onFilter,
  fieldMapping,
  sanitizedCellValue,
}: TableCellProps) => {
  const tdClassNames =
    columnType === 'date'
      ? 'osdDocTableCell eui-textNoWrap'
      : 'osdDocTableCell eui-textBreakAll eui-textBreakWord';
  return (
    <td data-test-subj="docTableField" className={tdClassNames}>
      {/* eslint-disable-next-line react/no-danger */}
      <span dangerouslySetInnerHTML={{ __html: sanitizedCellValue }} />
      <span className="osdDocTableCell__filter">
        <EuiToolTip
          content={i18n.translate('discover.filterForValue', {
            defaultMessage: 'Filter for value',
          })}
        >
          <EuiButtonIcon
            onClick={() => onFilter(columnId, fieldMapping, '+')}
            iconType="plusInCircle"
            aria-label={i18n.translate('discover.filterForValueLabel', {
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
            onClick={() => onFilter(columnId, fieldMapping, '-')}
            iconType="minusInCircle"
            aria-label={i18n.translate('discover.filterOutValueLabel', {
              defaultMessage: 'Filter out value',
            })}
            data-test-subj="filterOutValue"
            className="osdDocTableCell__filterButton"
          />
        </EuiToolTip>
      </span>
    </td>
  );
};
