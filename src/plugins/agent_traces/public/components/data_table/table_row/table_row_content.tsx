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
import { DocViewFilterFn, OpenSearchSearchHit } from '../../../types/doc_views_types';
import {
  isAgentTracesVirtualColumn,
  isOnAgentTracesPage,
  AgentTracesVirtualCell,
  AgentTracesTimeCell,
  getHitId,
  VIRTUAL_COL_SOURCE_FIELD,
} from '../table_cell/trace_utils/trace_utils';

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
  const baseClass = 'agentTracesDocTableCell';
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
      key={row._id || (row._source as any)?.spanId}
      className={row.isAnchor || isRowSelected ? 'agentTracesDocTable__row--highlight' : ''}
    >
      {isOnTracesPage ? (
        <td />
      ) : (
        <td className="agentTracesDocTableCell__toggleDetails">
          <EuiButtonIcon
            color="text"
            onClick={onToggleExpand}
            iconType={isExpanded ? 'arrowDown' : 'arrowRight'}
            aria-label={i18n.translate('agentTraces.defaultTable.docTableExpandToggleColumnLabel', {
              defaultMessage: `Toggle row details`,
            })}
            size="xs"
            data-test-subj="docTableExpandToggleColumn"
          />
        </td>
      )}
      {columns.map((colName) => {
        // Agent traces: custom time cell with formatted timestamp and clickable link
        if (isOnAgentTracesPage() && dataset.timeFieldName === colName) {
          return <AgentTracesTimeCell key={colName} hitId={getHitId(row)} />;
        }

        // Agent traces virtual columns: bypass dataset formatField
        if (isAgentTracesVirtualColumn(colName) && isOnAgentTracesPage()) {
          return (
            <AgentTracesVirtualCell
              key={colName}
              colName={colName}
              row={row}
              onFilter={onFilter}
              fieldMapping={flattened[VIRTUAL_COL_SOURCE_FIELD[colName] || colName]}
            />
          );
        }

        const fieldInfo = dataset.fields.getByName(colName);
        const fieldMapping = flattened[colName];

        if (shouldShowEmptyCell(row, null)) {
          return <EmptyTableCell colName={colName} wrapCellText={wrapCellText} />;
        }

        if (fieldInfo?.type === '_source') {
          return (
            <SourceFieldTableCell
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
          return <EmptyTableCell colName={colName} wrapCellText={wrapCellText} />;
        }

        const sanitizedCellValue = dompurify.sanitize(formattedValue);

        if (fieldInfo?.filterable === false && !isOnAgentTracesPage()) {
          return (
            <NonFilterableTableCell
              colName={colName}
              className={getCellClassName(dataset.timeFieldName, colName, wrapCellText)}
              sanitizedCellValue={sanitizedCellValue}
              isTimeField={dataset.timeFieldName === colName}
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
            isTimeField={dataset.timeFieldName === colName}
            fieldMapping={fieldMapping}
            sanitizedCellValue={sanitizedCellValue}
            rowData={row}
            isOnTracesPage={isOnTracesPage}
            setIsRowSelected={setIsRowSelected}
            wrapCellText={wrapCellText}
          />
        );
      })}
    </tr>
  );
};
