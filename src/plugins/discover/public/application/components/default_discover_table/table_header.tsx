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

import './_table_header.scss'

import React from 'react';
import { IndexPattern } from '../../../opensearch_dashboards_services';
import { SortOrder, getDefaultSort } from '../../view_components/utils/get_default_sort';
import { AnyAsyncThunk } from '@reduxjs/toolkit/dist/matchers';
import { TableHeaderColumn } from './table_header_column';

interface Props {
  displayedTableColumns:any;
  //columns: string[];
  defaultSortOrder: string;
  //hideTimeColumn: boolean;
  indexPattern: IndexPattern;
  //isShortDots: boolean;
  onChangeSortOrder?: (sortOrder: SortOrder[]) => void;
  onMoveColumn?: (name: string, index: number) => void;
  onRemoveColumn?: (name: string) => void;
  sortOrder: SortOrder[];
}

export function TableHeader({
  //columns,
  displayedTableColumns,
  defaultSortOrder,
  //hideTimeColumn,
  indexPattern,
  //isShortDots,
  onChangeSortOrder,
  onMoveColumn,
  onRemoveColumn,
  sortOrder,
}: Props) {
  //const displayedColumns = getDisplayedColumns(columns, indexPattern, hideTimeColumn, isShortDots);
  console.log("displayedTableColumns", displayedTableColumns)
  return (
    <tr data-test-subj="docTableHeader" className="osdDocTableHeader">
      <th style={{ width: '24px' }} />
      {displayedTableColumns.map((col:any) => {
        return (
          <TableHeaderColumn
            key={col.id}
            colLeftIdx={-1} //TODO
            colRightIdx={-1} //TODO
            displayName={col.display}
            isRemoveable={false} //TODO
            isSortable={col.isSortable}
            name={col.schema}
            sortOrder={
              sortOrder.length ? sortOrder : getDefaultSort(indexPattern, defaultSortOrder)
            }
            onMoveColumn={onMoveColumn}
            onRemoveColumn={onRemoveColumn}
            onChangeSortOrder={onChangeSortOrder}
          />
        );
      })}
    </tr>
  );
}