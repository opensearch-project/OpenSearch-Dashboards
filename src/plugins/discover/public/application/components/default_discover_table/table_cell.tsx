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
import { OpenSearchSearchHit } from '../../doc_views/doc_views_types';
import { IndexPattern } from '../../../opensearch_dashboards_services';
import { useDataGridContext } from '../data_grid/data_grid_table_context';

export interface TableCellProps {
  column: EuiDataGridColumn;
  row: OpenSearchSearchHit;
  rowIndex: number;
  indexPattern: IndexPattern;
}

export const TableCell = ({ column, row, rowIndex, indexPattern }: TableCellProps) => {
  const singleRow = row as Record<string, unknown>;
  // const flattenedRows = dataRows ? dataRows.map((hit) => idxPattern.flattenHit(hit)) : [];
  // const flattenedRow = flattenedRows
  //   ? (flattenedRows[rowIndex] as Record<string, unknown>)
  //   : undefined;

  const fieldInfo = indexPattern.fields.getByName(column.id);

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
  // const filterFor = column.cellActions ? column.cellActions[0]

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
    const { onFilter } = useDataGridContext();

    const filterForButton = () => {
      const filterForValueText = i18n.translate('discover.filterForValue', {
        defaultMessage: 'Filter for value',
      });
      const filterForValueLabel = i18n.translate('discover.filterForValueLabel', {
        defaultMessage: 'Filter for value: {value}',
        values: { value: column.id },
      });
      return (
        <EuiToolTip content={filterForValueText}>
          <EuiButtonIcon
            onClick={() => {
              const flattened = indexPattern.flattenHit(row);

              if (flattened) {
                onFilter(column.id, flattened[column.id], '+');
              }
            }}
            iconType="plusInCircle"
            aria-label={filterForValueLabel}
            data-test-subj="filterForValue"
            className="osdDocTableCell__filterButton"
          />
        </EuiToolTip>
      );
    };

    const filterOutButton = () => {
      const filterOutValueText = i18n.translate('discover.filterOutValue', {
        defaultMessage: 'Filter out value',
      });
      const filterOutValueLabel = i18n.translate('discover.filterOutValueLabel', {
        defaultMessage: 'Filter out value: {value}',
        values: { value: column.id },
      });
      return (
        <EuiToolTip content={filterOutValueText}>
          <EuiButtonIcon
            onClick={() => {
              const flattened = indexPattern.flattenHit(row);

              if (flattened) {
                onFilter(column.id, flattened[column.id], '-');
              }
            }}
            iconType="minusInCircle"
            aria-label={filterOutValueLabel}
            data-test-subj="filterOutValue"
            className="osdDocTableCell__filterButton"
          />
        </EuiToolTip>
      );
    };

    return (
      // eslint-disable-next-line react/no-danger
      <td
        data-test-subj="docTableField"
        className="osdDocTableCell eui-textBreakAll eui-textBreakWord"
      >
        <span dangerouslySetInnerHTML={{ __html: sanitizedCellValue }} />
        <span className="osdDocTableCell__filter">
          {fieldInfo?.filterable ? filterForButton() : null}
          {fieldInfo?.filterable ? filterOutButton() : null}
        </span>
      </td>
    );
  }
};
