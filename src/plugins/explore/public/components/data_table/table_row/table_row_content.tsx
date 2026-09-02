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

import { EuiButtonIcon } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import dompurify from 'dompurify';
import React, { useState } from 'react';
import { IndexPattern, DataView as Dataset } from 'src/plugins/data/public';
import { TableCell } from '../table_cell/table_cell';
import { EmptyTableCell } from '../table_cell/empty_table_cell';
import { SourceFieldTableCell } from '../table_cell/source_field_table_cell';
import { NonFilterableTableCell } from '../table_cell/non_filterable_table_cell';
import {
  isSpanIdColumn,
  isTraceIdColumn,
  isDurationColumn,
} from '../table_cell/trace_utils/trace_utils';
import { DocViewFilterFn, OpenSearchSearchHit } from '../../../types/doc_views_types';

export interface TableRowContentProps {
  row: OpenSearchSearchHit<Record<string, unknown>>;
  index?: number;
  columns: string[];
  dataset: IndexPattern | Dataset;
  onFilter?: DocViewFilterFn;
  isShortDots: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isOnTracesPage: boolean;
  wrapCellText?: boolean;
}

// Helper functions
const getCellClassName = (
  timeFieldName?: string,
  colName?: string,
  wrapCellText?: boolean
): string => {
  const baseClass = 'exploreDocTableCell';
  if (timeFieldName === colName) {
    return `${baseClass} eui-textNoWrap`;
  }
  return wrapCellText ? baseClass : `${baseClass} eui-textTruncate`;
};

const shouldShowEmptyCell = (row: any, formattedValue: any): boolean => {
  return typeof row === 'undefined' || typeof formattedValue === 'undefined';
};

const formatFieldValue = (
  dataset: IndexPattern | Dataset,
  row: OpenSearchSearchHit<Record<string, unknown>>,
  colName: string
): string => {
  return dataset.formatField(row, colName);
};

export const TableRowContent: React.FC<TableRowContentProps> = ({
  row,
  index,
  columns,
  dataset,
  onFilter,
  isShortDots,
  isExpanded,
  onToggleExpand,
  isOnTracesPage,
  wrapCellText,
}) => {
  const [isRowSelected, setIsRowSelected] = useState(false);

  const flattened = dataset.flattenHit(row);
  return (
    <tr
      key={row._id}
      className={row.isAnchor || isRowSelected ? 'exploreDocTable__row--highlight' : ''}
    >
      {isOnTracesPage ? (
        <td />
      ) : (
        <td
          data-test-subj="docTableExpandToggleColumn"
          className="exploreDocTableCell__toggleDetails"
        >
          <EuiButtonIcon
            color="text"
            onClick={onToggleExpand}
            iconType={isExpanded ? 'arrowDown' : 'arrowRight'}
            aria-label={i18n.translate('explore.defaultTable.docTableExpandToggleColumnLabel', {
              defaultMessage: `Toggle row details`,
            })}
            size="xs"
            data-test-subj="docTableExpandToggleColumn"
          />
        </td>
      )}
      {columns.map((colName) => {
        const fieldInfo = dataset.fields.getByName(colName);
        const fieldMapping = flattened[colName];
        const isTimeField = dataset.timeFieldName === colName;
        // Suppress value filtering on the configured time field (regardless of its
        // mapped type) and on any date-typed column: PPL exact-equality on a
        // timestamp is broken (timezone-shifted display vs. raw value, and it
        // effectively never matches). Time filtering is owned by the time picker.
        const isDateField = fieldInfo?.type === 'date' || fieldInfo?.type === 'date_nanos';
        // Trace-detail link columns (Span ID / time / duration) must keep their
        // interactive rendering on the Traces page even when the field is not
        // filterable — otherwise they silently degrade to plain text (e.g. when a
        // field-caps mapping conflict across the spans_* indices flips a field to
        // non-filterable). See TableCell's trace-cell branches.
        const isTraceLinkColumn =
          isOnTracesPage &&
          (isSpanIdColumn(colName) ||
            isTraceIdColumn(colName) ||
            isTimeField ||
            isDurationColumn(colName));
        const disableValueFilter = isTimeField || isDateField || fieldInfo?.filterable === false;

        if (shouldShowEmptyCell(row, null)) {
          return <EmptyTableCell key={colName} colName={colName} wrapCellText={wrapCellText} />;
        }

        if (fieldInfo?.type === '_source') {
          return (
            <SourceFieldTableCell
              key={colName}
              colName={colName}
              dataset={dataset}
              row={row}
              isShortDots={isShortDots}
              wrapCellText={wrapCellText}
            />
          );
        }

        const formattedValue = formatFieldValue(dataset, row, colName);

        if (shouldShowEmptyCell(row, formattedValue)) {
          return <EmptyTableCell key={colName} colName={colName} wrapCellText={wrapCellText} />;
        }

        const sanitizedCellValue = dompurify.sanitize(formattedValue);

        if (fieldInfo?.filterable === false && !isTraceLinkColumn) {
          return (
            <NonFilterableTableCell
              key={colName}
              colName={colName}
              className={getCellClassName(dataset.timeFieldName, colName, wrapCellText)}
              sanitizedCellValue={sanitizedCellValue}
              isTimeField={isTimeField}
              index={index}
              rowData={row}
              columnId={colName}
            />
          );
        }

        return (
          <TableCell
            key={colName}
            columnId={colName}
            index={index}
            onFilter={onFilter}
            isTimeField={isTimeField}
            disableValueFilter={disableValueFilter}
            fieldMapping={fieldMapping}
            sanitizedCellValue={sanitizedCellValue}
            rowData={row}
            dataset={dataset}
            isOnTracesPage={isOnTracesPage}
            setIsRowSelected={setIsRowSelected}
            wrapCellText={wrapCellText}
          />
        );
      })}
    </tr>
  );
};
