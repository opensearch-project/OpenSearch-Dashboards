/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './_table_header.scss';

import { TableHeaderColumn } from './table_header_column';
import { LegacyDisplayedColumn, SortOrder } from '../../../helpers/data_table_helper';

interface Props {
  displayedColumns: LegacyDisplayedColumn[];
  onChangeSortOrder?: (sortOrder: SortOrder[]) => void;
  onRemoveColumn?: (name: string) => void;
  sortOrder?: SortOrder[];
}

export function TableHeader({
  displayedColumns,
  onChangeSortOrder,
  onRemoveColumn,
  sortOrder,
}: Props) {
  return (
    <tr data-test-subj="docTableHeader" className="agentTracesDocTableHeader">
      <th style={{ width: '28px' }} />
      {displayedColumns.map((col) => {
        return (
          <TableHeaderColumn
            key={col.name}
            displayName={col.displayName}
            isRemoveable={col.isRemoveable}
            isSortable={col.isSortable}
            name={col.name}
            onChangeSortOrder={onChangeSortOrder}
            onRemoveColumn={onRemoveColumn}
            sortOrder={sortOrder}
          />
        );
      })}
    </tr>
  );
}
