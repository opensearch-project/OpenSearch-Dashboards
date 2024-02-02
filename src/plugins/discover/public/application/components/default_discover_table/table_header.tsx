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

import './_table_header.scss';

import React from 'react';
import { IndexPattern } from '../../../opensearch_dashboards_services';
import { TableHeaderColumn } from './table_header_column';
import { SortOrder, LegacyDisplayedColumn } from './helper';
import { getDefaultSort } from '../../view_components/utils/get_default_sort';

interface Props {
  displayedColumns: LegacyDisplayedColumn[];
  defaultSortOrder: string;
  indexPattern: IndexPattern;
  onChangeSortOrder?: (sortOrder: SortOrder[]) => void;
  onRemoveColumn?: (name: string) => void;
  onReorderColumn?: (colName: string, destination: number) => void;
  sortOrder: SortOrder[];
}

export function TableHeader({
  displayedColumns,
  defaultSortOrder,
  indexPattern,
  onChangeSortOrder,
  onReorderColumn,
  onRemoveColumn,
  sortOrder,
}: Props) {
  return (
    <tr data-test-subj="docTableHeader" className="osdDocTableHeader">
      <th style={{ width: '24px' }} />
      {displayedColumns.map((col) => {
        return (
          <TableHeaderColumn
            key={col.name}
            {...col}
            sortOrder={
              sortOrder.length ? sortOrder : getDefaultSort(indexPattern, defaultSortOrder)
            }
            onReorderColumn={onReorderColumn}
            onRemoveColumn={onRemoveColumn}
            onChangeSortOrder={onChangeSortOrder}
          />
        );
      })}
    </tr>
  );
}
