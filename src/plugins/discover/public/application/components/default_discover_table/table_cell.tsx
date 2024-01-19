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

import './_table_cell.scss'

import React, { useState, useMemo, useCallback } from 'react';
import { indexPatternField } from '../../../../../opensearch_ui_shared/static/forms/helpers/field_validators/index_pattern_field';
import { fetchSourceTypeDataCell } from '../data_grid/data_grid_table_cell_value';
import dompurify from 'dompurify';

export const TableCell = ({
    column,
    row,
    indexPattern
}) => {
    const singleRow = row as Record<string, unknown>;
    //const flattenedRows = dataRows ? dataRows.map((hit) => idxPattern.flattenHit(hit)) : [];
    // const flattenedRow = flattenedRows
    //   ? (flattenedRows[rowIndex] as Record<string, unknown>)
    //   : undefined;
    const fieldInfo = indexPattern.fields.getByName(column.id);
  
    if (typeof singleRow === 'undefined') {
      return <td data-test-subj="docTableField" className="osdDocTableCell__dataField eui-textBreakAll eui-textBreakWord">
        <span>-</span>
      </td>;
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
      )
    }
  
    const formattedValue = indexPattern.formatField(singleRow, column.id);
    if (typeof formattedValue === 'undefined') {
      return (
        <td data-test-subj="docTableField" className="osdDocTableCell__dataField eui-textBreakAll eui-textBreakWord">
            <span>-</span>
        </td>
      )
    } else {
      const sanitizedCellValue = dompurify.sanitize(formattedValue);
      return (
        // eslint-disable-next-line react/no-danger
        <td data-test-subj="docTableField" className="osdDocTableCell__dataField eui-textBreakAll eui-textBreakWord">
            <span dangerouslySetInnerHTML={{ __html: sanitizedCellValue }} />
        </td>
      );
    }
   
}