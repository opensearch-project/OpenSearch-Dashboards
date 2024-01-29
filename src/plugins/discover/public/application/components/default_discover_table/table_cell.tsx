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

import React, { useState, useMemo, useCallback } from 'react';
import dompurify from 'dompurify';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiDataGridColumn,
  EuiToolTip,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { indexPatternField } from '../../../../../opensearch_ui_shared/static/forms/helpers/field_validators/index_pattern_field';
import { fetchSourceTypeDataCell } from '../data_grid/data_grid_table_cell_value';
import { DocViewFilterFn, OpenSearchSearchHit } from '../../doc_views/doc_views_types';
import { IndexPattern } from '../../../opensearch_dashboards_services';
import { useDataGridContext } from '../data_grid/data_grid_table_context';

export interface TableCellProps {
  column: EuiDataGridColumn;
  row: OpenSearchSearchHit;
  rowIndex: number;
  indexPattern: IndexPattern;
  flattened: Record<string, any>;
  onFilter: DocViewFilterFn;
}

export const TableCell = ({
  column,
  row,
  rowIndex,
  indexPattern,
  flattened,
  onFilter,
}: TableCellProps) => {
  const singleRow = row as Record<string, unknown>;
  // const flattenedRows = dataRows ? dataRows.map((hit) => idxPattern.flattenHit(hit)) : [];
  // const flattenedRow = flattenedRows
  //   ? (flattenedRows[rowIndex] as Record<string, unknown>)
  //   : undefined;

  const fieldInfo = indexPattern.fields.getByName(column.id);
  const fieldMapping = flattened[column.id];

  if (typeof singleRow === 'undefined') {
    return (
      <td
        data-test-subj="docTableField"
        className="osdDocTableCell eui-textBreakAll eui-textBreakWord"
      >
        <span>-</span>
      </td>
    );
  }

  // TODO: when the cell is a object
  // if (!fieldInfo?.type && typeof flattenedRow?.[columnId] === 'object') {
  //   return <span>{stringify(flattenedRow[columnId])}</span>;
  // }

  if (fieldInfo?.type === '_source') {
    return (
      <td className="eui-textBreakAll eui-textBreakWord" data-test-subj="docTableField">
        {fetchSourceTypeDataCell(indexPattern, singleRow, column.id, false)}
      </td>
    );
  }

  const formattedValue = indexPattern.formatField(singleRow, column.id);

  if (typeof formattedValue === 'undefined') {
    return (
      <td
        data-test-subj="docTableField"
        className="osdDocTableCell eui-textBreakAll eui-textBreakWord"
      >
        <span>-</span>
      </td>
    );
  } else {
    const sanitizedCellValue = dompurify.sanitize(formattedValue);

    const filters = (
      <span className="osdDocTableCell__filter">
        <EuiToolTip
          content={i18n.translate('discover.filterForValue', {
            defaultMessage: 'Filter for value',
          })}
        >
          <EuiButtonIcon
            onClick={() => onFilter(column.id, fieldMapping, '+')}
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
            onClick={() => onFilter(column.id, fieldMapping, '-')}
            iconType="minusInCircle"
            aria-label={i18n.translate('discover.filterOutValueLabel', {
              defaultMessage: 'Filter out value',
            })}
            data-test-subj="filterOutValue"
            className="osdDocTableCell__filterButton"
          />
        </EuiToolTip>
      </span>
    );

    return (
      // eslint-disable-next-line react/no-danger
      <td
        data-test-subj="docTableField"
        className="osdDocTableCell eui-textBreakAll eui-textBreakWord"
      >
        <span dangerouslySetInnerHTML={{ __html: sanitizedCellValue }} />
        {fieldInfo?.filterable && filters}
      </td>
    );
  }
};
