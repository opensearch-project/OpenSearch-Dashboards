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

import { EuiSmallButtonIcon } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import dompurify from 'dompurify';
import React from 'react';
import { IndexPattern, DataView as Dataset } from 'src/plugins/data/public';
import { TableCell } from '../table_cell/table_cell';
import { EmptyTableCell } from '../table_cell/empty_table_cell';
import { SourceFieldTableCell } from '../table_cell/source_field_table_cell';
import { NonFilterableTableCell } from '../table_cell/non_filterable_table_cell';
import { DocViewFilterFn, OpenSearchSearchHit } from '../../../types/doc_views_types';

export interface TableRowContentProps {
  row: OpenSearchSearchHit<Record<string, unknown>>;
  columns: string[];
  dataset: IndexPattern | Dataset;
  onFilter?: DocViewFilterFn;
  isShortDots: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

// Helper functions
const getCellClassName = (timeFieldName?: string, colName?: string): string => {
  const baseClass = 'exploreDocTableCell';
  if (timeFieldName === colName) {
    return `${baseClass} eui-textNoWrap`;
  }
  return `${baseClass} eui-textBreakAll eui-textBreakWord`;
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
  columns,
  dataset,
  onFilter,
  isShortDots,
  isExpanded,
  onToggleExpand,
}) => {
  const flattened = dataset.flattenHit(row);

  return (
    <tr key={row._id} className={row.isAnchor ? 'exploreDocTable__row--highlight' : ''}>
      <td
        data-test-subj="docTableExpandToggleColumn"
        className="exploreDocTableCell__toggleDetails"
      >
        <EuiSmallButtonIcon
          color="text"
          onClick={onToggleExpand}
          iconType={isExpanded ? 'arrowDown' : 'arrowRight'}
          aria-label={i18n.translate('explore.defaultTable.docTableExpandToggleColumnLabel', {
            defaultMessage: `Toggle row details`,
          })}
          data-test-subj="docTableExpandToggleColumn"
        />
      </td>
      {columns.map((colName) => {
        const fieldInfo = dataset.fields.getByName(colName);
        const fieldMapping = flattened[colName];

        if (shouldShowEmptyCell(row, null)) {
          return <EmptyTableCell colName={colName} />;
        }

        if (fieldInfo?.type === '_source') {
          return (
            <SourceFieldTableCell
              colName={colName}
              dataset={dataset}
              row={row}
              isShortDots={isShortDots}
            />
          );
        }

        const formattedValue = formatFieldValue(dataset, row, colName);

        if (shouldShowEmptyCell(row, formattedValue)) {
          return <EmptyTableCell colName={colName} />;
        }

        const sanitizedCellValue = dompurify.sanitize(formattedValue);

        if (fieldInfo?.filterable === false) {
          return (
            <NonFilterableTableCell
              colName={colName}
              className={getCellClassName(dataset.timeFieldName, colName)}
              sanitizedCellValue={sanitizedCellValue}
            />
          );
        }

        return (
          <TableCell
            key={colName}
            columnId={colName}
            onFilter={onFilter}
            isTimeField={dataset.timeFieldName === colName}
            fieldMapping={fieldMapping}
            sanitizedCellValue={sanitizedCellValue}
            rowData={row}
          />
        );
      })}
    </tr>
  );
};
